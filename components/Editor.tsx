'use client';

import React, { useState, useRef, Suspense, lazy, useEffect, useCallback } from 'react';

// Lazy load mantido
const MonacoEditor = lazy(() => import('@monaco-editor/react').then(mod => ({ default: mod.Editor }))) as any;

interface EditorProps {
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

export default function Editor({ value, onChange, onExecute, onSave, theme, language }: EditorProps) {
  const [isReady, setIsReady] = useState(false);
  const [editorHeight, setEditorHeight] = useState(60); // Altura inicial

  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const isMounted = useRef(false);

  // 1. Proteção contra Drag-and-Drop (Delay de estabilização)
  useEffect(() => {
    isMounted.current = true;
    const timer = setTimeout(() => {
      if (isMounted.current) setIsReady(true);
    }, 150); // Aguarda o componente "pousar" no DOM

    return () => {
      isMounted.current = false;
      clearTimeout(timer);
      // Cleanup seguro
      if (editorRef.current) {
        try {
          editorRef.current.dispose();
        } catch (e) { }
        editorRef.current = null;
      }
    };
  }, []);

  // 2. Função de redimensionamento (Restaurada e Blindada)
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

  const handleEditorMount = (editor: any, monaco: any) => {
    if (!isMounted.current) return;
    editorRef.current = editor;

    // Comandos
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Enter, onExecute);
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => onSave && onSave());

    // Listeners
    // Atualiza altura quando o conteúdo muda (digitação)
    const changeListener = editor.onDidContentSizeChange(updateLayout);

    // Observa redimensionamento do container pai (janela mudando)
    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(updateLayout);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Trigger inicial para ajustar a altura assim que montar
    window.requestAnimationFrame(updateLayout);

    return () => {
      changeListener.dispose();
      resizeObserver.disconnect();
    };
  };

  return (
    <div
      ref={containerRef}
      className="border rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e1e1e] overflow-hidden shadow-sm transition-colors"
      style={{ minHeight: '60px' }}
    >
      {!isReady ? (
        <EditorFallback />
      ) : (
        <Suspense fallback={<EditorFallback />}>
          <MonacoEditor
            height={`${editorHeight}px`} // Altura dinâmica voltou!
            language={language}
            value={value}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            onChange={(val: string) => onChange(val || '')}
            onMount={handleEditorMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
              automaticLayout: false, // MANTENHA FALSE (Isso evita o crash)
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
      )}
    </div>
  );
}