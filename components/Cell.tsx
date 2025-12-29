'use client';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // Importe o plugin GFM
import Editor from './Editor';
import {
  Play, Trash2, ChevronUp, ChevronDown, Edit3, Eye,
  ChevronRight, GripVertical, Loader2
} from 'lucide-react';

// Language type
type CellLanguage = 'typescript' | 'javascript' | 'python';

// SVG Icons for languages
const TypeScriptIcon = () => (
  <svg viewBox="0 0 128 128" width="14" height="14">
    <path fill="#3178c6" d="M2 63.91v62.5h125v-125H2zm100.73-5a15.56 15.56 0 017.82 4.5 20.58 20.58 0 013 4c0 .16-5.4 3.81-8.69 5.85-.12.08-.6-.44-1.13-1.23a7.09 7.09 0 00-5.87-3.53c-3.79-.26-6.23 1.73-6.21 5a4.58 4.58 0 00.54 2.34c.83 1.73 2.38 2.76 7.24 4.86 8.95 3.85 12.78 6.39 15.16 10 2.66 4 3.25 10.46 1.45 15.24-2 5.2-6.9 8.73-13.83 9.9a38.32 38.32 0 01-9.52-.1A23 23 0 0180 109.19c-1.15-1.27-3.39-4.58-3.25-4.82a9.34 9.34 0 011.15-.73L82.5 101l3.59-2.08.75 1.11a16.78 16.78 0 004.74 4.54c4 2.1 9.46 1.81 12.16-.62a5.43 5.43 0 00.69-6.92c-1-1.39-3-2.56-8.59-5-6.45-2.78-9.23-4.5-11.77-7.24a16.48 16.48 0 01-3.43-6.25 25 25 0 01-.22-8c1.33-6.23 6-10.58 12.82-11.87a31.66 31.66 0 019.49.26zm-29.34 5.24v5.12H57.16v46.23H45.65V69.26H29.38v-5a49.19 49.19 0 01.14-5.16c.06-.08 10-.12 22-.1h21.81z" />
  </svg>
);

const JavaScriptIcon = () => (
  <svg viewBox="0 0 128 128" width="14" height="14">
    <path fill="#f7df1e" d="M2 1v125h125V1H2zm66.119 106.513c-1.845 3.749-5.367 6.212-9.448 7.401-6.271 1.44-12.269.619-16.731-2.059-2.986-1.832-5.318-4.652-6.901-7.901l9.52-5.83c.083.035.333.487.667 1.071 1.214 2.034 2.261 3.474 4.319 4.485 2.022.69 6.461 1.131 8.175-2.427 1.047-1.81.714-7.628.714-14.065C60.027 75.115 60 61.564 60 47.858h12v37.759c0 6.623.375 15.696-3.881 22.896zm35.287-2.655c-5.014 8.865-16.152 9.912-24.182 7.568-4.655-1.323-8.958-4.203-11.505-8.508l10.199-6.087c.676 2.387 2.202 4.179 4.058 5.269 3.805 2.247 9.46 1.927 11.987-1.395 1.325-1.751 1.49-4.065 1.49-6.146V65.91h12v27.048c0 4.568-.501 9.306-4.047 12.9z" />
  </svg>
);

const PythonIcon = () => (
  <svg viewBox="0 0 128 128" width="14" height="14">
    <linearGradient id="python-a" gradientUnits="userSpaceOnUse" x1="70.252" y1="1237.476" x2="170.659" y2="1151.089" gradientTransform="matrix(.563 0 0 -.568 -29.215 707.817)">
      <stop offset="0" stopColor="#5A9FD4" />
      <stop offset="1" stopColor="#306998" />
    </linearGradient>
    <linearGradient id="python-b" gradientUnits="userSpaceOnUse" x1="209.474" y1="1098.811" x2="173.62" y2="1149.537" gradientTransform="matrix(.563 0 0 -.568 -29.215 707.817)">
      <stop offset="0" stopColor="#FFD43B" />
      <stop offset="1" stopColor="#FFE873" />
    </linearGradient>
    <path fill="url(#python-a)" d="M63.391 1.988c-4.222.02-8.252.379-11.8 1.007-10.45 1.846-12.346 5.71-12.346 12.837v9.411h24.693v3.137H29.977c-7.176 0-13.46 4.313-15.426 12.521-2.268 9.405-2.368 15.275 0 25.096 1.755 7.311 5.947 12.519 13.124 12.519h8.491V67.234c0-8.151 7.051-15.34 15.426-15.34h24.665c6.866 0 12.346-5.654 12.346-12.548V15.833c0-6.693-5.646-11.72-12.346-12.837-4.244-.706-8.645-1.027-12.866-1.008zM50.037 9.557c2.55 0 4.634 2.117 4.634 4.721 0 2.593-2.083 4.69-4.634 4.69-2.56 0-4.633-2.097-4.633-4.69-.001-2.604 2.073-4.721 4.633-4.721z" />
    <path fill="url(#python-b)" d="M91.682 28.38v10.966c0 8.5-7.208 15.655-15.426 15.655H51.591c-6.756 0-12.346 5.783-12.346 12.549v23.515c0 6.691 5.818 10.628 12.346 12.547 7.816 2.297 15.312 2.713 24.665 0 6.216-1.801 12.346-5.423 12.346-12.547v-9.412H63.938v-3.138h37.012c7.176 0 9.852-5.005 12.348-12.519 2.578-7.735 2.467-15.174 0-25.096-1.774-7.145-5.161-12.521-12.348-12.521h-9.268zM77.809 87.927c2.561 0 4.634 2.097 4.634 4.692 0 2.602-2.074 4.719-4.634 4.719-2.55 0-4.633-2.117-4.633-4.719 0-2.595 2.083-4.692 4.633-4.692z" />
  </svg>
);

