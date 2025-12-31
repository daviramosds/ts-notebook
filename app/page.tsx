'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Auth from '@/components/Auth';
import ShareModal from '@/components/ShareModal';
import { getNotebooks, saveNotebook, deleteNotebook, renameNotebook, duplicateNotebook } from '@/app/_actions/notebook';
import { Loader2, Plus, FileCode, Clock, Search, LogOut, Languages, Moon, Sun, Settings, MoreVertical, Trash2, Copy, Edit3, Share2, Globe, ArrowUpDown, X } from 'lucide-react';

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
    delete: 'Deletar',
    rename: 'Renomear',
    duplicate: 'Duplicar',
    share: 'Compartilhar',
    public: 'Público',
    private: 'Privado',
    sortBy: 'Ordenar',
    sortDate: 'Por data',
    sortName: 'Por nome',
    confirmDelete: 'Tem certeza que deseja deletar este notebook?',
    cancel: 'Cancelar'
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
    delete: 'Delete',
    rename: 'Rename',
    duplicate: 'Duplicate',
    share: 'Share',
    public: 'Public',
    private: 'Private',
    sortBy: 'Sort by',
    sortDate: 'By date',
    sortName: 'By name',
    confirmDelete: 'Are you sure you want to delete this notebook?',
    cancel: 'Cancel'
  }
};

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [notebooks, setNotebooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<'pt' | 'en'>('en');
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [renameModal, setRenameModal] = useState<{ id: string; name: string } | null>(null);
  const [shareModal, setShareModal] = useState<{ id: string; name: string } | null>(null);
  const [sortOrder, setSortOrder] = useState<'date' | 'name'>('date');

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
        // Apply user preferences from database
        if (data.user.language) {
          setLang(data.user.language as 'pt' | 'en');
        }
        if (data.user.theme) {
          setTheme(data.user.theme);
        }
        fetchNotebooks();
      } else {
        setLoading(false); // Não logado
      }
    } catch (error) {
      console.error("Erro de sessão:", error);
      setLoading(false);
    }
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

  const handleDeleteNotebook = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    try {
      await deleteNotebook(id);
      setNotebooks(notebooks.filter(nb => nb.id !== id));
    } catch (error) {
      console.error(error);
    }
    setContextMenu(null);
  };

  const handleRenameNotebook = async () => {
    if (!renameModal) return;
    try {
      await renameNotebook(renameModal.id, renameModal.name);
      setNotebooks(notebooks.map(nb =>
        nb.id === renameModal.id ? { ...nb, name: renameModal.name } : nb
      ));
    } catch (error) {
      console.error(error);
    }
    setRenameModal(null);
  };

  const handleDuplicateNotebook = async (id: string) => {
    if (!user?.id) return;
    try {
      const newNb = await duplicateNotebook(id, user.id);
      setNotebooks([...notebooks, newNb]);
    } catch (error) {
      console.error(error);
    }
    setContextMenu(null);
  };

  const handleOpenShareModal = (id: string) => {
    const notebook = notebooks.find(n => n.id === id);
    if (notebook) {
      setShareModal({ id, name: notebook.name || 'Untitled' });
    }
    setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ id, x: e.clientX, y: e.clientY });
  };

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  const sortedNotebooks = [...notebooks].sort((a, b) => {
    if (sortOrder === 'name') {
      return (a.name || '').localeCompare(b.name || '');
    }
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const filteredNotebooks = sortedNotebooks.filter(nb =>
    nb.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user && !loading) {
    return (
      <Auth
        onLogin={handleLogin}
        lang={lang}
        onLanguageChange={(newLang) => setLang(newLang)}
        onThemeChange={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      />
    );
  }

  // Estado de loading inicial enquanto verifica a sessão
  if (loading && !user) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center cursor-default select-none">
            <span className="font-semibold text-lg text-slate-800 dark:text-slate-100">
              <span className="text-blue-600">TS</span><span className="text-slate-500 dark:text-slate-400">Lab</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{user.name || 'User'}</span>
              {user.username && (
                <span className="text-xs text-slate-400 dark:text-slate-500">@{user.username}</span>
              )}
            </div>
            <Link
              href="/settings"
              className="p-2 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings size={16} />
            </Link>
            <button onClick={handleLogout} className="p-2 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors cursor-pointer" title="Logout">
              <LogOut size={16} />
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSortOrder(sortOrder === 'date' ? 'name' : 'date')}
              className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:border-blue-500 transition-all cursor-pointer"
            >
              <ArrowUpDown size={14} />
              {sortOrder === 'date' ? t.sortDate : t.sortName}
            </button>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
              <input type="text" placeholder={t.search} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full md:w-72 shadow-sm transition-all" />
            </div>
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
              <div key={nb.id} className="group relative flex flex-col h-[220px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-blue-500/30 dark:hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Link href={`/notebook/${nb.id}`} className="absolute inset-0 z-0" />
                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-blue-600 border border-slate-100 dark:border-slate-700 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-all duration-300">
                    <FileCode size={22} />
                  </div>
                  <div className="flex items-center gap-2">
                    {nb.isPublic && <Globe size={12} className="text-green-500" />}
                    <button
                      onClick={(e) => handleContextMenu(e, nb.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-20"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 relative z-10">
                  <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate mb-1.5 transition-colors">{nb.name || t.untitled}</h2>
                  <p className="text-xs font-medium text-slate-500 line-clamp-2">Notebook TypeScript.</p>
                </div>
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-medium text-slate-400 relative z-10">
                  <Clock size={12} />
                  <span>{new Date(nb.updated_at).toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && notebooks.length === 0 && (
          <div className="text-center mt-20 text-slate-400"><p className="font-medium">{t.empty}</p></div>
        )}
      </main>

      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-2 min-w-[160px]"
        >
          <button
            onClick={() => { setRenameModal({ id: contextMenu.id, name: notebooks.find(n => n.id === contextMenu.id)?.name || '' }); setContextMenu(null); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Edit3 size={14} /> {t.rename}
          </button>
          <button
            onClick={() => handleDuplicateNotebook(contextMenu.id)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Copy size={14} /> {t.duplicate}
          </button>
          <button
            onClick={() => handleOpenShareModal(contextMenu.id)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Share2 size={14} /> {t.share}
          </button>
          <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
          <button
            onClick={() => handleDeleteNotebook(contextMenu.id)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
          >
            <Trash2 size={14} /> {t.delete}
          </button>
        </div>
      )}

      {/* Rename Modal */}
      {renameModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setRenameModal(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.rename}</h3>
              <button onClick={() => setRenameModal(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <input
              type="text"
              value={renameModal.name}
              onChange={(e) => setRenameModal({ ...renameModal, name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameNotebook()}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white mb-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRenameModal(null)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                {t.cancel}
              </button>
              <button onClick={handleRenameNotebook} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer">
                {t.rename}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModal && (
        <ShareModal
          notebookId={shareModal.id}
          notebookName={shareModal.name}
          isOpen={true}
          onClose={() => setShareModal(null)}
          lang={lang}
        />
      )}
    </div>
  );
}