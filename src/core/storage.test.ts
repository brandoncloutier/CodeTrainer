import { beforeEach, describe, expect, it } from "vitest";
import { addSubmission, getBaselineByCategory, loadState, recordSession } from "./storage";
import { Session, SubmissionRecord } from "./types";

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

  it("stores submissions and preserves them", () => {
    const submission: SubmissionRecord = {
      id: "sub-1",
      createdAt: 1,
      drillId: "arith-add",
      category: "arith",
      difficulty: 1,
      prompt: "Prompt",
      submittedCode: "code",
      recommendedSolution: "solution",
      isCorrect: true,
      explanation: "reasoning",
      errorSummary: null,
      timing: {
        solveTimeMs: 5000,
        evalTimeMs: 5,
        timedOutSolve: false,
        timedOutExec: false
      }
    };
    addSubmission(submission);
    const state = loadState();
    expect(state.submissions).toHaveLength(1);
    expect(state.submissions[0].id).toBe("sub-1");
  });
});