// Language config with icons
const languageConfig: Record<CellLanguage, { label: string; color: string; Icon: React.FC }> = {
  typescript: { label: 'TypeScript', color: 'bg-blue-500', Icon: TypeScriptIcon },
  javascript: { label: 'JavaScript', color: 'bg-yellow-500', Icon: JavaScriptIcon },
  python: { label: 'Python', color: 'bg-green-500', Icon: PythonIcon },
};

interface CellProps {
  cell: any;
  theme: 'light' | 'dark';
  dragHandleProps?: any;
  lang: 'pt' | 'en';
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onExecute: (id: string) => void | Promise<void>;
  onSave?: () => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onToggleCollapse: (id: string) => void;
  onLanguageChange?: (id: string, language: CellLanguage) => void;
}

const cellTranslations = {
  pt: {
    confirmDelete: 'Tem certeza que deseja excluir esta célula?',
    console: 'Console Output',
    edit: 'Editar',
    view: 'Visualizar',
    placeholder: 'Clique para editar o Markdown...',
    error: 'Erro de Execução'
  },
  en: {
    confirmDelete: 'Are you sure you want to delete this cell?',
    console: 'Console Output',
    edit: 'Edit',
    view: 'View',
    placeholder: 'Click to edit Markdown...',
    error: 'Execution Error'
  }
};

