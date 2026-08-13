import type { CashflowState } from '../../types';

function fmt(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

interface CashflowScreenProps {
  cashflow: CashflowState;
  investReturn: number;
  onNext: () => void;
  isLastTurn: boolean;
}

export default function CashflowScreen({
  cashflow,
  investReturn,
  onNext,
  isLastTurn,
}: CashflowScreenProps) {
  const unrealizedPnL = cashflow.invested - cashflow.invested_cost;

  return (
    <div className="screen">
      <div className="page-header">
        <div className="page-title">💰 개인 현금흐름</div>
      </div>

      <div className="card mb-16">
        <div style={{ fontWeight: 700, marginBottom: 12, color: '#374151' }}>이번 달 수지</div>
        <div className="cashflow-row">
          <span className="cashflow-label" data-testid="label-salary">월급</span>
          <span className="cashflow-value val-pos" data-testid="value-salary">
            +{fmt(cashflow.salary)}
          </span>
        </div>
        <div className="cashflow-row">
          <span className="cashflow-label" data-testid="label-living-cost">생활비</span>
          <span className="cashflow-value val-neg" data-testid="value-living-cost">
            -{fmt(cashflow.living_cost)}
          </span>
        </div>
        {investReturn !== 0 && (
          <div className="cashflow-row">
            <span className="cashflow-label">투자 수익 (이번 달)</span>
            <span
              className={`cashflow-value ${investReturn >= 0 ? 'val-pos' : 'val-neg'}`}
              data-testid="value-invest-return"
            >
              {investReturn >= 0 ? '+' : ''}{fmt(investReturn)}
            </span>
          </div>
        )}
        <div
          className="cashflow-row"
          style={{ borderTop: '2px solid #e5e7eb', paddingTop: 10, fontWeight: 800 }}
        >
          <span>월 순현금</span>
          <span
            className={cashflow.salary - cashflow.living_cost >= 0 ? 'val-pos' : 'val-neg'}
          >
            {cashflow.salary - cashflow.living_cost >= 0 ? '+' : ''}
            {fmt(cashflow.salary - cashflow.living_cost)}
          </span>
        </div>
      </div>

      <div className="card mb-16">
        <div style={{ fontWeight: 700, marginBottom: 12, color: '#374151' }}>보유 현황</div>
        <div className="cashflow-row">
          <span className="cashflow-label" data-testid="label-cash">현금</span>
          <span className="cashflow-value" data-testid="value-cash">
            {fmt(cashflow.cash)}
          </span>
        </div>
        <div className="cashflow-row">
          <span className="cashflow-label" data-testid="label-invested">투자금</span>
          <span className="cashflow-value" data-testid="value-invested">
            {fmt(cashflow.invested)}
          </span>
        </div>
        {cashflow.invested > 0 && (
          <div className="cashflow-row">
            <span className="cashflow-label">평가 손익 (미실현)</span>
            <span
              className={`cashflow-value ${unrealizedPnL >= 0 ? 'val-pos' : 'val-neg'}`}
              data-testid="value-unrealized-pnl"
            >
              {unrealizedPnL >= 0 ? '+' : ''}{fmt(Math.round(unrealizedPnL))}
            </span>
          </div>
        )}
        <div className="cashflow-row">
          <span className="cashflow-label" data-testid="label-profit-loss">수익/손실</span>
          <span
            className={`cashflow-value ${cashflow.profit_loss >= 0 ? 'val-pos' : 'val-neg'}`}
            data-testid="value-profit-loss"
          >
            {cashflow.profit_loss >= 0 ? '+' : ''}{fmt(Math.round(cashflow.profit_loss))}
          </span>
        </div>
      </div>

      <button className="btn btn-primary" onClick={onNext}>
        {isLastTurn ? '결산 화면 보기 →' : '다음 턴으로 →'}
      </button>
    </div>
  );
}
