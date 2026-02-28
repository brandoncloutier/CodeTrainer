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
  proceedLabel
}: DrillScreenProps) {
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
        <span className="badge">Timer hidden</span>
      </div>

      <div className="card">
        <h2>Prompt</h2>
        <p>{question.prompt}</p>

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
          {showSolution && (
            <button className="button secondary" onClick={onProceed}>
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

        {showSolution && (
          <div style={{ marginTop: 16 }}>
            <h3>Reference solution</h3>
            <pre className="solution">{question.solution}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
