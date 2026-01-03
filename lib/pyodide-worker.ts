/* eslint-disable no-restricted-globals */

// Define the worker context
const ctx: Worker = self as any;

// Declare worker globals
declare function importScripts(...urls: string[]): void;
declare function loadPyodide(config: any): Promise<any>;

// Pyodide configuration
const PYODIDE_VERSION = 'v0.25.0';
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/pyodide.js`;
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;

let pyodide: any = null;
let pyodideReadyPromise: Promise<void> | null = null;
let initProgress = 0;

// Import scripts helper
const loadScripts = async (urls: string[]) => {
  importScripts(...urls);
};

// Initialize Pyodide
async function initPyodide() {
  if (pyodideReadyPromise) return pyodideReadyPromise;

  pyodideReadyPromise = (async () => {
    try {
      postMessage({ type: 'LOADING', progress: 10 });
      await loadScripts([PYODIDE_URL]);

      postMessage({ type: 'LOADING', progress: 30 });

      // @ts-ignore
      pyodide = await loadPyodide({
        indexURL: INDEX_URL,
        stdout: (text: string) => {
          postMessage({ type: 'OUTPUT', stream: 'stdout', text });
        },
        stderr: (text: string) => {
          postMessage({ type: 'OUTPUT', stream: 'stderr', text });
        },
      });

      postMessage({ type: 'LOADING', progress: 60 });

      // Setup environment
      await pyodide.runPythonAsync(`
import sys
from io import StringIO

# Custom output capturing if needed, though stdout/stderr callbacks work well
class OutputCapture:
    def write(self, data):
        # We rely on JS callbacks for main stdout/stderr
        pass
    
    def flush(self):
        pass

# Helper to capture rich output (matplotlib, pandas)
class RichOutputManager:
    def __init__(self):
        self.rich_outputs = []
    
    def add_image(self, img_data):
        self.rich_outputs.append({'type': 'image', 'data': img_data})
        
    def add_html(self, html_data):
        self.rich_outputs.append({'type': 'html', 'data': html_data})
        
    def get_and_clear(self):
        outputs = self.rich_outputs.copy()
        self.rich_outputs = []
        return outputs

_rich_output = RichOutputManager()

# Algorithm Tracer for Python (matches TypeScript API)
class AlgorithmTracer:
    def __init__(self):
        self.steps = []
        self.step_counter = 0
    
    def reset(self):
        """
        Reset all captured steps.
        Call this at the start of your algorithm.
        """
        self.steps = []
        self.step_counter = 0
    
    def add_step(self, description, variables, arrays=None):
        """
        Add a visualization step.
        
        Args:
            description (str): Description of the current step
            variables (dict): variables to display (e.g. {'x': 10, 'arr': [1,2]})
            arrays (list): (Optional) List of dicts for array visualization
                           [{'name': 'arr', 'values': [1,2], 'highlights': [1]}]
        """
        step = {
            'step': self.step_counter,
            'description': description,
            'variables': variables,
            'arrays': arrays or []
        }
        self.steps.append(step)
        self.step_counter += 1
    
    def get_steps(self):
        """Return the list of captured steps."""
        return self.steps

# Global tracer instance (matches TS tracer)
tracer = AlgorithmTracer()

# Magic commands support
class MagicCommands:
    @staticmethod
    def reset():
        to_keep = set(['__builtins__', '__name__', '__doc__', '_rich_output', 'MagicCommands', '_magic', 'AlgorithmTracer', 'tracer'])
        user_vars = [k for k in globals().keys() if k not in to_keep and not k.startswith('_')]
        for var in user_vars:
            del globals()[var]
        return f"Reset namespace. Removed {len(user_vars)} variable(s)."
    
    @staticmethod
    def who():
        to_exclude = set(['__builtins__', '__name__', '__doc__', '_rich_output', 'MagicCommands', '_magic', 'AlgorithmTracer', 'tracer'])
        user_vars = [k for k in sorted(globals().keys()) if k not in to_exclude and not k.startswith('_')]
        return user_vars
    
    @staticmethod
    def whos():
        import sys
        to_exclude = set(['__builtins__', '__name__', '__doc__', '_rich_output', 'MagicCommands', '_magic', 'AlgorithmTracer', 'tracer'])
        user_vars = [(k, type(globals()[k]).__name__, sys.getsizeof(globals()[k])) 
                     for k in sorted(globals().keys()) 
                     if k not in to_exclude and not k.startswith('_')]
        return user_vars

