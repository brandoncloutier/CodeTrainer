import { NEETCODE_150 } from "./neetcode150";

export const FUNDAMENTAL_CATEGORIES = [
  "arith",
  "strings",
  "lists",
  "loops",
  "conditionals",
  "functions"
] as const;

export type FundamentalCategory = (typeof FUNDAMENTAL_CATEGORIES)[number];

export type NeetCodePatternCategory = (typeof NEETCODE_150.patterns)[number]["id"];

export type Category = FundamentalCategory | NeetCodePatternCategory;

export type Difficulty = 1 | 2 | 3;

export type Question = {
  id: string;
  category: Category;
  difficulty: Difficulty;
  prompt: string;
  starterCode: string;
  tests: string;
  solution: string;
  timeLimitMs: number;
};

export type AnswerResult = {
  correct: boolean;
  error?: string;
  runtimeMs: number;
  stdout?: string;
};

export type QuestionResult = {
  questionId: string;
  category: Category;
  correct: boolean;
  timeMs: number;
  timestamp: number;
};

export type Session = {
  id: string;
  startedAt: number;
  endedAt: number;
  results: QuestionResult[];
};

export type CategoryStats = {
  totalAttempts: number;
  correctAttempts: number;
  totalTimeMs: number;
  rollingAvgTimeMs: number | null;
};

export type PersistedState = {
  schemaVersion: 1;
  sessions: Session[];
  categoryStats: Record<Category, CategoryStats>;
};

export type RoundConfig = {
  questionCount: number;
  categories: Category[];
  difficulty: Difficulty;
};

export type CategorySummary = {
  total: number;
  correct: number;
  accuracy: number;
  avgTimeMs: number | null;
};

export type RoundMetrics = {
  accuracy: number;
  avgTimeMs: number | null;
  bestStreak: number;
  perCategory: Record<Category, CategorySummary>;
};

export const NEETCODE_PATTERN_CATEGORIES = NEETCODE_150.patterns.map(
  (pattern) => pattern.id
) as NeetCodePatternCategory[];

export const ALL_CATEGORIES: Category[] = [
  ...FUNDAMENTAL_CATEGORIES,
  ...NEETCODE_PATTERN_CATEGORIES
];

export const NEETCODE_PATTERN_LABELS = NEETCODE_150.patterns.reduce<
  Record<NeetCodePatternCategory, string>
>((acc, pattern) => {
  acc[pattern.id] = pattern.label;
  return acc;
}, {} as Record<NeetCodePatternCategory, string>);

export const CATEGORY_LABELS: Record<Category, string> = {
  arith: "Arithmetic",
  strings: "Strings",
  lists: "Lists",
  loops: "Loops",
  conditionals: "Conditionals",
  functions: "Functions",
  ...NEETCODE_PATTERN_LABELS
};

export const CATEGORY_GROUPS: { label: string; categories: Category[] }[] = [
  {
    label: "Fundamentals",
    categories: [...FUNDAMENTAL_CATEGORIES]
  },
  {
    label: "NeetCode Patterns",
    categories: [...NEETCODE_PATTERN_CATEGORIES]
  }
];

export type Template = {
  id: string;
  category: Category;
  difficulty: Difficulty;
  generate: () => Question;
};
