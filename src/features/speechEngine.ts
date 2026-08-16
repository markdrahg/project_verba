/**
 * Port for a speech-to-text engine.
 *
 * v1 had `useVoiceCommands`/`Index.tsx` calling directly into a hook that
 * was hard-wired to the browser's Web Speech API, with no seam for
 * swapping engines. Given the README already flags that Safari/Firefox
 * barely support Web Speech, that's a real reach limiter — this interface
 * is the contract any future engine hook (e.g. a server-side
 * Whisper-backed one, for browsers without native support) must satisfy
 * to be a drop-in replacement for `useSpeechRecognition`.
 *
 * This is intentionally just a type-level contract (a "hook shape"), not a
 * runtime plugin system — that's the right amount of abstraction for an
 * app with exactly one engine today. It should still be introduced now
 * rather than later, because retrofitting it after more app code depends
 * on `useSpeechRecognition`'s concrete return shape is strictly more work.
 */
export interface SpeechEngineOptions {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (error: SpeechEngineError) => void;
  onStart?: () => void;
  onEnd?: () => void;
  continuous?: boolean;
  lang?: string;
}

export interface SpeechEngineError {
  /** Machine-readable error code (engine-specific, e.g. 'not-allowed', 'network'). */
  code: string;
  /** Whether the engine will keep trying on its own, or has given up. */
  recoverable: boolean;
}

export interface SpeechEngine {
  /** Whether this engine is usable in the current environment at all. */
  isSupported: boolean;
  /** Whether the engine is actively capturing audio right now. */
  isListening: boolean;
  start: () => void;
  stop: () => void;
}

/** The shape every speech engine hook (e.g. useSpeechRecognition) must implement. */
export type UseSpeechEngine = (options: SpeechEngineOptions) => SpeechEngine;
