'use client';

import React, { useState } from 'react';
import { X, Clock, RotateCcw, Trash2, Edit3, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { CellHistoryEntry } from '@/lib/cell-history';
import DiffViewer from './DiffViewer';

interface CellHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: CellHistoryEntry[];
  currentIndex: number;
  currentContent: string;
  language: string;
  theme: 'light' | 'dark';
  onRestore: (entryId: string) => void;
  onDelete: (entryId: string) => void;
  onUpdateLabel: (entryId: string, label: string) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
}

const CellHistoryModal: React.FC<CellHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  currentIndex,
  currentContent,
  language,
  theme,
  onRestore,
  onDelete,
  onUpdateLabel,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
}) => {
  const [selectedEntry, setSelectedEntry] = useState<CellHistoryEntry | null>(
    history[currentIndex] || null
  );
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState('');

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Agora mesmo';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days === 1) return 'Ontem';
    return `${days}d atrás`;
  };

  const handleStartEdit = (entry: CellHistoryEntry) => {
    setEditingLabelId(entry.id);
    setLabelInput(entry.label || '');
  };

  const handleSaveLabel = (entryId: string) => {
    if (labelInput.trim()) {
      onUpdateLabel(entryId, labelInput.trim());
    }
    setEditingLabelId(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl flex flex-col ${isDark ? 'bg-slate-900' : 'bg-white'
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
          <div className="flex items-center gap-3">
            <Clock className="text-blue-500" size={24} />
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'
                }`}>
                Histórico da Célula
              </h2>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                {history.length} {history.length === 1 ? 'versão' : 'versões'}
              </p>
            </div>
          </div>

          {/* Navigation controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onGoBack}
              disabled={!canGoBack}
              className={`p-2 rounded-lg transition-colors ${canGoBack
                  ? isDark
                    ? 'hover:bg-slate-800 text-slate-300'
                    : 'hover:bg-slate-100 text-slate-600'
                  : 'opacity-30 cursor-not-allowed text-slate-400'
                }`}
              title="Versão anterior (Ctrl+Alt+Z)"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              onClick={onGoForward}
              disabled={!canGoForward}
              className={`p-2 rounded-lg transition-colors ${canGoForward
                  ? isDark
                    ? 'hover:bg-slate-800 text-slate-300'
                    : 'hover:bg-slate-100 text-slate-600'
                  : 'opacity-30 cursor-not-allowed text-slate-400'
                }`}
              title="Próxima versão (Ctrl+Alt+Shift+Z)"
            >
              <ChevronRight size={20} />
            </button>

            <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-2" />

            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${isDark
                  ? 'hover:bg-slate-800 text-slate-400'
                  : 'hover:bg-slate-100 text-slate-500'
                }`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Timeline Sidebar */}
          <div className={`w-80 border-r overflow-y-auto ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'
            }`}>
            <div className="p-4 space-y-2">
              {history.map((entry, index) => {
                const isSelected = selectedEntry?.id === entry.id;
                const isCurrent = index === currentIndex;

                return (
                  <div
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className={`relative p-3 rounded-lg cursor-pointer transition-all group ${isSelected
                        ? isDark
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-500 text-white'
                        : isDark
                          ? 'hover:bg-slate-800 text-slate-300'
                          : 'hover:bg-white text-slate-700'
                      }`}
                  >
                    {/* Current indicator */}
                    {isCurrent && (
                      <div className={`absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r ${isSelected ? 'bg-white' : 'bg-blue-500'
                        }`} />
                    )}

                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        {editingLabelId === entry.id ? (
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={labelInput}
                              onChange={(e) => setLabelInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveLabel(entry.id);
                                if (e.key === 'Escape') setEditingLabelId(null);
                              }}
                              className={`flex-1 px-2 py-1 text-xs rounded ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
                                } border border-blue-500`}
                              autoFocus
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveLabel(entry.id);
                              }}
                              className="p-1 hover:bg-blue-700 rounded"
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium truncate ${isSelected ? 'text-white' : ''
                              }`}>
                              {entry.label || 'Sem título'}
                            </span>
                            {!entry.isAutomatic && (
                              <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                }`}>
                                MANUAL
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(entry);
                          }}
                          className={`p-1 rounded hover:bg-white/10 ${isSelected ? 'text-white' : 'text-slate-400'
                            }`}
                          title="Editar label"
                        >
                          <Edit3 size={12} />
                        </button>
                        {history.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(entry.id);
                            }}
                            className={`p-1 rounded hover:bg-red-500/20 ${isSelected ? 'text-white' : 'text-red-500'
                              }`}
                            title="Deletar versão"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className={`text-xs ${isSelected ? 'text-white/70' : 'text-slate-400'
                      }`}>
                      {formatTime(entry.timestamp)}
                    </div>

                    <div className={`text-xs mt-1 ${isSelected ? 'text-white/50' : 'text-slate-500'
                      }`}>
                      {new Date(entry.timestamp).toLocaleString('pt-BR')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Diff Viewer */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedEntry ? (
              <>
                <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'
                  }`}>
                  <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                    Comparando: <span className="font-medium text-blue-500">
                      {selectedEntry.label || 'Versão selecionada'}
                    </span> → <span className="font-medium text-green-500">Atual</span>
                  </div>

                  {selectedEntry.id !== history[currentIndex]?.id && (
                    <button
                      onClick={() => onRestore(selectedEntry.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <RotateCcw size={16} />
                      Restaurar esta versão
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-hidden">
                  <DiffViewer
                    original={selectedEntry.content}
                    modified={currentContent}
                    language={language}
                    theme={theme}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                  Selecione uma versão para ver as diferenças
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CellHistoryModal;
