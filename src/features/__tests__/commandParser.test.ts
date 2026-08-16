import { describe, it, expect } from 'vitest';
import { parseCommand, extractLetter, isSingleLetter, suggestClosestCommand } from '../commandParser';

describe('parseCommand', () => {
  it('matches an exact command phrase', () => {
    expect(parseCommand('stop listening')).toBe('stop_listening');
    expect(parseCommand('dark mode')).toBe('dark_mode');
  });

  it('is case-insensitive', () => {
    expect(parseCommand('STOP LISTENING')).toBe('stop_listening');
    expect(parseCommand('Dark Mode')).toBe('dark_mode');
  });

  it('tolerates trailing punctuation from the recognizer', () => {
    // v1 regression: anchored ^...$ regex meant any trailing punctuation
    // caused a silent, total match failure.
    expect(parseCommand('stop listening.')).toBe('stop_listening');
    expect(parseCommand('confirm,')).toBe('confirm');
    expect(parseCommand('cancel!')).toBe('cancel');
  });

  it('tolerates extra internal/outer whitespace', () => {
    expect(parseCommand('  stop   listening  ')).toBe('stop_listening');
  });

  it('returns null for non-command speech', () => {
    expect(parseCommand('the quick brown fox')).toBeNull();
    expect(parseCommand('')).toBeNull();
  });

  it('does not match a command phrase embedded in a longer sentence', () => {
    expect(parseCommand('please stop listening to me')).toBeNull();
  });
});

describe('extractLetter', () => {
  it('extracts a bare single letter', () => {
    expect(extractLetter('a')).toBe('a');
    expect(extractLetter('Z')).toBe('z');
  });

  it('extracts from "letter X"', () => {
    expect(extractLetter('letter b')).toBe('b');
  });

  it('extracts and uppercases from "capital X"', () => {
    expect(extractLetter('capital c')).toBe('C');
  });

  it('returns null for anything else', () => {
    expect(extractLetter('hello')).toBeNull();
    expect(extractLetter('')).toBeNull();
  });
});

describe('isSingleLetter', () => {
  it('recognizes single letters only', () => {
    expect(isSingleLetter('a')).toBe(true);
    expect(isSingleLetter('ab')).toBe(false);
    expect(isSingleLetter('')).toBe(false);
  });
});

describe('suggestClosestCommand', () => {
  it('suggests a close phrase for a near-miss', () => {
    expect(suggestClosestCommand('stop listenin')).toBe('stop listening');
  });

  it('returns null for speech unrelated to any command', () => {
    expect(suggestClosestCommand('I went to the store yesterday and bought milk')).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(suggestClosestCommand('')).toBeNull();
  });
});
