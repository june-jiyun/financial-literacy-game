import { useState, useCallback } from 'react';
import setAData from '../data/scenarios/set-a.json';
import setBData from '../data/scenarios/set-b.json';
import setCData from '../data/scenarios/set-c.json';
import {
  ScenarioSet, GamePhase, PlayerAction, TurnResult, CashflowState, Company,
} from './types';
import { getCurrentSetId, advanceSet } from './features/session/setRotation';
import { getQuizTargetCompanyId, isAnswerCorrect } from './features/turn/revealOrder';
import { isSessionOver } from './features/session/sessionScore';
import CashflowScreen from './features/cashflow/CashflowScreen';
import SettlementScreen from './features/session/SettlementScreen';

const SCENARIOS: Record<string, ScenarioSet> = {
  A: setAData as unknown as ScenarioSet,
  B: setBData as unknown as ScenarioSet,
  C: setCData as unknown as ScenarioSet,
};

const INVESTMENT_AMOUNT = 1_000_000;

const INDICATOR_LABELS: Record<string, string> = {
  revenue: '매출',
  operating_profit: '영업이익',
  debt_ratio: '부채비율',
  per: 'PER',
  net_buying: '외국인·기관 순매수',
};

function pct(n: number): string {
  return (n >= 0 ? '+' : '') + n.toFixed(1) + '%';
}

// ── Indicator display ──────────────────────────────────────────────────────────

