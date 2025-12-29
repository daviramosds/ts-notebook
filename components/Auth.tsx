'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, ArrowRight, Loader2, Moon, Sun, AlertCircle, Languages } from 'lucide-react';

interface AuthProps {
  // Atualizado para aceitar o ID opcional, permitindo que o objeto completo passe
  onLogin: (user: { id?: string; name: string; email: string }) => void;
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
    desc: 'Autenticação segura via JWT.',
    invalidCreds: 'E-mail ou senha incorretos.',
    networkError: 'Erro de conexão com o servidor.',
    genericError: 'Ocorreu um problema inesperado.',
  },
  en: {
    signin: 'SIGN IN',
    signup: 'SIGN UP',
    email: 'Email',
    pass: 'Password',
    name: 'Full Name',
    btnIn: 'SIGN IN NOW',
    btnUp: 'CREATE & ACCESS',
    desc: 'Secure JWT authentication.',
    invalidCreds: 'Invalid email or password.',
    networkError: 'Server connection error.',
    genericError: 'An unexpected problem occurred.',
  },
};

export default function Auth({ onLogin, lang, onToggleLang }: AuthProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
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
        <button
          onClick={toggleTheme}
          className="p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 hover:scale-110 transition-all shadow-xl"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      <div className="w-full max-w-[440px] relative z-10">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-[22px] text-white font-black text-3xl shadow-2xl shadow-blue-500/30 mb-6 transform hover:rotate-6">
            TS
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            <span className="text-blue-600">TS</span>Lab
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">{t.desc}</p>
        </div>

        <div
          className={`bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border transition-all duration-300 rounded-[40px] p-10 shadow-2xl ${error ? 'border-red-500/50 animate-shake' : 'border-slate-200 dark:border-slate-800'
            }`}
        >
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 animate-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-xs font-bold leading-tight">{error}</p>
            </div>
          )}

          <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-[20px] mb-8">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-3 text-[11px] font-black tracking-widest rounded-[16px] transition-all ${mode === 'signin'
                ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xl'
                : 'text-slate-500'
                }`}
            >
              {t.signin}
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-3 text-[11px] font-black tracking-widest rounded-[16px] transition-all ${mode === 'signup'
                ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xl'
                : 'text-slate-500'
                }`}
            >
              {t.signup}
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">{t.name}</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-blue-500/20 focus:bg-white dark:focus:bg-slate-900 rounded-[20px] py-4 pl-14 pr-6 text-sm outline-none transition-all dark:text-white"
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">{t.email}</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-blue-500/20 focus:bg-white dark:focus:bg-slate-900 rounded-[20px] py-4 pl-14 pr-6 text-sm outline-none transition-all dark:text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">{t.pass}</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-blue-500/20 focus:bg-white dark:focus:bg-slate-900 rounded-[20px] py-4 pl-14 pr-6 text-sm outline-none transition-all dark:text-white"
                />
              </div>
            </div>
            <button
              disabled={isLoading}
              className="group w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-[22px] shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 mt-8 relative overflow-hidden"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span className="relative z-10">{mode === 'signin' ? t.btnIn : t.btnUp}</span>
                  <ArrowRight
                    size={20}
                    strokeWidth={3}
                    className="relative z-10 group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}