import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { DictationState } from '@/features/types';
import { Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface DictationDisplayProps {
  state: DictationState;
  onClear: () => void;
}

/**
 * Large responsive text area displaying live dictated text
 * Shows transcript with interim results and typing cursor
 */
export function DictationDisplay({ state, onClear }: DictationDisplayProps) {
  const { transcript, interimTranscript, isListening, spellingBuffer, isSpellingMode } = state;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when content changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, interimTranscript]);

  const handleCopy = async () => {
    if (!transcript) return;
    try {
      await navigator.clipboard.writeText(transcript);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleClear = () => {
    if (!transcript) return;
    onClear();
    toast.success('Transcript cleared');
  };

  const hasContent = transcript || interimTranscript || spellingBuffer;

  return (
    <div className="glass-card p-6 w-full animate-scale-in">
      {/* Header with actions */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Transcript
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={!transcript}
            className={cn(
              'p-2 rounded-lg transition-all',
              transcript
                ? 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                : 'text-muted-foreground/30 cursor-not-allowed'
            )}
            aria-label="Copy transcript"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleClear}
            disabled={!transcript}
            className={cn(
              'p-2 rounded-lg transition-all',
              transcript
                ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                : 'text-muted-foreground/30 cursor-not-allowed'
            )}
            aria-label="Clear transcript"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Text display area */}
      <div
        ref={scrollRef}
        className={cn(
          'min-h-[200px] max-h-[400px] overflow-y-auto',
          'font-mono text-lg leading-relaxed',
          'scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent'
        )}
      >
        {hasContent ? (
          <p className="whitespace-pre-wrap break-words">
            {/* Finalized transcript */}
            <span className="text-foreground">{transcript}</span>

            {/* Spelling buffer in spelling mode */}
            {isSpellingMode && spellingBuffer && (
              <span className="text-warning ml-1">[{spellingBuffer}]</span>
            )}

            {/* Interim transcript (partial/unfinished) */}
            {interimTranscript && (
              <span className="text-muted-foreground ml-1">{interimTranscript}</span>
            )}

            {/* Blinking cursor when listening */}
            {isListening && (
              <span className="inline-block w-0.5 h-5 bg-primary ml-0.5 align-middle animate-cursor" />
            )}
          </p>
        ) : (
          <p className="text-muted-foreground/50 italic">
            {isListening
              ? 'Listening... Start speaking to transcribe.'
              : 'Tap the microphone to start dictating.'}
          </p>
        )}
      </div>

      {/* Character/word count */}
      {transcript && (
        <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-4 text-xs text-muted-foreground">
          <span>{transcript.split(/\s+/).filter(Boolean).length} words</span>
          <span>{transcript.length} characters</span>
        </div>
      )}
    </div>
  );
}
