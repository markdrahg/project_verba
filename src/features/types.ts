/**
 * Core types for Verba speech-to-text application
 */

export type VoiceCommand =
  | 'start_listening'
  | 'stop_listening'
  | 'pause_dictation'
  | 'resume_dictation'
  | 'activate_spelling'
  | 'exit_spelling'
  | 'delete_last_word'
  | 'delete_paragraph'
  | 'new_paragraph'
  | 'new_line'
  | 'confirm'
  | 'cancel'
  | 'command_pause'
  | 'resume_commands'
  | 'dark_mode'
  | 'light_mode'
  | 'toggle_theme'
  | 'export_pdf'
  | 'export_docx';

/**
 * Extra data a command may need beyond its own identity. Currently only
 * 'delete_paragraph' is parameterized (it needs to know *which*
 * paragraph), but this is deliberately a general bag rather than a
 * one-off field so future parameterized commands (e.g. "go to paragraph
 * N") don't each need their own plumbing through executeCommand.
 */
export interface CommandArgs {
  paragraphIndex?: number;
}

export interface DictationState {
  /**
   * Document content as an ordered list of paragraphs (v2). Replaces v1's
   * flat `transcript: string` — paragraph-level features (numbered
   * display, "new paragraph", "delete paragraph N", future per-paragraph
   * editing) need an addressable unit, which a single string can't give
   * without ad-hoc parsing on every access. A paragraph's own text may
   * still contain internal '\n' line breaks (from the "new line" command),
   * which is a within-paragraph concern and doesn't need its own array.
   */
  paragraphs: string[];
  /** Whether the microphone is actively listening */
  isListening: boolean;
  /** Whether dictation is paused (listening but not transcribing) */
  isPaused: boolean;
  /** Whether command mode is active (interpreting speech as commands) */
  isCommandMode: boolean;
  /** Whether spelling mode is active (capturing letters individually) */
  isSpellingMode: boolean;
  /** Current word being spelled in spelling mode */
  spellingBuffer: string;
  /** Whether there's a pending action requiring confirmation */
  pendingConfirmation: PendingConfirmation | null;
  /** Interim/partial results from speech recognition */
  interimTranscript: string;
}

/**
 * Something the user needs to explicitly confirm/cancel before it takes
 * effect. A discriminated union rather than one interface with optional
 * fields, so each variant only carries the data it actually needs —
 * TypeScript, not a runtime check, guarantees `paragraphIndex` exists for
 * 'delete_paragraph' and `command` exists for 'run_command'.
 *
 * 'run_command' is the same gate used for destructive edits, reused for a
 * different purpose: when the parser hears something close to — but not
 * exactly — a known command, it proposes the closest match here instead
 * of silently discarding the utterance or guessing. Saying "yes"/"confirm"
 * runs the proposed command; "no"/"cancel" dismisses it. See
 * modeMachine.ts's use of proposeCommand.
 */
export type PendingConfirmation =
  | { action: 'delete_last_word'; description: string }
  | { action: 'delete_paragraph'; description: string; paragraphIndex: number }
  | { action: 'run_command'; description: string; command: VoiceCommand };

export type DictationAction =
  | { type: 'SET_LISTENING'; payload: boolean }
  | { type: 'SET_PAUSED'; payload: boolean }
  | { type: 'SET_COMMAND_MODE'; payload: boolean }
  | { type: 'SET_SPELLING_MODE'; payload: boolean }
  | { type: 'APPEND_TRANSCRIPT'; payload: string }
  | { type: 'APPEND_LETTER'; payload: string }
  | { type: 'COMMIT_SPELLING' }
  | { type: 'SET_PENDING_CONFIRMATION'; payload: PendingConfirmation | null }
  | { type: 'DELETE_LAST_WORD' }
  | { type: 'NEW_PARAGRAPH' }
  | { type: 'NEW_LINE' }
  | { type: 'DELETE_PARAGRAPH'; payload: { index: number } }
  | { type: 'SET_INTERIM_TRANSCRIPT'; payload: string }
  | { type: 'CLEAR_TRANSCRIPT' }
  | { type: 'HYDRATE'; payload: { paragraphs: string[] } };