const Cell: React.FC<CellProps> = ({ cell, theme, dragHandleProps, lang, onUpdate, onDelete, onExecute, onSave, onMove, onToggleCollapse, onLanguageChange }) => {
  const [isEditingMarkdown, setIsEditingMarkdown] = useState(cell.type === 'markdown' && !cell.content);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const t = cellTranslations[lang];
  const isDark = theme === 'dark';
  const currentLang = (cell.language || 'typescript') as CellLanguage;
  const CurrentLangIcon = languageConfig[currentLang].Icon;

  const handleDelete = () => {
    if (window.confirm(t.confirmDelete)) {
      onDelete(cell.id);
    }
  };

  const renderOutput = () => {
    if (!cell.output || cell.isCollapsed) return null;
    const { logs, error, result } = cell.output;

    if ((!logs || logs.length === 0) && !error && result === undefined) return null;

    return (
      <div className={`mt-4 p-4 rounded-lg border font-mono text-sm overflow-x-auto shadow-inner transition-colors duration-200 ${isDark ? 'bg-[#0d1117] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
        <div className={`flex items-center justify-between mb-2 pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <span className="text-[10px] font-bold tracking-widest uppercase opacity-50">{t.console}</span>
        </div>
        {logs && logs.map((log: string, i: number) => (
          <div key={i} className={`whitespace-pre-wrap py-0.5 border-l-2 pl-3 mb-1 ${isDark ? 'border-blue-500/30' : 'border-blue-500/50'}`}>{log}</div>
        ))}
        {result !== undefined && (
          <div className="text-blue-500 dark:text-blue-400 mt-1 flex gap-2 border-l-2 border-blue-500 pl-3">
            <span className="opacity-50 shrink-0">out:</span>
            <span className="whitespace-pre-wrap">{typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}</span>
          </div>
        )}
        {error && (
          <div className="text-red-500 mt-1 whitespace-pre-wrap border-l-2 border-red-500 pl-3 bg-red-500/10 p-2 rounded">
            <span className="font-bold uppercase text-[10px] block mb-1">{t.error}</span>
            {error}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`group relative rounded-xl shadow-sm border transition-all overflow-hidden flex ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      } ${cell.isCollapsed ? 'opacity-80' : 'min-h-[160px]'}`}>

      {/* Sidebar Handle */}
      <div className={`w-12 flex flex-col items-center py-3 border-r shrink-0 transition-colors ${isDark ? 'bg-[#0B0F19] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
        <div {...dragHandleProps} className={`p-2 cursor-grab active:cursor-grabbing mb-2 transition-colors ${isDark ? 'text-slate-600 hover:text-blue-500' : 'text-slate-300 hover:text-blue-500'
          }`}>
          <GripVertical size={18} />
        </div>

        {/* Play Button only for Code */}
        {!cell.isCollapsed && cell.type === 'code' && (
          <button
            onClick={() => onExecute(cell.id)}
            disabled={cell.isExecuting}
            className={`p-2 rounded-full mb-2 group-play relative
              transition-all duration-100 ease-in-out
              active:scale-75 active:bg-green-500/20  
              ${cell.isExecuting
                ? 'text-blue-500 bg-blue-100 dark:bg-blue-900/30 cursor-wait'
                : isDark
                  ? 'text-green-500 hover:bg-green-900/30 hover:text-green-400 cursor-pointer'
                  : 'text-green-600 hover:bg-green-50 cursor-pointer'
              }`}
            title="Executar Célula (Shift + Enter)"
          >
            {cell.isExecuting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Play size={18} fill="currentColor" className="ml-0.5" />
            )}
          </button>
        )}

        <button onClick={() => onMove(cell.id, 'up')} className={`p-1.5 rounded transition-colors cursor-pointer active:scale-90 ${isDark ? 'text-slate-500 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-200'}`}><ChevronUp size={16} /></button>
        <button onClick={() => onMove(cell.id, 'down')} className={`p-1.5 rounded mt-0.5 transition-colors cursor-pointer active:scale-90 ${isDark ? 'text-slate-500 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-200'}`}><ChevronDown size={16} /></button>

        <div className="flex-grow" />
        <button onClick={handleDelete} className={`p-2 rounded-full mb-1 opacity-0 group-hover:opacity-100 transition-all cursor-pointer active:scale-75 ${isDark ? 'text-red-400 hover:bg-red-900/30 hover:text-red-300' : 'text-red-500 hover:bg-red-50'
          }`}><Trash2 size={18} /></button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 min-w-0">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <button onClick={() => onToggleCollapse(cell.id)} className={`p-1 rounded transition-colors cursor-pointer active:scale-90 ${isDark ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
              {cell.isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            </button>
            {cell.type === 'code' ? (
              <div className="relative">
                {/* Dropdown Button */}
                <button
                  onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                  onBlur={(e) => {
                    // Only close if clicking outside the dropdown
                    if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) {
                      setIsLangDropdownOpen(false);
                    }
                  }}
                  className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 pr-5 rounded cursor-pointer transition-colors ${isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                >
                  <CurrentLangIcon />
                  <span>{languageConfig[currentLang].label}</span>
                </button>
                <ChevronDown size={12} className={`absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />

                {/* Dropdown Menu */}
                {isLangDropdownOpen && (
                  <div className={`absolute top-full left-0 mt-1 z-50 min-w-[140px] rounded-lg shadow-xl border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                    }`}>
                    {(Object.keys(languageConfig) as CellLanguage[]).map((langKey) => {
                      const config = languageConfig[langKey];
                      const isSelected = langKey === currentLang;
                      return (
                        <button
                          key={langKey}
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent blur from firing
                            onLanguageChange?.(cell.id, langKey);
                            setIsLangDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${isSelected
                            ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                            : isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                          <config.Icon />
                          <span>{config.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 select-none">{cell.type}</span>
            )}
          </div>
          {!cell.isCollapsed && cell.type === 'markdown' && (
            <button onClick={() => setIsEditingMarkdown(!isEditingMarkdown)} className={`text-xs font-medium flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors cursor-pointer active:scale-95 ${isDark ? 'bg-slate-800 text-slate-400 hover:text-slate-100' : 'bg-slate-100 text-slate-500 hover:text-slate-900'
              }`}>
              {isEditingMarkdown ? <><Eye size={12} /> {t.view}</> : <><Edit3 size={12} /> {t.edit}</>}
            </button>
          )}
        </div>

        {!cell.isCollapsed && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
            {cell.type === 'code' ? (
              <>
                <Editor value={cell.content} language={cell.language || 'typescript'} onChange={(val) => onUpdate(cell.id, val)} onExecute={() => onExecute(cell.id)} onSave={onSave} theme={theme} />
                {renderOutput()}
              </>
            ) : (
              <div className="min-h-[50px]">
                {isEditingMarkdown ? (
                  <Editor value={cell.content} language="markdown" onChange={(val) => onUpdate(cell.id, val)} onExecute={() => setIsEditingMarkdown(false)} onSave={onSave} theme={theme} />
                ) : (
                  // A MÁGICA DO MARKDOWN ACONTECE AQUI
                  <div
                    className={`prose prose-sm max-w-none p-3 rounded-lg transition-all border border-transparent
                      prose-p:leading-relaxed prose-pre:bg-transparent prose-pre:p-0
                      ${isDark
                        ? 'prose-invert hover:bg-white/5 hover:border-slate-800 prose-a:text-blue-400'
                        : 'prose-slate hover:bg-slate-50 hover:border-slate-200 prose-a:text-blue-600'
                      }`}
                    onClick={() => setIsEditingMarkdown(true)}
                  >
                    {cell.content ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ node, ...props }) => (
                            <a target="_blank" rel="noopener noreferrer" {...props} />
                          )
                        }}
                      >
                        {cell.content}
                      </ReactMarkdown>
                    ) : (
                      <span className="italic text-slate-500 opacity-50 select-none cursor-pointer">{t.placeholder}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Cell;