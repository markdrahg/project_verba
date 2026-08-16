import { describe, it, expect, vi } from 'vitest';
import { resolveMode, handleSpeechInMode, ModeActions } from '../modeMachine';
import { DictationState } from '../types';

const baseState: DictationState = {
  paragraphs: [''],
  isListening: true,
  isPaused: false,
  isCommandMode: true,
  isSpellingMode: false,
  spellingBuffer: '',
  pendingConfirmation: null,
  interimTranscript: '',
};

function makeActions(): ModeActions {
  return {
    executeCommand: vi.fn(),
    appendTranscript: vi.fn(),
    appendLetter: vi.fn(),
    setInterimTranscript: vi.fn(),
    proposeCommand: vi.fn(),
    notifyUnrecognizedCommand: vi.fn(),
    notifyUnrecognizedLetter: vi.fn(),
  };
}

describe('resolveMode', () => {
  it('prioritizes a pending confirmation over everything else', () => {
    const state: DictationState = {
      ...baseState,
      isCommandMode: false,
      isPaused: true,
      isSpellingMode: true,
      pendingConfirmation: { action: 'delete_last_word', description: 'Delete the last word?' },
    };
    expect(resolveMode(state)).toBe('confirming');
  });

  it('prioritizes command mode over paused/spelling', () => {
    const state: DictationState = { ...baseState, isCommandMode: true, isPaused: true, isSpellingMode: true };
    expect(resolveMode(state)).toBe('command');
  });

  it('prioritizes paused over spelling within dictation', () => {
    const state: DictationState = { ...baseState, isCommandMode: false, isPaused: true, isSpellingMode: true };
    expect(resolveMode(state)).toBe('dictation_paused');
  });

  it('falls back to normal dictation', () => {
    const state: DictationState = { ...baseState, isCommandMode: false };
    expect(resolveMode(state)).toBe('dictation_normal');
  });
});

describe('handleSpeechInMode / confirming', () => {
  it('accepts confirm and cancel, ignores everything else', () => {
    const actions = makeActions();
    handleSpeechInMode('confirming', 'confirm', true, actions);
    expect(actions.executeCommand).toHaveBeenCalledWith('confirm');

    const actions2 = makeActions();
    handleSpeechInMode('confirming', 'delete last word', true, actions2);
    expect(actions2.executeCommand).not.toHaveBeenCalled();
  });

  it('accepts "yes" and "no" as synonyms for confirm/cancel', () => {
    // This is what lets a user confirm a proposed near-miss command by
    // voice: proposeCommand puts the app in 'confirming' mode, and saying
    // "yes" here is what actually triggers executeCommand('confirm').
    const actions = makeActions();
    handleSpeechInMode('confirming', 'yes', true, actions);
    expect(actions.executeCommand).toHaveBeenCalledWith('confirm');

    const actions2 = makeActions();
    handleSpeechInMode('confirming', 'no', true, actions2);
    expect(actions2.executeCommand).toHaveBeenCalledWith('cancel');
  });
});

