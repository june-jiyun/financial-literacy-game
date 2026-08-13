import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import CashflowScreen from './CashflowScreen';
import type { CashflowState } from '../../types';

const BASE_CASHFLOW: CashflowState = {
  salary: 3_000_000,
  living_cost: 1_500_000,
  cash: 5_000_000,
  invested: 1_050_000,
  invested_cost: 1_000_000,
  profit_loss: 0,
};

describe('CashflowScreen', () => {
  it('renders 월급 label and value', () => {
    render(
      <CashflowScreen cashflow={BASE_CASHFLOW} investReturn={0} onNext={() => {}} isLastTurn={false} />,
    );
    expect(screen.getByTestId('label-salary').textContent).toBe('월급');
    expect(screen.getByTestId('value-salary').textContent).toContain('3,000,000');
  });

  it('renders 생활비 label and value', () => {
    render(
      <CashflowScreen cashflow={BASE_CASHFLOW} investReturn={0} onNext={() => {}} isLastTurn={false} />,
    );
    expect(screen.getByTestId('label-living-cost').textContent).toBe('생활비');
    expect(screen.getByTestId('value-living-cost').textContent).toContain('1,500,000');
  });

  it('renders 현금 label and value', () => {
    render(
      <CashflowScreen cashflow={BASE_CASHFLOW} investReturn={0} onNext={() => {}} isLastTurn={false} />,
    );
    expect(screen.getByTestId('label-cash').textContent).toBe('현금');
    expect(screen.getByTestId('value-cash').textContent).toContain('5,000,000');
  });

  it('renders 투자금 label and value', () => {
    render(
      <CashflowScreen cashflow={BASE_CASHFLOW} investReturn={0} onNext={() => {}} isLastTurn={false} />,
    );
    expect(screen.getByTestId('label-invested').textContent).toBe('투자금');
    expect(screen.getByTestId('value-invested').textContent).toContain('1,050,000');
  });

  it('renders 수익/손실 label and value', () => {
    render(
      <CashflowScreen cashflow={BASE_CASHFLOW} investReturn={0} onNext={() => {}} isLastTurn={false} />,
    );
    expect(screen.getByTestId('label-profit-loss').textContent).toBe('수익/손실');
    expect(screen.getByTestId('value-profit-loss').textContent).toContain('0');
  });

  it('shows all 5 required fields on a single screen', () => {
    render(
      <CashflowScreen cashflow={BASE_CASHFLOW} investReturn={0} onNext={() => {}} isLastTurn={false} />,
    );
    expect(screen.getByTestId('label-salary')).toBeTruthy();
    expect(screen.getByTestId('label-living-cost')).toBeTruthy();
    expect(screen.getByTestId('label-cash')).toBeTruthy();
    expect(screen.getByTestId('label-invested')).toBeTruthy();
    expect(screen.getByTestId('label-profit-loss')).toBeTruthy();
  });

  it('shows unrealized PnL when invested > 0', () => {
    render(
      <CashflowScreen cashflow={BASE_CASHFLOW} investReturn={0} onNext={() => {}} isLastTurn={false} />,
    );
    // invested (1,050,000) > invested_cost (1,000,000) → unrealizedPnL = +50,000
    expect(screen.getByTestId('value-unrealized-pnl').textContent).toContain('50,000');
  });

  it('shows negative profit/loss in red class', () => {
    const lossState: CashflowState = { ...BASE_CASHFLOW, profit_loss: -50_000 };
    render(
      <CashflowScreen cashflow={lossState} investReturn={0} onNext={() => {}} isLastTurn={false} />,
    );
    const el = screen.getByTestId('value-profit-loss');
    expect(el.classList.contains('val-neg')).toBe(true);
    expect(el.textContent).toContain('50,000');
  });

  it('shows invest return row when investReturn is non-zero', () => {
    render(
      <CashflowScreen cashflow={BASE_CASHFLOW} investReturn={50_000} onNext={() => {}} isLastTurn={false} />,
    );
    expect(screen.getByTestId('value-invest-return').textContent).toContain('50,000');
  });

  it('shows 다음 턴으로 button when not last turn', () => {
    const onNext = vi.fn();
    render(
      <CashflowScreen cashflow={BASE_CASHFLOW} investReturn={0} onNext={onNext} isLastTurn={false} />,
    );
    const btn = screen.getByText('다음 턴으로 →');
    expect(btn).toBeTruthy();
    fireEvent.click(btn);
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('shows 결산 화면 보기 button on last turn', () => {
    render(
      <CashflowScreen cashflow={BASE_CASHFLOW} investReturn={0} onNext={() => {}} isLastTurn={true} />,
    );
    expect(screen.getByText('결산 화면 보기 →')).toBeTruthy();
  });
});
