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
  | 'confirm'
  | 'cancel'
  | 'command_pause'
  | 'resume_commands'
  | 'dark_mode'
  | 'light_mode'
  | 'toggle_theme';

export interface DictationState {
  /** The full transcript text */
  transcript: string;
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

export interface PendingConfirmation {
  action: 'delete_last_word';
  description: string;
}

export type DictationAction =
  | { type: 'SET_LISTENING'; payload: boolean }
  | { type: 'SET_PAUSED'; payload: boolean }
  | { type: 'SET_COMMAND_MODE'; payload: boolean }
  | { type: 'SET_SPELLING_MODE'; payload: boolean }
  | { type: 'APPEND_TRANSCRIPT'; payload: string }
  | { type: 'SET_TRANSCRIPT'; payload: string }
  | { type: 'APPEND_LETTER'; payload: string }
  | { type: 'COMMIT_SPELLING' }
  | { type: 'SET_PENDING_CONFIRMATION'; payload: PendingConfirmation | null }
  | { type: 'DELETE_LAST_WORD' }
  | { type: 'SET_INTERIM_TRANSCRIPT'; payload: string }
  | { type: 'CLEAR_TRANSCRIPT' };
