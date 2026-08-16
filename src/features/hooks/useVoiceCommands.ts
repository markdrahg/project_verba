import { useCallback } from 'react';
import { toast } from 'sonner';
import { resolveMode, handleSpeechInMode, ModeActions } from '../modeMachine';
import { CommandArgs, DictationState, PendingConfirmation, VoiceCommand } from '../types';

interface UseVoiceCommandsProps {
  state: DictationState;
  actions: {
    setListening: (isListening: boolean) => void;
    setPaused: (isPaused: boolean) => void;
    setCommandMode: (isCommandMode: boolean) => void;
    setSpellingMode: (isSpellingMode: boolean) => void;
    appendTranscript: (text: string) => void;
    appendLetter: (letter: string) => void;
    commitSpelling: () => void;
    setPendingConfirmation: (pending: PendingConfirmation | null) => void;
    deleteLastWord: () => void;
    newParagraph: () => void;
    newLine: () => void;
    deleteParagraph: (index: number) => void;
    setInterimTranscript: (text: string) => void;
  };
  onStopListening?: () => void;
  onStartListening?: () => void;
  onSetTheme?: (theme: 'dark' | 'light' | 'toggle') => void;
  onExportPdf?: () => void;
  onExportDocx?: () => void;
}

/**
 * Hook for processing voice commands and managing command flow.
 *
 * The actual "which mode am I in, and what does this speech mean in that
 * mode" logic lives in features/modeMachine.ts as a pure, testable
 * function. This hook's job is just to (a) know how to execute each
 * command against app state, and (b) wire the current mode + resulting
 * side effects together for React.
 */
export function useVoiceCommands({
  state,
  actions,
  onStopListening,
  onStartListening,
  onSetTheme,
  onExportPdf,
  onExportDocx,
}: UseVoiceCommandsProps) {
  /**
   * Process a voice command. `args` carries data for parameterized
   * commands (currently just which paragraph, for delete_paragraph) —
   * see features/parameterizedCommands.ts for where it's produced.
   */
  const executeCommand = useCallback(
    (command: VoiceCommand, args?: CommandArgs) => {
      switch (command) {
        case 'start_listening':
          onStartListening?.();
          break;

        case 'stop_listening':
          onStopListening?.();
          break;

        case 'pause_dictation':
          actions.setPaused(true);
          break;

        case 'resume_dictation':
          actions.setPaused(false);
          break;

        case 'activate_spelling':
          actions.setSpellingMode(true);
          break;

        case 'exit_spelling':
          actions.commitSpelling();
          break;

        case 'delete_last_word':
          actions.setPendingConfirmation({
            action: 'delete_last_word',
            description: 'Delete the last word?',
          });
          break;

        case 'new_paragraph':
          actions.newParagraph();
          break;

        case 'new_line':
          actions.newLine();
          break;

        case 'delete_paragraph': {
          if (args?.paragraphIndex === undefined) break;
          if (args.paragraphIndex < 0 || args.paragraphIndex >= state.paragraphs.length) {
            toast.error(`There's no paragraph ${args.paragraphIndex + 1} to delete.`);
            break;
          }
          actions.setPendingConfirmation({
            action: 'delete_paragraph',
            description: `Delete paragraph ${args.paragraphIndex + 1}?`,
            paragraphIndex: args.paragraphIndex,
          });
          break;
        }

        case 'confirm': {
          const pending = state.pendingConfirmation;
          if (!pending) break;
          switch (pending.action) {
            case 'delete_last_word':
              actions.deleteLastWord();
              break;
            case 'delete_paragraph':
              actions.deleteParagraph(pending.paragraphIndex);
              break;
            case 'run_command':
              // Defense in depth: proposeCommand (modeMachine.ts) already
              // excludes 'confirm'/'cancel' from ever being proposed, but
              // guard here too — running 'confirm' recursively would read
              // this same stale `state.pendingConfirmation` closure
              // (dispatch hasn't applied yet) and recurse forever.
              if (pending.command === 'confirm' || pending.command === 'cancel') {
                actions.setPendingConfirmation(null);
                break;
              }
              // Clear the gate before running the proposed command, not
              // after: if that command itself needs confirmation (e.g. the
              // suggestion was "delete last word"), it will set its own
              // fresh PendingConfirmation, and we don't want to immediately
              // stomp on that by clearing afterward.
              actions.setPendingConfirmation(null);
              executeCommand(pending.command);
              break;
          }
          break;
        }

        case 'cancel':
          actions.setPendingConfirmation(null);
          break;

        case 'command_pause':
          actions.setCommandMode(false);
          break;

        case 'resume_commands':
          actions.setCommandMode(true);
          break;

        case 'dark_mode':
          onSetTheme?.('dark');
          break;

        case 'light_mode':
          onSetTheme?.('light');
          break;

        case 'toggle_theme':
          onSetTheme?.('toggle');
          break;

        case 'export_pdf':
          onExportPdf?.();
          break;

        case 'export_docx':
          onExportDocx?.();
          break;
      }
    },
    [state.pendingConfirmation, state.paragraphs, actions, onStopListening, onStartListening, onSetTheme, onExportPdf, onExportDocx]
  );

  /**
   * Process incoming speech result by resolving the current mode and
   * delegating to the mode machine's transition function.
   */
  const processSpeechResult = useCallback(
    (transcript: string, isFinal: boolean) => {
      const mode = resolveMode(state);

      const modeActions: ModeActions = {
        executeCommand,
        appendTranscript: actions.appendTranscript,
        appendLetter: actions.appendLetter,
        setInterimTranscript: actions.setInterimTranscript,
        proposeCommand: (heard, command, matchedPhrase) => {
          // Surface both a toast (for immediate visibility — the badge
          // below is easy to miss mid-speech) and a persistent
          // confirmation gate (so "yes"/"confirm" actually runs it, and
          // "no"/"cancel" dismisses it). This is the same gate destructive
          // edits use; see the 'run_command' case in executeCommand's
          // 'confirm' handling above.
          toast.message(`Didn't recognize "${heard}"`, {
            description: `Say "yes" to run "${matchedPhrase}", or "no" to dismiss.`,
          });
          actions.setPendingConfirmation({
            action: 'run_command',
            description: `Did you mean "${matchedPhrase}"?`,
            command,
          });
        },
        notifyUnrecognizedCommand: () => {
          // Intentionally silent — command mode discards a lot of ordinary
          // non-command speech in normal use, and toasting on every miss
          // would be constant noise. Near-misses worth surfacing go
          // through proposeCommand instead.
        },
        notifyUnrecognizedLetter: (heard) => {
          toast.message(`Didn't catch that letter`, {
            description: `Heard "${heard}" — try a single letter, or "letter A".`,
          });
        },
      };

      handleSpeechInMode(mode, transcript, isFinal, modeActions);
    },
    [state, actions, executeCommand]
  );

  return {
    processSpeechResult,
    executeCommand,
  };
}
