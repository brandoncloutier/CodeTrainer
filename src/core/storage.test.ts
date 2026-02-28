import { beforeEach, describe, expect, it } from "vitest";
import { getBaselineByCategory, loadState, recordSession } from "./storage";
import { Session } from "./types";

const buildSession = (overrides?: Partial<Session>): Session => ({
  id: "session-1",
  startedAt: 0,
  endedAt: 1000,
  results: [
    {
      questionId: "q1",
      category: "arith",
      correct: true,
      timeMs: 800,
      timestamp: 1
    }
  ],
  ...overrides
});

beforeEach(() => {
  localStorage.clear();
});

describe("storage", () => {
  it("records sessions and updates rolling averages", () => {
    const session = buildSession();
    const state = recordSession(session);
    expect(state.sessions).toHaveLength(1);
    expect(state.categoryStats.arith.totalAttempts).toBe(1);
    expect(state.categoryStats.arith.correctAttempts).toBe(1);
    expect(state.categoryStats.arith.rollingAvgTimeMs).toBe(800);
  });

  it("returns baseline by category", () => {
    recordSession(buildSession());
    const state = loadState();
    const baseline = getBaselineByCategory(state);
    expect(baseline.arith).toBe(800);
  });
});
