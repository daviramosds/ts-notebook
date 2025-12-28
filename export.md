# Compilação de arquivos de `.`


**Gerado em:** 28/12/2025 às 20:28:15  


**ISO:** `2025-12-28T20:28:15.109682`


> Export automático.


# Estrutura do Projeto


```

├── .env.local

├── .gitignore

├── README.md

├── app

│   ├── favicon.ico

│   ├── globals.css

│   ├── layout.tsx

│   ├── notebook

│   │   └── [id]

│   │       └── page.tsx

│   └── page.tsx

├── components

│   ├── AiSidebar.tsx

│   ├── Auth.tsx

│   ├── Cell.tsx

│   ├── CodeEditor.tsx

│   └── Editor.tsx

├── eslint.config.mjs

├── lib

│   ├── compiler.ts

│   ├── database-manager.ts

│   ├── env.ts

│   └── prisma-browser.ts

├── next-env.d.ts

├── next.config.ts

├── package.json

├── pnpm-lock.yaml

├── pnpm-workspace.yaml

├── postcss.config.mjs

├── providers.tsx

├── public

│   ├── file.svg

│   ├── globe.svg

│   ├── next.svg

│   ├── vercel.svg

│   └── window.svg

├── tsconfig.json

└── tsconfig.tsbuildinfo

```



## .env.local

- **Arquivo ignorado** (0.3 KB)


## .gitignore

```

# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.
# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions
# testing
/coverage
# next.js
/.next/
/out/
# production
/build
# misc
.DS_Store
*.pem
# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*
# env files (can opt-in for committing if needed)
.env*
# vercel
.vercel
# typescript
*.tsbuildinfo
next-env.d.ts

```


## app\favicon.ico

- **Arquivo de mídia**: `favicon.ico`


## app\globals.css

<details><summary>globals.css</summary>


```

@import "tailwindcss";
/* REMOVA ESTA LINHA: @plugin "tailwindcss-animate"; */
@theme {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
:root {
  --background: #ffffff;
  --foreground: #171717;
}
/* Modo Escuro Manual */
.dark {
  --background: #020617;
  --foreground: #ededed;
}
body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans), Arial, Helvetica, sans-serif;
  transition: background-color 0.3s ease, color 0.3s ease;
}

```

</details>


## app\layout.tsx

```tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";
const geistSans = Geist({
  variable: "
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "
  subsets: ["latin"],
});
export const metadata: Metadata = {
  title: "TSLab",
  description: "TypeScript Notebook Environment",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 dark:bg-slate-950`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

```


## app\notebook\[id]\page.tsx

```tsx

'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, ArrowLeft, Save, Play, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes'; 
import Cell from '@/components/Cell';
import { notebookService, getDbConfig } from '@/lib/database-manager';
import { compileTS, executeJS } from '@/lib/compiler';
export default function NotebookPage() {
  const params = useParams();
  const router = useRouter();
  const notebookId = params.id as string;
  const { theme, setTheme } = useTheme();
  const [cells, setCells] = useState<any[]>([]);
  const [title, setTitle] = useState('Carregando...');
  const [user, setUser] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
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
        theme: theme 
      });
      const btn = document.getElementById('save-btn');
      if (btn) btn.style.color = '
      setTimeout(() => { if (btn) btn.style.color = ''; }, 2000);
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
  const addCell = (type: 'code' | 'markdown') => {
    const newCell = {
      id: crypto.randomUUID(),
      type,
      content: '',
      isCollapsed: false,
      output: null
    };
    setCells([...cells, newCell]);
  };
  const updateCell = (id: string, content: string) => {
    setCells(cells.map(c => c.id === id ? { ...c, content } : c));
  };
  const deleteCell = (id: string) => {
    setCells(cells.filter(c => c.id !== id));
  };
  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(cells);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setCells(items);
  };
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors duration-300">
      {}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent font-bold text-lg outline-none text-slate-800 dark:text-slate-100 w-full md:w-auto"
          />
        </div>
        <div className="flex items-center gap-2">
          {}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            id="save-btn"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
          >
            <Save size={16} /> {isSaving ? 'SALVANDO...' : 'SALVAR'}
          </button>
        </div>
      </header>
      {}
      <main className="max-w-4xl mx-auto p-4 space-y-4 mt-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="cells">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {cells.map((cell, index) => (
                  <Draggable key={cell.id} draggableId={cell.id} index={index}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} className="mb-4">
                        <Cell
                          cell={cell}
                          theme={theme === 'dark' ? 'dark' : 'light'}
                          lang="pt" 
                          dragHandleProps={provided.dragHandleProps}
                          onUpdate={updateCell}
                          onDelete={deleteCell}
                          onExecute={handleExecute}
                          onSave={handleSave}
                          onMove={() => { }}
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
        {}
        <div className="flex justify-center gap-4 py-8 opacity-50 hover:opacity-100 transition-opacity">
          <button onClick={() => addCell('code')} className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-bold hover:scale-105 transition-transform">
            <Plus size={14} /> Código TS
          </button>
          <button onClick={() => addCell('markdown')} className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-bold hover:scale-105 transition-transform">
            <Plus size={14} /> Markdown
          </button>
        </div>
      </main>
    </div>
  );
}

