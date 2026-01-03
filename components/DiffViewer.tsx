'use client';

import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface DiffViewerProps {
  original: string;
  modified: string;
  language: string;
  theme: 'light' | 'dark';
}

const DiffViewer: React.FC<DiffViewerProps> = ({ original, modified, language, theme }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    let mounted = true;
    let editor: any = null;

    const initDiffEditor = async () => {
      try {
        // Wait for Monaco to be available from @monaco-editor/react
        const { loader } = await import('@monaco-editor/react');
        const monaco = await loader.init();

        if (!mounted || !containerRef.current) return;

        // Create diff editor
        editor = monaco.editor.createDiffEditor(containerRef.current, {
          automaticLayout: true,
          readOnly: true,
          renderSideBySide: true,
          minimap: { enabled: false },
          fontSize: 13,
          scrollBeyondLastLine: false,
          theme: theme === 'dark' ? 'vs-dark' : 'vs',
          lineNumbers: 'on',
          wordWrap: 'on',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        });

        // Set models
        const originalModel = monaco.editor.createModel(original, language);
        const modifiedModel = monaco.editor.createModel(modified, language);

        editor.setModel({
          original: originalModel,
          modified: modifiedModel,
        });

        editorRef.current = editor;
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize diff editor:', error);
        setIsLoading(false);
      }
    };

    initDiffEditor();

    return () => {
      mounted = false;
      if (editor) {
        editor.dispose();
      }
    };
  }, [original, modified, language, theme]);

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      )}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};

export default DiffViewer;
