'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, ArrowLeft, Save, Moon, Sun, Cloud, CheckCircle2, AlertCircle, Loader2, Download, Upload } from 'lucide-react';
import { useTheme } from 'next-themes';
import Cell from '@/components/Cell';
import { getNotebook, saveNotebook } from '@/app/_actions/notebook';
import { compileTS, executeJS } from '@/lib/compiler';

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const handleExecute = async (cellId: string) => {
    const cellIndex = cells.findIndex(c => c.id === cellId);
    if (cellIndex === -1) return;

    const newCells = [...cells];
    newCells[cellIndex].isExecuting = true;
    newCells[cellIndex].output = null;
    setCells([...newCells]);

    let previousCode = '';
    for (let i = 0; i < cellIndex; i++) {
      if (cells[i].type === 'code') {
        try {
          previousCode += compileTS(cells[i].content) + ';\n';
        } catch (e) { }
      }
    }

    try {
      const cell = newCells[cellIndex];
      const jsCode = compileTS(cell.content);
      const output = await executeJS(jsCode, previousCode);
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

  const addCell = (type: 'code' | 'markdown') => {
    const newCell = { id: crypto.randomUUID(), type, content: '', isCollapsed: false, output: null };
    setCells([...cells, newCell]);
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
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm group cursor-pointer"
              title="Voltar ao Dashboard"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                NOTEBOOK
              </span>
              <input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="bg-transparent font-bold text-lg outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 min-w-[200px] focus:underline decoration-blue-500/30 underline-offset-4 decoration-2"
                placeholder="Nome do Notebook"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs font-medium mr-2 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
              {isSaving ? (
                <div className="flex items-center gap-2 text-blue-500">
                  <Cloud size={14} className="animate-pulse" />
                  <span>Salvando...</span>
                </div>
              ) : hasUnsavedChanges ? (
                <div className="flex items-center gap-2 text-amber-500 animate-in fade-in">
                  <AlertCircle size={14} />
                  <span>Não salvo</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-400">
                  <CheckCircle2 size={14} className="text-green-500" />
                  <span className="opacity-70">
                    {lastSaved ? `Salvo às ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Salvo'}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving || (!hasUnsavedChanges && !isSaving)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all shadow-sm ${hasUnsavedChanges
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 hover:scale-105 cursor-pointer'
                : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed opacity-70 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
            >
              <Save size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">SALVAR</span>
            </button>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
            <button
              onClick={handleExport}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-green-500 hover:border-green-300 dark:hover:border-green-800 transition-all shadow-sm cursor-pointer"
              title="Exportar Notebook"
            >
              <Download size={18} />
            </button>
            <button
              onClick={handleImport}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-purple-500 hover:border-purple-300 dark:hover:border-purple-800 transition-all shadow-sm cursor-pointer"
              title="Importar Notebook"
            >
              <Upload size={18} />
            </button>
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-yellow-500 dark:hover:text-yellow-400 transition-all shadow-sm cursor-pointer"
              aria-label="Toggle Theme"
            >
              {mounted && (resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />)}
            </button>
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
    </div>
  );
}