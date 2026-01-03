'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface SyntaxHighlightedOutputProps {
  code: string;
  language?: string;
  theme: 'light' | 'dark';
}

const SyntaxHighlightedOutput: React.FC<SyntaxHighlightedOutputProps> = ({
  code,
  language = 'json',
  theme
}) => {
  const [copied, setCopied] = useState(false);
  const isDark = theme === 'dark';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple syntax highlighting for JSON
  const highlightJSON = (json: string) => {
    if (language !== 'json') return json;

    try {
      const parsed = JSON.parse(json);
      const formatted = JSON.stringify(parsed, null, 2);

      return formatted
        .replace(/(".*?"):/g, '<span class="json-key">$1</span>:')
        .replace(/: (".*?")/g, ': <span class="json-string">$1</span>')
        .replace(/: (\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
        .replace(/: (true|false|null)/g, ': <span class="json-boolean">$1</span>');
    } catch {
      return json;
    }
  };

  return (
    <div className={`relative rounded-lg border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2 border-b ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-100'
        }`}>
        <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
          {language}
        </span>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded transition-colors ${isDark
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
        >
          {copied ? (
            <>
              <Check size={14} />
              Copied
            </>
          ) : (
            <>
              <Copy size={14} />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className={`p-4 overflow-x-auto font-mono text-sm ${isDark ? 'text-slate-300' : 'text-slate-800'
        }`}>
        <style jsx>{`
          .json-key {
            color: ${isDark ? '#8be9fd' : '#0077aa'};
          }
          .json-string {
            color: ${isDark ? '#50fa7b' : '#22863a'};
          }
          .json-number {
            color: ${isDark ? '#bd93f9' : '#6f42c1'};
          }
          .json-boolean {
            color: ${isDark ? '#ff79c6' : '#d73a49'};
          }
        `}</style>
        {language === 'json' ? (
          <pre
            dangerouslySetInnerHTML={{ __html: highlightJSON(code) }}
            className="whitespace-pre-wrap break-words"
          />
        ) : (
          <pre className="whitespace-pre-wrap break-words">{code}</pre>
        )}
      </div>
    </div>
  );
};

export default SyntaxHighlightedOutput;
