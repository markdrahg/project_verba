import { parseCommand, extractLetter, suggestClosestCommand } from './commandParser';
import { lookupCommand } from './commands';
import { parseParameterizedCommand } from './parameterizedCommands';
import { CommandArgs, DictationState, VoiceCommand } from './types';

/**
 * Explicit representation of "which mode is speech currently being
 * interpreted under" — this used to be implicit, expressed only as a
 * sequence of if/else checks inside useVoiceCommands.processSpeechResult,
 * with the priority order documented solely in a code comment
 * ("CRITICAL: Commands only execute in Command Mode"). That meant every
 * new mode had to be manually re-threaded into the cascade and re-verified
 * by hand against every existing branch.
 *
 * resolveMode() is a single pure function mapping state -> mode, so the
 * priority order is enforced in one place and is trivially unit-testable
 * (see features/__tests__/modeMachine.test.ts).
 */
export type Mode =
  | 'confirming'
  | 'command'
  | 'dictation_paused'
  | 'dictation_spelling'
  | 'dictation_normal';

export function resolveMode(state: DictationState): Mode {
  if (state.pendingConfirmation) return 'confirming';
  if (state.isCommandMode) return 'command';
  if (state.isPaused) return 'dictation_paused';
  if (state.isSpellingMode) return 'dictation_spelling';
  return 'dictation_normal';
}

export interface ModeActions {
  executeCommand: (command: VoiceCommand, args?: CommandArgs) => void;
  appendTranscript: (text: string) => void;
  appendLetter: (letter: string) => void;
  setInterimTranscript: (text: string) => void;
  /**
   * A near-miss was close enough to a known command to propose running it.
   * Implementations should set up a confirm/cancel gate (PendingConfirmation
   * with action: 'run_command') so the user can say "yes" to actually run
   * `command`, rather than the app guessing on their behalf.
   */
  proposeCommand: (heard: string, command: VoiceCommand, matchedPhrase: string) => void;
  /**
   * Nothing close enough to a known command was found. Intentionally a
   * no-op by default — command mode discards a lot of ordinary non-command
   * speech, and toasting on every miss would be constant noise.
   */
  notifyUnrecognizedCommand: (heard: string) => void;
  notifyUnrecognizedLetter: (transcript: string) => void;
}

/**
 * Any dictation sub-mode (paused/spelling/normal) still needs to recognize
 * "command mode" / "resume commands" as an escape hatch back to command
 * mode, even though it isn't in command mode. This is the one deliberate
 * cross-cutting rule; it's kept explicit and in a single place rather than
 * floating above the mode switch as in v1.
 */
function checkResumeCommandsEscape(
  transcript: string,
  isFinal: boolean,
  actions: ModeActions
): boolean {
  if (!isFinal) return false;
  const command = parseCommand(transcript);
  if (command === 'resume_commands') {
    actions.executeCommand(command);
    actions.setInterimTranscript('');
    return true;
  }
  return false;
}

/**
 * Process one speech result (interim or final) against the current mode.
 * This is the FSM's transition function: (mode, input) -> side effects.
 */
export function handleSpeechInMode(
  mode: Mode,
  transcript: string,
  isFinal: boolean,
  actions: ModeActions
): void {
  switch (mode) {
    case 'confirming': {
      // Only confirm/cancel are accepted; everything else — including
      // commands and dictation — is ignored until resolved.
      if (isFinal) {
        const command = parseCommand(transcript);
        if (command === 'confirm' || command === 'cancel') {
          actions.executeCommand(command);
        }
        actions.setInterimTranscript('');
      }
      return;
    }

    case 'command': {
      if (checkResumeCommandsEscape(transcript, isFinal, actions)) return;

      if (!isFinal) {
        actions.setInterimTranscript(transcript);
        return;
      }

      const command = parseCommand(transcript);
      if (command) {
        actions.executeCommand(command);
        actions.setInterimTranscript('');
        return;
      }

      // Fixed-phrase lookup missed — try a parameterized command
      // ("delete paragraph two") before giving up. Tried second, not
      // first, since it's a regex match against arbitrary trailing text
      // and the fixed-phrase map is a cheap, exact, unambiguous lookup.
      const paramMatch = parseParameterizedCommand(transcript);
      if (paramMatch) {
        actions.executeCommand(paramMatch.command, { paragraphIndex: paramMatch.paragraphIndex });
        actions.setInterimTranscript('');
        return;
      }

      // Still no match — if the utterance is close enough to a known
      // phrase, propose running it rather than silently dropping it (v1's
      // behavior) or guessing and running it outright. suggestClosestCommand
      // returns the matched phrase itself; map it back to the command it
      // belongs to so the confirmation gate has something concrete to run.
      //
      // 'confirm'/'cancel' are excluded from proposal: they're meta-commands
      // about a *pending* confirmation, so proposing "did you mean confirm?"
      // when nothing is pending yet is meaningless — and if it were proposed
      // and then confirmed, executing 'confirm' would try to resolve against
      // the very pendingConfirmation it's still sitting under, recursing.
      const suggestionPhrase = suggestClosestCommand(transcript);
      const suggestedCommand = suggestionPhrase ? lookupCommand(suggestionPhrase) : null;
      const isProposable =
        suggestedCommand && suggestedCommand !== 'confirm' && suggestedCommand !== 'cancel';
      if (suggestionPhrase && isProposable) {
        actions.proposeCommand(transcript, suggestedCommand, suggestionPhrase);
      } else {
        actions.notifyUnrecognizedCommand(transcript);
      }
      actions.setInterimTranscript('');
      return;
    }

    case 'dictation_paused': {
      if (checkResumeCommandsEscape(transcript, isFinal, actions)) return;
      actions.setInterimTranscript(isFinal ? '' : transcript);
      return;
    }

    case 'dictation_spelling': {
      if (checkResumeCommandsEscape(transcript, isFinal, actions)) return;

      if (!isFinal) {
        actions.setInterimTranscript(transcript);
        return;
      }

      const command = parseCommand(transcript);
      if (command === 'exit_spelling') {
        actions.executeCommand(command);
        return;
      }

      const letter = extractLetter(transcript);
      if (letter) {
        actions.appendLetter(letter);
      } else {
        // v1 dropped this silently too — single-letter ASR misrecognition
        // ("C" -> "see") is extremely common, so staying silent here is
        // one of the most confusing failure modes in the whole app.
        actions.notifyUnrecognizedLetter(transcript);
      }
      actions.setInterimTranscript('');
      return;
    }

    case 'dictation_normal': {
      if (checkResumeCommandsEscape(transcript, isFinal, actions)) return;

      if (isFinal) {
        actions.appendTranscript(transcript);
      } else {
        actions.setInterimTranscript(transcript);
      }
      return;
    }
  }
}
