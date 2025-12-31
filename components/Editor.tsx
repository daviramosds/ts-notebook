'use client';

import React, { useState, useRef, Suspense, lazy, useEffect, useCallback } from 'react';

// Lazy load mantido
const MonacoEditor = lazy(() => import('@monaco-editor/react').then(mod => ({ default: mod.Editor }))) as any;

interface EditorProps {
  cellId: string; // Unique ID for this editor instance
  value: string;
  onChange: (value: string) => void;
  onExecute: () => void;
  onSave?: () => void;
  theme: 'light' | 'dark';
  language: string;
}

const EditorFallback = () => (
  <div className="h-full min-h-[60px] flex items-center justify-center text-xs text-slate-400 animate-pulse">
    Carregando...
  </div>
);

export default function Editor({ cellId, value, onChange, onExecute, onSave, theme, language }: EditorProps) {
  const [editorHeight, setEditorHeight] = useState(60);
  const [isEditorReady, setIsEditorReady] = useState(false); // Track when editor is mounted

  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const isMounted = useRef(false);

  // Refs para callbacks para evitar stale closures e re-renders
  const onExecuteRef = useRef(onExecute);
  const onSaveRef = useRef(onSave);
  const languageRef = useRef(language);

  // Atualiza refs sempre que props mudam
  useEffect(() => {
    onExecuteRef.current = onExecute;
    onSaveRef.current = onSave;
    languageRef.current = language;
  }, [onExecute, onSave, language]);

  // Lifecycle management
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      editorRef.current = null;
      setIsEditorReady(false);
    };
  }, []);

  // Função de redimensionamento
  const updateLayout = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || !isMounted.current) return;

    try {
      // Verifica se o modelo ainda existe
      const model = editor.getModel();
      if (!model || model.isDisposed()) return;

      // 1. Força o layout para garantir que o Monaco leia o container
      editor.layout();

      // 2. Calcula a altura real do conteúdo
      const contentHeight = Math.max(60, editor.getContentHeight());

      // 3. Atualiza o estado apenas se mudou (evita loops)
      setEditorHeight(prev => (Math.abs(prev - contentHeight) > 2 ? contentHeight : prev));

    } catch (e) {
      // Silencia erros caso o componente esteja desmontando
    }
  }, []);

  // Setup effect when editor mounts - now triggers when isEditorReady becomes true
  useEffect(() => {
    if (!isEditorReady || !editorRef.current || !monacoRef.current) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;

    // A. Setup Commands
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
      if (onExecuteRef.current) onExecuteRef.current();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSaveRef.current) onSaveRef.current();
    });

    // B. Setup Listeners
    const changeListener = editor.onDidContentSizeChange(updateLayout);

    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(updateLayout);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Trigger inicial - force layout after a small delay to ensure container is ready
    requestAnimationFrame(() => {
      updateLayout();
    });

    // Cleanup
    return () => {
      changeListener.dispose();
      resizeObserver.disconnect();
    };

  }, [isEditorReady, updateLayout]); // Now re-runs when isEditorReady becomes true

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    // Trigger the setup effect by updating state
    setIsEditorReady(true);
  };

  return (
    <div
      ref={containerRef}
      className="border rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e1e1e] overflow-hidden shadow-sm transition-colors"
      style={{ minHeight: '60px' }}
    >
      <Suspense fallback={<EditorFallback />}>
        <MonacoEditor
          key={cellId} // Unique key prevents editor reuse across cells
          height={`${editorHeight}px`}
          language={language}
          value={value}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          onChange={(val: string) => onChange(val || '')}
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
            automaticLayout: false,
            padding: { top: 12, bottom: 12 },
            lineNumbers: 'on',
            wordWrap: 'on',
            scrollbar: {
              vertical: 'hidden',
              horizontal: 'auto',
              handleMouseWheel: false,
            },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            fixedOverflowWidgets: true,
            contextmenu: false,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          }}
        />
      </Suspense>
    </div>
  );
}