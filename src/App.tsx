import { useEffect, useRef, useState, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import SettingsScreen from "./components/SettingsScreen";
import DrillScreen, { Feedback } from "./components/DrillScreen";
import ResultsScreen from "./components/ResultsScreen";
import LoginScreen from "./components/LoginScreen";
import { generateRound } from "./core/generator";
import {
  evaluatePython,
  preloadPython,
  runPython,
  TIMEOUT_ERROR
} from "./core/evaluator";
import {
  Category,
  Question,
  QuestionResult,
  RoundConfig,
  RoundMetrics,
  Session,
  SubmissionRecord
} from "./core/types";
import { calculateRoundMetrics } from "./core/metrics";
import {
  addSubmission,
  getBaselineByCategory,
  loadState,
  recordSession
} from "./core/storage";
import { createId } from "./core/templates";
import { AuthProvider, useAuth } from "./core/auth";

type ViewState = "settings" | "drill" | "results";

type RoundState = {
  config: RoundConfig;
  questions: Question[];
  currentIndex: number;
  results: QuestionResult[];
  startedAt: number;
  questionStartedAt: number;
};

type AttemptSnapshot = {
  question: Question;
  submittedCode: string;
  isCorrect: boolean;
  errorSummary: string | null;
  timing: SubmissionRecord["timing"];
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

const SOLVE_TIME_LIMIT_MS = 60000;

const AppShell = () => {
  const { signOut } = useAuth();
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
  const [remainingMs, setRemainingMs] = useState(SOLVE_TIME_LIMIT_MS);
  const timeoutTriggeredRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);
  const [explanationText, setExplanationText] = useState("");
  const [explanationError, setExplanationError] = useState<string | null>(null);
  const [explanationSubmitted, setExplanationSubmitted] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<AttemptSnapshot | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    setExplanationText("");
    setExplanationError(null);
    setExplanationSubmitted(false);
    setLastAttempt(null);
    setRemainingMs(SOLVE_TIME_LIMIT_MS);
    timeoutTriggeredRef.current = false;
    setIsPaused(false);
    setIsTesting(false);
    setTestOutput(null);
    setTestError(null);
    setView("drill");
  };

  const finalizeQuestion = ({
    correct,
    errorMessage,
    solveTimeMs,
    evalTimeMs,
    timedOutSolve,
    timedOutExec,
    submittedCode
  }: {
    correct: boolean;
    errorMessage: string | null;
    solveTimeMs: number;
    evalTimeMs?: number;
    timedOutSolve: boolean;
    timedOutExec: boolean;
    submittedCode: string;
  }) => {
    if (!round) {
      return;
    }
    const question = round.questions[round.currentIndex];
    const questionResult: QuestionResult = {
      questionId: question.id,
      category: question.category,
      correct,
      timeMs: solveTimeMs,
      timestamp: Date.now()
    };

    const nextResults = [...round.results, questionResult];
    const isLast = round.currentIndex === round.questions.length - 1;

    setRound({
      ...round,
      results: nextResults
    });
    setFeedback(
      correct
        ? { correct: true }
        : { correct: false, error: errorMessage ?? "Incorrect answer" }
    );
    setRuntimeError(null);
    setShowSolution(true);
    setPendingAdvance({
      nextIndex: round.currentIndex + 1,
      nextResults,
      isLast
    });
    setExplanationText("");
    setExplanationError(null);
    setExplanationSubmitted(false);
    setLastAttempt({
      question,
      submittedCode,
      isCorrect: correct,
      errorSummary: correct ? null : errorMessage ?? "Incorrect answer",
      timing: {
        solveTimeMs,
        evalTimeMs,
        timedOutSolve,
        timedOutExec
      }
    });
  };

  const handleSubmit = async () => {
    if (!round || isEvaluating || showSolution) {
      return;
    }
    const question = round.questions[round.currentIndex];
    const submittedCode = code;
    setIsEvaluating(true);
    setFeedback(null);
    setRuntimeError(null);

    try {
      const result = await evaluatePython(
        submittedCode,
        question.tests,
        question.timeLimitMs
      );
      finalizeQuestion({
        correct: result.correct,
        errorMessage: result.error ?? null,
        solveTimeMs: Math.max(0, Date.now() - round.questionStartedAt),
        evalTimeMs: result.runtimeMs,
        timedOutSolve: false,
        timedOutExec: result.error === TIMEOUT_ERROR,
        submittedCode
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

  const handleTimeout = () => {
    if (!round || showSolution || isEvaluating) {
      return;
    }
    finalizeQuestion({
      correct: false,
      errorMessage: TIMEOUT_ERROR,
      solveTimeMs: SOLVE_TIME_LIMIT_MS,
      evalTimeMs: undefined,
      timedOutSolve: true,
      timedOutExec: false,
      submittedCode: code
    });
  };

  const persistSubmission = (explanation: string | null) => {
    if (!lastAttempt) {
      return;
    }
    addSubmission({
      id: createId(),
      createdAt: Date.now(),
      drillId: lastAttempt.question.drillId,
      category: lastAttempt.question.category,
      difficulty: lastAttempt.question.difficulty,
      prompt: lastAttempt.question.prompt,
      submittedCode: lastAttempt.submittedCode,
      recommendedSolution: lastAttempt.question.solution,
      isCorrect: lastAttempt.isCorrect,
      explanation,
      errorSummary: lastAttempt.isCorrect ? null : lastAttempt.errorSummary,
      timing: lastAttempt.timing
    });
  };

  const handleSubmitExplanation = () => {
    if (!lastAttempt || explanationSubmitted) {
      return;
    }
    const trimmed = explanationText.trim();
    if (lastAttempt.isCorrect && trimmed.length === 0) {
      setExplanationError("Explanation is required.");
      return;
    }
    if (!lastAttempt.isCorrect && trimmed.length === 0) {
      setExplanationError("Add an explanation or click Skip.");
      return;
    }
    persistSubmission(trimmed);
    setExplanationSubmitted(true);
    setExplanationError(null);
  };

  const handleSkipExplanation = () => {
    if (!lastAttempt || explanationSubmitted) {
      return;
    }
    persistSubmission(null);
    setExplanationSubmitted(true);
    setExplanationError(null);
  };

  const handleProceed = () => {
    if (!round || !pendingAdvance || !explanationSubmitted) {
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
    setRemainingMs(SOLVE_TIME_LIMIT_MS);
    timeoutTriggeredRef.current = false;
    setExplanationText("");
    setExplanationError(null);
    setExplanationSubmitted(false);
    setLastAttempt(null);
    setIsPaused(false);
    setIsTesting(false);
    setTestOutput(null);
    setTestError(null);
  };

  const handleRestart = () => {
    setView("settings");
    setRound(null);
    setSession(null);
    setMetrics(null);
    setFeedback(null);
    setShowSolution(false);
    setPendingAdvance(null);
    setRemainingMs(SOLVE_TIME_LIMIT_MS);
    timeoutTriggeredRef.current = false;
    setExplanationText("");
    setExplanationError(null);
    setExplanationSubmitted(false);
    setLastAttempt(null);
    setIsPaused(false);
    setIsTesting(false);
    setTestOutput(null);
    setTestError(null);
  };

  const handleExitToMenu = () => {
    if (isEvaluating) {
      return;
    }
    handleRestart();
  };

  const handleTogglePause = () => {
    if (showSolution || isEvaluating) {
      return;
    }
    setIsPaused((prev) => !prev);
  };

  const handleTestCode = async () => {
    if (!round || isTesting || isEvaluating) {
      return;
    }
    setIsTesting(true);
    setTestError(null);
    setTestOutput(null);
    try {
      const result = await runPython(
        code,
        round.questions[round.currentIndex].timeLimitMs
      );
      if (result.error) {
        setTestError(result.error);
      } else if (result.stdout.trim().length === 0) {
        setTestOutput("No output.");
      } else {
        setTestOutput(result.stdout);
      }
    } catch (error) {
      setTestError(error instanceof Error ? error.message : "Failed to run code.");
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    if (view !== "drill" || !round) {
      return;
    }
    timeoutTriggeredRef.current = false;
    setRemainingMs(SOLVE_TIME_LIMIT_MS);
  }, [view, round?.currentIndex, round?.questionStartedAt]);

  useEffect(() => {
    if (view !== "drill" || !round || showSolution || isEvaluating || isPaused) {
      return;
    }
    const deadline = round.questionStartedAt + SOLVE_TIME_LIMIT_MS;
    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, deadline - now);
      setRemainingMs(remaining);
      if (remaining === 0 && !timeoutTriggeredRef.current) {
        timeoutTriggeredRef.current = true;
        handleTimeout();
      }
    };
    tick();
    const intervalId = window.setInterval(tick, 250);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [view, round, showSolution, isEvaluating, isPaused]);

  if (view === "settings") {
    return (
      <SettingsScreen
        onStart={handleStartRound}
        onLogout={async () => {
          setIsLoggingOut(true);
          await signOut();
          setIsLoggingOut(false);
        }}
        isLoggingOut={isLoggingOut}
      />
    );
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
        remainingSeconds={Math.max(0, Math.ceil(remainingMs / 1000))}
        progress={Math.max(0, Math.min(1, remainingMs / SOLVE_TIME_LIMIT_MS))}
        explanationText={explanationText}
        onExplanationChange={(value) => {
          setExplanationText(value);
          if (explanationError) {
            setExplanationError(null);
          }
        }}
        onSubmitExplanation={handleSubmitExplanation}
        onSkipExplanation={lastAttempt?.isCorrect ? null : handleSkipExplanation}
        explanationRequired={lastAttempt?.isCorrect ?? false}
        explanationSubmitted={explanationSubmitted}
        explanationError={explanationError}
        onExit={handleExitToMenu}
        canExit={!isEvaluating}
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        canPause={!showSolution && !isEvaluating}
        onTest={handleTestCode}
        isTesting={isTesting}
        testOutput={testOutput}
        testError={testError}
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
};

const LoadingScreen = ({ message }: { message: string }) => (
  <div className="container">
    <div className="card">
      <p>{message}</p>
    </div>
  </div>
);

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen message="Checking your session..." />;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

const LoginRoute = () => {
  const { session, loading } = useAuth();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
    "/";

  if (loading) {
    return <LoadingScreen message="Checking your session..." />;
  }

  if (session) {
    return <Navigate to={from} replace />;
  }

  return <LoginScreen />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
