import { useEffect, useState } from "react";
import SettingsScreen from "./components/SettingsScreen";
import DrillScreen, { Feedback } from "./components/DrillScreen";
import ResultsScreen from "./components/ResultsScreen";
import { generateRound } from "./core/generator";
import { evaluatePython, preloadPython } from "./core/evaluator";
import {
  Category,
  Question,
  QuestionResult,
  RoundConfig,
  RoundMetrics,
  Session
} from "./core/types";
import { calculateRoundMetrics } from "./core/metrics";
import { getBaselineByCategory, loadState, recordSession } from "./core/storage";
import { createId } from "./core/templates";

type ViewState = "settings" | "drill" | "results";

type RoundState = {
  config: RoundConfig;
  questions: Question[];
  currentIndex: number;
  results: QuestionResult[];
  startedAt: number;
  questionStartedAt: number;
};

const buildSession = (
  round: RoundState,
  results: QuestionResult[],
  endedAt: number
): Session => ({
  id: createId(),
  startedAt: round.startedAt,
  endedAt,
  results
});

export default function App() {
  const [view, setView] = useState<ViewState>("settings");
  const [round, setRound] = useState<RoundState | null>(null);
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [metrics, setMetrics] = useState<RoundMetrics | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [baselineByCategory, setBaselineByCategory] = useState<
    Record<Category, number | null>
  >({} as Record<Category, number | null>);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [pendingAdvance, setPendingAdvance] = useState<{
    nextIndex: number;
    nextResults: QuestionResult[];
    isLast: boolean;
  } | null>(null);

  useEffect(() => {
    preloadPython();
  }, []);

  const handleStartRound = (config: RoundConfig) => {
    const questions = generateRound(config);
    const now = Date.now();
    setRound({
      config,
      questions,
      currentIndex: 0,
      results: [],
      startedAt: now,
      questionStartedAt: now
    });
    setCode(questions[0].starterCode);
    setFeedback(null);
    setRuntimeError(null);
    setShowSolution(false);
    setPendingAdvance(null);
    setView("drill");
  };

  const handleSubmit = async () => {
    if (!round || isEvaluating || showSolution) {
      return;
    }
    const question = round.questions[round.currentIndex];
    setIsEvaluating(true);
    setFeedback(null);
    setRuntimeError(null);

    try {
      const result = await evaluatePython(
        code,
        question.tests,
        question.timeLimitMs
      );
      const timeMs = Date.now() - round.questionStartedAt;
      const questionResult: QuestionResult = {
        questionId: question.id,
        category: question.category,
        correct: result.correct,
        timeMs,
        timestamp: Date.now()
      };

      const nextResults = [...round.results, questionResult];
      const isLast = round.currentIndex === round.questions.length - 1;

      if (result.correct) {
        setFeedback({ correct: true });
      } else {
        setFeedback({ correct: false, error: result.error || "Incorrect answer" });
      }

      setRound({
        ...round,
        results: nextResults
      });
      setShowSolution(true);
      setPendingAdvance({
        nextIndex: round.currentIndex + 1,
        nextResults,
        isLast
      });
    } catch (error) {
      setRuntimeError(
        error instanceof Error
          ? error.message
          : "Failed to evaluate the answer."
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleProceed = () => {
    if (!round || !pendingAdvance) {
      return;
    }

    if (pendingAdvance.isLast) {
      const endedAt = Date.now();
      const previousState = loadState();
      const baseline = getBaselineByCategory(previousState);
      const sessionData = buildSession(round, pendingAdvance.nextResults, endedAt);
      recordSession(sessionData);
      setSession(sessionData);
      setMetrics(calculateRoundMetrics(pendingAdvance.nextResults));
      setBaselineByCategory(baseline);
      setView("results");
      return;
    }

    const nextQuestion = round.questions[pendingAdvance.nextIndex];
    setRound({
      ...round,
      currentIndex: pendingAdvance.nextIndex,
      results: pendingAdvance.nextResults,
      questionStartedAt: Date.now()
    });
    setCode(nextQuestion.starterCode);
    setFeedback(null);
    setRuntimeError(null);
    setShowSolution(false);
    setPendingAdvance(null);
  };

  const handleRestart = () => {
    setView("settings");
    setRound(null);
    setSession(null);
    setMetrics(null);
    setFeedback(null);
    setShowSolution(false);
    setPendingAdvance(null);
  };

  if (view === "settings") {
    return <SettingsScreen onStart={handleStartRound} />;
  }

  if (view === "drill" && round) {
    return (
      <DrillScreen
        question={round.questions[round.currentIndex]}
        index={round.currentIndex}
        total={round.questions.length}
        code={code}
        onCodeChange={setCode}
        onSubmit={handleSubmit}
        isEvaluating={isEvaluating}
        feedback={feedback}
        runtimeError={runtimeError}
        showSolution={showSolution}
        onProceed={handleProceed}
        proceedLabel={pendingAdvance?.isLast ? "Finish Round" : "Next Question"}
      />
    );
  }

  if (view === "results" && metrics && session) {
    return (
      <ResultsScreen
        session={session}
        metrics={metrics}
        baselineByCategory={baselineByCategory}
        onRestart={handleRestart}
      />
    );
  }

  return null;
}
