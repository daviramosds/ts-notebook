'use client'; // <--- Obrigatório para componentes interativos

import dynamic from 'next/dynamic';

// Importação dinâmica com SSR desativado
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.Editor),
  { ssr: false } // <--- O segredo está aqui
);

import { EditorProps } from '@monaco-editor/react';

export default function CodeEditor(props: EditorProps) {
  return <MonacoEditor {...props} />;
}