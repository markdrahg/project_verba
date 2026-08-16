import { useReducer, useCallback } from 'react';
import { DictationState, DictationAction, PendingConfirmation } from '../types';

export const initialState: DictationState = {
  paragraphs: [''],
  isListening: false,
  isPaused: false,
  isCommandMode: true, // Commands are always recognized when listening
  isSpellingMode: false,
  spellingBuffer: '',
  pendingConfirmation: null,
  interimTranscript: '',
};

/** Applies `updater` to the last paragraph only, leaving all others untouched. */
function updateLastParagraph(paragraphs: string[], updater: (last: string) => string): string[] {
  if (paragraphs.length === 0) return [updater('')];
  const next = paragraphs.slice();
  next[next.length - 1] = updater(next[next.length - 1]);
  return next;
}

export function dictationReducer(state: DictationState, action: DictationAction): DictationState {
  switch (action.type) {
    case 'SET_LISTENING':
      return {
        ...state,
        isListening: action.payload,
        // Reset states when stopping
        ...(action.payload === false && {
          isPaused: false,
          isSpellingMode: false,
          spellingBuffer: '',
          interimTranscript: '',
        }),
      };

    case 'SET_PAUSED':
      return { ...state, isPaused: action.payload };

    case 'SET_COMMAND_MODE':
      return { ...state, isCommandMode: action.payload };

    case 'SET_SPELLING_MODE':
      return {
        ...state,
        isSpellingMode: action.payload,
        spellingBuffer: action.payload ? '' : state.spellingBuffer,
      };

    case 'APPEND_TRANSCRIPT': {
      // Punctuation-aware join, applied within the current (last)
      // paragraph. Previously this always inserted a literal space
      // between the existing text and the new chunk, which produces
      // "hello , world" once a payload begins with ',', '.', '!', '?',
      // ';', ':', or a closing bracket.
      const startsWithPunctuation = /^[.,!?;:)\]}]/.test(action.payload);
      return {
        ...state,
        paragraphs: updateLastParagraph(state.paragraphs, (last) => {
          const needsSpace = last.length > 0 && !startsWithPunctuation;
          return last + (needsSpace ? ' ' : '') + action.payload;
        }),
        interimTranscript: '',
      };
    }

    case 'APPEND_LETTER':
      return {
        ...state,
        spellingBuffer: state.spellingBuffer + action.payload,
      };

    case 'COMMIT_SPELLING':
      if (!state.spellingBuffer) return state;
      return {
        ...state,
        paragraphs: updateLastParagraph(state.paragraphs, (last) =>
          last ? `${last} ${state.spellingBuffer}` : state.spellingBuffer
        ),
        spellingBuffer: '',
        isSpellingMode: false,
      };

    case 'SET_PENDING_CONFIRMATION':
      return { ...state, pendingConfirmation: action.payload };

    case 'DELETE_LAST_WORD': {
      const last = state.paragraphs[state.paragraphs.length - 1];
      if (!last.trim()) {
        return { ...state, pendingConfirmation: null };
      }
      // Remove only the trailing word plus the whitespace immediately
      // before it, within the last paragraph only, leaving all other
      // whitespace/formatting (including other paragraphs) untouched.
      // v1 did `transcript.trim().split(/\s+/); words.pop(); words.join(' ')`,
      // which silently collapsed EVERY run of whitespace in the whole
      // transcript down to a single space on every single delete.
      return {
        ...state,
        paragraphs: updateLastParagraph(state.paragraphs, (p) => p.replace(/\s*\S+\s*$/, '')),
        pendingConfirmation: null,
      };
    }

    case 'NEW_PARAGRAPH': {
      const last = state.paragraphs[state.paragraphs.length - 1];
      // Avoid stacking multiple empty paragraphs from repeated commands
      // (e.g. saying "new paragraph" twice in a row) — that would just
      // grow the numbered list with nothing to show for it.
      if (last === '') return { ...state, interimTranscript: '' };
      return {
        ...state,
        paragraphs: [...state.paragraphs, ''],
        interimTranscript: '',
      };
    }

    case 'NEW_LINE':
      return {
        ...state,
        paragraphs: updateLastParagraph(state.paragraphs, (last) => last + '\n'),
        interimTranscript: '',
      };

    case 'DELETE_PARAGRAPH': {
      const { index } = action.payload;
      if (index < 0 || index >= state.paragraphs.length) {
        // Stale/out-of-range reference (e.g. paragraphs changed between
        // the command being issued and confirmed) — clear the pending
        // confirmation without touching the document rather than throw
        // or silently delete the wrong paragraph.
        return { ...state, pendingConfirmation: null };
      }
      const next = state.paragraphs.filter((_, i) => i !== index);
      return {
        ...state,
        paragraphs: next.length > 0 ? next : [''],
        pendingConfirmation: null,
      };
    }

    case 'SET_INTERIM_TRANSCRIPT':
      return { ...state, interimTranscript: action.payload };

    case 'CLEAR_TRANSCRIPT':
      return { ...state, paragraphs: [''], interimTranscript: '' };

    case 'HYDRATE':
      // Restores a previously-autosaved document on load. Kept as an
      // explicit, isolated action (rather than folded into initialState)
      // so the reducer stays a pure function and persistence remains an
      // outside concern — see useTranscriptPersistence.ts.
      return {
        ...state,
        paragraphs: action.payload.paragraphs.length > 0 ? action.payload.paragraphs : [''],
      };

    default:
      return state;
  }
}

