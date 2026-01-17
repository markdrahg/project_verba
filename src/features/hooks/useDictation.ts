import { useReducer, useCallback } from 'react';
import { DictationState, DictationAction, PendingConfirmation } from '../types';

const initialState: DictationState = {
  transcript: '',
  isListening: false,
  isPaused: false,
  isCommandMode: true, // Commands are always recognized when listening
  isSpellingMode: false,
  spellingBuffer: '',
  pendingConfirmation: null,
  interimTranscript: '',
};

function dictationReducer(state: DictationState, action: DictationAction): DictationState {
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

    case 'APPEND_TRANSCRIPT':
      return {
        ...state,
        transcript: state.transcript
          ? `${state.transcript} ${action.payload}`
          : action.payload,
        interimTranscript: '',
      };

    case 'SET_TRANSCRIPT':
      return { ...state, transcript: action.payload };

    case 'APPEND_LETTER':
      return {
        ...state,
        spellingBuffer: state.spellingBuffer + action.payload,
      };

    case 'COMMIT_SPELLING':
      if (!state.spellingBuffer) return state;
      return {
        ...state,
        transcript: state.transcript
          ? `${state.transcript} ${state.spellingBuffer}`
          : state.spellingBuffer,
        spellingBuffer: '',
        isSpellingMode: false,
      };

    case 'SET_PENDING_CONFIRMATION':
      return { ...state, pendingConfirmation: action.payload };

    case 'DELETE_LAST_WORD':
      const words = state.transcript.trim().split(/\s+/);
      words.pop();
      return {
        ...state,
        transcript: words.join(' '),
        pendingConfirmation: null,
      };

    case 'SET_INTERIM_TRANSCRIPT':
      return { ...state, interimTranscript: action.payload };

    case 'CLEAR_TRANSCRIPT':
      return { ...state, transcript: '', interimTranscript: '' };

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

  const setTranscript = useCallback((text: string) => {
    dispatch({ type: 'SET_TRANSCRIPT', payload: text });
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

  const setInterimTranscript = useCallback((text: string) => {
    dispatch({ type: 'SET_INTERIM_TRANSCRIPT', payload: text });
  }, []);

  const clearTranscript = useCallback(() => {
    dispatch({ type: 'CLEAR_TRANSCRIPT' });
  }, []);

  return {
    state,
    actions: {
      setListening,
      setPaused,
      setCommandMode,
      setSpellingMode,
      appendTranscript,
      setTranscript,
      appendLetter,
      commitSpelling,
      setPendingConfirmation,
      deleteLastWord,
      setInterimTranscript,
      clearTranscript,
    },
  };
}
