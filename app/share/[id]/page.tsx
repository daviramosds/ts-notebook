'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { getSharedNotebook, validateShareAccess, logShareAccess } from '@/app/_actions/share';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Loader2, FileCode, User, Globe, ArrowLeft, Lock, AlertCircle, Clock, Shield, Eye, EyeOff, Moon, Sun, Languages } from 'lucide-react';
import Link from 'next/link';

type AccessState =
  | 'loading'
  | 'password_required'
  | 'login_required'
  | 'not_authorized'
  | 'expired'
  | 'not_found'
  | 'disabled'
  | 'success';

const translations = {
  pt: {
    protectedNotebook: 'Notebook Protegido',
    passwordRequired: 'Este notebook requer uma senha para acessar',
    enterPassword: 'Digite a senha',
    wrongPassword: 'Senha incorreta',
    accessNotebook: 'Acessar Notebook',
    backToHome: 'Voltar ao início',
    loginRequired: 'Login Necessário',
    loginRequiredDesc: 'Este notebook requer que você esteja logado para acessar',
    login: 'Fazer Login',
    accessDenied: 'Acesso Negado',
    accessDeniedDesc: 'Você não tem permissão para acessar este notebook',
    linkExpired: 'Link Expirado',
    linkExpiredDesc: 'Este link de compartilhamento expirou',
    sharingDisabled: 'Compartilhamento desativado',
    notebookNotFound: 'Notebook não encontrado',
    shared: 'Compartilhado'
  },
  en: {
    protectedNotebook: 'Protected Notebook',
    passwordRequired: 'This notebook requires a password to access',
    enterPassword: 'Enter password',
    wrongPassword: 'Wrong password',
    accessNotebook: 'Access Notebook',
    backToHome: 'Back to home',
    loginRequired: 'Login Required',
    loginRequiredDesc: 'This notebook requires you to be logged in to access',
    login: 'Login',
    accessDenied: 'Access Denied',
    accessDeniedDesc: 'You do not have permission to access this notebook',
    linkExpired: 'Link Expired',
    linkExpiredDesc: 'This share link has expired',
    sharingDisabled: 'Sharing disabled',
    notebookNotFound: 'Notebook not found',
    shared: 'Shared'
  }
};

