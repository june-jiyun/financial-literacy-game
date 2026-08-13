import { describe, it, expect } from 'vitest';
import { calcSessionScore, formatSessionScore } from './sessionScore';
import type { TurnResult } from '../../types';

function makeResult(turnIndex: number, isCorrect: boolean): TurnResult {
  return {
    turnIndex,
    monthLabel: `${turnIndex}월`,
    quizCompanyId: 'c1',
    quizCompanyName: '테스트 기업',
    selectedCauseId: isCorrect ? 'cause_correct' : 'cause_wrong',
    correctCauseId: 'cause_correct',
    isCorrect,
  };
}

describe('calcSessionScore', () => {
  it('returns 0/0 for an empty session', () => {
    expect(calcSessionScore([])).toEqual({ correct: 0, total: 0 });
  });

  it('counts all correct when every turn is right (3-turn session)', () => {
    const results = [makeResult(1, true), makeResult(2, true), makeResult(3, true)];
    expect(calcSessionScore(results)).toEqual({ correct: 3, total: 3 });
  });

  it('counts none correct when every turn is wrong (3-turn session)', () => {
    const results = [makeResult(1, false), makeResult(2, false), makeResult(3, false)];
    expect(calcSessionScore(results)).toEqual({ correct: 0, total: 3 });
  });

  it('counts mixed correct/wrong across 5-turn session', () => {
    const results = [
      makeResult(1, true),
      makeResult(2, false),
      makeResult(3, true),
      makeResult(4, false),
      makeResult(5, true),
    ];
    expect(calcSessionScore(results)).toEqual({ correct: 3, total: 5 });
  });

  it('handles 4-turn session with 1 correct', () => {
    const results = [
      makeResult(1, false),
      makeResult(2, true),
      makeResult(3, false),
      makeResult(4, false),
    ];
    expect(calcSessionScore(results)).toEqual({ correct: 1, total: 4 });
  });
});

describe('formatSessionScore', () => {
  it('formats "3턴 중 3턴 정답" for a perfect 3-turn session', () => {
    expect(formatSessionScore({ correct: 3, total: 3 })).toBe('3턴 중 3턴 정답');
  });

  it('formats "5턴 중 2턴 정답" for 2 correct out of 5', () => {
    expect(formatSessionScore({ correct: 2, total: 5 })).toBe('5턴 중 2턴 정답');
  });

  it('formats "4턴 중 0턴 정답" for 0 correct out of 4', () => {
    expect(formatSessionScore({ correct: 0, total: 4 })).toBe('4턴 중 0턴 정답');
  });

  it('formats "5턴 중 5턴 정답" for a perfect 5-turn session', () => {
    expect(formatSessionScore({ correct: 5, total: 5 })).toBe('5턴 중 5턴 정답');
  });
});
