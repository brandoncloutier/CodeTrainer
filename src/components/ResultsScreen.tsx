import { CATEGORY_LABELS, Category, RoundMetrics, Session } from "../core/types";
import { formatDuration, formatPercentage } from "../core/metrics";

type ResultsScreenProps = {
  session: Session;
  metrics: RoundMetrics;
  baselineByCategory: Record<Category, number | null>;
  onRestart: () => void;
};

const formatDelta = (baseline: number | null, current: number | null): string => {
  if (baseline === null || current === null) {
    return "—";
  }
  const delta = baseline - current;
  const sign = delta === 0 ? "" : delta > 0 ? "+" : "-";
  return `${sign}${Math.abs(delta / 1000).toFixed(2)}s`;
};

export default function ResultsScreen({
  session,
  metrics,
  baselineByCategory,
  onRestart
}: ResultsScreenProps) {
  const totalTimeMs = session.endedAt - session.startedAt;
  const categoriesWithAttempts = Array.from(
    new Set(session.results.map((result) => result.category))
  ).sort((a, b) => CATEGORY_LABELS[a].localeCompare(CATEGORY_LABELS[b]));

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Round summary</h1>
          <p>Great work! Review your stats and try another round.</p>
        </div>
        <span className="badge">Completed</span>
      </div>

      <div className="grid two">
        <div className="card">
          <h2>Overall metrics</h2>
          <p>Accuracy: {formatPercentage(metrics.accuracy)}</p>
          <p>Avg time (correct): {formatDuration(metrics.avgTimeMs)}</p>
          <p>Best correct streak: {metrics.bestStreak}</p>
          <p>Total round time: {(totalTimeMs / 1000).toFixed(1)}s</p>
        </div>

        <div className="card">
          <h2>Next steps</h2>
          <p>
            Focus on categories with slower times or lower accuracy. Improvement is
            measured against your historical rolling average (last 10 attempts).
          </p>
          <button className="button" onClick={onRestart}>
            Start New Round
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h2>Category breakdown</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Accuracy</th>
              <th>Avg time</th>
              <th>Improvement</th>
            </tr>
          </thead>
          <tbody>
            {categoriesWithAttempts.map((category) => {
              const summary = metrics.perCategory[category];
              return (
                <tr key={category}>
                  <td>{CATEGORY_LABELS[category]}</td>
                  <td>
                    {summary.total === 0
                      ? "—"
                      : formatPercentage(summary.accuracy)}
                  </td>
                  <td>
                    {summary.total === 0
                      ? "—"
                      : formatDuration(summary.avgTimeMs)}
                  </td>
                  <td>{formatDelta(baselineByCategory[category], summary.avgTimeMs)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
