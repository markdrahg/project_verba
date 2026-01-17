import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const COMMANDS = [
  { command: '"Start listening" / "Stop listening"', description: 'Toggle microphone' },
  { command: '"Command mode" / "Dictate"', description: 'Switch between command & dictation modes' },
  { command: '"Pause dictation" / "Resume dictation"', description: 'Pause/resume transcription' },
  { command: '"Activate spelling" / "Exit spelling"', description: 'Spell words letter by letter' },
  { command: '"Delete last word"', description: 'Remove the last word (requires confirmation)' },
  { command: '"Confirm" / "Cancel"', description: 'Confirm or cancel pending actions' },
  { command: '"Dark mode" / "Light mode"', description: 'Switch theme (command mode only)' },
  { command: '"Toggle theme"', description: 'Toggle between dark and light (command mode only)' },
];

/**
 * Collapsible help section showing available voice commands
 */
export function CommandHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-center gap-2',
          'py-2 px-4 rounded-lg',
          'text-sm text-muted-foreground',
          'hover:text-foreground hover:bg-secondary/50',
          'transition-all duration-200'
        )}
      >
        <HelpCircle className="w-4 h-4" />
        <span>Voice Commands</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {isOpen && (
        <div className="mt-2 glass-card p-4 animate-scale-in">
          <div className="grid gap-2">
            {COMMANDS.map(({ command, description }) => (
              <div
                key={command}
                className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0"
              >
                <code className="text-xs bg-secondary px-2 py-1 rounded text-primary font-mono flex-shrink-0">
                  {command}
                </code>
                <span className="text-sm text-muted-foreground">{description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
