import { describe, expect, it } from "vitest";
import { generateRound } from "./generator";
import { ALL_CATEGORIES, RoundConfig } from "./types";

describe("generateRound", () => {
  it("creates the requested number of questions", () => {
    const config: RoundConfig = {
      questionCount: 5,
      categories: ALL_CATEGORIES,
      difficulty: 2
    };

    const round = generateRound(config);
    expect(round).toHaveLength(5);
    round.forEach((question) => {
      expect(config.categories).toContain(question.category);
      expect(question.difficulty).toBeLessThanOrEqual(config.difficulty);
      expect(question.tests.length).toBeGreaterThan(0);
    });
  });
});
