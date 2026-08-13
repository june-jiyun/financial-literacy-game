import type { TurnResult } from '../../types';

export interface SessionScore {
  correct: number;
  total: number;
}

export function calcSessionScore(turnResults: TurnResult[]): SessionScore {
  return {
    correct: turnResults.filter(r => r.isCorrect).length,
    total: turnResults.length,
  };
}

export function formatSessionScore(score: SessionScore): string {
  return `${score.total}턴 중 ${score.correct}턴 정답`;
}

/** Minimum / maximum turns per session (1 turn = 1 in-game month). */
export const MIN_SESSION_TURNS = 3;
export const MAX_SESSION_TURNS = 5;

/**
 * A session is over once the just-completed turn is the final turn of the
 * scenario. `turnIdx` is 0-based; `totalTurns` must be within the 3~5 range.
 */
export function isSessionOver(turnIdx: number, totalTurns: number): boolean {
  return turnIdx >= totalTurns - 1;
}

/** Whether a scenario's turn count is within the allowed 3~5 session length. */
export function isValidSessionLength(totalTurns: number): boolean {
  return totalTurns >= MIN_SESSION_TURNS && totalTurns <= MAX_SESSION_TURNS;
}
