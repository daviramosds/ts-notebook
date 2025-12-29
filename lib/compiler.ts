import { transform } from 'sucrase';

// REMOVIDO: import { getDbConfig... } pois o arquivo não existe e causava erro de build.

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
      // Criação da função de execução isolada.
      // Removemos 'supabase' e 'rest' dos argumentos pois não temos essas configs agora.
      // Usamos 'eval' para garantir que o retorno da última linha seja capturado.
      const executionFn = new Function('console', 'setCapture', `
        return (async function() {
          try {
            setCapture(false);
            // Executa contexto anterior (células acima) sem capturar logs
            if (previousContext) {
               try { eval(previousContext); } catch(e) {}
            }
            
            setCapture(true);
            // Executa o código atual e retorna o resultado
            return eval(${JSON.stringify(jsCode)});
          } catch (e) {
            throw e;
          }
        })();
      `);

      const setCapture = (val: boolean) => { isCapturing = val; };

      // Executa sem passar dependências externas quebradas
      executionFn(customConsole, setCapture)
        .then((result: any) => resolve({ logs, result }))
        .catch((error: any) => resolve({ logs, result: undefined, error: error.message || String(error) }));

    } catch (error: any) {
      resolve({ logs, result: undefined, error: error.message || String(error) });
    }
  });
};