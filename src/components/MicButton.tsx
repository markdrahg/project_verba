import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MicButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onClick: () => void;
}

/**
 * Animated microphone button with pulse effect when listening
 */
export function MicButton({ isListening, isSupported, onClick }: MicButtonProps) {
  if (!isSupported) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <button
            disabled
            className={cn(
              'relative z-10 w-20 h-20 rounded-full',
              'flex items-center justify-center',
              'bg-muted text-muted-foreground cursor-not-allowed',
              'transition-all duration-300'
            )}
          >
            <MicOff className="w-8 h-8" />
          </button>
        </div>
        <p className="text-sm text-destructive text-center max-w-xs">
          Speech recognition is not supported in this browser. Please try Chrome or Edge.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {/* Pulse rings when listening */}
        {isListening && (
          <>
            <div
              className={cn(
                'absolute inset-0 rounded-full bg-primary/30',
                'animate-pulse-ring'
              )}
            />
            <div
              className={cn(
                'absolute inset-0 rounded-full bg-primary/20',
                'animate-pulse-ring animation-delay-500'
              )}
              style={{ animationDelay: '0.5s' }}
            />
          </>
        )}

        {/* Main button */}
        <button
          onClick={onClick}
          className={cn(
            'relative z-10 w-20 h-20 rounded-full',
            'flex items-center justify-center',
            'transition-all duration-300 transform',
            'focus:outline-none focus:ring-4 focus:ring-primary/30',
            isListening
              ? 'bg-primary text-primary-foreground glow-primary animate-pulse-dot'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105'
          )}
          aria-label={isListening ? 'Stop listening' : 'Start listening'}
        >
          {isListening ? (
            <Mic className="w-8 h-8" />
          ) : (
            <MicOff className="w-8 h-8" />
          )}
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        {isListening ? 'Tap to stop' : 'Tap to start'}
      </p>
    </div>
  );
}
