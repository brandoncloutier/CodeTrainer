import {
  ALL_CATEGORIES,
  Category,
  CategoryStats,
  PersistedState,
  Session,
  SubmissionRecord
} from "./types";

const STORAGE_KEY = "codetrainer_state";
const MAX_SESSIONS = 50;
const MAX_SUBMISSIONS = 200;

const createEmptyCategoryStats = (): CategoryStats => ({
  totalAttempts: 0,
  correctAttempts: 0,
  totalTimeMs: 0,
  rollingAvgTimeMs: null
});

const createEmptyState = (): PersistedState => ({
  schemaVersion: 1,
  sessions: [],
  categoryStats: ALL_CATEGORIES.reduce<Record<Category, CategoryStats>>(
    (acc, category) => {
      acc[category] = createEmptyCategoryStats();
      return acc;
    },
    {} as Record<Category, CategoryStats>
  ),
  submissions: []
});

export const loadState = (): PersistedState => {
  if (typeof localStorage === "undefined") {
    return createEmptyState();
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createEmptyState();
  }
  try {
    const parsed = JSON.parse(raw) as PersistedState;
    if (parsed.schemaVersion !== 1) {
      return createEmptyState();
    }
    return {
      ...createEmptyState(),
      ...parsed,
      categoryStats: {
        ...createEmptyState().categoryStats,
        ...parsed.categoryStats
      },
      submissions: parsed.submissions ?? []
    };
  } catch {
    return createEmptyState();
  }
};

export const saveState = (state: PersistedState): void => {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const computeRollingAvgTimeMs = (
  category: Category,
  sessions: Session[],
  limit = 10
): number | null => {
  const attempts = sessions
    .flatMap((session) => session.results)
    .filter((result) => result.category === category && result.correct)
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-limit)
    .map((result) => result.timeMs);

  if (attempts.length === 0) {
    return null;
  }

  const total = attempts.reduce((acc, val) => acc + val, 0);
  return total / attempts.length;
};

export const recordSession = (session: Session): PersistedState => {
  const state = loadState();
  const nextSessions = [...state.sessions, session].slice(-MAX_SESSIONS);

  const nextCategoryStats = { ...state.categoryStats };
  session.results.forEach((result) => {
    const stats = nextCategoryStats[result.category] ?? createEmptyCategoryStats();
    const nextStats: CategoryStats = {
      ...stats,
      totalAttempts: stats.totalAttempts + 1,
      correctAttempts: stats.correctAttempts + (result.correct ? 1 : 0),
      totalTimeMs: stats.totalTimeMs + (result.correct ? result.timeMs : 0),
      rollingAvgTimeMs: stats.rollingAvgTimeMs
    };
    nextCategoryStats[result.category] = nextStats;
  });

  ALL_CATEGORIES.forEach((category) => {
    nextCategoryStats[category] = {
      ...nextCategoryStats[category],
      rollingAvgTimeMs: computeRollingAvgTimeMs(category, nextSessions)
    };
  });

  const nextState: PersistedState = {
    schemaVersion: 1,
    sessions: nextSessions,
    categoryStats: nextCategoryStats,
    submissions: state.submissions
  };

  saveState(nextState);
  return nextState;
};

export const addSubmission = (record: SubmissionRecord): PersistedState => {
  const state = loadState();
  const nextSubmissions = [...state.submissions, record].slice(
    -MAX_SUBMISSIONS
  );
  const nextState: PersistedState = {
    ...state,
    submissions: nextSubmissions
  };
  saveState(nextState);
  return nextState;
};

export const getBaselineByCategory = (
  state: PersistedState
): Record<Category, number | null> =>
  ALL_CATEGORIES.reduce<Record<Category, number | null>>((acc, category) => {
    acc[category] = state.categoryStats[category]?.rollingAvgTimeMs ?? null;
    return acc;
  }, {} as Record<Category, number | null>);
