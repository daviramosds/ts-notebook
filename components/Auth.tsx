'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, ArrowRight, Loader2, Moon, Sun, AlertCircle, Languages, Eye, EyeOff } from 'lucide-react';

interface AuthProps {
  // Atualizado para aceitar o ID opcional, permitindo que o objeto completo passe
  onLogin: (user: { id?: string; name: string; email: string }) => void;
  lang: 'pt' | 'en';
}

interface InternalAuthProps extends AuthProps {
  onLanguageChange?: (lang: 'pt' | 'en') => void;
  onThemeChange?: () => void;
}



const authT = {
  pt: {
    signin: 'ENTRAR',
    signup: 'CADASTRAR',
    email: 'E-mail',
    pass: 'Senha',
    name: 'Nome Completo',
    username: 'Nome de usuário',
    btnIn: 'ENTRAR AGORA',
    btnUp: 'CRIAR E ACESSAR',
    desc: 'Um notebook typescript.',
    invalidCreds: 'E-mail/usuário ou senha incorretos.',
    networkError: 'Erro de conexão com o servidor.',
    genericError: 'Ocorreu um problema inesperado.',
    usernameExists: 'Este nome de usuário já está em uso.',
  },
  en: {
    signin: 'SIGN IN',
    signup: 'SIGN UP',
    email: 'Email',
    pass: 'Password',
    name: 'Full Name',
    username: 'Username',
    btnIn: 'SIGN IN NOW',
    btnUp: 'CREATE & ACCESS',
    desc: 'A typescript notebook.',
    invalidCreds: 'Invalid email/username or password.',
    networkError: 'Server connection error.',
    genericError: 'An unexpected problem occurred.',
    usernameExists: 'This username is already taken.',
  },
};

export default function Auth({ onLogin, lang, onLanguageChange, onThemeChange }: InternalAuthProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', username: '' });
  const [showPassword, setShowPassword] = useState(false);

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
    onThemeChange?.();
  };

  const toggleLanguage = () => {
    const newLang = lang === 'pt' ? 'en' : 'pt';
    onLanguageChange?.(newLang);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const endpoint = mode === 'signup' ? '/api/auth/register' : '/api/auth/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.genericError);
      }

      // --- LÓGICA ATUALIZADA AQUI ---

      if (mode === 'signup') {
        // Fluxo de Cadastro + Auto Login
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password })
        });

        if (loginRes.ok) {
          // IMPORTANTE: Lemos o JSON da resposta do login para pegar o ID real
          const loginData = await loginRes.json();
          if (loginData.user) {
            onLogin(loginData.user);
          } else {
            // Fallback caso a API não retorne user (mas deve retornar)
            onLogin({ name: formData.name, email: formData.email });
          }
        }
      } else {
        // Fluxo de Login Normal
        // IMPORTANTE: Agora usamos data.user que vem da API com o ID
        if (data.user) {
          onLogin(data.user);
        } else {
          // Se a API antiga não mandar user, montamos manualmente (mas sem ID vai dar erro no save)
          console.warn("API de login não retornou objeto user completo.");
          onLogin({ name: formData.name || formData.email.split('@')[0], email: formData.email });
        }
      }

    } catch (err: any) {
      let errMsg = err.message || t.genericError;
      if (errMsg.toLowerCase().includes('credential')) errMsg = t.invalidCreds;
      if (errMsg.toLowerCase().includes('username') && errMsg.toLowerCase().includes('taken')) errMsg = t.usernameExists;
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 relative">
      {/* Language and Theme toggles */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        <button
          onClick={toggleLanguage}
          className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:scale-110 cursor-pointer shadow-sm hover:shadow-md"
          title={lang === 'pt' ? 'Switch to English' : 'Mudar para Português'}
        >
          <Languages size={18} />
        </button>
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-300 dark:hover:border-amber-600 transition-all duration-300 hover:scale-110 cursor-pointer shadow-sm hover:shadow-md"
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-3xl mb-2 transition-all duration-300 hover:scale-105" style={{ fontFamily: 'var(--font-inter)' }}>
            <span style={{ color: '#0F69DD', fontWeight: 600 }} className="inline-block transition-all duration-300 hover:tracking-wider">TS</span>
            <span style={{ color: '#676767', fontWeight: 500 }} className="inline-block transition-all duration-300 hover:tracking-wider">Lab</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">{t.desc}</p>
        </div>

        <div
          className={`bg-white dark:bg-slate-900 border rounded-2xl p-8 shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 ${error ? 'border-red-400 dark:border-red-600 shake' : 'border-slate-200 dark:border-slate-800'
            }`}
        >
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 animate-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-medium leading-tight">{error}</p>
            </div>
          )}

          <div className="flex p-1 bg-slate-200 dark:bg-slate-700 rounded-lg mb-6 relative">
            <div
              className={`absolute top-1 bottom-1 bg-white dark:bg-slate-600 rounded-md shadow-sm transition-all duration-300 ease-out ${mode === 'signin' ? 'left-1 right-1/2 mr-0.5' : 'left-1/2 right-1 ml-0.5'}`}
            />
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-all duration-300 cursor-pointer relative z-10 ${mode === 'signin'
                ? 'text-slate-800 dark:text-white scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:scale-105'
                }`}
            >
              {t.signin}
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-all duration-300 cursor-pointer relative z-10 ${mode === 'signup'
                ? 'text-slate-800 dark:text-white scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:scale-105'
                }`}
            >
              {t.signup}
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {mode === 'signup' && (
              <div className="animate-in slide-in-from-top-4 fade-in duration-500 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.name}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 rounded-xl py-3 pl-11 pr-4 text-sm outline-none transition-all dark:text-white"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.username}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 rounded-xl py-3 pl-11 pr-4 text-sm outline-none transition-all dark:text-white"
                      placeholder="johndoe"
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2 animate-in slide-in-from-left-4 fade-in duration-300" style={{ animationDelay: mode === 'signup' ? '100ms' : '0ms' }}>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.email}</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors duration-200" size={18} />
                <input
                  type={mode === 'signup' ? 'email' : 'text'}
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 rounded-xl py-3 pl-11 pr-4 text-sm outline-none transition-all dark:text-white"
                  placeholder={mode === 'signup' ? 'john@example.com' : 'Email or username'}
                />
              </div>
            </div>
            <div className="space-y-2 animate-in slide-in-from-right-4 fade-in duration-300" style={{ animationDelay: mode === 'signup' ? '200ms' : '50ms' }}>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.pass}</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors duration-200" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 rounded-xl py-3 pl-11 pr-11 text-sm outline-none transition-all duration-300 dark:text-white hover:border-slate-300 dark:hover:border-slate-600"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-all duration-200 cursor-pointer hover:scale-110"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 mt-6 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] animate-in slide-in-from-bottom-4 fade-in"
              style={{ animationDelay: mode === 'signup' ? '300ms' : '100ms' }}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <span>{mode === 'signin' ? t.btnIn : t.btnUp}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}