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

  // Theme Hook
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
    // Usa resolvedTheme para garantir que toggle funcione mesmo se estiver em 'system'
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
      theme: 'light' // Default inicial
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

  // REMOVIDO: if (!mounted) return null; -> Isso causava o flash branco.

  return (
    // As classes bg-slate-50 dark:bg-slate-950 garantem a troca de cor baseada no seletor .dark
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
                {/* Só renderiza o ícone correto após montar para evitar erro de hidratação */}
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