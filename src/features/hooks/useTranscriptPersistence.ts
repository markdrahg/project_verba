import { useEffect, useRef } from 'react';

const STORAGE_KEY_V2 = 'verba:document:v2';
/** v1 stored a single flat string under this key; kept only for one-time migration. */
const STORAGE_KEY_V1_LEGACY = 'verba:transcript:v1';
const AUTOSAVE_DEBOUNCE_MS = 500;

/**
 * Autosaves the document (debounced) to localStorage and exposes a
 * one-shot `readSavedDocument()` for restoring it on mount.
 *
 * v2 changed the document model from a flat string to a paragraphs array
 * (see types.ts), so the storage format changed too. Rather than lose
 * everyone's v1 autosave on upgrade, readSavedDocument() transparently
 * migrates an old flat-string save into the new array format the first
 * time it's read.
 */
export function useTranscriptPersistence(paragraphs: string[]) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      try {
        const hasContent = paragraphs.some((p) => p.length > 0);
        if (hasContent) {
          window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(paragraphs));
        } else {
          window.localStorage.removeItem(STORAGE_KEY_V2);
        }
      } catch {
        // localStorage can throw in private-browsing modes or when full —
        // autosave is a nice-to-have, so we fail silently rather than
        // crash the app or spam the user with toasts on every keystroke.
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [paragraphs]);
}

/**
 * Reads the last autosaved document, migrating a v1 flat-string save into
 * the v2 paragraphs format if that's all that's present. Returns [] when
 * there's nothing saved (distinct from [''], which is "one empty
 * paragraph") so callers can tell "nothing to restore" apart from "restore
 * an empty document" without inspecting contents.
 */
export function readSavedDocument(): string[] {
  try {
    const v2 = window.localStorage.getItem(STORAGE_KEY_V2);
    if (v2) {
      const parsed: unknown = JSON.parse(v2);
      if (Array.isArray(parsed) && parsed.every((p) => typeof p === 'string')) {
        return parsed as string[];
      }
    }

    const legacy = window.localStorage.getItem(STORAGE_KEY_V1_LEGACY);
    if (legacy) {
      const migrated = legacy.split(/\n{2,}/).filter((p) => p.length > 0);
      const paragraphs = migrated.length > 0 ? migrated : [legacy];
      window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(paragraphs));
      window.localStorage.removeItem(STORAGE_KEY_V1_LEGACY);
      return paragraphs;
    }
  } catch {
    // Corrupt/inaccessible storage — treat as "nothing saved" rather than crash.
  }
  return [];
}

export function clearSavedDocument(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY_V2);
    window.localStorage.removeItem(STORAGE_KEY_V1_LEGACY);
  } catch {
    // ignore
  }
}