function IndicatorRow({
  label, value, unit, change,
}: { label: string; value: number | string; unit?: string; change?: number }) {
  return (
    <tr>
      <td className="text-gray text-sm">{label}</td>
      <td style={{ fontWeight: 600 }}>
        {typeof value === 'number' ? value.toLocaleString('ko-KR') : value}
        {unit && <span className="text-gray text-sm" style={{ marginLeft: 3 }}>{unit}</span>}
      </td>
      <td>
        {change !== undefined && (
          <span className={`tag ${change >= 0 ? 'tag-up' : 'tag-down'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
        )}
      </td>
    </tr>
  );
}

function CompanyIndicators({ company }: { company: Company }) {
  const { indicators } = company;
  return (
    <table className="indicator-table">
      <tbody>
        <IndicatorRow label="매출" value={indicators.revenue.value} unit={indicators.revenue.unit} change={indicators.revenue.change} />
        <IndicatorRow label="영업이익" value={indicators.operating_profit.value} unit={indicators.operating_profit.unit} change={indicators.operating_profit.change} />
        <IndicatorRow label="부채비율" value={indicators.debt_ratio.value} unit={indicators.debt_ratio.unit} />
        <IndicatorRow label="PER" value={indicators.per.value} unit={indicators.per.unit} />
        <IndicatorRow
          label="외국인 순매수"
          value={(indicators.net_buying.foreign >= 0 ? '+' : '') + indicators.net_buying.foreign.toLocaleString('ko-KR')}
          unit={indicators.net_buying.unit}
        />
        <IndicatorRow
          label="기관 순매수"
          value={(indicators.net_buying.institutional >= 0 ? '+' : '') + indicators.net_buying.institutional.toLocaleString('ko-KR')}
          unit={indicators.net_buying.unit}
        />
      </tbody>
    </table>
  );
}

// ── Company card used in action phase ─────────────────────────────────────────

function CompanyActionCard({
  company,
  holdingCompanyId,
  selectedAction,
  selectedCompanyId,
  onSelect,
}: {
  company: Company;
  holdingCompanyId: string | null;
  selectedAction: PlayerAction | null;
  selectedCompanyId: string | null;
  onSelect: (companyId: string, action: PlayerAction) => void;
}) {
  const isHolding = holdingCompanyId === company.id;
  const isSelectedCompany = selectedCompanyId === company.id;
  const isOtherSelected = selectedCompanyId !== null && selectedCompanyId !== company.id;
  const otherHolding = holdingCompanyId !== null && holdingCompanyId !== company.id;

  const canBuy = !holdingCompanyId && !otherHolding;
  const canHold = isHolding;
  const canSell = isHolding;

  return (
    <div className={`card ${isSelectedCompany ? 'highlighted-company' : ''}`}>
      <div className="company-card-header">
        <div>
          <div className="company-name">{company.name}</div>
          <div className="company-sector">{company.sector}</div>
        </div>
        <div className="company-price">
          {company.base_price.toLocaleString('ko-KR')}원
          {isHolding && (
            <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 2 }}>보유 중</div>
          )}
        </div>
      </div>
      <CompanyIndicators company={company} />
      <div className="action-btns" style={{ marginTop: 12 }}>
        <button
          className={`action-btn ${isSelectedCompany && selectedAction === '매수' ? 'active' : ''} ${!canBuy || (isOtherSelected && selectedAction !== null) ? 'disabled-btn' : ''}`}
          onClick={() => canBuy && onSelect(company.id, '매수')}
        >매수</button>
        <button
          className={`action-btn ${isSelectedCompany && selectedAction === '보유' ? 'active' : ''} ${!canHold ? 'disabled-btn' : ''}`}
          onClick={() => canHold && onSelect(company.id, '보유')}
        >보유</button>
        <button
          className={`action-btn ${isSelectedCompany && selectedAction === '매도' ? 'active' : ''} ${!canSell ? 'disabled-btn' : ''}`}
          onClick={() => canSell && onSelect(company.id, '매도')}
        >매도</button>
      </div>
    </div>
  );
}

// ── Screens ────────────────────────────────────────────────────────────────────

function StartScreen({ onStart, setId }: { onStart: () => void; setId: string }) {
  return (
    <div className="screen text-center" style={{ paddingTop: 60 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>📈</div>
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>금융 학습 시뮬레이션</h1>
      <p style={{ color: '#6b7280', marginBottom: 4 }}>가상 월급으로 주식을 투자하며 주가 변동의 원인을 배워보세요</p>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 36 }}>
        세트 {setId} · 3~5턴 · 약 15분
      </p>
      <button className="btn btn-primary" style={{ fontSize: 17, padding: '14px 48px' }} onClick={onStart}>
        게임 시작
      </button>
    </div>
  );
}

function ActionScreen({
  scenario,
  turnIdx,
  holdingCompanyId,
  selectedCompanyId,
  selectedAction,
  onSelect,
  onPass,
  onNext,
}: {
  scenario: ScenarioSet;
  turnIdx: number;
  holdingCompanyId: string | null;
  selectedCompanyId: string | null;
  selectedAction: PlayerAction | null;
  onSelect: (companyId: string, action: PlayerAction) => void;
  onPass: () => void;
  onNext: () => void;
}) {
  const turn = scenario.turns[turnIdx];
  const totalTurns = scenario.turns.length;

  return (
    <div className="screen">
      <div className="page-header">
        <div>
          <div className="page-title">{turn.month_label}</div>
          <div className="page-subtitle">턴 {turn.turn_index} / {totalTurns} · 투자할 기업을 선택하세요</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>세트 {scenario.scenario_set_id}</div>
        </div>
      </div>

      <div className="company-grid">
        {turn.companies.map(c => (
          <CompanyActionCard
            key={c.id}
            company={c}
            holdingCompanyId={holdingCompanyId}
            selectedAction={selectedAction}
            selectedCompanyId={selectedCompanyId}
            onSelect={onSelect}
          />
        ))}
      </div>

      <div className="flex gap-8 flex-wrap mt-16">
        <button
          className={`btn btn-outline ${selectedAction === null && selectedCompanyId === null ? 'active' : ''}`}
          onClick={onPass}
          style={{ background: selectedAction === null && selectedCompanyId === null ? '#eff6ff' : '' }}
        >
          이번 턴은 보류 (투자 안 함)
        </button>
        <button
          className="btn btn-primary"
          style={{ marginLeft: 'auto' }}
          onClick={onNext}
        >
          다음 →
        </button>
      </div>
    </div>
  );
}

function QuizScreen({
  company,
  monthLabel,
  turnIdx,
  totalTurns,
  selectedCauseId,
  onSelect,
  onSubmit,
}: {
  company: Company;
  monthLabel: string;
  turnIdx: number;
  totalTurns: number;
  selectedCauseId: string | null;
  onSelect: (id: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="screen">
      <div className="page-header">
        <div>
          <div className="page-title">퀴즈: 주가 변동 원인</div>
          <div className="page-subtitle">{monthLabel} · 턴 {turnIdx} / {totalTurns}</div>
        </div>
      </div>

      <div className="card mb-16">
        <div className="flex justify-between items-center mb-12">
          <div>
            <div className="company-name">{company.name}</div>
            <div className="company-sector">{company.sector}</div>
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', background: '#f3f4f6', padding: '4px 10px', borderRadius: 8 }}>
            이 기업의 주가가 이번 달에 변동했습니다
          </div>
        </div>
        <p style={{ color: '#374151', marginBottom: 0, fontSize: 15 }}>
          아래 원인 중 <strong>주가 변동에 가장 크게 영향을 준 원인</strong>은 무엇일까요?
        </p>
      </div>

      <div className="mb-16">
        {company.cause_cards.map(card => (
          <div
            key={card.id}
            className={`cause-card ${selectedCauseId === card.id ? 'selected' : ''}`}
            onClick={() => onSelect(card.id)}
          >
            <div style={{ flex: 1, fontSize: 15 }}>{card.label}</div>
          </div>
        ))}
      </div>

      <button
        className="btn btn-primary"
        disabled={selectedCauseId === null}
        onClick={onSubmit}
      >
        선택 완료 → 결과 확인
      </button>
    </div>
  );
}

function RevealScreen({
  company,
  monthLabel,
  turnIdx,
  totalTurns,
  selectedCauseId,
  isCorrect,
  onNext,
}: {
  company: Company;
  monthLabel: string;
  turnIdx: number;
  totalTurns: number;
  selectedCauseId: string;
  isCorrect: boolean;
  onNext: () => void;
}) {
  const pcr = company.price_change_rate;

  return (
    <div className="screen">
      <div className="page-header">
        <div>
          <div className="page-title">결과 공개</div>
          <div className="page-subtitle">{monthLabel} · 턴 {turnIdx} / {totalTurns}</div>
        </div>
      </div>

      <div className="card mb-16">
        <div className="flex justify-between items-center mb-12">
          <div>
            <div className="company-name">{company.name}</div>
            <div className="company-sector">{company.sector}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: pcr >= 0 ? '#dc2626' : '#2563eb' }}>
              {pct(pcr)}
            </div>
            <div className="text-sm text-gray">이번 달 주가 변동</div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <span className={`result-badge ${isCorrect ? 'result-correct' : 'result-wrong'}`}>
            {isCorrect ? '✓ 정답!' : '✗ 오답'}
          </span>
        </div>

        <div style={{ fontWeight: 600, color: '#374151', marginBottom: 10, fontSize: 14 }}>
          원인별 기여도 (선택 후 공개)
        </div>

        {company.cause_cards.map(card => {
          const isSelected = card.id === selectedCauseId;
          const isCorrectCard = card.id === company.correct_cause_id;
          let cls = '';
          if (isCorrectCard) cls = 'correct';
          else if (isSelected && !isCorrectCard) cls = 'wrong';

          return (
            <div key={card.id} className={`cause-card ${cls}`} style={{ cursor: 'default' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, marginBottom: 4 }}>{card.label}</div>
                <div className="text-sm text-gray">
                  연결 지표: <strong>{INDICATOR_LABELS[card.linked_indicator] ?? card.linked_indicator}</strong>
                  {isSelected && <span style={{ marginLeft: 8 }}>(내 선택)</span>}
                  {isCorrectCard && <span style={{ marginLeft: 8, color: '#16a34a' }}>★ 정답</span>}
                </div>
              </div>
              <span className={`impact-badge ${card.impact_ticks >= 0 ? 'impact-pos' : 'impact-neg'}`}>
                {card.impact_ticks >= 0 ? '+' : ''}{card.impact_ticks.toFixed(1)}%p
              </span>
            </div>
          );
        })}
      </div>

      <button className="btn btn-primary" onClick={onNext}>
        현금흐름 확인 →
      </button>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────

export default function App() {
  const [phase, setPhase] = useState<GamePhase>('start');
  const [setId] = useState(() => getCurrentSetId());
  const [scenario, setScenario] = useState<ScenarioSet | null>(null);
  const [turnIdx, setTurnIdx] = useState(0);

  const [holdingCompanyId, setHoldingCompanyId] = useState<string | null>(null);
  const [holdingAmount, setHoldingAmount] = useState(0);
  const [holdingCost, setHoldingCost] = useState(0);

  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<PlayerAction | null>(null);

  const [quizCompanyId, setQuizCompanyId] = useState<string | null>(null);
  const [selectedCauseId, setSelectedCauseId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const [cashflow, setCashflow] = useState<CashflowState>({
    salary: 0, living_cost: 0, cash: 0, invested: 0, invested_cost: 0, profit_loss: 0,
  });
  const [investReturnThisTurn, setInvestReturnThisTurn] = useState(0);

  const [turnResults, setTurnResults] = useState<TurnResult[]>([]);

  const startGame = useCallback(() => {
    const s = SCENARIOS[setId];
    setScenario(s);
    setCashflow({
      salary: s.initial_cashflow.salary,
      living_cost: s.initial_cashflow.living_cost,
      cash: s.initial_cashflow.cash,
      invested: 0,
      invested_cost: 0,
      profit_loss: 0,
    });
    setTurnIdx(0);
    setHoldingCompanyId(null);
    setHoldingAmount(0);
    setHoldingCost(0);
    setSelectedCompanyId(null);
    setSelectedAction(null);
    setTurnResults([]);
    setPhase('action');
  }, [setId]);

  const handleSelectAction = useCallback((companyId: string, action: PlayerAction) => {
    setSelectedCompanyId(companyId);
    setSelectedAction(action);
  }, []);

  const handlePass = useCallback(() => {
    setSelectedCompanyId(null);
    setSelectedAction(null);
  }, []);

  const handleActionNext = useCallback(() => {
    if (!scenario) return;
    const turn = scenario.turns[turnIdx];

    // Determine quiz target
    const quizId = getQuizTargetCompanyId(
      turn.companies,
      selectedAction === '매수' || selectedAction === '보유' ? (selectedCompanyId ?? holdingCompanyId) : null,
      selectedAction,
    );
    setQuizCompanyId(quizId);
    setSelectedCauseId(null);
    setIsCorrect(null);
    setPhase('quiz');
  }, [scenario, turnIdx, selectedAction, selectedCompanyId, holdingCompanyId]);

  const handleSelectCause = useCallback((causeId: string) => {
    setSelectedCauseId(causeId);
  }, []);

  const handleSubmitQuiz = useCallback(() => {
    if (!scenario || !quizCompanyId || !selectedCauseId) return;
    const turn = scenario.turns[turnIdx];
    const company = turn.companies.find(c => c.id === quizCompanyId)!;
    const correct = isAnswerCorrect(selectedCauseId, company.correct_cause_id);
    setIsCorrect(correct);
    setPhase('reveal');
  }, [scenario, turnIdx, quizCompanyId, selectedCauseId]);

  const handleRevealNext = useCallback(() => {
    if (!scenario || !quizCompanyId || selectedCauseId === null || isCorrect === null) return;
    const turn = scenario.turns[turnIdx];
    const company = turn.companies.find(c => c.id === quizCompanyId)!;

    // Record result
    const result: TurnResult = {
      turnIndex: turn.turn_index,
      monthLabel: turn.month_label,
      quizCompanyId: quizCompanyId,
      quizCompanyName: company.name,
      selectedCauseId: selectedCauseId,
      correctCauseId: company.correct_cause_id,
      isCorrect,
    };
    setTurnResults(prev => [...prev, result]);

    // Update cashflow
    setCashflow(prev => {
      let next = { ...prev };
      // Monthly income/expenses
      next.cash += prev.salary - prev.living_cost;

      // Apply buy action
      if (selectedAction === '매수' && selectedCompanyId) {
        const inv = INVESTMENT_AMOUNT;
        next.cash -= inv;
        next.invested_cost += inv;
        // Market value will be calculated below
        setHoldingCompanyId(selectedCompanyId);
        setHoldingCost(prev.invested_cost + inv);
        setHoldingAmount(prev.invested + inv);
      }

      // Apply price change to holding
      let returnThisTurn = 0;
      const activeHolding = selectedAction === '매수' ? selectedCompanyId : holdingCompanyId;
      if (activeHolding && (selectedAction === '매수' || selectedAction === '보유')) {
        const heldCompany = turn.companies.find(c => c.id === activeHolding)!;
        const pcr = heldCompany.price_change_rate / 100;
        const currentHeld = selectedAction === '매수'
          ? (prev.invested + INVESTMENT_AMOUNT)
          : prev.invested;
        returnThisTurn = currentHeld * pcr;
        next.invested = currentHeld + returnThisTurn;
      }
      setInvestReturnThisTurn(returnThisTurn);

      // Apply sell action
      if (selectedAction === '매도' && holdingCompanyId) {
        const heldCompany = turn.companies.find(c => c.id === holdingCompanyId)!;
        const pcr = heldCompany.price_change_rate / 100;
        returnThisTurn = prev.invested * pcr;
        const finalValue = prev.invested + returnThisTurn;
        next.cash += finalValue;
        next.profit_loss += finalValue - prev.invested_cost;
        next.invested = 0;
        next.invested_cost = 0;
        setHoldingCompanyId(null);
        setHoldingAmount(0);
        setHoldingCost(0);
        setInvestReturnThisTurn(returnThisTurn);
      }

      return next;
    });

    if (selectedAction === '매수' && selectedCompanyId) {
      // Update holding state for next turn
      setHoldingCompanyId(selectedCompanyId);
    }

    setPhase('cashflow');
  }, [scenario, turnIdx, quizCompanyId, selectedCauseId, isCorrect, selectedAction, selectedCompanyId, holdingCompanyId]);

  const handleCashflowNext = useCallback(() => {
    if (!scenario) return;
    const isLast = isSessionOver(turnIdx, scenario.turns.length);
    if (isLast) {
      setPhase('results');
    } else {
      // Prepare next turn
      setSelectedCompanyId(null);
      setSelectedAction(null);
      setTurnIdx(prev => prev + 1);
      setPhase('action');
    }
  }, [scenario, turnIdx]);

  const handleReplay = useCallback(() => {
    advanceSet();
    window.location.reload();
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (phase === 'start') {
    return <StartScreen onStart={startGame} setId={setId} />;
  }

  if (!scenario) return null;

  if (phase === 'action') {
    return (
      <ActionScreen
        scenario={scenario}
        turnIdx={turnIdx}
        holdingCompanyId={holdingCompanyId}
        selectedCompanyId={selectedCompanyId}
        selectedAction={selectedAction}
        onSelect={handleSelectAction}
        onPass={handlePass}
        onNext={handleActionNext}
      />
    );
  }

  if (phase === 'quiz') {
    const turn = scenario.turns[turnIdx];
    const company = turn.companies.find(c => c.id === quizCompanyId)!;
    return (
      <QuizScreen
        company={company}
        monthLabel={turn.month_label}
        turnIdx={turn.turn_index}
        totalTurns={scenario.turns.length}
        selectedCauseId={selectedCauseId}
        onSelect={handleSelectCause}
        onSubmit={handleSubmitQuiz}
      />
    );
  }

  if (phase === 'reveal') {
    const turn = scenario.turns[turnIdx];
    const company = turn.companies.find(c => c.id === quizCompanyId)!;
    return (
      <RevealScreen
        company={company}
        monthLabel={turn.month_label}
        turnIdx={turn.turn_index}
        totalTurns={scenario.turns.length}
        selectedCauseId={selectedCauseId!}
        isCorrect={isCorrect!}
        onNext={handleRevealNext}
      />
    );
  }

  if (phase === 'cashflow') {
    return (
      <CashflowScreen
        cashflow={cashflow}
        investReturn={investReturnThisTurn}
        onNext={handleCashflowNext}
        isLastTurn={turnIdx >= scenario.turns.length - 1}
      />
    );
  }

  if (phase === 'results') {
    return (
      <SettlementScreen
        turnResults={turnResults}
        cashflow={cashflow}
        setId={setId}
        onReplay={handleReplay}
      />
    );
  }

  return null;
}
