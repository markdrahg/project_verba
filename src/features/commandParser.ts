import { VoiceCommand } from './types';

/**
 * Command patterns mapped to voice commands
 * Each pattern is a regex that matches spoken phrases
 */
const COMMAND_PATTERNS: Array<{ pattern: RegExp; command: VoiceCommand }> = [
  // Listening controls
  { pattern: /^(start listening|begin listening|start|listen)$/i, command: 'start_listening' },
  { pattern: /^(stop listening|stop|end listening)$/i, command: 'stop_listening' },
  
  // Dictation controls
  { pattern: /^(pause dictation|pause|hold)$/i, command: 'pause_dictation' },
  { pattern: /^(resume dictation|resume|continue|go)$/i, command: 'resume_dictation' },
  
  // Spelling mode
  { pattern: /^(activate spelling|spelling mode|spell|start spelling)$/i, command: 'activate_spelling' },
  { pattern: /^(exit spelling|done spelling|end spelling|stop spelling)$/i, command: 'exit_spelling' },
  
  // Editing
  { pattern: /^(delete last word|remove last word|undo word|backspace)$/i, command: 'delete_last_word' },
  
  // Confirmation
  { pattern: /^(confirm|yes|affirmative|do it)$/i, command: 'confirm' },
  { pattern: /^(cancel|no|nevermind|never mind|abort)$/i, command: 'cancel' },
  
  // Command mode controls
  { pattern: /^(command pause|pause commands|dictate)$/i, command: 'command_pause' },
  { pattern: /^(resume commands|commands on|command mode)$/i, command: 'resume_commands' },
  
  // Theme controls
  { pattern: /^(dark mode|go dark|switch to dark|enable dark)$/i, command: 'dark_mode' },
  { pattern: /^(light mode|go light|switch to light|enable light)$/i, command: 'light_mode' },
  { pattern: /^(toggle theme|switch theme|change theme)$/i, command: 'toggle_theme' },
];

/**
 * Parse spoken text and detect if it matches a voice command
 * @param text - The spoken text to parse
 * @returns The matched command or null if no command matches
 */
export function parseCommand(text: string): VoiceCommand | null {
  const normalizedText = text.trim().toLowerCase();
  
  for (const { pattern, command } of COMMAND_PATTERNS) {
    if (pattern.test(normalizedText)) {
      return command;
    }
  }
  
  return null;
}

/**
 * Check if text is a single letter (for spelling mode)
 * @param text - The text to check
 * @returns True if text is a single letter
 */
export function isSingleLetter(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return /^[a-z]$/.test(normalized);
}

/**
 * Extract the letter from spoken input
 * Handles cases like "letter A", "A", "capital A"
 */
export function extractLetter(text: string): string | null {
  const normalized = text.trim().toLowerCase();
  
  // Direct single letter
  if (/^[a-z]$/.test(normalized)) {
    return normalized;
  }
  
  // "letter X" pattern
  const letterMatch = normalized.match(/^letter\s+([a-z])$/);
  if (letterMatch) {
    return letterMatch[1];
  }
  
  // "capital X" pattern - still return lowercase for simplicity
  const capitalMatch = normalized.match(/^capital\s+([a-z])$/);
  if (capitalMatch) {
    return capitalMatch[1].toUpperCase();
  }
  
  return null;
}

/**
 * Get a human-readable description of a command
 */
export function getCommandDescription(command: VoiceCommand): string {
  const descriptions: Record<VoiceCommand, string> = {
    start_listening: 'Start listening',
    stop_listening: 'Stop listening',
    pause_dictation: 'Pause dictation',
    resume_dictation: 'Resume dictation',
    activate_spelling: 'Activate spelling mode',
    exit_spelling: 'Exit spelling mode',
    delete_last_word: 'Delete last word',
    confirm: 'Confirm action',
    cancel: 'Cancel action',
    command_pause: 'Switch to dictation mode',
    resume_commands: 'Switch to command mode',
    dark_mode: 'Switch to dark theme',
    light_mode: 'Switch to light theme',
    toggle_theme: 'Toggle theme',
  };
  
  return descriptions[command];
}
