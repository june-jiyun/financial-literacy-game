export interface Indicator {
  value: number;
  unit: string;
  change?: number;
}

export interface NetBuying {
  foreign: number;
  institutional: number;
  unit: string;
}

export interface Indicators {
  revenue: Indicator;
  operating_profit: Indicator;
  debt_ratio: Indicator;
  per: Indicator;
  net_buying: NetBuying;
}

export interface CauseCard {
  id: string;
  label: string;
  impact_ticks: number;
  linked_indicator: string;
}

export interface Company {
  id: string;
  name: string;
  sector: string;
  base_price: number;
  indicators: Indicators;
  price_change_rate: number;
  cause_cards: CauseCard[];
  correct_cause_id: string;
}

export interface Turn {
  turn_index: number;
  month_label: string;
  companies: Company[];
}

export interface InitialCashflow {
  salary: number;
  living_cost: number;
  cash: number;
  invested: number;
  profit_loss: number;
}

export interface ScenarioSet {
  scenario_set_id: string;
  initial_cashflow: InitialCashflow;
  turns: Turn[];
}

export type PlayerAction = '매수' | '보유' | '매도' | '보류';

export interface CashflowState {
  salary: number;
  living_cost: number;
  cash: number;
  invested: number;
  invested_cost: number;
  profit_loss: number;
}

export interface TurnResult {
  turnIndex: number;
  monthLabel: string;
  quizCompanyId: string;
  quizCompanyName: string;
  selectedCauseId: string;
  correctCauseId: string;
  isCorrect: boolean;
}

export type GamePhase = 'start' | 'action' | 'quiz' | 'reveal' | 'cashflow' | 'results';
