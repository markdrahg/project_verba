import { describe, it, expect } from 'vitest';
import { parseParameterizedCommand } from '../parameterizedCommands';

describe('parseParameterizedCommand', () => {
  it('matches "delete paragraph N" with a digit, returning a 0-based index', () => {
    expect(parseParameterizedCommand('delete paragraph 1')).toEqual({
      command: 'delete_paragraph',
      paragraphIndex: 0,
    });
    expect(parseParameterizedCommand('delete paragraph 4')).toEqual({
      command: 'delete_paragraph',
      paragraphIndex: 3,
    });
  });

  it('matches "delete paragraph N" with a spoken number word', () => {
    expect(parseParameterizedCommand('delete paragraph two')).toEqual({
      command: 'delete_paragraph',
      paragraphIndex: 1,
    });
  });

  it('is case-insensitive and tolerates trailing punctuation', () => {
    expect(parseParameterizedCommand('Delete Paragraph Two.')).toEqual({
      command: 'delete_paragraph',
      paragraphIndex: 1,
    });
  });

  it('rejects paragraph zero and negative-ish input', () => {
    expect(parseParameterizedCommand('delete paragraph zero')).toBeNull();
  });

  it('returns null when no number follows', () => {
    expect(parseParameterizedCommand('delete paragraph')).toBeNull();
  });

  it('returns null for unrelated speech', () => {
    expect(parseParameterizedCommand('the quick brown fox')).toBeNull();
    expect(parseParameterizedCommand('delete last word')).toBeNull();
  });
});
