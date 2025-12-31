// Removed uuid import to use crypto.randomUUID


// Types
export interface PyodideResult {
  logs: string[];
  result: any;
  error?: string;
  executionTime?: number;
  richOutputs?: Array<{ type: string; data: any }>;
}

export type OutputCallback = (text: string) => void;

// Worker Management
let worker: Worker | null = null;
let workerReadyPromise: Promise<void> | null = null;
let loadingCallbacks: Array<(progress: number) => void> = [];

// Execution State
interface PendingExecution {
  resolve: (value: PyodideResult) => void;
  reject: (reason?: any) => void;
  logs: string[];
  startTime: number;
  onOutput?: OutputCallback;
}

let pendingExecutions: Map<string, PendingExecution> = new Map();

// Initialize Worker
const initWorker = () => {
  if (worker) return;

  if (typeof window === 'undefined') return;

  // Create worker using standard Vite/Next.js compatible syntax
  worker = new Worker(new URL('./pyodide-worker.ts', import.meta.url), {
    type: 'module',
  });

  worker.onmessage = (event) => {
    const { type, id, stream, text, results, error, progress } = event.data;

    switch (type) {
      case 'LOADING':
        loadingCallbacks.forEach(cb => cb(progress));
        break;

      case 'READY':
        loadingCallbacks.forEach(cb => cb(100));
        break;

      case 'OUTPUT':
        // Find execution and append log
        // Note: Global stdout might not have an ID if we don't pass it in init
        // But for specific cell execution, we hope logic flow matches.
        // Actually, we process all executions sequentially for now or track active one.
        // Limitation: Pyodide stdout callback doesn't carry "context".
        // Solution: We assume the most recent/only active execution owns the output.
        // Or we just broadcast to active execution.
        if (pendingExecutions.size > 0) {
          const entry = pendingExecutions.entries().next().value;
          if (entry) {
            const [_, exec] = entry;
            exec.logs.push(text);
            if (exec.onOutput) exec.onOutput(text);
          }
        }
        break;

      case 'RESULTS':
        if (id && pendingExecutions.has(id)) {
          const exec = pendingExecutions.get(id)!;
          pendingExecutions.delete(id);

          exec.resolve({
            logs: exec.logs,
            result: results.result,
            richOutputs: results.richOutputs,
            executionTime: performance.now() - exec.startTime
          });
        }
        break;

      case 'ERROR':
        if (id && pendingExecutions.has(id)) {
          const exec = pendingExecutions.get(id)!;
          pendingExecutions.delete(id);

          exec.resolve({ // Resolve with error field instead of rejecting to match previous API
            logs: exec.logs,
            result: undefined,
            error: error,
            executionTime: performance.now() - exec.startTime
          });
        } else {
          console.error('Worker Global Error:', error);
        }
        break;
    }
  };

  worker.postMessage({ type: 'INIT' });
};

// Progress Listener
export const onLoadingProgress = (callback: (progress: number) => void) => {
  loadingCallbacks.push(callback);
  // Trigger immediately if we have state? 
  // Simplified for now.
};

// Main Execute Function
export const executePython = async (
  code: string,
  onOutput?: OutputCallback
): Promise<PyodideResult> => {
  if (!worker) {
    initWorker();
  }

  const id = crypto.randomUUID();
  const startTime = performance.now();

  return new Promise((resolve, reject) => {
    pendingExecutions.set(id, {
      resolve,
      reject,
      logs: [],
      startTime,
      onOutput
    });

    worker!.postMessage({ type: 'EXECUTE', id, data: { code } });
  });
};

// Utilities
export const isPyodideLoaded = () => !!worker;

export const resetPythonNamespace = async () => {
  if (!worker) return;
  return executePython('%reset');
};

// TODO: Implement kill/restart worker if needed
export const restartWorker = () => {
  if (worker) {
    worker.terminate();
    worker = null;
    pendingExecutions.forEach(exec => exec.reject('Worker terminated'));
    pendingExecutions.clear();
    initWorker();
  }
}
