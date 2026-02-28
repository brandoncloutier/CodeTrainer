import { describe, expect, it, vi } from "vitest";
import { AnswerResult } from "./types";
import { TIMEOUT_ERROR, createEvaluator } from "./evaluator";

class MockWorker {
  private messageListeners = new Set<(event: MessageEvent) => void>();
  private errorListeners = new Set<(event: ErrorEvent) => void>();
  private respondToRun: boolean;
  terminated = false;

  constructor(respondToRun = true) {
    this.respondToRun = respondToRun;
  }

  postMessage(message: { type: string; requestId?: number }) {
    if (message.type === "init") {
      queueMicrotask(() => {
        this.emitMessage({ type: "init", ok: true });
      });
      return;
    }

    if (message.type === "run" && this.respondToRun) {
      queueMicrotask(() => {
        this.emitMessage({
          type: "run",
          requestId: message.requestId,
          ok: true,
          runtimeMs: 5,
          stdout: ""
        });
      });
    }
  }

  terminate() {
    this.terminated = true;
  }

  addEventListener(type: "message" | "error", listener: (event: any) => void) {
    if (type === "message") {
      this.messageListeners.add(listener);
    } else {
      this.errorListeners.add(listener);
    }
  }

  removeEventListener(type: "message" | "error", listener: (event: any) => void) {
    if (type === "message") {
      this.messageListeners.delete(listener);
    } else {
      this.errorListeners.delete(listener);
    }
  }

  private emitMessage(data: any) {
    this.messageListeners.forEach((listener) =>
      listener({ data } as MessageEvent)
    );
  }

  emitError(message: string) {
    this.errorListeners.forEach((listener) =>
      listener({ message } as ErrorEvent)
    );
  }
}

describe("createEvaluator", () => {
  it("returns correct results for successful run", async () => {
    const worker = new MockWorker();
    const evaluator = createEvaluator({ workerFactory: () => worker });
    const result = (await evaluator.evaluate("code", "tests", 1000)) as AnswerResult;
    expect(result.correct).toBe(true);
  });

  it("times out when worker does not respond", async () => {
    vi.useFakeTimers();
    const worker = new MockWorker(false);
    const evaluator = createEvaluator({ workerFactory: () => worker });
    const promise = evaluator.evaluate("code", "tests", 10);
    await vi.advanceTimersByTimeAsync(20);
    const result = await promise;
    expect(result.correct).toBe(false);
    expect(result.error).toBe(TIMEOUT_ERROR);
    expect(worker.terminated).toBe(true);
    vi.useRealTimers();
  });
});