```


## app\page.tsx

```tsx

'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Auth from '@/components/Auth';
import { notebookService, getDbConfig } from '@/lib/database-manager';
import { Loader2, Plus, FileCode, Clock, Search, LogOut, Languages, Moon, Sun, Settings } from 'lucide-react';
const dashboardT = {
  pt: {
    projects: 'Meus Projetos',
    desc: 'Gerencie e edite seus notebooks TypeScript.',
    search: 'Buscar notebook...',
    new: 'Novo Notebook',
    environment: 'Ambiente TypeScript',
    untitled: 'Sem título',
    loading: 'Carregando seus projetos...',
    empty: 'Nenhum notebook encontrado. Crie o seu primeiro!',
    pro: 'Plano Pro'
  },
  en: {
    projects: 'My Projects',
    desc: 'Manage and edit your TypeScript notebooks.',
    search: 'Search notebook...',
    new: 'New Notebook',
    environment: 'TypeScript Environment',
    untitled: 'Untitled',
    loading: 'Loading your projects...',
    empty: 'No notebooks found. Create your first one!',
    pro: 'Pro Plan'
  }
};
export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [notebooks, setNotebooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<'pt' | 'en'>('pt');
  const router = useRouter();
  const t = dashboardT[lang];
  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem('tslab_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      fetchNotebooks(JSON.parse(savedUser));
    } else {
      setLoading(false);
    }
  }, []);
  const toggleLang = () => {
    setLang(prev => prev === 'pt' ? 'en' : 'pt');
  };
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };
  const fetchNotebooks = async (currentUser: any) => {
    try {
      setLoading(true);
      const config = getDbConfig();
      const data = await notebookService.list(config, currentUser.token);
      setNotebooks(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const handleLogin = (loggedUser: any) => {
    setUser(loggedUser);
    localStorage.setItem('tslab_user', JSON.stringify(loggedUser));
    fetchNotebooks(loggedUser);
  };
  const handleCreateNotebook = async () => {
    if (!user) return;
    const title = prompt(lang === 'pt' ? "Nome do Notebook:" : "Notebook Name:");
    if (!title) return;
    const newId = crypto.randomUUID();
    const newNotebook = {
      id: newId,
      name: title,
      cells: [],
      theme: 'light' 
    };
    try {
      const config = getDbConfig();
      await notebookService.upsert(config, user.token, newNotebook);
      router.push(`/notebook/${newId}`);
    } catch (error) {
      alert("Erro ao criar notebook");
    }
  };
  const filteredNotebooks = notebooks.filter(nb =>
    nb.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  if (!user) {
    return <Auth onLogin={handleLogin} lang={lang} onToggleLang={toggleLang} />;
  }
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20">TS</div>
            <span className="font-bold text-lg tracking-tight">TSLab</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-4 border-r border-slate-200 dark:border-slate-800 pr-4">
              <button
                onClick={toggleLang}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-blue-600 text-xs font-black hover:scale-105 transition-all"
              >
                <Languages size={14} /> {lang.toUpperCase()}
              </button>
              <button className="p-2 rounded-lg border border-green-500/20 bg-green-500/10 text-green-500 hover:scale-110 transition-all">
                <Settings size={16} />
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-500 hover:scale-110 transition-all"
                aria-label="Toggle Theme"
              >
                {}
                {mounted ? (resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />) : <div className="w-4 h-4 bg-slate-200 rounded animate-pulse" />}
              </button>
            </div>
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{t.pro}</span>
            </div>
            <button
              onClick={() => { localStorage.removeItem('tslab_user'); setUser(null); }}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-1">{t.projects}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{t.desc}</p>
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input
              type="text"
              placeholder={t.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none w-full md:w-64 transition-all"
            />
          </div>
        </div>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-500 animate-pulse">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-sm font-medium">{t.loading}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <button
              onClick={handleCreateNotebook}
              className="group relative flex flex-col items-center justify-center h-[200px] border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 rounded-2xl hover:bg-white dark:hover:bg-slate-900 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 group-hover:bg-blue-600 flex items-center justify-center mb-4 transition-colors duration-300">
                <Plus className="text-slate-400 group-hover:text-white" size={24} />
              </div>
              <span className="font-semibold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{t.new}</span>
              <span className="text-xs text-slate-400 mt-1">{t.environment}</span>
            </button>
            {filteredNotebooks.map((nb) => (
              <Link
                key={nb.id}
                href={`/notebook/${nb.id}`}
                className="group flex flex-col h-[200px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-blue-500 group-hover:text-white group-hover:bg-blue-600 transition-colors">
                    <FileCode size={20} />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded">
                    {nb.id.slice(0, 4)}
                  </span>
                </div>
                <div className="flex-1 relative z-10">
                  <h2 className="font-bold text-lg text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-white truncate mb-1">
                    {nb.name || t.untitled}
                  </h2>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    Notebook TypeScript.
                  </p>
                </div>
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-400 relative z-10">
                  <Clock size={12} />
                  <span>
                    {new Date(nb.updated_at).toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
        {!loading && notebooks.length === 0 && (
          <div className="text-center mt-12 text-slate-400">
            <p>{t.empty}</p>
          </div>
        )}
      </main>
    </div>
  );
}

```


## components\AiSidebar.tsx

```tsx

'use client';
import React, { useState } from 'react';
import { X, Settings, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import { getDbConfig, saveDbConfig, DbConfig } from '../../lib/database-manager';
interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  notebookContext: string;
}
export default function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const [dbConfig, setDbConfig] = useState<DbConfig>(getDbConfig());
  const handleSaveConfig = () => {
    saveDbConfig(dbConfig);
    alert('Configurações salvas!');
  };
  if (!isOpen) return null;
  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-[60] flex flex-col animate-in slide-in-from-right duration-300">
      {}
      <div className="p-2 border-b border-slate-200 dark:border-slate-800 flex bg-slate-50 dark:bg-slate-950 gap-2">
        <div className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold rounded-md bg-white dark:bg-slate-800 text-blue-600 shadow-sm transition-all">
          <Settings size={12} /> CONEXÕES & CONFIG
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-400">
          <X size={14} />
        </button>
      </div>
      {}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-2">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <LinkIcon size={16} className="text-blue-500" /> External Connections
          </h3>
          <p className="text-xs opacity-50">Conecte seu notebook a APIs externas.</p>
        </div>
        <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 font-bold text-xs">
            <ShieldCheck size={14} className="text-green-500" /> Supabase / API Config
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase opacity-50">Project URL</label>
            <input
              type="text"
              value={dbConfig.url}
              onChange={e => setDbConfig({ ...dbConfig, url: e.target.value })}
              placeholder="https:
              className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase opacity-50">API Key</label>
            <input
              type="password"
              value={dbConfig.apiKey}
              onChange={e => setDbConfig({ ...dbConfig, apiKey: e.target.value })}
              placeholder="Key..."
              className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSaveConfig}
            className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
          >
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}

```


## components\Auth.tsx

```tsx

'use client';
import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, ArrowRight, Loader2, Moon, Sun, Settings, AlertCircle, Languages, X } from 'lucide-react';
import { getDbConfig, saveDbConfig, supabaseAuth, DbConfig } from '@/lib/database-manager';
interface AuthProps {
  onLogin: (user: { name: string, email: string, token?: string }) => void;
  lang: 'pt' | 'en';
  onToggleLang?: () => void;
}
const authT = {
  pt: {
    signin: 'ENTRAR',
    signup: 'CADASTRAR',
    email: 'E-mail',
    pass: 'Senha',
    name: 'Nome Completo',
    btnIn: 'ENTRAR AGORA',
    btnUp: 'CRIAR E ACESSAR',
    desc: 'Autenticação persistente na nuvem.',
    configTitle: 'Configurar Supabase',
    save: 'SALVAR E APLICAR',
    sandbox: 'Modo Sandbox Ativado',
    invalidCreds: 'E-mail ou senha incorretos.',
    networkError: 'Erro de conexão com o servidor.',
    genericError: 'Ocorreu um problema inesperado.'
  },
  en: {
    signin: 'SIGN IN',
    signup: 'SIGN UP',
    email: 'Email',
    pass: 'Password',
    name: 'Full Name',
    btnIn: 'SIGN IN NOW',
    btnUp: 'CREATE & ACCESS',
    desc: 'Instant cloud persistence authentication.',
    configTitle: 'Configure Supabase',
    save: 'SAVE & APPLY',
    sandbox: 'Sandbox Mode Active',
    invalidCreds: 'Invalid email or password.',
    networkError: 'Server connection error.',
    genericError: 'An unexpected problem occurred.'
  }
};
export default function Auth({ onLogin, lang, onToggleLang }: AuthProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [dbConfig, setDbConfig] = useState<DbConfig>(getDbConfig());
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const t = authT[lang];
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (dbConfig.url && dbConfig.apiKey) {
        if (mode === 'signup') {
          const res = await supabaseAuth.signUp(dbConfig, formData.email, formData.password, formData.name);
          const token = res.access_token || res.session?.access_token;
          if (token) onLogin({ name: res.user?.user_metadata?.full_name || res.user?.email, email: res.user?.email, token });
          else {
            const loginRes = await supabaseAuth.signIn(dbConfig, formData.email, formData.password);
            onLogin({ name: loginRes.user?.user_metadata?.full_name, email: loginRes.user?.email, token: loginRes.access_token });
          }
        } else {
          const res = await supabaseAuth.signIn(dbConfig, formData.email, formData.password);
          onLogin({ name: res.user?.user_metadata?.full_name || res.user?.email, email: res.user?.email, token: res.access_token });
        }
      } else {
        setTimeout(() => onLogin({ name: formData.name || formData.email.split('@')[0], email: formData.email }), 800);
      }
    } catch (err: any) {
      let errMsg = err.message || t.genericError;
      const lower = errMsg.toLowerCase();
      if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) errMsg = t.invalidCreds;
      if (lower.includes('fetch')) errMsg = t.networkError;
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans transition-colors duration-500 overflow-hidden relative">
      <div className="fixed top-8 right-8 flex gap-3 z-50">
        <button
          onClick={onToggleLang}
          className="p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl text-blue-600 hover:scale-110 transition-all shadow-xl flex items-center gap-2 text-xs font-black uppercase"
        >
          <Languages size={20} /> {lang}
        </button>
        <button onClick={() => setIsConfigOpen(true)} className={`p-3 rounded-2xl backdrop-blur-md border transition-all ${dbConfig.url ? 'bg-green-500/10 border-green-500/20 text-green-600 shadow-lg' : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-500 hover:scale-110'}`}><Settings size={20} /></button>
        <button onClick={toggleTheme} className="p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 hover:scale-110 transition-all shadow-xl">{theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}</button>
      </div>
      <div className="w-full max-w-[440px] relative z-10">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-[22px] text-white font-black text-3xl shadow-2xl shadow-blue-500/30 mb-6 transform hover:rotate-6">TS</div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            <span className="text-blue-600">TS</span>Lab
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">{t.desc}</p>
        </div>
        <div className={`bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border transition-all duration-300 rounded-[40px] p-10 shadow-2xl ${error ? 'border-red-500/50 animate-shake' : 'border-slate-200 dark:border-slate-800'}`}>
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 animate-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-xs font-bold leading-tight">{error}</p>
            </div>
          )}
          <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-[20px] mb-8">
            <button onClick={() => setMode('signin')} className={`flex-1 py-3 text-[11px] font-black tracking-widest rounded-[16px] transition-all ${mode === 'signin' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xl' : 'text-slate-500'}`}>{t.signin}</button>
            <button onClick={() => setMode('signup')} className={`flex-1 py-3 text-[11px] font-black tracking-widest rounded-[16px] transition-all ${mode === 'signup' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xl' : 'text-slate-500'}`}>{t.signup}</button>
          </div>
          <form onSubmit={handleAuth} className="space-y-5">
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">{t.name}</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-blue-500/20 focus:bg-white dark:focus:bg-slate-900 rounded-[20px] py-4 pl-14 pr-6 text-sm outline-none transition-all dark:text-white" />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">{t.email}</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-blue-500/20 focus:bg-white dark:focus:bg-slate-900 rounded-[20px] py-4 pl-14 pr-6 text-sm outline-none transition-all dark:text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">{t.pass}</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-blue-500/20 focus:bg-white dark:focus:bg-slate-900 rounded-[20px] py-4 pl-14 pr-6 text-sm outline-none transition-all dark:text-white" />
              </div>
            </div>
            <button disabled={isLoading} className="group w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-[22px] shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 mt-8 relative overflow-hidden">
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><span className="relative z-10">{mode === 'signin' ? t.btnIn : t.btnUp}</span><ArrowRight size={20} strokeWidth={3} className="relative z-10 group-hover:translate-x-1 transition-transform" /></>}
            </button>
          </form>
        </div>
        <div className="text-center mt-8"><span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-full border border-transparent dark:border-slate-800">{dbConfig.url ? 'SUPABASE Persist' : t.sandbox}</span></div>
      </div>
      {isConfigOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-slate-950/60 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6"><h3 className="font-black text-sm text-slate-800 dark:text-white">{t.configTitle}</h3><button onClick={() => setIsConfigOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400"><X size={20} /></button></div>
            <div className="space-y-4">
              <input type="text" value={dbConfig.url} onChange={e => setDbConfig({ ...dbConfig, url: e.target.value })} placeholder="URL..." className="w-full bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-blue-500/20 rounded-2xl py-3.5 px-5 text-sm dark:text-white outline-none" />
              <input type="password" value={dbConfig.apiKey} onChange={e => setDbConfig({ ...dbConfig, apiKey: e.target.value })} placeholder="API Key..." className="w-full bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-blue-500/20 rounded-2xl py-3.5 px-5 text-sm dark:text-white outline-none" />
              <button onClick={() => { saveDbConfig(dbConfig); setIsConfigOpen(false); }} className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-2xl shadow-xl">{t.save}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

```


## components\Cell.tsx

```tsx

'use client';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Editor from './Editor';
import { 
  Play, Trash2, ChevronUp, ChevronDown, Edit3, Eye, 
  ChevronRight, GripVertical, Loader2 
} from 'lucide-react';
interface CellProps {
  cell: any;
  theme: 'light' | 'dark';
  dragHandleProps?: any;
  lang: 'pt' | 'en';
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onExecute: (id: string) => void | Promise<void>;
  onSave?: () => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onToggleCollapse: (id: string) => void;
}
const cellTranslations = {
  pt: {
    confirmDelete: 'Tem certeza que deseja excluir esta célula?',
    console: 'Console Output',
    edit: 'Editar',
    view: 'Visualizar',
    placeholder: 'Escreva algo aqui...',
    error: 'Erro de Execução'
  },
  en: {
    confirmDelete: 'Are you sure you want to delete this cell?',
    console: 'Console Output',
    edit: 'Edit',
    view: 'View',
    placeholder: 'Write something here...',
    error: 'Execution Error'
  }
};
const Cell: React.FC<CellProps> = ({ cell, theme, dragHandleProps, lang, onUpdate, onDelete, onExecute, onSave, onMove, onToggleCollapse }) => {
  const [isEditingMarkdown, setIsEditingMarkdown] = useState(cell.type === 'markdown' && !cell.content);
  const t = cellTranslations[lang];
  const handleDelete = () => {
    if (window.confirm(t.confirmDelete)) {
      onDelete(cell.id);
    }
  };
  const renderOutput = () => {
    if (!cell.output || cell.isCollapsed) return null;
    const { logs, error, result } = cell.output;
    if ((!logs || logs.length === 0) && !error && result === undefined) return null;
    const isDark = theme === 'dark';
    return (
      <div className={`mt-4 p-4 rounded-lg border font-mono text-sm overflow-x-auto shadow-inner transition-colors duration-200 ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
      }`}>
        <div className={`flex items-center justify-between mb-2 pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <span className="text-[10px] font-bold tracking-widest uppercase opacity-50">{t.console}</span>
        </div>
        {logs && logs.map((log: string, i: number) => (
          <div key={i} className={`whitespace-pre-wrap py-0.5 border-l-2 pl-3 mb-1 ${isDark ? 'border-blue-500/30' : 'border-blue-500/50'}`}>{log}</div>
        ))}
        {result !== undefined && (
          <div className="text-blue-500 dark:text-blue-400 mt-1 flex gap-2 border-l-2 border-blue-500 pl-3">
            <span className="opacity-50 shrink-0">out:</span>
            <span className="whitespace-pre-wrap">{typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}</span>
          </div>
        )}
        {error && (
          <div className="text-red-600 dark:text-red-400 mt-1 whitespace-pre-wrap border-l-2 border-red-500 pl-3 bg-red-500/10 p-2 rounded">
            <span className="font-bold uppercase text-[10px] block mb-1">{t.error}</span>
            {error}
          </div>
        )}
      </div>
    );
  };
  return (
    <div className={`group relative bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-all ${cell.isCollapsed ? 'opacity-80' : 'min-h-[160px]'} flex`}>
      <div className="w-12 flex flex-col items-center py-3 bg-slate-50 dark:bg-slate-850 border-r border-slate-200 dark:border-slate-800 shrink-0">
        <div {...dragHandleProps} className="p-2 text-slate-300 dark:text-slate-600 hover:text-blue-500 cursor-grab active:cursor-grabbing mb-2">
          <GripVertical size={18} />
        </div>
        {!cell.isCollapsed && cell.type === 'code' && (
          <button 
            onClick={() => onExecute(cell.id)} 
            disabled={cell.isExecuting} 
            className={`p-2 rounded-full transition-all mb-2 ${
              cell.isExecuting 
                ? 'text-blue-500 bg-blue-100 dark:bg-blue-900/30 scale-110 animate-pulse' 
                : 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 hover:scale-110 active:scale-95'
            }`}
          >
            {cell.isExecuting ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
          </button>
        )}
        <button onClick={() => onMove(cell.id, 'up')} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded"><ChevronUp size={16} /></button>
        <button onClick={() => onMove(cell.id, 'down')} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded mt-0.5"><ChevronDown size={16} /></button>
        <div className="flex-grow" />
        <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18} /></button>
      </div>
      <div className="flex-1 p-4 min-w-0">
        <div className="flex justify-between items-center mb-2">
           <div className="flex items-center gap-2 overflow-hidden">
             <button onClick={() => onToggleCollapse(cell.id)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-400">
               {cell.isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
             </button>
             <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">{cell.type}</span>
           </div>
           {!cell.isCollapsed && cell.type === 'markdown' && (
             <button onClick={() => setIsEditingMarkdown(!isEditingMarkdown)} className="text-xs font-medium flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-md">
                {isEditingMarkdown ? <><Eye size={12}/> {t.view}</> : <><Edit3 size={12}/> {t.edit}</>}
             </button>
           )}
        </div>
        {!cell.isCollapsed && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
            {cell.type === 'code' ? (
              <>
                <Editor value={cell.content} language="typescript" onChange={(val) => onUpdate(cell.id, val)} onExecute={() => onExecute(cell.id)} onSave={onSave} theme={theme} />
                {renderOutput()}
              </>
            ) : (
              <div className="min-h-[50px]">
                {isEditingMarkdown ? (
                  <Editor value={cell.content} language="markdown" onChange={(val) => onUpdate(cell.id, val)} onExecute={() => setIsEditingMarkdown(false)} onSave={onSave} theme={theme} />
                ) : (
                  <div className="prose prose-slate dark:prose-invert max-w-none cursor-pointer p-3 rounded-lg hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all" onClick={() => setIsEditingMarkdown(true)}>
                    {cell.content ? <ReactMarkdown>{cell.content}</ReactMarkdown> : <span className="italic text-slate-400">{t.placeholder}</span>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default Cell;

```


## components\CodeEditor.tsx

```tsx

'use client'; 
import dynamic from 'next/dynamic';
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.Editor),
  { ssr: false } 
);
import { EditorProps } from '@monaco-editor/react';
export default function CodeEditor(props: EditorProps) {
  return <MonacoEditor {...props} />;
}

```


## components\Editor.tsx

```tsx

'use client';
import React, { useState, useRef, Suspense, lazy, startTransition } from 'react';
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
  <div className="h-[60px] bg-slate-100 dark:bg-slate-900 animate-pulse rounded-md flex items-center justify-center text-xs text-slate-400 font-mono">
    Loading Editor...
  </div>
);
export default function Editor({ value, onChange, onExecute, onSave, theme, language }: EditorProps) {
  const [editorHeight, setEditorHeight] = useState(60);
  const editorRef = useRef<any>(null);
  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
      onExecute();
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave) onSave();
    });
    const domNode = editor.getDomNode();
    if (domNode) {
      let spacePressed = false;
      domNode.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.code === 'Space') spacePressed = true;
        if (e.code === 'Enter' && spacePressed) {
          e.preventDefault();
          onExecute();
        }
      });
      domNode.addEventListener('keyup', (e: KeyboardEvent) => {
        if (e.code === 'Space') spacePressed = false;
      });
    }
    const contentHeight = Math.max(60, editor.getContentHeight());
    startTransition(() => {
      setEditorHeight(contentHeight);
    });
    editor.onDidContentSizeChange((e: any) => {
      if (e.contentHeightChanged) {
        startTransition(() => {
          setEditorHeight(Math.max(60, e.contentHeight));
        });
      }
    });
  };
  return (
    <div className="border rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      <Suspense fallback={<EditorFallback />}>
        <MonacoEditor
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
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            lineNumbers: 'on',
            wordWrap: 'on',
            scrollbar: {
              vertical: 'hidden',
              horizontal: 'auto',
              handleMouseWheel: false,
            },
            fixedOverflowWidgets: true,
            suggest: {
              showMethods: true,
              showFunctions: true,
              showVariables: true,
              showConstants: true,
            },
            glyphMargin: false,
            folding: false,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            contextmenu: false,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          }}
        />
      </Suspense>
    </div>
  );
}

```


## eslint.config.mjs

```

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);
export default eslintConfig;

```


## lib\compiler.ts

```ts

import { transform } from 'sucrase';
import { getDbConfig, createSupabaseClient, restClient } from './database-manager';
export const compileTS = (tsCode: string): string => {
  try {
    const result = transform(tsCode, {
      transforms: ['typescript'],
      production: true,
    });
    return result.code;
  } catch (err: any) {
    throw new Error(`Compilation Error: ${err.message}`);
  }
};
export const executeJS = (jsCode: string, previousContext: string = ''): Promise<{ logs: string[]; result: any; error?: any }> => {
  return new Promise((resolve) => {
    const logs: string[] = [];
    let isCapturing = false;
    const customConsole = {
      log: (...args: any[]) => {
        if (!isCapturing) return;
        logs.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
      },
      error: (...args: any[]) => {
        if (!isCapturing) return;
        logs.push(`ERROR: ${args.join(' ')}`);
      },
      warn: (...args: any[]) => {
        if (!isCapturing) return;
        logs.push(`WARN: ${args.join(' ')}`);
      }
    };
    try {
      const config = getDbConfig();
      const supabase = createSupabaseClient(config);
      const executionFn = new Function('console', 'setCapture', 'supabase', 'rest', `
        return (async function() {
          try {
            setCapture(false);
            ${previousContext}
            setCapture(true);
            ${jsCode}
          } catch (e) {
            throw e;
          }
        })();
      `);
      const setCapture = (val: boolean) => { isCapturing = val; };
      executionFn(customConsole, setCapture, supabase, restClient)
        .then((result: any) => resolve({ logs, result }))
        .catch((error: any) => resolve({ logs, result: undefined, error: error.message || String(error) }));
    } catch (error: any) {
      resolve({ logs, result: undefined, error: error.message || String(error) });
    }
  });
};

```


## lib\database-manager.ts

```ts

import { ENV } from './env';
export interface DbConfig {
  type: 'local' | 'supabase' | 'rest';
  url: string;
  apiKey: string;
  isFromEnv?: boolean; 
}
const CONFIG_KEY = 'ts_lab_db_config';
export const getDbConfig = (): DbConfig => {
  if (ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY) {
    return {
      type: 'supabase',
      url: ENV.SUPABASE_URL,
      apiKey: ENV.SUPABASE_ANON_KEY,
      isFromEnv: true
    };
  }
  const saved = localStorage.getItem(CONFIG_KEY);
  if (saved) {
    return { ...JSON.parse(saved), isFromEnv: false };
  }
  return { type: 'local', url: '', apiKey: '', isFromEnv: false };
};
export const saveDbConfig = (config: DbConfig) => {
  if (!config.isFromEnv) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }
};
export const supabaseAuth = {
  signUp: async (config: DbConfig, email: string, password: string, name: string) => {
    if (!config.url || !config.apiKey) throw new Error("Supabase não configurado.");
    const res = await fetch(`${config.url}/auth/v1/signup`, {
      method: 'POST',
      headers: { 'apikey': config.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, data: { full_name: name } })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || data.error_description || "Erro no cadastro");
    return data;
  },
  signIn: async (config: DbConfig, email: string, password: string) => {
    if (!config.url || !config.apiKey) throw new Error("Supabase não configurado.");
    const res = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'apikey': config.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.msg || "Erro no login");
    return data;
  }
};
export const notebookService = {
  list: async (config: DbConfig, token: string) => {
    if (!config.url || !config.apiKey) return [];
    const res = await fetch(`${config.url}/rest/v1/notebooks?select=id,name,updated_at&order=updated_at.desc`, {
      headers: {
        'apikey': config.apiKey,
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) return [];
    return await res.json();
  },
  get: async (config: DbConfig, token: string, id: string) => {
    const res = await fetch(`${config.url}/rest/v1/notebooks?id=eq.${id}&select=*`, {
      headers: {
        'apikey': config.apiKey,
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    return data[0];
  },
  upsert: async (config: DbConfig, token: string, notebook: any) => {
    let userId;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub;
    } catch (e) {
      console.error("Falha ao decodificar token", e);
    }
    const res = await fetch(`${config.url}/rest/v1/notebooks`, {
      method: 'POST',
      headers: {
        'apikey': config.apiKey,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify({
        id: notebook.id,
        name: notebook.name,
        content: { cells: notebook.cells, theme: notebook.theme },
        updated_at: new Date().toISOString(),
        user_id: userId
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Erro ao salvar no Supabase. Verifique se a tabela 'notebooks' foi criada e o RLS configurado.");
    }
    return await res.json();
  },
  delete: async (config: DbConfig, token: string, id: string) => {
    const res = await fetch(`${config.url}/rest/v1/notebooks?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': config.apiKey,
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error("Erro ao excluir notebook");
  }
};
export const createSupabaseClient = (config: DbConfig) => {
  if (!config.url || !config.apiKey) return null;
  return {
    from: (table: string) => ({
      select: async (columns: string = '*') => {
        const res = await fetch(`${config.url}/rest/v1/${table}?select=${columns}`, {
          headers: { 'apikey': config.apiKey, 'Authorization': `Bearer ${config.apiKey}` }
        });
        return await res.json();
      },
      insert: async (data: any) => {
        const res = await fetch(`${config.url}/rest/v1/${table}`, {
          method: 'POST',
          headers: { 'apikey': config.apiKey, 'Authorization': `Bearer ${config.apiKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
          body: JSON.stringify(data)
        });
        return await res.json();
      }
    })
  };
};
export const restClient = {
  get: async (url: string, headers = {}) => {
    const res = await fetch(url, { headers });
    return await res.json();
  },
  post: async (url: string, data: any, headers = {}) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(data)
    });
    return await res.json();
  }
};

```


## lib\env.ts

```ts

export const ENV = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
};

```


## lib\prisma-browser.ts

```ts



```


## next-env.d.ts

```ts

import "./.next/dev/types/routes.d.ts";

```


## next.config.ts

```ts

import type { NextConfig } from "next";
const nextConfig: NextConfig = {
};
export default nextConfig;

```


## package.json

<details><summary>package.json</summary>


```json

{
  "name": "tslab",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@hello-pangea/dnd": "^18.0.1",
    "@monaco-editor/react": "^4.7.0",
    "@supabase/supabase-js": "^2.89.0",
    "clsx": "^2.1.1",
    "lucide-react": "^0.562.0",
    "next": "16.1.1",
    "next-themes": "^0.4.6",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "react-markdown": "^10.1.0",
    "sucrase": "^3.35.1",
    "tailwind-merge": "^3.4.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.1.1",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}

```

</details>


## pnpm-lock.yaml

- **Arquivo ignorado** (163.23 KB)


## pnpm-workspace.yaml

<details><summary>pnpm-workspace.yaml</summary>


```yaml

packages:
  - .
ignoredBuiltDependencies:
  - sharp
  - unrs-resolver

```

</details>


## postcss.config.mjs

```

const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;

```


## providers.tsx

```tsx

'use client';
import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}

```


## public\file.svg

- **Arquivo de mídia**: `file.svg`


## public\globe.svg

- **Arquivo de mídia**: `globe.svg`


## public\next.svg

- **Arquivo de mídia**: `next.svg`


## public\vercel.svg

- **Arquivo de mídia**: `vercel.svg`


## public\window.svg

- **Arquivo de mídia**: `window.svg`


## README.md

<details><summary>README.md</summary>


```md

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
## Getting Started
First, run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.
This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
## Learn More
To learn more about Next.js, take a look at the following resources:
- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
## Deploy on Vercel
The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.
Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

```

</details>


## tsconfig.json

<details><summary>tsconfig.json</summary>


```json

{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}

```

</details>


## tsconfig.tsbuildinfo

- **Arquivo ignorado** (144.25 KB)


# Verificação de TypeScript


```

components/AiSidebar.tsx(4,53): error TS2307: Cannot find module '../../lib/database-manager' or its corresponding type declarations.




```