import { Mic, MicOff, Pause, Play, Command, Type, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DictationState } from '@/features/types';

interface StatusIndicatorsProps {
  state: DictationState;
}

interface StatusBadgeProps {
  active: boolean;
  activeColor: 'primary' | 'success' | 'warning' | 'destructive';
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
}

function StatusBadge({ active, activeColor, icon, label, sublabel }: StatusBadgeProps) {
  const colorClasses = {
    primary: 'bg-primary/20 text-primary border-primary/30',
    success: 'bg-success/20 text-success border-success/30',
    warning: 'bg-warning/20 text-warning border-warning/30',
    destructive: 'bg-destructive/20 text-destructive border-destructive/30',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300',
        active
          ? colorClasses[activeColor]
          : 'bg-muted/50 text-muted-foreground border-border/50 opacity-50'
      )}
    >
      <span className={cn('transition-transform', active && 'scale-110')}>
        {icon}
      </span>
      <span className="text-xs font-medium">
        {label}
        {sublabel && <span className="ml-1 opacity-70">{sublabel}</span>}
      </span>
    </div>
  );
}

/**
 * Status indicators showing current dictation state
 * Displays listening, paused, command mode, spelling mode, and confirmation status
 */
export function StatusIndicators({ state }: StatusIndicatorsProps) {
  const {
    isListening,
    isPaused,
    isCommandMode,
    isSpellingMode,
    pendingConfirmation,
    spellingBuffer,
  } = state;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 animate-fade-in">
      {/* Listening Status */}
      <StatusBadge
        active={isListening}
        activeColor="success"
        icon={isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
        label={isListening ? 'Listening' : 'Not Listening'}
      />

      {/* Paused Status */}
      {isListening && (
        <StatusBadge
          active={isPaused}
          activeColor="warning"
          icon={isPaused ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          label={isPaused ? 'Paused' : 'Active'}
        />
      )}

      {/* Command Mode */}
      {isListening && (
        <StatusBadge
          active={isCommandMode}
          activeColor="primary"
          icon={<Command className="w-3.5 h-3.5" />}
          label="Commands"
          sublabel={isCommandMode ? 'ON' : 'OFF'}
        />
      )}

      {/* Spelling Mode */}
      {isListening && (
        <StatusBadge
          active={isSpellingMode}
          activeColor="primary"
          icon={<Type className="w-3.5 h-3.5" />}
          label="Spelling"
          sublabel={isSpellingMode ? spellingBuffer || '...' : 'OFF'}
        />
      )}

      {/* Pending Confirmation */}
      {pendingConfirmation && (
        <StatusBadge
          active={true}
          activeColor="destructive"
          icon={<AlertCircle className="w-3.5 h-3.5" />}
          label={pendingConfirmation.description}
          sublabel="Say confirm or cancel"
        />
      )}
    </div>
  );
}