/**
 * Hook for managing dictation state
 * Provides state and actions for controlling the dictation flow
 */
export function useDictation() {
  const [state, dispatch] = useReducer(dictationReducer, initialState);

  const setListening = useCallback((isListening: boolean) => {
    dispatch({ type: 'SET_LISTENING', payload: isListening });
  }, []);

  const setPaused = useCallback((isPaused: boolean) => {
    dispatch({ type: 'SET_PAUSED', payload: isPaused });
  }, []);

  const setCommandMode = useCallback((isCommandMode: boolean) => {
    dispatch({ type: 'SET_COMMAND_MODE', payload: isCommandMode });
  }, []);

  const setSpellingMode = useCallback((isSpellingMode: boolean) => {
    dispatch({ type: 'SET_SPELLING_MODE', payload: isSpellingMode });
  }, []);

  const appendTranscript = useCallback((text: string) => {
    dispatch({ type: 'APPEND_TRANSCRIPT', payload: text });
  }, []);

  const appendLetter = useCallback((letter: string) => {
    dispatch({ type: 'APPEND_LETTER', payload: letter });
  }, []);

  const commitSpelling = useCallback(() => {
    dispatch({ type: 'COMMIT_SPELLING' });
  }, []);

  const setPendingConfirmation = useCallback((pending: PendingConfirmation | null) => {
    dispatch({ type: 'SET_PENDING_CONFIRMATION', payload: pending });
  }, []);

  const deleteLastWord = useCallback(() => {
    dispatch({ type: 'DELETE_LAST_WORD' });
  }, []);

  const newParagraph = useCallback(() => {
    dispatch({ type: 'NEW_PARAGRAPH' });
  }, []);

  const newLine = useCallback(() => {
    dispatch({ type: 'NEW_LINE' });
  }, []);

  const deleteParagraph = useCallback((index: number) => {
    dispatch({ type: 'DELETE_PARAGRAPH', payload: { index } });
  }, []);

  const setInterimTranscript = useCallback((text: string) => {
    dispatch({ type: 'SET_INTERIM_TRANSCRIPT', payload: text });
  }, []);

  const clearTranscript = useCallback(() => {
    dispatch({ type: 'CLEAR_TRANSCRIPT' });
  }, []);

  const hydrate = useCallback((paragraphs: string[]) => {
    dispatch({ type: 'HYDRATE', payload: { paragraphs } });
  }, []);

  return {
    state,
    actions: {
      setListening,
      setPaused,
      setCommandMode,
      setSpellingMode,
      appendTranscript,
      appendLetter,
      commitSpelling,
      setPendingConfirmation,
      deleteLastWord,
      newParagraph,
      newLine,
      deleteParagraph,
      setInterimTranscript,
      clearTranscript,
      hydrate,
    },
  };
}
