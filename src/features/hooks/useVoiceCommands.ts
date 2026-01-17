import { useCallback } from 'react';
import { parseCommand, extractLetter } from '../commandParser';
import { DictationState, VoiceCommand } from '../types';

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
    setPendingConfirmation: (pending: { action: 'delete_last_word'; description: string } | null) => void;
    deleteLastWord: () => void;
    setInterimTranscript: (text: string) => void;
  };
  onStopListening?: () => void;
  onStartListening?: () => void;
  onSetTheme?: (theme: 'dark' | 'light' | 'toggle') => void;
}

/**
 * Hook for processing voice commands and managing command flow
 */
export function useVoiceCommands({
  state,
  actions,
  onStopListening,
  onStartListening,
  onSetTheme,
}: UseVoiceCommandsProps) {
  /**
   * Process a voice command
   */
  const executeCommand = useCallback(
    (command: VoiceCommand) => {
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

        case 'confirm':
          if (state.pendingConfirmation?.action === 'delete_last_word') {
            actions.deleteLastWord();
          }
          break;

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
      }
    },
    [state.pendingConfirmation, actions, onStopListening, onStartListening, onSetTheme]
  );

  /**
   * Process incoming speech result
   * CRITICAL: Commands only execute in Command Mode.
   * In regular dictation mode, speech is transcribed verbatim.
   */
  const processSpeechResult = useCallback(
    (transcript: string, isFinal: boolean) => {
      // Handle pending confirmation - only accept confirm/cancel (always active)
      if (state.pendingConfirmation) {
        if (isFinal) {
          const command = parseCommand(transcript);
          if (command === 'confirm' || command === 'cancel') {
            executeCommand(command);
          }
          actions.setInterimTranscript('');
        }
        return;
      }

      // Check for "resume commands" even when NOT in command mode
      // This allows user to switch back to command mode from dictation
      if (!state.isCommandMode && isFinal) {
        const command = parseCommand(transcript);
        if (command === 'resume_commands') {
          executeCommand(command);
          actions.setInterimTranscript('');
          return;
        }
      }

      // COMMAND MODE: Process commands only
      if (state.isCommandMode) {
        const command = parseCommand(transcript);
        if (command && isFinal) {
          executeCommand(command);
          actions.setInterimTranscript('');
          return;
        }
        // In command mode, show interim but don't transcribe non-commands
        if (!isFinal) {
          actions.setInterimTranscript(transcript);
        } else {
          // Final non-command in command mode - ignore
          actions.setInterimTranscript('');
        }
        return;
      }

      // DICTATION MODE (command mode OFF): Transcribe everything verbatim

      // If paused, ignore non-command speech
      if (state.isPaused) {
        if (!isFinal) {
          actions.setInterimTranscript(transcript);
        } else {
          actions.setInterimTranscript('');
        }
        return;
      }

      // Handle spelling mode
      if (state.isSpellingMode) {
        if (isFinal) {
          // Check for exit command first (always allowed in spelling)
          const command = parseCommand(transcript);
          if (command === 'exit_spelling') {
            executeCommand(command);
            return;
          }

          // Try to extract a letter
          const letter = extractLetter(transcript);
          if (letter) {
            actions.appendLetter(letter);
          }
          actions.setInterimTranscript('');
        } else {
          actions.setInterimTranscript(transcript);
        }
        return;
      }

      // Regular transcription - everything is transcribed verbatim
      if (isFinal) {
        actions.appendTranscript(transcript);
      } else {
        actions.setInterimTranscript(transcript);
      }
    },
    [
      state.isCommandMode,
      state.isPaused,
      state.isSpellingMode,
      state.pendingConfirmation,
      actions,
      executeCommand,
    ]
  );

  return {
    processSpeechResult,
    executeCommand,
  };
}
