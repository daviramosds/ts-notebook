
import { transform } from 'sucrase';
import { getDbConfig, createSupabaseClient, restClient } from './database-manager';

export const compileTS = (tsCode: string): string => {
  try {
    const result = transform(tsCode, {
      transforms: ['typescript'],
      production: true,
    });
    return result.code;
  } catch (err: any) {
    throw new Error(`Compilation Error: ${err.message}`);
  }
};

export const executeJS = (jsCode: string, previousContext: string = ''): Promise<{ logs: string[]; result: any; error?: any }> => {
  return new Promise((resolve) => {
    const logs: string[] = [];
    let isCapturing = false;
    
    const customConsole = {
      log: (...args: any[]) => {
        if (!isCapturing) return;
        logs.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
      },
      error: (...args: any[]) => {
        if (!isCapturing) return;
        logs.push(`ERROR: ${args.join(' ')}`);
      },
      warn: (...args: any[]) => {
        if (!isCapturing) return;
        logs.push(`WARN: ${args.join(' ')}`);
      }
    };

    try {
      const config = getDbConfig();
      const supabase = createSupabaseClient(config);

      const executionFn = new Function('console', 'setCapture', 'supabase', 'rest', `
        return (async function() {
          try {
            setCapture(false);
            ${previousContext}
            
            setCapture(true);
            ${jsCode}
          } catch (e) {
            throw e;
          }
        })();
      `);

      const setCapture = (val: boolean) => { isCapturing = val; };
      
      executionFn(customConsole, setCapture, supabase, restClient)
        .then((result: any) => resolve({ logs, result }))
        .catch((error: any) => resolve({ logs, result: undefined, error: error.message || String(error) }));
        
    } catch (error: any) {
      resolve({ logs, result: undefined, error: error.message || String(error) });
    }
  });
};
