/* eslint-disable no-restricted-globals */
const PYODIDE_JS = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
const PYODIDE_INDEX_URL = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/";

type InitMessage = { type: "init" };
type RunMessage = {
  type: "run";
  requestId: number;
  code: string;
  tests: string;
};

type WorkerRequest = InitMessage | RunMessage;

type InitResponse = { type: "init"; ok: true } | { type: "init"; ok: false; error: string };
type RunResponse =
  | { type: "run"; requestId: number; ok: true; runtimeMs: number; stdout?: string }
  | { type: "run"; requestId: number; ok: false; runtimeMs: number; error: string };

type WorkerResponse = InitResponse | RunResponse;

declare function importScripts(...urls: string[]): void;

type PyodideInterface = {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (config: { batched: (msg: string) => void }) => void;
  setStderr: (config: { batched: (msg: string) => void }) => void;
};

let pyodideReady: Promise<PyodideInterface> | null = null;

const formatPythonError = (error: unknown): string => {
  const raw =
    error instanceof Error ? error.message : error ? String(error) : "Unknown error";
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return "Unknown error";
  }
  const lastLine = lines[lines.length - 1];
  if (lastLine === "AssertionError" || lastLine.startsWith("AssertionError")) {
    return "Assertion failed: expected output did not match.";
  }
  return lastLine;
};

const loadPyodideRuntime = async (): Promise<PyodideInterface> => {
  if (!pyodideReady) {
    importScripts(PYODIDE_JS);
    const loader = (self as unknown as { loadPyodide: (opts: { indexURL: string }) => Promise<PyodideInterface> })
      .loadPyodide;
    pyodideReady = loader({ indexURL: PYODIDE_INDEX_URL });
  }
  return pyodideReady;
};

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const data = event.data;
  if (data.type === "init") {
    try {
      await loadPyodideRuntime();
      const response: WorkerResponse = { type: "init", ok: true };
      self.postMessage(response);
    } catch (error) {
      const response: WorkerResponse = {
        type: "init",
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      };
      self.postMessage(response);
    }
    return;
  }

  if (data.type === "run") {
    const start = performance.now();
    try {
      const pyodide = await loadPyodideRuntime();
      let stdout = "";
      pyodide.setStdout({
        batched: (msg) => {
          stdout += msg;
        }
      });
      pyodide.setStderr({
        batched: (msg) => {
          stdout += msg;
        }
      });

      await pyodide.runPythonAsync(`${data.code}\n\n${data.tests}`);
      const runtimeMs = performance.now() - start;
      const response: WorkerResponse = {
        type: "run",
        requestId: data.requestId,
        ok: true,
        runtimeMs,
        stdout
      };
      self.postMessage(response);
    } catch (error) {
      const runtimeMs = performance.now() - start;
      const response: WorkerResponse = {
        type: "run",
        requestId: data.requestId,
        ok: false,
        runtimeMs,
        error: formatPythonError(error)
      };
      self.postMessage(response);
    }
  }
};
