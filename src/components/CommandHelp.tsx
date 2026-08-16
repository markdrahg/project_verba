import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COMMAND_REGISTRY, PARAMETERIZED_COMMAND_HELP } from '@/features/commands';

/**
 * Collapsible help section showing available voice commands.
 *
 * Reads directly from COMMAND_REGISTRY (features/commands.ts) so this panel
 * can never drift out of sync with what the parser actually recognizes.
 * Parameterized commands (e.g. "delete paragraph 2") aren't in that
 * registry — their wording varies, so they're documented separately in
 * PARAMETERIZED_COMMAND_HELP and merged in here for display only.
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
            {COMMAND_REGISTRY.map(({ command, label, description }) => (
              <div
                key={command}
                className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0"
              >
                <code className="text-xs bg-secondary px-2 py-1 rounded text-primary font-mono flex-shrink-0">
                  {label}
                </code>
                <span className="text-sm text-muted-foreground">{description}</span>
              </div>
            ))}
            {PARAMETERIZED_COMMAND_HELP.map(({ label, description }) => (
              <div
                key={label}
                className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0"
              >
                <code className="text-xs bg-secondary px-2 py-1 rounded text-primary font-mono flex-shrink-0">
                  {label}
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
