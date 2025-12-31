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

# Magic commands support
class MagicCommands:
    @staticmethod
    def reset():
        to_keep = set(['__builtins__', '__name__', '__doc__', '_rich_output', 'MagicCommands', '_magic'])
        user_vars = [k for k in globals().keys() if k not in to_keep and not k.startswith('_')]
        for var in user_vars:
            del globals()[var]
        return f"Reset namespace. Removed {len(user_vars)} variable(s)."
    
    @staticmethod
    def who():
        to_exclude = set(['__builtins__', '__name__', '__doc__', '_rich_output', 'MagicCommands', '_magic'])
        user_vars = [k for k in sorted(globals().keys()) if k not in to_exclude and not k.startswith('_')]
        return user_vars
    
    @staticmethod
    def whos():
        import sys
        to_exclude = set(['__builtins__', '__name__', '__doc__', '_rich_output', 'MagicCommands', '_magic'])
        user_vars = [(k, type(globals()[k]).__name__, sys.getsizeof(globals()[k])) 
                     for k in sorted(globals().keys()) 
                     if k not in to_exclude and not k.startswith('_')]
        return user_vars

_magic = MagicCommands()
`);

      postMessage({ type: 'LOADING', progress: 80 });

      // Pre-load micropip
      await pyodide.loadPackage('micropip');

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
if 'matplotlib' in sys.modules:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    # Clear any potential stale plots
    plt.clf()
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
      const result = await pyodide.runPythonAsync(code);

      // 4. Capture Rich Outputs
      const richOutputs = [];

      // Matplotlib
      const plot = await checkMatplotlib();
      if (plot) richOutputs.push({ type: 'image', data: plot });

      // Pandas (Automatic display of last line if it's a DataFrame)
      // Actually, pyodide.runPythonAsync returns the last expression value
      // If result is a DataFrame proxy, we can convert it.
      let jsResult = result;
      if (result && typeof result.toJs === 'function') {
        jsResult = result.toJs();
        // Check if it looks like a DataFrame or we can check type
        // Getting type of PyProxy is tricky. 
        // Easy way: try to call .to_html() if it exists
        try {
          if (result.type === 'DataFrame' || result.to_html) {
            const html = result.to_html();
            richOutputs.push({ type: 'html', data: html });
            jsResult = "<Pandas DataFrame>"; // Don't verify raw structure in console
          }
        } catch (e) { }
      }

      postMessage({
        type: 'RESULTS',
        id,
        results: {
          result: jsResult,
          richOutputs
        }
      });

    } catch (error: any) {
      postMessage({ type: 'ERROR', id, error: error.message });
    }
  }
};
