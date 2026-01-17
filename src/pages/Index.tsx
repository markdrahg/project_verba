import { useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useDictation } from '@/features/hooks/useDictation';
import { useSpeechRecognition } from '@/features/hooks/useSpeechRecognition';
import { useVoiceCommands } from '@/features/hooks/useVoiceCommands';
import { DictationDisplay } from '@/components/DictationDisplay';
import { MicButton } from '@/components/MicButton';
import { StatusIndicators } from '@/components/StatusIndicators';
import { CommandHelp } from '@/components/CommandHelp';
import { toast } from 'sonner';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Verba - Voice-to-text dictation application
 * Main page component orchestrating speech recognition and UI
 */
const Index = () => {
  const { state, actions } = useDictation();
  const { theme, setTheme } = useTheme();

  // Speech recognition callbacks
  const handleStart = useCallback(() => {
    actions.setListening(true);
    toast.success('Listening started');
  }, [actions]);

  const handleEnd = useCallback(() => {
    actions.setListening(false);
  }, [actions]);

  const handleError = useCallback((error: string) => {
    toast.error(`Speech recognition error: ${error}`);
  }, []);

  // Theme change handler for voice commands
  const handleSetTheme = useCallback((mode: 'dark' | 'light' | 'toggle') => {
    if (mode === 'toggle') {
      setTheme(theme === 'dark' ? 'light' : 'dark');
      toast.info(`Switched to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    } else {
      setTheme(mode);
      toast.info(`Switched to ${mode} mode`);
    }
  }, [theme, setTheme]);

  // Voice command processing
  const { processSpeechResult } = useVoiceCommands({
    state,
    actions,
    onSetTheme: handleSetTheme,
  });

  // Initialize speech recognition with processor
  const { isSupported, isListening, start, stop } = useSpeechRecognition({
    onResult: processSpeechResult,
    onStart: handleStart,
    onEnd: handleEnd,
    onError: handleError,
    continuous: true,
  });

  const toggleListening = useCallback(() => {
    if (isListening) {
      stop();
      toast.info('Listening stopped');
    } else {
      start();
    }
  }, [isListening, start, stop]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 text-center border-b border-border/50 relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="absolute right-4 top-1/2 -translate-y-1/2"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
        <h1 className="text-3xl md:text-4xl font-bold text-gradient-primary">
          Verba
        </h1>
        <p className="mt-2 text-muted-foreground text-sm md:text-base">
          Voice-powered transcription with intelligent commands
        </p>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center gap-8 p-4 md:p-8">
        {/* Status indicators */}
        <StatusIndicators state={state} />

        {/* Microphone button */}
        <MicButton
          isListening={isListening}
          isSupported={isSupported}
          onClick={toggleListening}
        />

        {/* Dictation display */}
        <div className="w-full max-w-2xl">
          <DictationDisplay
            state={state}
            onClear={actions.clearTranscript}
          />
        </div>

        {/* Command help */}
        <CommandHelp />
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 text-center border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          Powered by Web Speech API • Works best in Chrome or Edge
        </p>
      </footer>
    </div>
  );
};

export default Index;