export default function SharePage() {
  const params = useParams();
  const id = params?.id as string;
  const [notebook, setNotebook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accessState, setAccessState] = useState<AccessState>('loading');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [lang, setLang] = useState<'pt' | 'en'>('pt');
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const t = translations[lang];

  useEffect(() => {
    setMounted(true);
    checkCurrentUser();
  }, []);

  useEffect(() => {
    if (id) {
      loadNotebook();
    }
  }, [id, currentUser]);

  const checkCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (err) {
      // Not logged in
    }
  };

  const loadNotebook = async (enteredPassword?: string) => {
    setLoading(true);
    setPasswordError(false);

    try {
      const result = await getSharedNotebook(id, {
        password: enteredPassword,
        userId: currentUser?.id,
        userEmail: currentUser?.email
      });

      if ('error' in result) {
        switch (result.error) {
          case 'password_required':
            setAccessState('password_required');
            setShareId(result.shareId || null);
            break;
          case 'wrong_password':
            setAccessState('password_required');
            setShareId(result.shareId || null);
            setPasswordError(true);
            break;
          case 'login_required':
            setAccessState('login_required');
            break;
          case 'not_authorized':
            setAccessState('not_authorized');
            break;
          case 'expired':
            setAccessState('expired');
            break;
          case 'disabled':
          case 'not_shared':
            setAccessState('disabled');
            break;
          default:
            setAccessState('not_found');
        }
      } else {
        setNotebook(result.notebook);
        setAccessState('success');

        // Log the access
        if (result.shareId) {
          logShareAccess(result.shareId, {
            userId: currentUser?.id,
            userEmail: currentUser?.email
          });
        }
      }
    } catch (err) {
      console.error('Error loading shared notebook:', err);
      setAccessState('not_found');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadNotebook(password);
  };

  // Loading state
  if (loading && accessState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  // Password required
  if (accessState === 'password_required') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                <Lock size={32} className="text-blue-600" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">
              {t.protectedNotebook}
            </h1>
            <p className="text-sm text-slate-500 text-center mb-6">
              {t.passwordRequired}
            </p>
            <form onSubmit={handlePasswordSubmit}>
              <div className="relative mb-4">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
                  placeholder={t.enterPassword}
                  className={`w-full px-4 py-3 pr-12 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm outline-none transition-all ${passwordError
                    ? 'border-red-500 focus:ring-red-500/20'
                    : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    }`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordError && (
                <p className="text-red-500 text-xs mb-4 flex items-center gap-1">
                  <AlertCircle size={12} /> {t.wrongPassword}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {t.accessNotebook}
              </button>
            </form>
            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-blue-600 hover:underline">
                {t.backToHome}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login required
  if (accessState === 'login_required') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl">
              <Shield size={32} className="text-amber-600" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {t.loginRequired}
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            {t.loginRequiredDesc}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            {t.login}
          </Link>
        </div>
      </div>
    );
  }

  // Not authorized
  if (accessState === 'not_authorized') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl">
              <Shield size={32} className="text-red-600" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {t.accessDenied}
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            {t.accessDeniedDesc}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition-colors"
          >
            {t.backToHome}
          </Link>
        </div>
      </div>
    );
  }

  // Expired
  if (accessState === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <Clock size={32} className="text-slate-400" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {t.linkExpired}
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            {t.linkExpiredDesc}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition-colors"
          >
            {t.backToHome}
          </Link>
        </div>
      </div>
    );
  }

  // Not found or disabled
  if (accessState === 'not_found' || accessState === 'disabled') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-4">
        <Globe size={48} className="text-slate-400" />
        <p className="text-slate-500 font-medium">
          {accessState === 'disabled'
            ? t.sharingDisabled
            : t.notebookNotFound}
        </p>
        <Link href="/" className="text-blue-600 hover:underline font-medium">
          {t.backToHome}
        </Link>
      </div>
    );
  }

  // Success - show notebook
  const cells = (notebook?.content as any)?.cells || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-2">
              <FileCode size={16} className="text-blue-600" />
              <h1 className="font-medium text-sm truncate max-w-[200px] sm:max-w-none text-slate-800 dark:text-slate-100">{notebook?.name}</h1>
            </div>
            <span className="flex items-center gap-1.5 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold rounded-full">
              <Globe size={12} /> {t.shared}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {notebook?.user?.name && (
              <span className="flex items-center gap-2 text-sm text-slate-500">
                <User size={14} /> {notebook.user.name}
              </span>
            )}
            {/* Language and theme for unauthenticated users */}
            {!currentUser && (
              <>
                <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
                <button
                  onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
                  className="p-2 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title={lang === 'pt' ? 'Switch to English' : 'Mudar para Português'}
                >
                  <Languages size={16} />
                </button>
                <button
                  onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title={resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
                >
                  {mounted && (resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />)}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {cells.map((cell: any, index: number) => (
            <div
              key={cell.id || index}
              className="rounded-xl border overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            >
              {cell.type === 'code' ? (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${cell.language === 'python' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                      cell.language === 'javascript' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600' :
                        'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                      }`}>
                      {cell.language || 'typescript'}
                    </span>
                  </div>
                  <SyntaxHighlighter
                    language={cell.language || 'typescript'}
                    style={resolvedTheme === 'dark' ? vscDarkPlus : vs}
                    customStyle={{
                      margin: 0,
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      background: resolvedTheme === 'dark' ? '#0c111b' : '#f8f9fa'
                    }}
                    showLineNumbers={false}
                  >
                    {cell.content}
                  </SyntaxHighlighter>
                  {cell.output && (
                    <div className="mt-2 p-3 rounded-lg text-sm font-mono bg-slate-50 dark:bg-slate-950">
                      {cell.output.logs?.map((log: string, i: number) => (
                        <div key={i} className="text-slate-600 dark:text-slate-400">{log}</div>
                      ))}
                      {cell.output.error && (
                        <div className="text-red-500">{cell.output.error}</div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 prose dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {cell.content || ''}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
