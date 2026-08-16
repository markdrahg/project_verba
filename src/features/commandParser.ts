import { VoiceCommand } from './types';
import { COMMAND_REGISTRY, lookupCommand, ALL_PHRASES } from './commands';

/**
 * Normalize spoken text before matching:
 * - lowercase
 * - trim outer whitespace
 * - collapse internal whitespace
 * - strip trailing sentence punctuation the speech engine sometimes appends
 *   (e.g. "stop listening." or "stop listening,")
 *
 * Previously commands were matched with an anchored `^...$` regex against
 * the raw transcript, so any trailing punctuation or double space from the
 * recognizer caused a silent, unexplained match failure. Normalizing first
 * fixes that whole class of "the command just didn't work" bugs.
 */
export function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,!?]+$/g, '')
    .trim();
}

/**
 * Parse spoken text and detect if it matches a voice command.
 * @param text - The spoken text to parse
 * @returns The matched command or null if no command matches
 */
export function parseCommand(text: string): VoiceCommand | null {
  return lookupCommand(normalize(text));
}

/**
 * Check if text is a single letter (for spelling mode)
 */
export function isSingleLetter(text: string): boolean {
  const normalized = normalize(text);
  return /^[a-z]$/.test(normalized);
}

/**
 * Extract the letter from spoken input
 * Handles cases like "letter A", "A", "capital A"
 */
export function extractLetter(text: string): string | null {
  const normalized = normalize(text);

  // Direct single letter
  if (/^[a-z]$/.test(normalized)) {
    return normalized;
  }

  // "letter X" pattern
  const letterMatch = normalized.match(/^letter\s+([a-z])$/);
  if (letterMatch) {
    return letterMatch[1];
  }

  // "capital X" pattern - still return lowercase for simplicity
  const capitalMatch = normalized.match(/^capital\s+([a-z])$/);
  if (capitalMatch) {
    return capitalMatch[1].toUpperCase();
  }

  return null;
}

/**
 * Get a human-readable description of a command
 */
export function getCommandDescription(command: VoiceCommand): string {
  const def = COMMAND_REGISTRY.find((d) => d.command === command);
  return def?.description ?? command;
}

/** Levenshtein edit distance, used only for short command-phrase suggestions. */
function editDistance(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

/**
 * Find the closest known command phrase to unrecognized speech, so the UI
 * can surface a helpful "did you mean ...?" hint instead of silently
 * dropping the utterance. Only suggests a match within a small edit
 * distance relative to phrase length, to avoid nonsense suggestions for
 * speech that isn't command-shaped at all.
 */
export function suggestClosestCommand(text: string): string | null {
  const normalized = normalize(text);
  if (!normalized || normalized.length < 2) return null;

  let best: { phrase: string; distance: number } | null = null;
  for (const phrase of ALL_PHRASES) {
    const distance = editDistance(normalized, phrase);
    if (!best || distance < best.distance) {
      best = { phrase, distance };
    }
  }

  if (!best) return null;
  const threshold = Math.max(1, Math.floor(best.phrase.length * 0.3));
  return best.distance <= threshold ? best.phrase : null;
}
