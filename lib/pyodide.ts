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

// Completion State
interface PendingCompletion {
  resolve: (completions: any[]) => void;
  reject: (reason?: any) => void;
}
let pendingCompletions: Map<string, PendingCompletion> = new Map();

// Format State
interface PendingFormat {
  resolve: (formatted: string) => void;
  reject: (reason?: any) => void;
}
let pendingFormats: Map<string, PendingFormat> = new Map();

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

      case 'COMPLETIONS':
        if (id && pendingCompletions.has(id)) {
          const completion = pendingCompletions.get(id)!;
          pendingCompletions.delete(id);
          completion.resolve(event.data.completions || []);
        }
        break;

      case 'FORMATTED':
        if (id && pendingFormats.has(id)) {
          const fmt = pendingFormats.get(id)!;
          pendingFormats.delete(id);
          fmt.resolve(event.data.formatted || event.data.code);
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
    pendingCompletions.forEach(comp => comp.reject('Worker terminated'));
    pendingCompletions.clear();
    initWorker();
  }
}

// Get Python completions using Jedi
export interface PythonCompletion {
  name: string;
  type: string;
  description: string;
  docstring: string;
}

export const getPythonCompletions = async (
  code: string,
  line: number,
  column: number
): Promise<PythonCompletion[]> => {
  if (!worker) {
    initWorker();
  }

  const id = crypto.randomUUID();

  return new Promise((resolve, reject) => {
    // Timeout after 2 seconds to avoid blocking UI
    const timeout = setTimeout(() => {
      pendingCompletions.delete(id);
      resolve([]);
    }, 2000);

    pendingCompletions.set(id, {
      resolve: (completions) => {
        clearTimeout(timeout);
        resolve(completions);
      },
      reject: (reason) => {
        clearTimeout(timeout);
        reject(reason);
      }
    });

    worker!.postMessage({
      type: 'COMPLETE',
      id,
      data: { code, line, column }
    });
  });
};

// Format Python code using Black
export const formatPythonCode = async (code: string): Promise<string> => {
  if (!worker) {
    initWorker();
  }

  const id = crypto.randomUUID();

  return new Promise((resolve) => {
    // Timeout after 3 seconds
    const timeout = setTimeout(() => {
      pendingFormats.delete(id);
      resolve(code); // Return original on timeout
    }, 3000);

    pendingFormats.set(id, {
      resolve: (formatted) => {
        clearTimeout(timeout);
        resolve(formatted);
      },
      reject: () => {
        clearTimeout(timeout);
        resolve(code);
      }
    });

    worker!.postMessage({
      type: 'FORMAT',
      id,
      data: { code }
    });
  });
};
