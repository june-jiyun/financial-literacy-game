export interface RevealState {
  selectedCauseId: string | null;
  isRevealed: boolean;
}

export function shouldShowImpactTicks(state: RevealState): boolean {
  return state.isRevealed;
}

export function isAnswerCorrect(
  selectedCauseId: string | null,
  correctCauseId: string
): boolean {
  return selectedCauseId === correctCauseId;
}

export function getQuizTargetCompanyId(
  companies: Array<{ id: string; price_change_rate: number }>,
  investedCompanyId: string | null,
  playerAction: string | null
): string {
  if ((playerAction === '매수' || playerAction === '보유') && investedCompanyId) {
    return investedCompanyId;
  }
  return companies.reduce((max, c) =>
    Math.abs(c.price_change_rate) > Math.abs(max.price_change_rate) ? c : max
  ).id;
}