_magic = MagicCommands()
`);

      postMessage({ type: 'LOADING', progress: 80 });

      // Pre-load micropip
      await pyodide.loadPackage('micropip');

      // Install jedi for autocomplete (non-blocking, best effort)
      try {
        await pyodide.runPythonAsync(`
import micropip
await micropip.install('jedi')
`);
      } catch (e) {
        console.warn('Failed to install jedi for autocomplete:', e);
      }

      postMessage({ type: 'LOADING', progress: 100 });
      postMessage({ type: 'READY' });
    } catch (err: any) {
      postMessage({ type: 'ERROR', error: err.message });
      pyodideReadyPromise = null; // Allow retry
    }
  })();

  return pyodideReadyPromise;
}

// Ensure matplotlib setup for each run
async function setupMatplotlib() {
  if (!pyodide) return;
  await pyodide.runPythonAsync(`
import sys
try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    # Clear any potential stale plots
    plt.clf()
except ImportError:
    pass

`);
}

// Check for and render matplotlib plots
async function checkMatplotlib() {
  if (!pyodide) return null;

  return await pyodide.runPythonAsync(`
import sys
import io
import base64

img_data = None
if 'matplotlib.pyplot' in sys.modules:
    import matplotlib.pyplot as plt
    fig = plt.gcf()
    if fig.get_axes():
        buf = io.BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight', dpi=100)
        buf.seek(0)
        img_data = "data:image/png;base64," + base64.b64encode(buf.read()).decode('utf-8')
        plt.close(fig)

img_data
`);
}

// Check for pandas dataframes
async function checkPandas(lastResult: any) {
  if (!pyodide) return null;

  // Only check if we have a result that might be a dataframe
  if (!lastResult) return null;

  try {
    return await pyodide.runPythonAsync(`
import sys
html_output = None
if 'pandas' in sys.modules:
    import pandas as pd
    # Check if the last result (managed by Pyodide's last expr) is a DF
    # But we can't easily access the last expression result from Python side 
    # unless we assigned it or captured it.
    # Approach: JS passes the result back? No, result is already a Proxy.
    pass
    
