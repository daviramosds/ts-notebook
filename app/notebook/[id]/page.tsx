'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, ArrowLeft, Save, Cloud, CheckCircle2, AlertCircle, Loader2, Download, Upload, Play, Trash2, Keyboard, X, FolderDown, MoreHorizontal } from 'lucide-react';
import { useTheme } from 'next-themes';
import Cell from '@/components/Cell';
import { getNotebook, saveNotebook } from '@/app/_actions/notebook';
import { compileTS, executeCode, CellLanguage } from '@/lib/compiler';

export default function NotebookPage() {
  const params = useParams();
  const router = useRouter();
  const notebookId = params.id as string;
  const { resolvedTheme, setTheme } = useTheme();

  const [cells, setCells] = useState<any[]>([]);
  const [title, setTitle] = useState('Carregando...');
  const [user, setUser] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [lang] = useState<'pt' | 'en'>('pt');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkSessionAndLoad();
  }, [notebookId]);

  const checkSessionAndLoad = async () => {
    try {
      // 1. Verifica autenticação via API
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/');
        return;
      }
      const data = await res.json();
      setUser(data.user);

      // 2. Carrega o notebook
      await loadNotebook(notebookId);
    } catch (err) {
      console.error("Erro de sessão:", err);
      router.push('/');
    } finally {
      setLoadingSession(false);
    }
  };

  const loadNotebook = async (id: string) => {
    try {
      const data = await getNotebook(id);
      if (data) {
        setTitle(data.name);
        const content = data.content as any;
        setCells(content.cells || []);
        setLastSaved(new Date(data.updated_at));
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error("Erro ao carregar notebook:", err);
    }
  };

  const handleSave = useCallback(async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await saveNotebook({
        id: notebookId,
        name: title,
        cells: cells,
        theme: resolvedTheme || 'light'
      });
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar notebook');
    } finally {
      setIsSaving(false);
    }
  }, [user, notebookId, title, cells, resolvedTheme]);

  // Keyboard shortcuts (Ctrl+S to save, Shift+? for shortcuts modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.shiftKey && e.key === '?') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Auto-save every 30 seconds when there are unsaved changes
  useEffect(() => {
    if (hasUnsavedChanges && user) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        handleSave();
      }, 30000);
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [hasUnsavedChanges, user, handleSave]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleExecute = async (cellId: string) => {
    const cellIndex = cells.findIndex(c => c.id === cellId);
    if (cellIndex === -1) return;

    const newCells = [...cells];
    newCells[cellIndex].isExecuting = true;
    newCells[cellIndex].output = null;
    setCells([...newCells]);

    const cell = newCells[cellIndex];
    const cellLanguage: CellLanguage = cell.language || 'typescript';

    // Build previous context for TS/JS (Python doesn't share context)
    let previousCode = '';
    if (cellLanguage !== 'python') {
      for (let i = 0; i < cellIndex; i++) {
        const prevCell = cells[i];
        if (prevCell.type === 'code' && (prevCell.language || 'typescript') !== 'python') {
          try {
            const lang = prevCell.language || 'typescript';
            if (lang === 'typescript') {
              previousCode += compileTS(prevCell.content) + ';\n';
            } else {
              previousCode += prevCell.content + ';\n';
            }
          } catch (e) { }
        }
      }
    }

    try {
      const output = await executeCode(cell.content, cellLanguage, previousCode);
      newCells[cellIndex].output = output;
    } catch (err: any) {
      newCells[cellIndex].output = { error: err.message, logs: [] };
    } finally {
      newCells[cellIndex].isExecuting = false;
      setCells([...newCells]);
    }
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setHasUnsavedChanges(true);
  };

  const handleRunAll = async () => {
    setIsRunningAll(true);
    const codeCells = cells.filter(c => c.type === 'code');
    for (const cell of codeCells) {
      await handleExecute(cell.id);
    }
    setIsRunningAll(false);
  };

  const handleClearOutputs = () => {
    setCells(cells.map(c => ({ ...c, output: null })));
    setHasUnsavedChanges(true);
  };

  const addCell = (type: 'code' | 'markdown') => {
    const newCell = {
      id: crypto.randomUUID(),
      type,
      content: '',
      isCollapsed: false,
      output: null,
      language: type === 'code' ? 'typescript' as CellLanguage : undefined
    };
    setCells([...cells, newCell]);
    setHasUnsavedChanges(true);
  };

  const handleLanguageChange = (id: string, language: CellLanguage) => {
    setCells(cells.map(c => c.id === id ? { ...c, language, output: null } : c));
    setHasUnsavedChanges(true);
  };

  const updateCell = (id: string, content: string) => {
    setCells(cells.map(c => c.id === id ? { ...c, content } : c));
    setHasUnsavedChanges(true);
  };

  const deleteCell = (id: string) => {
    setCells(cells.filter(c => c.id !== id));
    setHasUnsavedChanges(true);
  };

  const handleMoveCell = (id: string, direction: 'up' | 'down') => {
    const index = cells.findIndex(c => c.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === cells.length - 1) return;

    const newCells = [...cells];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newCells[index], newCells[targetIndex]] = [newCells[targetIndex], newCells[index]];
    setCells(newCells);
    setHasUnsavedChanges(true);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(cells);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setCells(items);
    setHasUnsavedChanges(true);
  };

  // Export notebook as JSON file
  const handleExport = () => {
    const notebookData = {
      version: 1,
      name: title,
      cells: cells,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(notebookData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'notebook'}.tslab.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import notebook from JSON file
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.tslab.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.cells && Array.isArray(data.cells)) {
          setCells(data.cells);
          if (data.name) setTitle(data.name);
          setHasUnsavedChanges(true);
        } else {
          alert('Arquivo inválido. Certifique-se de que é um notebook TSLab válido.');
        }
      } catch (err) {
        alert('Erro ao ler arquivo. Verifique se é um JSON válido.');
      }
    };
    input.click();
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Notebook
              </span>
              <input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="bg-transparent font-medium text-sm outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 min-w-[180px]"
                placeholder="Notebook name"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Status indicator - minimal, just text and icon */}
            <div className="hidden md:flex items-center gap-1.5 text-xs mr-2">
              {isSaving ? (
                <div className="flex items-center gap-1.5 text-blue-500">
                  <Cloud size={14} className="animate-pulse" />
                  <span>Saving...</span>
                </div>
              ) : hasUnsavedChanges ? (
                <div className="flex items-center gap-1.5 text-amber-500">
                  <AlertCircle size={14} />
                  <span>Unsaved</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <CheckCircle2 size={14} className="text-blue-500" />
                  <span>
                    {lastSaved ? `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Saved'}
                  </span>
                </div>
              )}
            </div>
            {/* Save button - icon only */}
            <button
              onClick={handleSave}
              disabled={isSaving || (!hasUnsavedChanges && !isSaving)}
              className={`p-2 rounded-md transition-colors ${hasUnsavedChanges
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              title="Save (Ctrl+S)"
            >
              <Save size={16} />
            </button>
            <button
              onClick={handleRunAll}
              disabled={isRunningAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Run All"
            >
              <Play size={12} />
              <span className="hidden sm:inline">{isRunningAll ? '...' : 'Run All'}</span>
            </button>
            <button
              onClick={handleClearOutputs}
              className="p-2 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-red-500 transition-colors cursor-pointer"
              title="Clear Outputs"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={() => setShowShortcuts(true)}
              className="p-2 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Keyboard Shortcuts"
            >
              <Keyboard size={16} />
            </button>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            {/* Unified File Menu (Import/Export) */}
            <div className="relative">
              <button
                onClick={() => setShowFileMenu(!showFileMenu)}
                className="p-2 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="File Options"
              >
                <FolderDown size={16} />
              </button>
              {showFileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowFileMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 py-1">
                    <button
                      onClick={() => {
                        handleExport();
                        setShowFileMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      <Download size={14} />
                      <span>Export Notebook</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowImportModal(true);
                        setShowFileMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      <Upload size={14} />
                      <span>Import Notebook</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 space-y-4 mt-8">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="cells">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
                {cells.map((cell, index) => (
                  <Draggable key={cell.id} draggableId={cell.id} index={index}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} className="mb-6">
                        <Cell
                          cell={cell}
                          theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
                          lang="pt"
                          dragHandleProps={provided.dragHandleProps}
                          onUpdate={updateCell}
                          onDelete={deleteCell}
                          onExecute={handleExecute}
                          onSave={handleSave}
                          onMove={handleMoveCell}
                          onToggleCollapse={(id) => setCells(cells.map(c => c.id === id ? { ...c, isCollapsed: !c.isCollapsed } : c))}
                          onLanguageChange={handleLanguageChange}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <div className="flex justify-center gap-4 py-16 opacity-60 hover:opacity-100 transition-opacity">
          <button onClick={() => addCell('code')} className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold hover:border-blue-500 hover:text-blue-500 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer">
            <Plus size={16} /> Adicionar Código
          </button>
          <button onClick={() => addCell('markdown')} className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold hover:border-blue-500 hover:text-blue-500 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer">
            <Plus size={16} /> Adicionar Texto
          </button>
        </div>
      </main>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setShowShortcuts(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Keyboard size={20} className="text-blue-500" />
                {lang === 'pt' ? 'Atalhos de Teclado' : 'Keyboard Shortcuts'}
              </h3>
              <button onClick={() => setShowShortcuts(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { keys: 'Ctrl + S', desc: lang === 'pt' ? 'Salvar notebook' : 'Save notebook' },
                { keys: 'Shift + Enter', desc: lang === 'pt' ? 'Executar célula' : 'Execute cell' },
                { keys: 'Shift + ?', desc: lang === 'pt' ? 'Mostrar atalhos' : 'Show shortcuts' },
              ].map((shortcut, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{shortcut.desc}</span>
                  <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Import Modal with Drag & Drop */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setShowImportModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload size={20} className="text-blue-500" />
                {lang === 'pt' ? 'Importar Notebook' : 'Import Notebook'}
              </h3>
              <button onClick={() => setShowImportModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${isDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                  : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600'
                }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={async (e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) {
                  try {
                    const text = await file.text();
                    const data = JSON.parse(text);
                    if (data.cells && Array.isArray(data.cells)) {
                      setCells(data.cells);
                      if (data.name) setTitle(data.name);
                      setHasUnsavedChanges(true);
                      setShowImportModal(false);
                    } else {
                      alert(lang === 'pt' ? 'Arquivo inválido. Certifique-se de que é um notebook TSLab válido.' : 'Invalid file. Make sure it is a valid TSLab notebook.');
                    }
                  } catch (err) {
                    alert(lang === 'pt' ? 'Erro ao ler arquivo. Verifique se é um JSON válido.' : 'Error reading file. Check if it is a valid JSON.');
                  }
                }
              }}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json,.tslab.json';
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;
                  try {
                    const text = await file.text();
                    const data = JSON.parse(text);
                    if (data.cells && Array.isArray(data.cells)) {
                      setCells(data.cells);
                      if (data.name) setTitle(data.name);
                      setHasUnsavedChanges(true);
                      setShowImportModal(false);
                    } else {
                      alert(lang === 'pt' ? 'Arquivo inválido. Certifique-se de que é um notebook TSLab válido.' : 'Invalid file. Make sure it is a valid TSLab notebook.');
                    }
                  } catch (err) {
                    alert(lang === 'pt' ? 'Erro ao ler arquivo. Verifique se é um JSON válido.' : 'Error reading file. Check if it is a valid JSON.');
                  }
                };
                input.click();
              }}
            >
              <Upload size={40} className={`mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                {lang === 'pt' ? 'Arraste e solte o arquivo aqui' : 'Drag and drop file here'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {lang === 'pt' ? 'ou clique para selecionar' : 'or click to select'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
                .json, .tslab.json
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}