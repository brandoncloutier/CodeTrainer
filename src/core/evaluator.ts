import { AnswerResult } from "./types";

export type WorkerRequest =
  | { type: "init" }
  | { type: "run"; requestId: number; code: string; tests: string };

export type WorkerResponse =
  | { type: "init"; ok: true }
  | { type: "init"; ok: false; error: string }
  | {
      type: "run";
      requestId: number;
      ok: true;
      runtimeMs: number;
      stdout?: string;
    }
  | {
      type: "run";
      requestId: number;
      ok: false;
      runtimeMs: number;
      error: string;
    };

export interface WorkerLike {
  postMessage: (message: WorkerRequest) => void;
  terminate: () => void;
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<WorkerResponse>) => void
  ): void;
  addEventListener(type: "error", listener: (event: ErrorEvent) => void): void;
  removeEventListener(
    type: "message",
    listener: (event: MessageEvent<WorkerResponse>) => void
  ): void;
  removeEventListener(type: "error", listener: (event: ErrorEvent) => void): void;
}

type EvaluatorOptions = {
  workerFactory: () => WorkerLike;
};

type PendingRequest = {
  resolve: (result: AnswerResult) => void;
  reject: (error: Error) => void;
};

const TIMEOUT_ERROR = "Time limit exceeded";

const buildTimeoutResult = (timeLimitMs: number): AnswerResult => ({
  correct: false,
  error: TIMEOUT_ERROR,
  runtimeMs: timeLimitMs
});

export const createEvaluator = ({ workerFactory }: EvaluatorOptions) => {
  let worker: WorkerLike | null = null;
  let initPromise: Promise<void> | null = null;
  let initResolver: ((value: void | PromiseLike<void>) => void) | null = null;
  let initRejecter: ((reason?: unknown) => void) | null = null;
  let requestId = 1;
  const pending = new Map<number, PendingRequest>();

  const cleanupWorker = () => {
    worker?.terminate();
    worker = null;
    initPromise = null;
    initResolver = null;
    initRejecter = null;
    pending.forEach(({ reject }) =>
      reject(new Error("Worker was terminated before completing the request."))
    );
    pending.clear();
  };

  const handleMessage = (event: MessageEvent<WorkerResponse>) => {
    const data = event.data;
    if (data.type === "init") {
      if (data.ok) {
        initResolver?.();
      } else {
        initRejecter?.(new Error(data.error));
      }
      initResolver = null;
      initRejecter = null;
      return;
    }

    if (data.type === "run") {
      const entry = pending.get(data.requestId);
      if (!entry) {
        return;
      }
      pending.delete(data.requestId);
      if (data.ok) {
        entry.resolve({
          correct: true,
          runtimeMs: data.runtimeMs,
          stdout: data.stdout
        });
      } else {
        entry.resolve({
          correct: false,
          runtimeMs: data.runtimeMs,
          error: data.error
        });
      }
    }
  };

  const handleError = (event: ErrorEvent) => {
    const error = new Error(event.message || "Worker error");
    if (initRejecter) {
      initRejecter(error);
    }
    pending.forEach(({ reject }) => reject(error));
    pending.clear();
    cleanupWorker();
  };

  const ensureWorker = () => {
    if (!worker) {
      worker = workerFactory();
      worker.addEventListener("message", handleMessage);
      worker.addEventListener("error", handleError);
    }
  };

  const init = async () => {
    if (initPromise) {
      return initPromise;
    }
    ensureWorker();
    initPromise = new Promise<void>((resolve, reject) => {
      initResolver = resolve;
      initRejecter = reject;
      worker?.postMessage({ type: "init" });
    });
    return initPromise;
  };

  const evaluate = async (
    code: string,
    tests: string,
    timeLimitMs: number
  ): Promise<AnswerResult> => {
    await init();
    const currentWorker = worker;
    if (!currentWorker) {
      return {
        correct: false,
        runtimeMs: 0,
        error: "Python runtime unavailable"
      };
    }

    const currentRequestId = requestId++;
    const runPromise = new Promise<AnswerResult>((resolve, reject) => {
      pending.set(currentRequestId, { resolve, reject });
      currentWorker.postMessage({
        type: "run",
        requestId: currentRequestId,
        code,
        tests
      });
    });

    let timeoutHandle: number | null = null;
    const timeoutPromise = new Promise<AnswerResult>((resolve) => {
      timeoutHandle = window.setTimeout(() => {
        pending.delete(currentRequestId);
        cleanupWorker();
        resolve(buildTimeoutResult(timeLimitMs));
      }, timeLimitMs);
    });

    const result = await Promise.race([runPromise, timeoutPromise]);
    if (timeoutHandle !== null) {
      window.clearTimeout(timeoutHandle);
    }
    return result;
  };

  const preload = async () => {
    try {
      await init();
    } catch {
      // Preload errors are surfaced during evaluation.
    }
  };

  return {
    evaluate,
    preload
  };
};

const defaultEvaluator = createEvaluator({
  workerFactory: () =>
    new Worker(new URL("../workers/pyodideWorker.ts", import.meta.url), {
      type: "classic"
    })
});

export const evaluatePython = defaultEvaluator.evaluate;
export const preloadPython = defaultEvaluator.preload;
export { TIMEOUT_ERROR };
