'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Editor from './Editor';
import {
  Play, Trash2, ChevronUp, ChevronDown, Edit3, Eye,
  ChevronRight, GripVertical, Loader2
} from 'lucide-react';

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

const Cell: React.FC<CellProps> = ({ cell, theme, dragHandleProps, lang, onUpdate, onDelete, onExecute, onSave, onMove, onToggleCollapse }) => {
  const [isEditingMarkdown, setIsEditingMarkdown] = useState(cell.type === 'markdown' && !cell.content);
  const t = cellTranslations[lang];

  const isDark = theme === 'dark';

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
      <div className={`mt-4 p-4 rounded-lg border font-mono text-sm overflow-x-auto shadow-inner transition-colors duration-200 ${isDark ? 'bg-[#0f172a] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
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

      {/* Barra Lateral (Sidebar) */}
      <div className={`w-12 flex flex-col items-center py-3 border-r shrink-0 transition-colors ${isDark ? 'bg-[#020617] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>

        <div {...dragHandleProps} className={`p-2 cursor-grab active:cursor-grabbing mb-2 transition-colors ${isDark ? 'text-slate-600 hover:text-blue-500' : 'text-slate-300 hover:text-blue-500'
          }`}>
          <GripVertical size={18} />
        </div>

        {/* BOTÃO PLAY: Estilo "Clean" igual da Lixeira (Verde) */}
        {!cell.isCollapsed && cell.type === 'code' && (
          <button
            onClick={() => onExecute(cell.id)}
            disabled={cell.isExecuting}
            className={`p-2 rounded-full mb-2 group-play relative
              transition-all duration-100 ease-in-out
              active:scale-75 active:bg-green-500/20  /* Clique agressivo */
              ${cell.isExecuting
                ? 'text-blue-500 bg-blue-100 dark:bg-blue-900/30 cursor-wait'
                : isDark
                  ? 'text-green-500 hover:bg-green-900/30 hover:text-green-400 cursor-pointer' /* Estilo Lixeira Dark (Verde) */
                  : 'text-green-600 hover:bg-green-50 cursor-pointer' /* Estilo Lixeira Light (Verde) */
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

      {/* Conteúdo Principal */}
      <div className="flex-1 p-4 min-w-0">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <button onClick={() => onToggleCollapse(cell.id)} className={`p-1 rounded transition-colors cursor-pointer active:scale-90 ${isDark ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
              {cell.isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            </button>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 select-none">{cell.type}</span>
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
                <Editor value={cell.content} language="typescript" onChange={(val) => onUpdate(cell.id, val)} onExecute={() => onExecute(cell.id)} onSave={onSave} theme={theme} />
                {renderOutput()}
              </>
            ) : (
              <div className="min-h-[50px]">
                {isEditingMarkdown ? (
                  <Editor value={cell.content} language="markdown" onChange={(val) => onUpdate(cell.id, val)} onExecute={() => setIsEditingMarkdown(false)} onSave={onSave} theme={theme} />
                ) : (
                  <div className={`prose max-w-none cursor-pointer p-3 rounded-lg transition-all border border-transparent ${isDark ? 'prose-invert hover:bg-white/5 hover:border-slate-800' : 'prose-slate hover:bg-slate-50 hover:border-slate-200'
                    }`} onClick={() => setIsEditingMarkdown(true)}>
                    {cell.content ? <ReactMarkdown>{cell.content}</ReactMarkdown> : <span className="italic text-slate-500 opacity-50 select-none">{t.placeholder}</span>}
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