describe('handleSpeechInMode / command', () => {
  it('executes a recognized fixed-phrase command', () => {
    const actions = makeActions();
    handleSpeechInMode('command', 'dark mode', true, actions);
    expect(actions.executeCommand).toHaveBeenCalledWith('dark_mode');
  });

  it('executes new_paragraph and new_line commands', () => {
    const actions = makeActions();
    handleSpeechInMode('command', 'new paragraph', true, actions);
    expect(actions.executeCommand).toHaveBeenCalledWith('new_paragraph');

    const actions2 = makeActions();
    handleSpeechInMode('command', 'new line', true, actions2);
    expect(actions2.executeCommand).toHaveBeenCalledWith('new_line');
  });

  it('executes export commands', () => {
    const actions = makeActions();
    handleSpeechInMode('command', 'download pdf', true, actions);
    expect(actions.executeCommand).toHaveBeenCalledWith('export_pdf');

    const actions2 = makeActions();
    handleSpeechInMode('command', 'download docx', true, actions2);
    expect(actions2.executeCommand).toHaveBeenCalledWith('export_docx');
  });

  it('parses "delete paragraph N" as a parameterized command, with digit input', () => {
    const actions = makeActions();
    handleSpeechInMode('command', 'delete paragraph 2', true, actions);
    expect(actions.executeCommand).toHaveBeenCalledWith('delete_paragraph', { paragraphIndex: 1 });
  });

  it('parses "delete paragraph N" with a spoken number word', () => {
    const actions = makeActions();
    handleSpeechInMode('command', 'delete paragraph three', true, actions);
    expect(actions.executeCommand).toHaveBeenCalledWith('delete_paragraph', { paragraphIndex: 2 });
  });

  it('never transcribes non-command speech', () => {
    const actions = makeActions();
    handleSpeechInMode('command', 'the quick brown fox', true, actions);
    expect(actions.appendTranscript).not.toHaveBeenCalled();
  });

  it('proposes the closest command on a near-miss, rather than guessing or dropping it', () => {
    const actions = makeActions();
    handleSpeechInMode('command', 'stop listenin', true, actions);
    expect(actions.proposeCommand).toHaveBeenCalledWith('stop listenin', 'stop_listening', 'stop listening');
    // It must not run the command outright — only propose it.
    expect(actions.executeCommand).not.toHaveBeenCalled();
  });

  it('never proposes "confirm" or "cancel" themselves, even as a close match', () => {
    // Regression guard: proposing 'confirm' and later confirming it would
    // recurse into executeCommand('confirm') against the same pending
    // confirmation it's still sitting under. See modeMachine.ts's comment
    // on this exclusion.
    const actions = makeActions();
    handleSpeechInMode('command', 'confirn', true, actions); // 1 char off "confirm"
    expect(actions.proposeCommand).not.toHaveBeenCalled();
  });

  it('stays silent when nothing is close enough to suggest', () => {
    const actions = makeActions();
    handleSpeechInMode('command', 'the quick brown fox jumps', true, actions);
    expect(actions.proposeCommand).not.toHaveBeenCalled();
    expect(actions.notifyUnrecognizedCommand).toHaveBeenCalledWith('the quick brown fox jumps');
  });

  it('does not misfire a parameterized match on a bare "delete paragraph" with no number', () => {
    const actions = makeActions();
    handleSpeechInMode('command', 'delete paragraph', true, actions);
    expect(actions.executeCommand).not.toHaveBeenCalledWith('delete_paragraph', expect.anything());
  });
});

describe('handleSpeechInMode / dictation_normal', () => {
  it('transcribes verbatim on final results', () => {
    const actions = makeActions();
    handleSpeechInMode('dictation_normal', 'hello world', true, actions);
    expect(actions.appendTranscript).toHaveBeenCalledWith('hello world');
  });

  it('still allows escaping back to command mode', () => {
    const actions = makeActions();
    handleSpeechInMode('dictation_normal', 'command mode', true, actions);
    expect(actions.executeCommand).toHaveBeenCalledWith('resume_commands');
    expect(actions.appendTranscript).not.toHaveBeenCalled();
  });
});

describe('handleSpeechInMode / dictation_spelling', () => {
  it('appends a recognized letter', () => {
    const actions = makeActions();
    handleSpeechInMode('dictation_spelling', 'capital a', true, actions);
    expect(actions.appendLetter).toHaveBeenCalledWith('A');
  });

  it('notifies when the letter is unrecognized', () => {
    const actions = makeActions();
    handleSpeechInMode('dictation_spelling', 'see', true, actions);
    expect(actions.notifyUnrecognizedLetter).toHaveBeenCalledWith('see');
    expect(actions.appendLetter).not.toHaveBeenCalled();
  });

  it('exits spelling mode on command', () => {
    const actions = makeActions();
    handleSpeechInMode('dictation_spelling', 'exit spelling', true, actions);
    expect(actions.executeCommand).toHaveBeenCalledWith('exit_spelling');
  });
});

describe('handleSpeechInMode / dictation_paused', () => {
  it('does not transcribe while paused', () => {
    const actions = makeActions();
    handleSpeechInMode('dictation_paused', 'hello world', true, actions);
    expect(actions.appendTranscript).not.toHaveBeenCalled();
  });
});
