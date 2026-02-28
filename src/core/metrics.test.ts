import { describe, expect, it } from "vitest";
import { calculateRoundMetrics } from "./metrics";
import { QuestionResult } from "./types";

describe("calculateRoundMetrics", () => {
  it("calculates accuracy, average time, and best streak", () => {
    const results: QuestionResult[] = [
      {
        questionId: "1",
        category: "arith",
        correct: true,
        timeMs: 1000,
        timestamp: 1
      },
      {
        questionId: "2",
        category: "arith",
        correct: true,
        timeMs: 1500,
        timestamp: 2
      },
      {
        questionId: "3",
        category: "strings",
        correct: false,
        timeMs: 2000,
        timestamp: 3
      },
      {
        questionId: "4",
        category: "strings",
        correct: true,
        timeMs: 1200,
        timestamp: 4
      }
    ];

    const metrics = calculateRoundMetrics(results);
    expect(metrics.accuracy).toBeCloseTo(0.75);
    expect(metrics.avgTimeMs).toBeCloseTo((1000 + 1500 + 1200) / 3);
    expect(metrics.bestStreak).toBe(2);
    expect(metrics.perCategory.arith.correct).toBe(2);
    expect(metrics.perCategory.strings.total).toBe(2);
  });
});
