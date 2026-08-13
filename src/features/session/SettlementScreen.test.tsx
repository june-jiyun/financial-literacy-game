import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import SettlementScreen from './SettlementScreen';
import { isSessionOver, isValidSessionLength } from './sessionScore';
import type { TurnResult, CashflowState } from '../../types';

const CASHFLOW: CashflowState = {
  salary: 3_000_000,
  living_cost: 1_500_000,
  cash: 5_000_000,
  invested: 0,
  invested_cost: 0,
  profit_loss: 0,
};

function makeResults(outcomes: boolean[]): TurnResult[] {
  return outcomes.map((isCorrect, i) => ({
    turnIndex: i + 1,
    monthLabel: `${i + 1}월`,
    quizCompanyId: 'c1',
    quizCompanyName: '테스트 기업',
    selectedCauseId: isCorrect ? 'cause_correct' : 'cause_wrong',
    correctCauseId: 'cause_correct',
    isCorrect,
  }));
}

function renderSettlement(outcomes: boolean[]) {
  return render(
    <SettlementScreen
      turnResults={makeResults(outcomes)}
      cashflow={CASHFLOW}
      setId="A"
      onReplay={() => {}}
    />,
  );
}

describe('SettlementScreen (결산 화면)', () => {
  it('aggregates a 3-turn session as "3턴 중 2턴 정답"', () => {
    renderSettlement([true, false, true]);
    expect(screen.getByTestId('session-score-label').textContent).toBe('3턴 중 2턴 정답');
    expect(screen.getByTestId('session-score-fraction').textContent).toBe('2/3');
  });

  it('aggregates a 5-turn perfect session as "5턴 중 5턴 정답"', () => {
    renderSettlement([true, true, true, true, true]);
    expect(screen.getByTestId('session-score-label').textContent).toBe('5턴 중 5턴 정답');
  });

  it('aggregates a 4-turn zero-correct session as "4턴 중 0턴 정답"', () => {
    renderSettlement([false, false, false, false]);
    expect(screen.getByTestId('session-score-label').textContent).toBe('4턴 중 0턴 정답');
  });

  it('renders one row per completed turn (3~5 turns)', () => {
    renderSettlement([true, false, true, false]);
    expect(screen.getAllByTestId('settlement-turn-row')).toHaveLength(4);
  });

  it('shows the 결산 화면 heading marking session end', () => {
    renderSettlement([true, true, true]);
    expect(screen.getByText('🏁 결산 화면')).toBeTruthy();
  });

  it('offers a replay button and fires onReplay', () => {
    const onReplay = vi.fn();
    render(
      <SettlementScreen
        turnResults={makeResults([true, true, true])}
        cashflow={CASHFLOW}
        setId="A"
        onReplay={onReplay}
      />,
    );
    fireEvent.click(screen.getByText('다시 하기 (다음 세트)'));
    expect(onReplay).toHaveBeenCalledOnce();
  });
});

describe('session-end transition', () => {
  it('is not over before the final turn', () => {
    expect(isSessionOver(0, 3)).toBe(false);
    expect(isSessionOver(3, 5)).toBe(false);
  });

  it('is over on the final turn of a 3-turn and 5-turn session', () => {
    expect(isSessionOver(2, 3)).toBe(true);
    expect(isSessionOver(4, 5)).toBe(true);
  });

  it('accepts only 3~5 turn session lengths', () => {
    expect(isValidSessionLength(3)).toBe(true);
    expect(isValidSessionLength(5)).toBe(true);
    expect(isValidSessionLength(2)).toBe(false);
    expect(isValidSessionLength(6)).toBe(false);
  });
});
