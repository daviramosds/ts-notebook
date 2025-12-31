'use client';

import React, { useState, useRef, Suspense, lazy, useEffect, useCallback } from 'react';
import { formatCode } from '@/lib/code-formatter';

// Lazy load mantido
const MonacoEditor = lazy(() => import('@monaco-editor/react').then(mod => ({ default: mod.Editor }))) as any;

interface EditorProps {
  cellId: string;
  cellIndex: number;
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

// Calculate initial height based on content lines
const calculateInitialHeight = (value: string): number => {
  const lineCount = (value || '').split('\n').length;
  const lineHeight = 19; // Approximate line height in pixels
  const padding = 24; // Top + bottom padding
  return Math.max(60, lineCount * lineHeight + padding);
};

export default function Editor({ cellId, cellIndex, value, onChange, onExecute, onSave, theme, language }: EditorProps) {
  // Start with a height based on content to avoid flicker
  const [editorHeight, setEditorHeight] = useState(() => calculateInitialHeight(value));
  const [isFormatting, setIsFormatting] = useState(false);

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  // Refs para callbacks para evitar stale closures
  const onExecuteRef = useRef(onExecute);
  const onSaveRef = useRef(onSave);
  const onChangeRef = useRef(onChange);
  const languageRef = useRef(language);
  const valueRef = useRef(value);

  useEffect(() => {
    onExecuteRef.current = onExecute;
    onSaveRef.current = onSave;
    onChangeRef.current = onChange;
    languageRef.current = language;
    valueRef.current = value;
  }, [onExecute, onSave, onChange, language, value]);

  // Format code handler
  const handleFormat = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor || isFormatting) return;

    setIsFormatting(true);
    try {
      const currentValue = editor.getValue();
      const formatted = await formatCode(currentValue, languageRef.current);
      if (formatted !== currentValue) {
        editor.setValue(formatted);
        onChangeRef.current(formatted);
      }
    } catch (error) {
      console.warn('Format failed:', error);
    } finally {
      setIsFormatting(false);
    }
  }, [isFormatting]);

  // Update height when content changes
  const updateHeight = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    try {
      const model = editor.getModel();
      if (!model || model.isDisposed()) return;

      const contentHeight = Math.max(60, editor.getContentHeight());
      setEditorHeight(prev => (Math.abs(prev - contentHeight) > 2 ? contentHeight : prev));
    } catch {
      // Ignore errors during unmount
    }
  }, []);

  const handleEditorMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Setup keyboard shortcuts
    try {
      // Shift+Enter: Execute cell
      editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
        onExecuteRef.current?.();
      });

      // Ctrl+S: Save notebook
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        onSaveRef.current?.();
      });

      // Ctrl+Shift+F: Format code
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
        const currentValue = editor.getValue();
        formatCode(currentValue, languageRef.current).then(formatted => {
          if (formatted !== currentValue) {
            editor.setValue(formatted);
            onChangeRef.current(formatted);
          }
        }).catch(console.warn);
      });

      // Ctrl+D: Duplicate line (using built-in action)
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
        editor.getAction('editor.action.copyLinesDownAction')?.run();
      });

      // Ctrl+/: Toggle comment (using built-in action)
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => {
        editor.getAction('editor.action.commentLine')?.run();
      });

      // Ctrl+Shift+K: Delete line (using built-in action)
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyK, () => {
        editor.getAction('editor.action.deleteLines')?.run();
      });

      // Alt+Up: Move line up (using built-in action)
      editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.UpArrow, () => {
        editor.getAction('editor.action.moveLinesUpAction')?.run();
      });

      // Alt+Down: Move line down (using built-in action)
      editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.DownArrow, () => {
        editor.getAction('editor.action.moveLinesDownAction')?.run();
      });

    } catch (e) {
      console.warn('Failed to add editor commands:', e);
    }

    // Listen for content size changes
    const disposable = editor.onDidContentSizeChange(() => {
      updateHeight();
    });

    // Initial height calculation after mount
    // Use multiple attempts to ensure content is rendered
    const attempts = [0, 50, 150, 300];
    attempts.forEach(delay => {
      setTimeout(() => {
        updateHeight();
      }, delay);
    });

    // Store disposable for cleanup
    (editor as any).__disposable = disposable;
  }, [updateHeight]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const editor = editorRef.current;
      if (editor?.__disposable) {
        try {
          editor.__disposable.dispose();
        } catch {
          // Ignore cleanup errors
        }
      }
      editorRef.current = null;
      monacoRef.current = null;
    };
  }, [cellId, cellIndex]);

  return (
    <div
      className="border rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e1e1e] overflow-hidden shadow-sm transition-colors"
      style={{ minHeight: '60px' }}
    >
      <Suspense fallback={<EditorFallback />}>
        <MonacoEditor
          key={`${cellId}-${cellIndex}`}
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
            automaticLayout: true, // Let Monaco handle layout automatically
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