'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, ArrowRight, Loader2, Moon, Sun, AlertCircle, Languages, Eye, EyeOff } from 'lucide-react';

interface AuthProps {
  // Atualizado para aceitar o ID opcional, permitindo que o objeto completo passe
  onLogin: (user: { id?: string; name: string; email: string }) => void;
  lang: 'pt' | 'en';
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
    desc: 'Um notebook typescript.',
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
    desc: 'A typescript notebook.',
    invalidCreds: 'Invalid email or password.',
    networkError: 'Server connection error.',
    genericError: 'An unexpected problem occurred.',
  },
};

export default function Auth({ onLogin, lang }: AuthProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
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
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900 p-4 font-sans">
      <div className="w-full max-w-[380px] relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg text-white font-mono font-bold text-xl mb-4">
            TS
          </div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
            <span className="text-blue-600">TS</span><span className="text-slate-500 dark:text-slate-400">Lab</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">{t.desc}</p>
        </div>

        <div
          className={`bg-slate-50 dark:bg-slate-800 border rounded-xl p-8 ${error ? 'border-red-400 dark:border-red-600' : 'border-slate-200 dark:border-slate-700'
            }`}
        >
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 animate-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-xs font-bold leading-tight">{error}</p>
            </div>
          )}

          <div className="flex p-1 bg-slate-200 dark:bg-slate-700 rounded-lg mb-6">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${mode === 'signin'
                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
              {t.signin}
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${mode === 'signup'
                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
              {t.signup}
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">{t.name}</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none transition-colors dark:text-white"
                  />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">{t.email}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none transition-colors dark:text-white"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">{t.pass}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg py-2.5 pl-10 pr-10 text-sm outline-none transition-colors dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors mt-6 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <span>{mode === 'signin' ? t.btnIn : t.btnUp}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}