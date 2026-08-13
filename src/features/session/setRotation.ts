const STORAGE_KEY = 'financial_sim_play_count';
const SETS = ['A', 'B', 'C'] as const;
export type SetId = typeof SETS[number];

export function getCurrentSetId(): SetId {
  const count = parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10);
  return SETS[count % SETS.length];
}

export function advanceSet(): void {
  const count = parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10);
  localStorage.setItem(STORAGE_KEY, String(count + 1));
}

export function resetSets(): void {
  localStorage.removeItem(STORAGE_KEY);
}
