import { describe, it, expect } from 'vitest';
import { dictationReducer, initialState } from '../hooks/useDictation';
import { DictationState } from '../types';

function withParagraphs(paragraphs: string[]): DictationState {
  return { ...initialState, paragraphs };
}

describe('dictationReducer / APPEND_TRANSCRIPT', () => {
  it('appends with a single separating space, within the last paragraph', () => {
    const state = dictationReducer(withParagraphs(['hello']), {
      type: 'APPEND_TRANSCRIPT',
      payload: 'world',
    });
    expect(state.paragraphs).toEqual(['hello world']);
  });

  it('does not insert a leading space before punctuation', () => {
    // v1 regression: always inserted a literal space, producing "hello , world"
    const state = dictationReducer(withParagraphs(['hello']), {
      type: 'APPEND_TRANSCRIPT',
      payload: ', world',
    });
    expect(state.paragraphs).toEqual(['hello, world']);
  });

  it('does not insert a leading space on the very first chunk', () => {
    const state = dictationReducer(withParagraphs(['']), {
      type: 'APPEND_TRANSCRIPT',
      payload: 'hello',
    });
    expect(state.paragraphs).toEqual(['hello']);
  });

  it('only touches the last paragraph, leaving earlier ones untouched', () => {
    const state = dictationReducer(withParagraphs(['first', 'second']), {
      type: 'APPEND_TRANSCRIPT',
      payload: 'world',
    });
    expect(state.paragraphs).toEqual(['first', 'second world']);
  });

  it('clears the interim transcript', () => {
    const state = dictationReducer(
      { ...withParagraphs(['hi']), interimTranscript: 'wor' },
      { type: 'APPEND_TRANSCRIPT', payload: 'world' }
    );
    expect(state.interimTranscript).toBe('');
  });
});

describe('dictationReducer / DELETE_LAST_WORD', () => {
  it('removes only the last word of the last paragraph', () => {
    const state = dictationReducer(withParagraphs(['hello brave world']), {
      type: 'DELETE_LAST_WORD',
    });
    expect(state.paragraphs).toEqual(['hello brave']);
  });

  it('preserves formatting/whitespace elsewhere in the paragraph', () => {
    // v1 regression: split(/\s+/).join(' ') collapsed EVERY whitespace run
    // in the whole transcript, not just at the deletion point.
    const state = dictationReducer(withParagraphs(['hello\nbrave   world']), {
      type: 'DELETE_LAST_WORD',
    });
    expect(state.paragraphs).toEqual(['hello\nbrave']);
  });

  it('does not touch earlier paragraphs', () => {
    const state = dictationReducer(withParagraphs(['first paragraph', 'hello world']), {
      type: 'DELETE_LAST_WORD',
    });
    expect(state.paragraphs).toEqual(['first paragraph', 'hello']);
  });

  it('empties the last paragraph when deleting its only word', () => {
    const state = dictationReducer(withParagraphs(['hello']), {
      type: 'DELETE_LAST_WORD',
    });
    expect(state.paragraphs).toEqual(['']);
  });

  it('is a no-op on an empty transcript', () => {
    const state = dictationReducer(withParagraphs(['']), {
      type: 'DELETE_LAST_WORD',
    });
    expect(state.paragraphs).toEqual(['']);
  });

  it('clears any pending confirmation', () => {
    const state = dictationReducer(
      {
        ...withParagraphs(['hello world']),
        pendingConfirmation: { action: 'delete_last_word', description: 'Delete the last word?' },
      },
      { type: 'DELETE_LAST_WORD' }
    );
    expect(state.pendingConfirmation).toBeNull();
  });
});

describe('dictationReducer / NEW_PARAGRAPH', () => {
  it('starts a new empty paragraph after the current one', () => {
    const state = dictationReducer(withParagraphs(['hello world']), { type: 'NEW_PARAGRAPH' });
    expect(state.paragraphs).toEqual(['hello world', '']);
  });

  it('does not stack multiple empty paragraphs on repeated commands', () => {
    const once = dictationReducer(withParagraphs(['hello']), { type: 'NEW_PARAGRAPH' });
    const twice = dictationReducer(once, { type: 'NEW_PARAGRAPH' });
    expect(twice.paragraphs).toEqual(['hello', '']);
  });

  it('clears the interim transcript', () => {
    const state = dictationReducer(
      { ...withParagraphs(['hello']), interimTranscript: 'wor' },
      { type: 'NEW_PARAGRAPH' }
    );
    expect(state.interimTranscript).toBe('');
  });
});

describe('dictationReducer / NEW_LINE', () => {
  it('inserts a line break within the current paragraph, not a new paragraph', () => {
    const state = dictationReducer(withParagraphs(['hello']), { type: 'NEW_LINE' });
    expect(state.paragraphs).toEqual(['hello\n']);
  });

  it('only affects the last paragraph', () => {
    const state = dictationReducer(withParagraphs(['first', 'second']), { type: 'NEW_LINE' });
    expect(state.paragraphs).toEqual(['first', 'second\n']);
  });
});

describe('dictationReducer / DELETE_PARAGRAPH', () => {
  it('removes the paragraph at the given index', () => {
    const state = dictationReducer(withParagraphs(['first', 'second', 'third']), {
      type: 'DELETE_PARAGRAPH',
      payload: { index: 1 },
    });
    expect(state.paragraphs).toEqual(['first', 'third']);
  });

  it('leaves a single empty paragraph when deleting the only one', () => {
    const state = dictationReducer(withParagraphs(['only paragraph']), {
      type: 'DELETE_PARAGRAPH',
      payload: { index: 0 },
    });
    expect(state.paragraphs).toEqual(['']);
  });

  it('is a safe no-op on an out-of-range index', () => {
    const state = dictationReducer(withParagraphs(['first', 'second']), {
      type: 'DELETE_PARAGRAPH',
      payload: { index: 5 },
    });
    expect(state.paragraphs).toEqual(['first', 'second']);
  });

  it('clears any pending confirmation', () => {
    const state = dictationReducer(
      {
        ...withParagraphs(['first', 'second']),
        pendingConfirmation: { action: 'delete_paragraph', description: 'Delete paragraph 2?', paragraphIndex: 1 },
      },
      { type: 'DELETE_PARAGRAPH', payload: { index: 1 } }
    );
    expect(state.pendingConfirmation).toBeNull();
  });
});

describe('dictationReducer / HYDRATE', () => {
  it('restores a saved document', () => {
    const state = dictationReducer(initialState, {
      type: 'HYDRATE',
      payload: { paragraphs: ['restored', 'text'] },
    });
    expect(state.paragraphs).toEqual(['restored', 'text']);
  });

  it('falls back to a single empty paragraph if given an empty array', () => {
    const state = dictationReducer(initialState, {
      type: 'HYDRATE',
      payload: { paragraphs: [] },
    });
    expect(state.paragraphs).toEqual(['']);
  });
});

describe('dictationReducer / CLEAR_TRANSCRIPT', () => {
  it('resets to a single empty paragraph, not an empty array', () => {
    const state = dictationReducer(withParagraphs(['first', 'second']), { type: 'CLEAR_TRANSCRIPT' });
    expect(state.paragraphs).toEqual(['']);
  });
});

describe('dictationReducer / SET_SPELLING_MODE', () => {
  it('resets the spelling buffer when entering spelling mode', () => {
    const state = dictationReducer(
      { ...initialState, spellingBuffer: 'stale' },
      { type: 'SET_SPELLING_MODE', payload: true }
    );
    expect(state.spellingBuffer).toBe('');
  });
});
