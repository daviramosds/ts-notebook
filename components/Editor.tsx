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

    // Register Python autocomplete provider
    if (language === 'python') {
      monaco.languages.registerCompletionItemProvider('python', {
        provideCompletionItems: (model: any, position: any) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          const pythonKeywords = [
            'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue',
            'def', 'del', 'elif', 'else', 'except', 'False', 'finally', 'for',
            'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'None',
            'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'True', 'try',
            'while', 'with', 'yield'
          ];

          const pythonBuiltins = [
            'abs', 'all', 'any', 'bin', 'bool', 'bytearray', 'bytes', 'callable',
            'chr', 'classmethod', 'compile', 'complex', 'delattr', 'dict', 'dir',
            'divmod', 'enumerate', 'eval', 'exec', 'filter', 'float', 'format',
            'frozenset', 'getattr', 'globals', 'hasattr', 'hash', 'help', 'hex',
            'id', 'input', 'int', 'isinstance', 'issubclass', 'iter', 'len',
            'list', 'locals', 'map', 'max', 'memoryview', 'min', 'next', 'object',
            'oct', 'open', 'ord', 'pow', 'print', 'property', 'range', 'repr',
            'reversed', 'round', 'set', 'setattr', 'slice', 'sorted', 'staticmethod',
            'str', 'sum', 'super', 'tuple', 'type', 'vars', 'zip'
          ];

          const pythonModules = [
            'math', 'random', 'json', 'os', 'sys', 're', 'datetime', 'collections',
            'itertools', 'functools', 'operator', 'string', 'textwrap', 'struct',
            'copy', 'pprint', 'reprlib', 'enum', 'graphlib', 'numbers', 'cmath',
            'decimal', 'fractions', 'statistics', 'array', 'bisect', 'heapq'
          ];

          const suggestions = [
            ...pythonKeywords.map(kw => ({
              label: kw,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: kw,
              range,
            })),
            ...pythonBuiltins.map(fn => ({
              label: fn,
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: fn + '($0)',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range,
              detail: 'Built-in function',
            })),
            ...pythonModules.map(mod => ({
              label: mod,
              kind: monaco.languages.CompletionItemKind.Module,
              insertText: mod,
              range,
              detail: 'Module',
            })),
            // Common snippets
            {
              label: 'def',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'def ${1:function_name}(${2:args}):\n\t${3:pass}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range,
              detail: 'Function definition',
            },
            {
              label: 'class',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'class ${1:ClassName}:\n\tdef __init__(self${2:, args}):\n\t\t${3:pass}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range,
              detail: 'Class definition',
            },
            {
              label: 'for',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'for ${1:item} in ${2:iterable}:\n\t${3:pass}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range,
              detail: 'For loop',
            },
            {
              label: 'if',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'if ${1:condition}:\n\t${2:pass}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range,
              detail: 'If statement',
            },
            {
              label: 'try',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'try:\n\t${1:pass}\nexcept ${2:Exception} as ${3:e}:\n\t${4:pass}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range,
              detail: 'Try/Except block',
            },
            {
              label: 'with',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'with ${1:expression} as ${2:var}:\n\t${3:pass}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range,
              detail: 'With statement',
            },
          ];

          return { suggestions };
        },
      });
    }

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