'use client';

import React from 'react';
import InteractiveTable from './InteractiveTable';
import ChartViewer from './ChartViewer';
import SyntaxHighlightedOutput from './SyntaxHighlightedOutput';
import { detectOutputType, formatAsTableData, prettyPrintJSON, processRichOutputs } from '@/lib/output-renderers';
import { Eye } from 'lucide-react';

interface RichOutputProps {
  output: {
    logs?: string[];
    error?: string;
    result?: any;
    richOutputs?: any[];
  };
  theme: 'light' | 'dark';
  lang: 'pt' | 'en';
  onVisualize?: () => void;
}

const translations = {
  pt: {
    console: 'Console Output',
    result: 'Resultado',
    error: 'Erro de Execução',
    visualize: 'Visualizar',
  },
  en: {
    console: 'Console Output',
    result: 'Result',
    error: 'Execution Error',
    visualize: 'Visualize',
  }
};

const RichOutput: React.FC<RichOutputProps> = ({ output, theme, lang, onVisualize }) => {
  const isDark = theme === 'dark';
  const t = translations[lang];

  const { logs, error, result, richOutputs } = output;

  // Check if there's any output to display
  if ((!logs || logs.length === 0) && !error && result === undefined && (!richOutputs || richOutputs.length === 0)) {
    return null;
  }

  // Process rich outputs from Python
  const processedRichOutputs = richOutputs ? processRichOutputs(richOutputs) : [];

  // Detect output type for the result
  const resultType = result !== undefined ? detectOutputType(result) : null;

  return (
    <div className={`mt-4 space-y-3`}>
      {/* Console Logs */}
      {logs && logs.length > 0 && (
        <div className={`p-4 rounded-lg border font-mono text-sm overflow-x-auto shadow-inner transition-colors duration-200 ${isDark ? 'bg-[#0d1117] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
          <div className={`flex items-center justify-between mb-2 pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
            <span className="text-[10px] font-bold tracking-widest uppercase opacity-50">{t.console}</span>
          </div>
          {logs.map((log: string, i: number) => (
            <div
              key={i}
              className={`whitespace-pre-wrap py-0.5 border-l-2 pl-3 mb-1 ${isDark ? 'border-blue-500/30' : 'border-blue-500/50'
                }`}
            >
              {log}
            </div>
          ))}
        </div>
      )}

      {/* Rich Outputs from Python (charts, tables, etc) */}
      {processedRichOutputs.map((richOutput, index) => (
        <div key={`rich-${index}`}>
          {richOutput.type === 'chart' && (
            <ChartViewer
              data={richOutput.data}
              chartType={(richOutput.metadata?.chartType || 'matplotlib') as 'matplotlib' | 'plotly' | 'image'}
              theme={theme}
            />
          )}
          {richOutput.type === 'table' && typeof richOutput.data === 'string' && (
            <div
              className={`rounded-lg border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              dangerouslySetInnerHTML={{ __html: richOutput.data }}
            />
          )}
          {richOutput.type === 'html' && (
            <div
              className={`rounded-lg border overflow-hidden p-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              dangerouslySetInnerHTML={{ __html: richOutput.data }}
            />
          )}
        </div>
      ))}

      {/* Result Output */}
      {result !== undefined && (
        <div className="space-y-2">
          {/* Visualize Button (if applicable) */}
          {(resultType === 'table' || resultType === 'json') && onVisualize && (
            <div className="flex justify-end">
              <button
                onClick={onVisualize}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${isDark
                  ? 'bg-purple-900/30 text-purple-300 hover:bg-purple-800/40 border border-purple-700'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-300'
                  }`}
              >
                <Eye size={14} />
                {t.visualize}
              </button>
            </div>
          )}

          {/* Render based on type */}
          {resultType === 'table' && (() => {
            const tableData = formatAsTableData(result);
            return tableData ? (
              <InteractiveTable data={tableData} theme={theme} />
            ) : null;
          })()}

          {resultType === 'json' && (
            <SyntaxHighlightedOutput
              code={prettyPrintJSON(result)}
              language="json"
              theme={theme}
            />
          )}

          {resultType === 'text' && (
            <div className={`p-4 rounded-lg border font-mono text-sm overflow-x-auto ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
              <div className={`flex items-center gap-2 mb-2 pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'
                }`}>
                <span className="text-[10px] font-bold tracking-widest uppercase opacity-50">{t.result}</span>
              </div>
              <div className="text-blue-500 dark:text-blue-400 border-l-2 border-blue-500 pl-3">
                <span className="whitespace-pre-wrap">{String(result)}</span>
              </div>
            </div>
          )}

          {resultType === 'html' && (
            <div
              className={`p-4 rounded-lg border overflow-x-auto ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              dangerouslySetInnerHTML={{ __html: result }}
            />
          )}
        </div>
      )}

      {/* Error Output */}
      {error && (
        <div className={`p-4 rounded-lg border font-mono text-sm overflow-x-auto ${isDark ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-red-500/30">
            <span className="text-[10px] font-bold tracking-widest uppercase">{t.error}</span>
          </div>
          <div className="whitespace-pre-wrap border-l-2 border-red-500 pl-3 bg-red-500/10 p-2 rounded">
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default RichOutput;
