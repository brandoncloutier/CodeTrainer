import { ALL_CATEGORIES, Category, CategorySummary, QuestionResult, RoundMetrics } from "./types";

const average = (values: number[]): number | null => {
  if (values.length === 0) {
    return null;
  }
  const total = values.reduce((acc, val) => acc + val, 0);
  return total / values.length;
};

export const calculateRoundMetrics = (results: QuestionResult[]): RoundMetrics => {
  const total = results.length;
  const correctResults = results.filter((result) => result.correct);
  const accuracy = total === 0 ? 0 : correctResults.length / total;
  const avgTimeMs = average(correctResults.map((result) => result.timeMs));

  let bestStreak = 0;
  let currentStreak = 0;
  results.forEach((result) => {
    if (result.correct) {
      currentStreak += 1;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  const perCategory = ALL_CATEGORIES.reduce<Record<Category, CategorySummary>>(
    (acc, category) => {
      const categoryResults = results.filter(
        (result) => result.category === category
      );
      const categoryCorrect = categoryResults.filter((result) => result.correct);
      const categoryAccuracy =
        categoryResults.length === 0
          ? 0
          : categoryCorrect.length / categoryResults.length;
      const categoryAvgTime = average(
        categoryCorrect.map((result) => result.timeMs)
      );
      acc[category] = {
        total: categoryResults.length,
        correct: categoryCorrect.length,
        accuracy: categoryAccuracy,
        avgTimeMs: categoryAvgTime
      };
      return acc;
    },
    {} as Record<Category, CategorySummary>
  );

  return {
    accuracy,
    avgTimeMs,
    bestStreak,
    perCategory
  };
};

export const formatPercentage = (value: number): string =>
  `${Math.round(value * 100)}%`;

export const formatDuration = (valueMs: number | null): string => {
  if (valueMs === null) {
    return "—";
  }
  return `${(valueMs / 1000).toFixed(2)}s`;
};
