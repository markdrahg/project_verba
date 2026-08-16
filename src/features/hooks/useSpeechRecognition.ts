import { useEffect, useRef, useCallback, useState } from 'react';
import { SpeechEngine, SpeechEngineOptions, UseSpeechEngine } from '../speechEngine';

// Extend Window interface for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Auto-restart tuning. v1 restarted unconditionally and unboundedly on
// every `onend` while `shouldRestartRef.current` was true — if `start()`
// kept throwing (e.g. mic permission revoked mid-session), it would retry
// forever, silently, inside a `catch {}` block with no cap and no
// user-facing signal.
const MAX_CONSECUTIVE_RESTART_FAILURES = 5;
const RESTART_BACKOFF_BASE_MS = 300;

// Errors the underlying engine recovers from on its own; not worth
// surfacing to the user (matches v1 behavior for these two).
const SILENT_ERROR_CODES = new Set(['no-speech', 'aborted']);

/**
 * Web Speech API implementation of the SpeechEngine port (see
 * features/speechEngine.ts). Handles browser compatibility, restart
 * backoff, and exposes a clean start/stop interface.
 */
export const useSpeechRecognition: UseSpeechEngine = ({
  onResult,
  onError,
  onStart,
  onEnd,
  continuous = true,
  lang = 'en-US',
}: SpeechEngineOptions): SpeechEngine => {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const shouldRestartRef = useRef(false);
  const consecutiveFailuresRef = useRef(0);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use refs for callbacks to avoid re-initializing recognition
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  const onStartRef = useRef(onStart);
  const onEndRef = useRef(onEnd);

  // Keep refs up to date
  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
    onStartRef.current = onStart;
    onEndRef.current = onEnd;
  }, [onResult, onError, onStart, onEnd]);

  // Initialize recognition on mount
  useEffect(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      onErrorRef.current?.({ code: 'not-supported', recoverable: false });
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = lang;

    const attemptRestart = () => {
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);

      if (consecutiveFailuresRef.current >= MAX_CONSECUTIVE_RESTART_FAILURES) {
        shouldRestartRef.current = false;
        onErrorRef.current?.({ code: 'restart-failed', recoverable: false });
        return;
      }

      // Exponential backoff so a persistently failing mic (permission
      // revoked, device unplugged, etc.) doesn't spin in a tight loop.
      const delay = RESTART_BACKOFF_BASE_MS * 2 ** consecutiveFailuresRef.current;
      restartTimeoutRef.current = setTimeout(() => {
        try {
          recognition.start();
          consecutiveFailuresRef.current = 0;
        } catch {
          consecutiveFailuresRef.current += 1;
          attemptRestart();
        }
      }, delay);
    };

    recognition.onstart = () => {
      setIsListening(true);
      consecutiveFailuresRef.current = 0;
      onStartRef.current?.();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onResultRef.current(finalTranscript.trim(), true);
      } else if (interimTranscript) {
        onResultRef.current(interimTranscript.trim(), false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (SILENT_ERROR_CODES.has(event.error)) {
        return;
      }
      onErrorRef.current?.({ code: event.error, recoverable: shouldRestartRef.current });
    };

    recognition.onend = () => {
      setIsListening(false);

      if (shouldRestartRef.current) {
        attemptRestart();
      } else {
        onEndRef.current?.();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldRestartRef.current = false;
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      recognition.abort();
    };
  }, [continuous, lang]);

  const start = useCallback(() => {
    if (!recognitionRef.current || !isSupported) return;

    try {
      shouldRestartRef.current = true;
      consecutiveFailuresRef.current = 0;
      recognitionRef.current.start();
    } catch {
      // Already started, ignore
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;

    shouldRestartRef.current = false;
    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    recognitionRef.current.stop();
  }, []);

  return {
    isSupported,
    isListening,
    start,
    stop,
  };
};
