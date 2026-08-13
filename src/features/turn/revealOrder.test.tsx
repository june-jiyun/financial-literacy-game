import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React, { useState } from 'react';
import {
  shouldShowImpactTicks,
  isAnswerCorrect,
  getQuizTargetCompanyId,
  RevealState,
} from './revealOrder';
import type { CauseCard } from '../../types';

// ── Pure function tests ────────────────────────────────────────────────────────

describe('shouldShowImpactTicks', () => {
  it('returns false before player selects (quiz phase)', () => {
    const state: RevealState = { selectedCauseId: null, isRevealed: false };
    expect(shouldShowImpactTicks(state)).toBe(false);
  });

  it('returns false when cause selected but reveal not yet triggered', () => {
    const state: RevealState = { selectedCauseId: 'cause_1', isRevealed: false };
    expect(shouldShowImpactTicks(state)).toBe(false);
  });

  it('returns true after reveal is triggered (post-selection)', () => {
    const state: RevealState = { selectedCauseId: 'cause_1', isRevealed: true };
    expect(shouldShowImpactTicks(state)).toBe(true);
  });
});

describe('isAnswerCorrect', () => {
  it('returns true when selected cause matches the correct cause', () => {
    expect(isAnswerCorrect('cause_1', 'cause_1')).toBe(true);
  });

  it('returns false when selected cause does not match the correct cause', () => {
    expect(isAnswerCorrect('cause_2', 'cause_1')).toBe(false);
  });

  it('returns false when no cause has been selected', () => {
    expect(isAnswerCorrect(null, 'cause_1')).toBe(false);
  });
});

describe('getQuizTargetCompanyId', () => {
  const companies = [
    { id: 'company_a', price_change_rate: 5.0 },
    { id: 'company_b', price_change_rate: -8.0 },
    { id: 'company_c', price_change_rate: 3.0 },
  ];

  it('returns the invested company when action is 매수', () => {
    expect(getQuizTargetCompanyId(companies, 'company_a', '매수')).toBe('company_a');
  });

  it('returns the invested company when action is 보유', () => {
    expect(getQuizTargetCompanyId(companies, 'company_c', '보유')).toBe('company_c');
  });

  it('returns company with largest absolute price change when no investment', () => {
    // company_b has |−8.0| = 8.0, the highest absolute value
    expect(getQuizTargetCompanyId(companies, null, null)).toBe('company_b');
  });

  it('returns company with largest absolute price change when action is 보류', () => {
    expect(getQuizTargetCompanyId(companies, null, '보류')).toBe('company_b');
  });

  it('returns company with largest absolute price change when action is 매도', () => {
    expect(getQuizTargetCompanyId(companies, null, '매도')).toBe('company_b');
  });
});

// ── React component test: select→reveal flow ───────────────────────────────────

const SAMPLE_CARDS: CauseCard[] = [
  { id: 'c1', label: '분기 매출 15% 급증 공시', impact_ticks: 5.0, linked_indicator: 'revenue' },
  { id: 'c2', label: '외국인 대규모 순매수 유입', impact_ticks: 2.5, linked_indicator: 'net_buying' },
];
const CORRECT_CAUSE_ID = 'c1';

const INDICATOR_LABELS: Record<string, string> = {
  revenue: '매출',
  net_buying: '외국인·기관 순매수',
};

