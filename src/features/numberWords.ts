/**
 * Parses a spoken number into an integer. The Web Speech API is
 * inconsistent about whether it transcribes a spoken number as digits
 * ("2") or as a word ("two") — it varies by phrase, browser, and how the
 * user happens to pronounce it — so both forms need to be accepted at the
 * point of use ("delete paragraph two" and "delete paragraph 2" must both
 * work).
 */
const WORD_TO_NUMBER: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
};

/**
 * Parse a single spoken number, either as digits ("12") or as a word
 * ("twelve"). Returns null for anything else — this intentionally does
 * not attempt to parse compound numbers ("twenty one"), since paragraph
 * counts realistically stay well under that range for a dictation app.
 */
export function parseSpokenNumber(text: string): number | null {
  const trimmed = text.trim().toLowerCase();
  if (!trimmed) return null;

  if (/^\d+$/.test(trimmed)) {
    const parsed = parseInt(trimmed, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return trimmed in WORD_TO_NUMBER ? WORD_TO_NUMBER[trimmed] : null;
}
