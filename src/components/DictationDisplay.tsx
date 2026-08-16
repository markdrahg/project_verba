import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { DictationState } from '@/features/types';
import { Copy, Trash2, FileText, FileDown } from 'lucide-react';
import { toast } from 'sonner';

interface DictationDisplayProps {
  state: DictationState;
  onClear: () => void;
  onExportPdf: () => void;
  onExportDocx: () => void;
}

function headerButtonClass(enabled: boolean, destructive = false) {
  if (!enabled) return 'p-2 rounded-lg transition-all text-muted-foreground/30 cursor-not-allowed';
  return cn(
    'p-2 rounded-lg transition-all text-muted-foreground hover:bg-secondary',
    destructive ? 'hover:text-destructive hover:bg-destructive/10' : 'hover:text-foreground'
  );
}

/**
 * Large responsive text area displaying the live dictated document as
 * numbered paragraphs, with interim results and a typing cursor on the
 * paragraph currently being dictated.
 */
export function DictationDisplay({ state, onClear, onExportPdf, onExportDocx }: DictationDisplayProps) {
  const { paragraphs, interimTranscript, isListening, spellingBuffer, isSpellingMode } = state;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when content changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [paragraphs, interimTranscript]);

  const hasText = paragraphs.some((p) => p.length > 0);
  const hasContent = hasText || Boolean(interimTranscript) || Boolean(spellingBuffer);

  const handleCopy = async () => {
    if (!hasText) return;
    try {
      await navigator.clipboard.writeText(paragraphs.join('\n\n'));
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleClear = () => {
    if (!hasText) return;
    onClear();
    toast.success('Transcript cleared');
  };

  const wordCount = paragraphs.reduce((sum, p) => sum + p.split(/\s+/).filter(Boolean).length, 0);
  const charCount = paragraphs.reduce((sum, p) => sum + p.length, 0);
  const paragraphCount = paragraphs.filter((p) => p.length > 0).length;

  return (
    <div className="glass-card p-6 w-full animate-scale-in">
      {/* Header with actions */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Transcript
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={onExportDocx}
            disabled={!hasText}
            className={headerButtonClass(hasText)}
            aria-label="Download as Word document"
            title="Download DOCX"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            onClick={onExportPdf}
            disabled={!hasText}
            className={headerButtonClass(hasText)}
            aria-label="Download as PDF"
            title="Download PDF"
          >
            <FileDown className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopy}
            disabled={!hasText}
            className={headerButtonClass(hasText)}
            aria-label="Copy transcript"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleClear}
            disabled={!hasText}
            className={headerButtonClass(hasText, true)}
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
          'font-mono text-lg leading-relaxed space-y-3',
          'scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent'
        )}
      >
        {hasContent ? (
          paragraphs.map((paragraph, index) => {
            const isLastParagraph = index === paragraphs.length - 1;
            return (
              <p key={index} className="whitespace-pre-wrap break-words flex gap-3">
                <span className="text-muted-foreground/50 select-none text-sm shrink-0 pt-0.5 tabular-nums">
                  {index + 1}.
                </span>
                <span>
                  <span className="text-foreground">{paragraph}</span>

                  {/* Spelling buffer / interim / cursor only ever apply to the paragraph currently being dictated */}
                  {isLastParagraph && isSpellingMode && spellingBuffer && (
                    <span className="text-warning ml-1">[{spellingBuffer}]</span>
                  )}
                  {isLastParagraph && interimTranscript && (
                    <span className="text-muted-foreground ml-1">{interimTranscript}</span>
                  )}
                  {isLastParagraph && isListening && (
                    <span className="inline-block w-0.5 h-5 bg-primary ml-0.5 align-middle animate-cursor" />
                  )}
                </span>
              </p>
            );
          })
        ) : (
          <p className="text-muted-foreground/50 italic">
            {isListening
              ? 'Listening... Start speaking to transcribe.'
              : 'Tap the microphone to start dictating.'}
          </p>
        )}
      </div>

      {/* Paragraph/word/character count */}
      {hasText && (
        <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-4 text-xs text-muted-foreground">
          <span>{paragraphCount} paragraph{paragraphCount === 1 ? '' : 's'}</span>
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
        </div>
      )}
    </div>
  );
}