function QuizRevealFlow({ cards, correctId }: { cards: CauseCard[]; correctId: string }) {
  const [state, setState] = useState<RevealState>({ selectedCauseId: null, isRevealed: false });
  const revealed = shouldShowImpactTicks(state);

  function handleSelect(id: string) {
    setState(prev => ({ ...prev, selectedCauseId: id }));
  }

  function handleSubmit() {
    if (state.selectedCauseId) {
      setState(prev => ({ ...prev, isRevealed: true }));
    }
  }

  const correct = state.isRevealed && state.selectedCauseId !== null
    ? isAnswerCorrect(state.selectedCauseId, correctId)
    : null;

  return (
    <div>
      <div data-testid="quiz-phase-indicator">{revealed ? 'revealed' : 'quiz'}</div>

      {correct !== null && (
        <div data-testid="result-badge">{correct ? '정답' : '오답'}</div>
      )}

      {cards.map(card => (
        <div key={card.id} data-testid={`card-${card.id}`}>
          <span data-testid={`label-${card.id}`}>{card.label}</span>
          {revealed && (
            <>
              <span data-testid={`impact-${card.id}`}>
                {card.impact_ticks >= 0 ? '+' : ''}{card.impact_ticks.toFixed(1)}%p
              </span>
              <span data-testid={`indicator-${card.id}`}>
                {INDICATOR_LABELS[card.linked_indicator] ?? card.linked_indicator}
              </span>
            </>
          )}
          <button onClick={() => handleSelect(card.id)}>선택</button>
        </div>
      ))}

      <button data-testid="submit-btn" onClick={handleSubmit} disabled={!state.selectedCauseId}>
        선택 완료
      </button>
    </div>
  );
}

describe('QuizRevealFlow component', () => {
  it('hides impact_ticks before player selects a cause', () => {
    render(<QuizRevealFlow cards={SAMPLE_CARDS} correctId={CORRECT_CAUSE_ID} />);

    // Labels are visible
    expect(screen.getByTestId('label-c1')).toBeTruthy();
    expect(screen.getByTestId('label-c2')).toBeTruthy();

    // impact_ticks are not shown yet
    expect(screen.queryByTestId('impact-c1')).toBeNull();
    expect(screen.queryByTestId('impact-c2')).toBeNull();
    expect(screen.queryByTestId('result-badge')).toBeNull();

    // Phase indicator shows quiz
    expect(screen.getByTestId('quiz-phase-indicator').textContent).toBe('quiz');
  });

  it('reveals impact_ticks and linked indicators after player submits selection', () => {
    render(<QuizRevealFlow cards={SAMPLE_CARDS} correctId={CORRECT_CAUSE_ID} />);

    // Select the correct card
    fireEvent.click(screen.getAllByText('선택')[0]);

    // Submit
    fireEvent.click(screen.getByTestId('submit-btn'));

    // impact_ticks are now visible for both cards
    expect(screen.getByTestId('impact-c1').textContent).toBe('+5.0%p');
    expect(screen.getByTestId('impact-c2').textContent).toBe('+2.5%p');

    // Linked indicators are shown
    expect(screen.getByTestId('indicator-c1').textContent).toBe('매출');
    expect(screen.getByTestId('indicator-c2').textContent).toBe('외국인·기관 순매수');

    // Phase changed to revealed
    expect(screen.getByTestId('quiz-phase-indicator').textContent).toBe('revealed');
  });

  it('shows 정답 when the correct cause is selected', () => {
    render(<QuizRevealFlow cards={SAMPLE_CARDS} correctId={CORRECT_CAUSE_ID} />);

    // Select first card (c1 = correct)
    fireEvent.click(screen.getAllByText('선택')[0]);
    fireEvent.click(screen.getByTestId('submit-btn'));

    expect(screen.getByTestId('result-badge').textContent).toBe('정답');
  });

  it('shows 오답 when a wrong cause is selected', () => {
    render(<QuizRevealFlow cards={SAMPLE_CARDS} correctId={CORRECT_CAUSE_ID} />);

    // Select second card (c2 = wrong)
    fireEvent.click(screen.getAllByText('선택')[1]);
    fireEvent.click(screen.getByTestId('submit-btn'));

    expect(screen.getByTestId('result-badge').textContent).toBe('오답');
  });

  it('keeps submit button disabled until a cause is selected', () => {
    render(<QuizRevealFlow cards={SAMPLE_CARDS} correctId={CORRECT_CAUSE_ID} />);
    const btn = screen.getByTestId('submit-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);

    fireEvent.click(screen.getAllByText('선택')[0]);
    expect(btn.disabled).toBe(false);
  });
});
