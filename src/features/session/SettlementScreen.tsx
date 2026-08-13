import type { TurnResult, CashflowState } from '../../types';
import { calcSessionScore, formatSessionScore } from './sessionScore';

function fmt(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

interface SettlementScreenProps {
  turnResults: TurnResult[];
  cashflow: CashflowState;
  setId: string;
  onReplay: () => void;
}

/**
 * 결산 화면 — a session ends here after its 3~5 turns. Aggregates the per-turn
 * quiz outcomes into "n턴 중 m턴 정답" and shows the final cash position.
 */
export default function SettlementScreen({
  turnResults,
  cashflow,
  setId,
  onReplay,
}: SettlementScreenProps) {
  const score = calcSessionScore(turnResults);

  return (
    <div className="screen">
      <div className="page-header">
        <div className="page-title">🏁 결산 화면</div>
        <div style={{ marginLeft: 'auto', fontSize: 13, color: '#6b7280' }}>세트 {setId}</div>
      </div>

      <div className="card mb-16 text-center">
        <div style={{ color: '#6b7280', marginBottom: 8 }}>퀴즈 성적</div>
        <div
          className="score-big"
          data-testid="session-score-fraction"
          style={{ color: score.correct >= score.total / 2 ? '#16a34a' : '#dc2626' }}
        >
          {score.correct}/{score.total}
        </div>
        <div className="score-label" data-testid="session-score-label">{formatSessionScore(score)}</div>
      </div>

      <div className="card mb-16">
        <div style={{ fontWeight: 700, marginBottom: 12 }}>턴별 결과</div>
        {turnResults.map(r => (
          <div key={r.turnIndex} className="cashflow-row" data-testid="settlement-turn-row">
            <span className="cashflow-label">
              {r.monthLabel} — {r.quizCompanyName}
            </span>
            <span className={`result-badge ${r.isCorrect ? 'result-correct' : 'result-wrong'}`}>
              {r.isCorrect ? '✓ 정답' : '✗ 오답'}
            </span>
          </div>
        ))}
      </div>

      <div className="card mb-24">
        <div style={{ fontWeight: 700, marginBottom: 12 }}>최종 자산 현황</div>
        <div className="cashflow-row">
          <span className="cashflow-label">현금</span>
          <span className="cashflow-value">{fmt(cashflow.cash)}</span>
        </div>
        <div className="cashflow-row">
          <span className="cashflow-label">투자금 (시장가)</span>
          <span className="cashflow-value">{fmt(cashflow.invested)}</span>
        </div>
        <div className="cashflow-row">
          <span className="cashflow-label">실현 손익</span>
          <span className={`cashflow-value ${cashflow.profit_loss >= 0 ? 'val-pos' : 'val-neg'}`}>
            {cashflow.profit_loss >= 0 ? '+' : ''}{fmt(Math.round(cashflow.profit_loss))}
          </span>
        </div>
        <div className="cashflow-row" style={{ borderTop: '2px solid #e5e7eb', paddingTop: 10, fontWeight: 800 }}>
          <span>총 자산</span>
          <span>{fmt(Math.round(cashflow.cash + cashflow.invested))}</span>
        </div>
      </div>

      <div className="flex gap-8 flex-wrap">
        <button className="btn btn-primary" style={{ fontSize: 16, padding: '12px 36px' }} onClick={onReplay}>
          다시 하기 (다음 세트)
        </button>
      </div>
    </div>
  );
}
