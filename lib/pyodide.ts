// Pyodide integration for Python execution in browser
// Uses lazy loading to only download Pyodide when first Python cell is executed

let pyodideInstance: any = null;
let pyodideLoading: Promise<any> | null = null;

declare global {
  interface Window {
    loadPyodide?: (config?: { indexURL?: string }) => Promise<any>;
  }
}

// Check if running in browser
const isBrowser = typeof window !== 'undefined';

// Helper to check if loadPyodide is available
const isLoadPyodideAvailable = (): boolean => {
  return isBrowser && typeof window.loadPyodide === 'function';
};

const loadPyodideScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!isBrowser) {
      reject(new Error('Pyodide can only run in browser environment'));
      return;
    }

    // Check if already loaded
    if (isLoadPyodideAvailable()) {
      resolve();
      return;
    }

    if (document.querySelector('script[src*="pyodide"]')) {
      // Script exists, wait for it to load
      const checkInterval = setInterval(() => {
        if (isLoadPyodideAvailable()) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Timeout waiting for Pyodide to load'));
      }, 30000);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      // Wait for loadPyodide to be available
      const checkInterval = setInterval(() => {
        if (isLoadPyodideAvailable()) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
      setTimeout(() => {
        clearInterval(checkInterval);
        if (isLoadPyodideAvailable()) {
          resolve();
        } else {
          reject(new Error('loadPyodide function not available after script load'));
        }
      }, 5000);
    };
    script.onerror = (e) => reject(new Error(`Failed to load Pyodide script: ${e}`));
    document.head.appendChild(script);
  });
};

export const getPyodide = async (): Promise<any> => {
  if (!isBrowser) {
    throw new Error('Pyodide can only run in browser environment');
  }

  if (pyodideInstance) {
    return pyodideInstance;
  }

  if (pyodideLoading) {
    return pyodideLoading;
  }

  pyodideLoading = (async () => {
    await loadPyodideScript();

    pyodideInstance = await window.loadPyodide!({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
    });

    // Set up stdout/stderr capture
    await pyodideInstance.runPythonAsync(`
import sys
from io import StringIO

class OutputCapture:
    def __init__(self):
        self.logs = []
    
    def write(self, text):
        if text.strip():
            self.logs.append(text.rstrip('\\n'))
    
    def flush(self):
        pass
    
    def get_logs(self):
        logs = self.logs.copy()
        self.logs = []
        return logs

_output_capture = OutputCapture()
sys.stdout = _output_capture
sys.stderr = _output_capture
`);

    return pyodideInstance;
  })();

  return pyodideLoading;
};

export const executePython = async (
  code: string
): Promise<{ logs: string[]; result: any; error?: string }> => {
  try {
    const pyodide = await getPyodide();

    // Clear previous output
    await pyodide.runPythonAsync('_output_capture.logs = []');

    // Execute the code
    let result;
    try {
      result = await pyodide.runPythonAsync(code);
    } catch (err: any) {
      const logs = await pyodide.runPythonAsync('_output_capture.get_logs()');
      return {
        logs: logs.toJs() || [],
        result: undefined,
        error: err.message || String(err),
      };
    }

    // Get captured output
    const logs = await pyodide.runPythonAsync('_output_capture.get_logs()');
    const logsArray = logs.toJs() || [];

    // Convert Python result to JS
    let jsResult = undefined;
    if (result !== undefined && result !== null) {
      try {
        jsResult = result.toJs ? result.toJs() : result;
      } catch {
        jsResult = String(result);
      }
    }

    return { logs: logsArray, result: jsResult };
  } catch (error: any) {
    return {
      logs: [],
      result: undefined,
      error: error.message || String(error),
    };
  }
};

export const isPyodideLoaded = (): boolean => {
  return pyodideInstance !== null;
};
