import { useEffect, useRef, useCallback, useState } from 'react';

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

interface UseSpeechRecognitionProps {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  continuous?: boolean;
  lang?: string;
}

/**
 * Hook for Web Speech API speech recognition
 * Handles browser compatibility and provides a clean interface
 */
export function useSpeechRecognition({
  onResult,
  onError,
  onStart,
  onEnd,
  continuous = true,
  lang = 'en-US',
}: UseSpeechRecognitionProps) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const shouldRestartRef = useRef(false);
  
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
      onErrorRef.current?.('Speech recognition is not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      setIsListening(true);
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
      // Ignore no-speech errors in continuous mode
      if (event.error === 'no-speech') {
        return;
      }
      
      // Handle aborted - this is expected when stopping
      if (event.error === 'aborted') {
        return;
      }

      onErrorRef.current?.(event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
      
      // Auto-restart if we should be listening
      if (shouldRestartRef.current) {
        try {
          recognition.start();
        } catch (e) {
          // Ignore start errors during restart
        }
      } else {
        onEndRef.current?.();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldRestartRef.current = false;
      recognition.abort();
    };
  }, [continuous, lang]);

  const start = useCallback(() => {
    if (!recognitionRef.current || !isSupported) return;

    try {
      shouldRestartRef.current = true;
      recognitionRef.current.start();
    } catch (error) {
      // Already started, ignore
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;

    shouldRestartRef.current = false;
    recognitionRef.current.stop();
  }, []);

  return {
    isSupported,
    isListening,
    start,
    stop,
  };
}
