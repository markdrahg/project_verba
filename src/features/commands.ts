import { VoiceCommand } from './types';

/**
 * Single source of truth for voice commands.
 *
 * Both the command parser (commandParser.ts) and the UI help panel
 * (CommandHelp.tsx) read from this registry. Previously these lived as two
 * separately-maintained lists (a regex table + a hardcoded JSX array) that
 * could silently drift out of sync. Centralizing them here means adding,
 * renaming, or removing a command phrase is a one-line change that stays
 * consistent everywhere it's used.
 */
export interface CommandDefinition {
  command: VoiceCommand;
  /** Spoken phrases that trigger this command (matched case-insensitively). */
  phrases: string[];
  /** Human-readable label shown in the help panel. */
  label: string;
  /** Human-readable description shown in the help panel. */
  description: string;
  /** Group used to organize the help panel. */
  group: 'listening' | 'dictation' | 'spelling' | 'editing' | 'confirmation' | 'mode' | 'theme' | 'export';
}

/**
 * Documents a command whose exact wording varies (it takes a spoken
 * argument), so it can't be listed as a fixed phrase in COMMAND_REGISTRY
 * or matched by the same phrase -> command lookup. See
 * parameterizedCommands.ts for the actual matching logic. Kept here,
 * alongside COMMAND_REGISTRY, purely so CommandHelp.tsx has one place to
 * read the full list of what a user can say — including commands the
 * fixed-phrase parser doesn't handle.
 */
export interface ParameterizedCommandHelp {
  label: string;
  description: string;
  group: CommandDefinition['group'];
}

export const PARAMETERIZED_COMMAND_HELP: ParameterizedCommandHelp[] = [
  {
    label: '"Delete paragraph 2"',
    description: 'Remove a paragraph by number, e.g. "delete paragraph two" (requires confirmation)',
    group: 'editing',
  },
];

export const COMMAND_REGISTRY: CommandDefinition[] = [
  {
    command: 'start_listening',
    phrases: ['start listening', 'begin listening', 'start', 'listen'],
    label: '"Start listening"',
    description: 'Start the microphone',
    group: 'listening',
  },
  {
    command: 'stop_listening',
    phrases: ['stop listening', 'stop', 'end listening'],
    label: '"Stop listening"',
    description: 'Stop the microphone',
    group: 'listening',
  },
  {
    command: 'pause_dictation',
    phrases: ['pause dictation', 'pause', 'hold'],
    label: '"Pause dictation"',
    description: 'Pause transcription (mic stays on)',
    group: 'dictation',
  },
  {
    command: 'resume_dictation',
    phrases: ['resume dictation', 'resume', 'continue', 'go'],
    label: '"Resume dictation"',
    description: 'Resume transcription',
    group: 'dictation',
  },
  {
    command: 'activate_spelling',
    phrases: ['activate spelling', 'spelling mode', 'spell', 'start spelling'],
    label: '"Activate spelling"',
    description: 'Spell a word letter by letter',
    group: 'spelling',
  },
  {
    command: 'exit_spelling',
    phrases: ['exit spelling', 'done spelling', 'end spelling', 'stop spelling'],
    label: '"Exit spelling"',
    description: 'Commit the spelled word and return to dictation',
    group: 'spelling',
  },
  {
    command: 'delete_last_word',
    phrases: ['delete last word', 'remove last word', 'undo word', 'backspace'],
    label: '"Delete last word"',
    description: 'Remove the last word (requires confirmation)',
    group: 'editing',
  },
  {
    command: 'new_paragraph',
    phrases: ['new paragraph', 'next paragraph', 'paragraph break', 'start new paragraph'],
    label: '"New paragraph"',
    description: 'Start a new numbered paragraph',
    group: 'editing',
  },
  {
    command: 'new_line',
    phrases: ['new line', 'line break'],
    label: '"New line"',
    description: 'Insert a line break within the current paragraph',
    group: 'editing',
  },
  {
    command: 'confirm',
    phrases: ['confirm', 'yes', 'affirmative', 'do it'],
    label: '"Confirm" / "Yes"',
    description: 'Confirm a pending action',
    group: 'confirmation',
  },
  {
    command: 'cancel',
    phrases: ['cancel', 'no', 'nevermind', 'never mind', 'abort'],
    label: '"Cancel" / "No"',
    description: 'Cancel a pending action',
    group: 'confirmation',
  },
  {
    command: 'command_pause',
    phrases: ['command pause', 'pause commands', 'dictate'],
    label: '"Dictate"',
    description: 'Switch to dictation mode (speech is transcribed verbatim)',
    group: 'mode',
  },
  {
    command: 'resume_commands',
    phrases: ['resume commands', 'commands on', 'command mode'],
    label: '"Command mode"',
    description: 'Switch back to command mode',
    group: 'mode',
  },
  {
    command: 'dark_mode',
    phrases: ['dark mode', 'go dark', 'switch to dark', 'enable dark'],
    label: '"Dark mode"',
    description: 'Switch to dark theme (command mode only)',
    group: 'theme',
  },
  {
    command: 'light_mode',
    phrases: ['light mode', 'go light', 'switch to light', 'enable light'],
    label: '"Light mode"',
    description: 'Switch to light theme (command mode only)',
    group: 'theme',
  },
  {
    command: 'toggle_theme',
    phrases: ['toggle theme', 'switch theme', 'change theme'],
    label: '"Toggle theme"',
    description: 'Toggle between dark and light (command mode only)',
    group: 'theme',
  },
  {
    command: 'export_pdf',
    phrases: ['download pdf', 'export pdf', 'export as pdf', 'save as pdf'],
    label: '"Download PDF"',
    description: 'Export the document as a PDF file',
    group: 'export',
  },
  {
    command: 'export_docx',
    phrases: ['download docx', 'download word', 'export docx', 'export as docx', 'export as word', 'save as word'],
    label: '"Download DOCX"',
    description: 'Export the document as a Word (.docx) file',
    group: 'export',
  },
];

/**
 * Precomputed phrase -> command lookup, built once at module load rather
 * than re-testing a regex list on every call to parseCommand.
 */
const PHRASE_TO_COMMAND: Map<string, VoiceCommand> = new Map();
for (const def of COMMAND_REGISTRY) {
  for (const phrase of def.phrases) {
    PHRASE_TO_COMMAND.set(phrase.toLowerCase(), def.command);
  }
}

export function lookupCommand(normalizedPhrase: string): VoiceCommand | null {
  return PHRASE_TO_COMMAND.get(normalizedPhrase) ?? null;
}

/** All known phrases, longest-first, used for lightweight fuzzy suggestions. */
export const ALL_PHRASES: string[] = COMMAND_REGISTRY.flatMap((d) => d.phrases);
