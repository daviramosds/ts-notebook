'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Auth from '@/components/Auth';
import { getNotebooks, saveNotebook } from '@/app/_actions/notebook';
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
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<'pt' | 'en'>('pt');

  const router = useRouter();
  const t = dashboardT[lang];

  useEffect(() => {
    setMounted(true);
    checkSession(); // Verifica sessão via API, não LocalStorage
  }, []);

  const checkSession = async () => {
    try {
      // Pergunta ao servidor quem sou eu baseado no cookie HTTP-Only
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        fetchNotebooks();
      } else {
        setLoading(false); // Não logado
      }
    } catch (error) {
      console.error("Erro de sessão:", error);
      setLoading(false);
    }
  };

  const toggleLang = () => {
    setLang(prev => prev === 'pt' ? 'en' : 'pt');
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const fetchNotebooks = async () => {
    try {
      setLoading(true);
      const data = await getNotebooks();
      setNotebooks(data || []);
    } catch (error) {
      console.error("Erro ao buscar notebooks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (loggedUser: any) => {
    setUser(loggedUser);
    // NÃO SALVAMOS MAIS NO LOCALSTORAGE
    fetchNotebooks();
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setNotebooks([]);
    } catch (error) {
      console.error("Erro ao sair", error);
    }
  };

  const handleCreateNotebook = async () => {
    if (!user) return;

    if (!user.id) {
      alert("Sessão inválida. Recarregue a página.");
      return;
    }

    const title = lang === 'pt' ? "Notebook sem título" : "Untitled notebook";
    const newId = crypto.randomUUID();

    const newNotebook = {
      id: newId,
      name: title,
      cells: [],
      theme: 'light',
      userId: user.id
    };

    try {
      await saveNotebook(newNotebook);
      router.push(`/notebook/${newId}`);
    } catch (error) {
      console.error(error);
      alert("Erro ao criar notebook");
    }
  };

  const filteredNotebooks = notebooks.filter(nb =>
    nb.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user && !loading) {
    return <Auth onLogin={handleLogin} lang={lang} onToggleLang={toggleLang} />;
  }

  // Estado de loading inicial enquanto verifica a sessão
  if (loading && !user) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-20 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center cursor-default select-none">
            <span className="font-black text-2xl tracking-tight text-slate-900 dark:text-slate-100 hover:opacity-80 transition-opacity">
              <span className="text-blue-600">TS</span>Lab
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-3 border-r border-slate-200 dark:border-slate-800 pr-4 sm:pr-6">
              <button onClick={toggleLang} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-blue-600 text-[10px] font-black hover:scale-105 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm cursor-pointer">
                <Languages size={14} /> {lang.toUpperCase()}
              </button>
              <button onClick={toggleTheme} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-yellow-500 dark:hover:text-yellow-400 transition-all shadow-sm cursor-pointer">
                {mounted ? (resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />) : <div className="w-4 h-4" />}
              </button>
            </div>
            <div className="hidden md:flex flex-col items-end mr-1">
              <Link href="/settings" className="group/profile flex flex-col items-end cursor-pointer">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover/profile:text-blue-600 transition-colors">
                    {user.name}
                  </span>
                  <Settings size={12} className="text-slate-400 opacity-0 group-hover/profile:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t.pro}</span>
                </div>
              </Link>
            </div>
            <button onClick={handleLogout} className="p-2.5 bg-slate-100 dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-xl border border-transparent hover:border-red-200 dark:hover:border-red-900/30 transition-all shadow-sm group cursor-pointer" title="Sair">
              <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{t.projects}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t.desc}</p>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input type="text" placeholder={t.search} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full md:w-72 shadow-sm transition-all" />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-500 animate-pulse">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-sm font-medium">{t.loading}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <button onClick={handleCreateNotebook} className="group relative flex flex-col items-center justify-center h-[220px] border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl hover:bg-white dark:hover:bg-slate-900 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group-hover:border-blue-500/30 group-hover:bg-blue-600 flex items-center justify-center mb-4 transition-all duration-300 shadow-sm group-hover:scale-110">
                <Plus className="text-slate-400 group-hover:text-white" size={28} />
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{t.new}</span>
              <span className="text-xs font-medium text-slate-400 mt-1">{t.environment}</span>
            </button>
            {filteredNotebooks.map((nb) => (
              <Link key={nb.id} href={`/notebook/${nb.id}`} className="group flex flex-col h-[220px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-blue-500/30 dark:hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-blue-600 border border-slate-100 dark:border-slate-700 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all duration-300">
                    <FileCode size={22} />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800">{nb.id.slice(0, 4)}</span>
                </div>
                <div className="flex-1 relative z-10">
                  <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate mb-1.5 transition-colors">{nb.name || t.untitled}</h2>
                  <p className="text-xs font-medium text-slate-500 line-clamp-2">Notebook TypeScript.</p>
                </div>
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-medium text-slate-400 relative z-10">
                  <Clock size={12} />
                  <span>{new Date(nb.updated_at).toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US')}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
        {!loading && notebooks.length === 0 && (
          <div className="text-center mt-20 text-slate-400"><p className="font-medium">{t.empty}</p></div>
        )}
      </main>
    </div>
  );
}