# Alternative: user explicitly ends with a dataframe
html_output
`);
  } catch (e) {
    return null;
  }
}

// Handle incoming messages
ctx.onmessage = async (event) => {
  const { type, id, data } = event.data;

  if (type === 'INIT') {
    await initPyodide();
  }
  else if (type === 'EXECUTE') {
    if (!pyodide) await initPyodide();

    const { code } = data;

    try {
      if (code.trim().startsWith('%')) {
        // Handle magic commands specifically if needed, or just run them as python
        // Note: We need to parse them in JS if we want special handling not implemented in Python
        // For now, let's execute normally since we defined _magic helper class
        if (code.trim() === '%reset') {
          await pyodide.runPythonAsync('_magic.reset()');
          postMessage({ type: 'RESULTS', id, results: { result: 'Namespace reset' } });
          return;
        }
      }

      // 1. Auto-install packages logic could go here (scan code for imports)
      // Simple parse for imports
      await pyodide.loadPackagesFromImports(code);

      // 2. Setup environment
      await setupMatplotlib();

      // 3. Run code
      // Reset tracer before execution to prevent state leak from previous cells
      await pyodide.runPythonAsync('tracer.reset()');
      const result = await pyodide.runPythonAsync(code);

      // 4. Capture Rich Outputs
      const richOutputs = [];

      // Matplotlib
      const plot = await checkMatplotlib();
      if (plot) {
        richOutputs.push({
          type: 'image',
          data: plot,
          metadata: { chartType: 'matplotlib' }
        });
      }

      // Pandas (Automatic display of last line if it's a DataFrame)
      let jsResult = result;
      if (result && typeof result.toJs === 'function') {
        // Check if it's a DataFrame before converting
        try {
          if (result.to_html && typeof result.to_html === 'function') {
            // It's a DataFrame!
            const html = result.to_html();
            const shape = result.shape ? result.shape.toJs() : null;
            const columns = result.columns ? result.columns.toJs() : null;

            richOutputs.push({
              type: 'html',
              data: html,
              metadata: {
                rows: shape ? shape[0] : null,
                columns: columns ? columns : null
              }
            });
            jsResult = "<Pandas DataFrame>"; // Simple representation
          } else {
            // Regular Python object, convert to JS
            jsResult = result.toJs({ dict_converter: Object.fromEntries });
          }
        } catch (e) {
          // If conversion fails, try normal toJs
          try {
            jsResult = result.toJs({ dict_converter: Object.fromEntries });
          } catch {
            jsResult = String(result);
          }
        }
      }

      // Extract algorithm tracer steps from Python
      let algorithmSteps: any[] = [];
      try {
        const tracerSteps = await pyodide.runPythonAsync('tracer.get_steps()');
        if (tracerSteps) {
          algorithmSteps = tracerSteps.toJs({ dict_converter: Object.fromEntries });
        }
      } catch (e) {
        // No steps or error getting steps
      }

      postMessage({
        type: 'RESULTS',
        id,
        results: {
          result: jsResult,
          richOutputs,
          algorithmSteps
        }
      });

    } catch (error: any) {
      postMessage({ type: 'ERROR', id, error: error.message });
    }
  }
  else if (type === 'COMPLETE') {
    // Jedi-based Python autocomplete
    if (!pyodide) await initPyodide();

    const { code, line, column } = data;

    try {
      // Escape the code properly for Python triple-quoted string
      const escapedCode = code.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

      const completions = await pyodide.runPythonAsync(`
import json
try:
    import jedi
    
    # Header to make tracer visible to Jedi
    header = '''
class AlgorithmTracer:
    def reset(self):
        """Reset all captured steps. Call this at the start."""
        pass

    def add_step(self, description, variables, arrays=None):
        """
        Add a visualization step.
        
        Args:
            description (str): Description of the current step
            variables (dict): variables to display
            arrays (list): Optional list of dicts for array visualization
        """
        pass

tracer = AlgorithmTracer()
'''
    header_lines = header.count('\\n') + 1
    
    # Combine header and user code
    code_str = header + '''${escapedCode}'''
    
    # Adjust line number (Jedi uses 1-based indexing)
    script = jedi.Script(code_str, path='cell.py')
    completions = script.complete(${line} + header_lines, ${column})
    
    result = [{
        'name': c.name,
        'type': c.type,
        'description': c.description,
        'docstring': (c.docstring() or '')[:200]
    } for c in completions[:50]]
    json.dumps(result)
except Exception as e:
    json.dumps([])
`);

      postMessage({
        type: 'COMPLETIONS',
        id,
        completions: JSON.parse(completions)
      });

    } catch (error: any) {
      postMessage({ type: 'COMPLETIONS', id, completions: [] });
    }
  }
  else if (type === 'FORMAT') {
    // Format Python code using Black
    if (!pyodide) await initPyodide();

    const { code } = data;

    try {
      const escapedCode = code.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');

      const formatted = await pyodide.runPythonAsync(`
import micropip

# Install black if not already installed
try:
    import black
except ImportError:
    await micropip.install('black')
    import black

# Format the code
code_to_format = '''${escapedCode}'''.replace('\\\\n', '\\n')
try:
    formatted = black.format_str(code_to_format, mode=black.Mode(line_length=88))
    formatted
except Exception as e:
    code_to_format  # Return original on error
`);

      postMessage({
        type: 'FORMATTED',
        id,
        formatted: formatted
      });

    } catch (error: any) {
      postMessage({ type: 'FORMATTED', id, formatted: code, error: error.message });
    }
  }
};
