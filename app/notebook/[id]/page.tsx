'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Plus, ArrowLeft, Save, Moon, Sun, Cloud,
  CheckCircle2, ChevronRight, AlertCircle
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Cell from '@/components/Cell';
import { notebookService, getDbConfig } from '@/lib/database-manager';
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

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem('tslab_user');
    if (!savedUser) {
      router.push('/');
      return;
    }
    const userData = JSON.parse(savedUser);
    setUser(userData);
    loadNotebook(userData, notebookId);
  }, [notebookId]);

  const loadNotebook = async (userData: any, id: string) => {
    try {
      const config = getDbConfig();
      const data = await notebookService.get(config, userData.token, id);
      if (data) {
        setTitle(data.name);
        const content = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
        setCells(content.cells || []);
        setLastSaved(new Date(data.updated_at));
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error("Erro ao carregar", err);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const config = getDbConfig();
      await notebookService.upsert(config, user.token, {
        id: notebookId,
        name: title,
        cells: cells,
        theme: resolvedTheme
      });
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (err) {
      alert('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

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
    const newCell = {
      id: crypto.randomUUID(),
      type,
      content: '',
      isCollapsed: false,
      output: null
    };
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

  // --- NOVA LÓGICA DE MOVER (Setinhas) ---
  const handleMoveCell = (id: string, direction: 'up' | 'down') => {
    const index = cells.findIndex(c => c.id === id);
    if (index === -1) return;

    // Proteção para não mover para fora dos limites
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === cells.length - 1) return;

    const newCells = [...cells];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    // Troca de posição
    [newCells[index], newCells[targetIndex]] = [newCells[targetIndex], newCells[index]];

    setCells(newCells);
    setHasUnsavedChanges(true);
  };

  // --- LÓGICA DE DRAG AND DROP ---
  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    // Cria uma cópia rasa do array para não mutar o estado diretamente
    const items = Array.from(cells);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setCells(items);
    setHasUnsavedChanges(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] pb-20 transition-colors duration-300">

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 transition-colors">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">

          {/* Navegação e Título */}
          <div className="flex items-center gap-2 mr-4">
            <button
              onClick={() => router.push('/')}
              // ADICIONADO: cursor-pointer explícito
              className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

            <div className="flex flex-col justify-center">
              <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                <span>Dashboard</span>
                <ChevronRight size={10} className="mx-1" />
                <span>Notebook</span>
              </div>
              <input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="bg-transparent font-bold text-sm md:text-base outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 min-w-[200px]"
                placeholder="Nome do Notebook"
              />
            </div>
          </div>

          {/* Ações e Status */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs font-medium mr-2 transition-all">
              {isSaving ? (
                <div className="flex items-center gap-2 text-blue-500">
                  <Cloud size={14} className="animate-pulse" />
                  <span>Salvando...</span>
                </div>
              ) : hasUnsavedChanges ? (
                <div className="flex items-center gap-2 text-amber-500 animate-in fade-in">
                  <AlertCircle size={14} />
                  <span>Alterações pendentes</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-400">
                  <CheckCircle2 size={14} className="text-green-500" />
                  <span className="opacity-70">Salvo {lastSaved && `às ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
            >
              {mounted && (resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />)}
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving || (!hasUnsavedChanges && !isSaving)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg ${hasUnsavedChanges
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:scale-105 cursor-pointer'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default opacity-70'
                }`}
            >
              <Save size={16} />
              <span className="hidden sm:inline">SALVAR</span>
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
                          // AGORA ESTÁ PASSANDO A FUNÇÃO DE MOVER:
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

        <div className="flex justify-center gap-4 py-12 opacity-60 hover:opacity-100 transition-opacity">
          <button onClick={() => addCell('code')} className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-bold hover:border-blue-500 hover:text-blue-500 hover:shadow-lg transition-all cursor-pointer">
            <Plus size={14} /> Adicionar Código
          </button>
          <button onClick={() => addCell('markdown')} className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-bold hover:border-blue-500 hover:text-blue-500 hover:shadow-lg transition-all cursor-pointer">
            <Plus size={14} /> Adicionar Texto
          </button>
        </div>
      </main>
    </div>
  );
}