import { describe, it, expect, beforeEach } from 'vitest';
import { getCurrentSetId, advanceSet, resetSets } from './setRotation';

beforeEach(() => {
  localStorage.clear();
});

describe('getCurrentSetId', () => {
  it('returns A on first play (no prior storage)', () => {
    expect(getCurrentSetId()).toBe('A');
  });

  it('returns B after one advanceSet call', () => {
    advanceSet();
    expect(getCurrentSetId()).toBe('B');
  });

  it('returns C after two advanceSet calls', () => {
    advanceSet();
    advanceSet();
    expect(getCurrentSetId()).toBe('C');
  });

  it('wraps back to A after three advanceSet calls', () => {
    advanceSet();
    advanceSet();
    advanceSet();
    expect(getCurrentSetId()).toBe('A');
  });
});

describe('advanceSet', () => {
  it('progresses through A → B → C each replay', () => {
    expect(getCurrentSetId()).toBe('A');

    advanceSet();
    expect(getCurrentSetId()).toBe('B');

    advanceSet();
    expect(getCurrentSetId()).toBe('C');
  });

  it('each replay presents a different set than the previous', () => {
    const first = getCurrentSetId();
    advanceSet();
    const second = getCurrentSetId();
    advanceSet();
    const third = getCurrentSetId();

    expect(first).not.toBe(second);
    expect(second).not.toBe(third);
    expect(first).not.toBe(third);
  });
});

describe('resetSets', () => {
  it('resets to A after advancing', () => {
    advanceSet();
    advanceSet();
    expect(getCurrentSetId()).toBe('C');

    resetSets();
    expect(getCurrentSetId()).toBe('A');
  });

  it('is idempotent when already at A', () => {
    resetSets();
    expect(getCurrentSetId()).toBe('A');
  });
});
