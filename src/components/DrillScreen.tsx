import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { useCallback, type KeyboardEvent } from "react";
import { Question } from "../core/types";

export type Feedback = {
  correct: boolean;
  error?: string;
};

type DrillScreenProps = {
  question: Question;
  index: number;
  total: number;
  code: string;
  onCodeChange: (value: string) => void;
  onSubmit: () => void;
  isEvaluating: boolean;
  feedback: Feedback | null;
  runtimeError?: string | null;
  showSolution: boolean;
  onProceed: () => void;
  proceedLabel: string;
  remainingSeconds: number;
  progress: number;
  explanationText: string;
  onExplanationChange: (value: string) => void;
  onSubmitExplanation: () => void;
  onSkipExplanation: (() => void) | null;
  explanationRequired: boolean;
  explanationSubmitted: boolean;
  explanationError: string | null;
  onExit: () => void;
  canExit: boolean;
  isPaused: boolean;
  onTogglePause: () => void;
  canPause: boolean;
  onTest: () => void;
  isTesting: boolean;
  testOutput: string | null;
  testError: string | null;
};

export default function DrillScreen({
  question,
  index,
  total,
  code,
  onCodeChange,
  onSubmit,
  isEvaluating,
  feedback,
  runtimeError,
  showSolution,
  onProceed,
  proceedLabel,
  remainingSeconds,
  progress,
  explanationText,
  onExplanationChange,
  onSubmitExplanation,
  onSkipExplanation,
  explanationRequired,
  explanationSubmitted,
  explanationError,
  onExit,
  canExit,
  isPaused,
  onTogglePause,
  canPause,
  onTest,
  isTesting,
  testOutput,
  testError
}: DrillScreenProps) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = -circumference * (1 - progress);
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        if (!isEvaluating && !showSolution) {
          onSubmit();
        }
      }
    },
    [isEvaluating, showSolution, onSubmit]
  );

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Round in progress</h1>
          <p>
            Question {index + 1} of {total} · {question.category}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="button secondary" onClick={onExit} disabled={!canExit}>
            Exit to menu
          </button>
          <button
            className={`timer ${isPaused ? "paused" : ""}`}
            onClick={onTogglePause}
            disabled={!canPause}
            type="button"
          >
            <svg width="44" height="44">
              <circle className="timer-bg" cx="22" cy="22" r={radius} />
              <circle
                className="timer-fg"
                cx="22"
                cy="22"
                r={radius}
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: dashOffset
                }}
              />
            </svg>
            <span className="timer-label">{remainingSeconds}</span>
            {isPaused && <span className="timer-icon">⏸</span>}
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Prompt</h2>
        <p>{question.prompt}</p>

        <div className="examples">
          <h3>Examples</h3>
          <div className="examples-list">
            {question.examples.map((example, idx) => (
              <div className="example-card" key={`${example.input}-${idx}`}>
                <div>
                  <strong>Input:</strong> {example.input}
                </div>
                <div>
                  <strong>Output:</strong> {example.output}
                </div>
              </div>
            ))}
          </div>
        </div>

        <CodeMirror
          value={code}
          height="220px"
          extensions={[python()]}
          onChange={(value) => onCodeChange(value)}
          onKeyDown={handleKeyDown}
        />

        <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            className="button"
            onClick={onSubmit}
            disabled={isEvaluating || showSolution}
          >
            {isEvaluating ? "Checking..." : "Submit"}
          </button>
          <button
            className="button secondary"
            onClick={onTest}
            disabled={isTesting || isEvaluating}
          >
            {isTesting ? "Running..." : "Test code"}
          </button>
          {showSolution && (
            <button
              className="button secondary"
              onClick={onProceed}
              disabled={!explanationSubmitted}
            >
              {proceedLabel}
            </button>
          )}
          <span style={{ alignSelf: "center", color: "#6b7280" }}>
            Press <span className="kbd">Ctrl</span> +
            <span className="kbd">Enter</span>
          </span>
        </div>

        {feedback && (
          <div
            className={`feedback ${feedback.correct ? "correct" : "incorrect"}`}
          >
            {feedback.correct ? "Correct!" : "Incorrect."}
            {feedback.error && (
              <div style={{ marginTop: 8, fontWeight: 500 }}>
                {feedback.error}
              </div>
            )}
          </div>
        )}

        {runtimeError && (
          <div className="feedback incorrect">
            {runtimeError}
          </div>
        )}

        {(testOutput || testError) && (
          <div className="test-output">
            <h3>Test output</h3>
            {testError ? (
              <div className="feedback incorrect">{testError}</div>
            ) : (
              <pre className="solution">{testOutput}</pre>
            )}
          </div>
        )}

        {showSolution && (
          <div style={{ marginTop: 16 }}>
            <h3>Reference solution</h3>
            <pre className="solution">{question.solution}</pre>
          </div>
        )}

        {showSolution && (
          <div className="explanation">
            <label htmlFor="explanation-input">
              {explanationRequired
                ? "Explain your solution"
                : "Explain the correct solution (optional)"}
            </label>
            <textarea
              id="explanation-input"
              value={explanationText}
              onChange={(event) => onExplanationChange(event.target.value)}
              placeholder={
                explanationRequired
                  ? "Explain the reason for the solution, technique used, and the logical flow…"
                  : "Explain why the reference solution works."
              }
              rows={4}
              disabled={explanationSubmitted}
            />
            {explanationError && (
              <div className="explanation-error">{explanationError}</div>
            )}
            <div className="explanation-actions">
              <button
                className="button"
                onClick={onSubmitExplanation}
                disabled={explanationSubmitted}
              >
                Submit explanation
              </button>
              {!explanationRequired && onSkipExplanation && (
                <button
                  className="button secondary"
                  onClick={onSkipExplanation}
                  disabled={explanationSubmitted}
                >
                  Skip
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
