import { normalize } from './commandParser';
import { parseSpokenNumber } from './numberWords';

export interface ParameterizedMatch {
  command: 'delete_paragraph';
  /** 0-based, ready to index straight into state.paragraphs. */
  paragraphIndex: number;
}

/**
 * The fixed-phrase registry (commands.ts / commandParser.ts) can only
 * express commands that are the exact same words every time. "Delete
 * paragraph N" varies per utterance, so it can't live in that flat
 * phrase -> command map without either exploding it into one entry per
 * number (doesn't scale, caps out arbitrarily) or bolting regex captures
 * onto what's otherwise a simple lookup table (muddies the one thing that
 * table is good at). Parameterized commands get their own small, explicit
 * matcher instead, tried only after the fixed-phrase lookup misses.
 */
export function parseParameterizedCommand(text: string): ParameterizedMatch | null {
  const normalized = normalize(text);
  const match = normalized.match(/^delete paragraph (.+)$/);
  if (!match) return null;

  const spokenNumber = parseSpokenNumber(match[1]);
  if (spokenNumber === null || spokenNumber < 1) return null;

  // Spoken paragraph numbers are 1-based from the user's perspective
  // ("paragraph 1" = the first paragraph, matching the numbering shown in
  // the UI); state.paragraphs is a 0-based array internally.
  return { command: 'delete_paragraph', paragraphIndex: spokenNumber - 1 };
}
