'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  User, Lock, Trash2, Save, Loader2,
  ShieldAlert, CheckCircle2, AlertCircle,
  Languages, Moon, Sun, LogOut, Eye, EyeOff, ArrowLeft
} from 'lucide-react';
import { updateUserProfile, changePassword, deleteAccount, updateUserPreferences, updateUsername } from '@/app/_actions/users'

const settingsT = {
  pt: {
    settings: 'Configurações',
    profile: 'Perfil Público',
    profileDesc: 'Como você aparece no TSLab',
    email: 'Email',
    emailCantChange: 'O email não pode ser alterado.',
    fullName: 'Nome Completo',
    namePlaceholder: 'Seu nome',
    saveChanges: 'Salvar Alterações',
    security: 'Segurança',
    securityDesc: 'Alterar sua senha de acesso',
    currentPassword: 'Senha Atual',
    newPassword: 'Nova Senha',
    confirmPassword: 'Confirmar Nova Senha',
    updatePassword: 'Atualizar Senha',
    dangerZone: 'Zona de Perigo',
    dangerDesc: 'Ações irreversíveis',
    deleteAccount: 'Excluir conta e notebooks',
    deleteWarning: 'Ao excluir sua conta, todos os seus dados serão perdidos permanentemente.',
    deleteBtn: 'Excluir Conta',
    deleteConfirm: 'Esta ação é irreversível. Todos os seus notebooks serão apagados.\n\nDigite "DELETAR" para confirmar:',
    deleteKeyword: 'DELETAR',
    profileSuccess: 'Perfil atualizado com sucesso!',
    profileError: 'Erro ao atualizar perfil.',
    passwordMismatch: 'As novas senhas não coincidem.',
    passwordTooShort: 'A nova senha deve ter no mínimo 6 caracteres.',
    passwordSuccess: 'Senha alterada com sucesso!',
    passwordWrong: 'Senha atual incorreta.',
    passwordError: 'Erro ao alterar senha.',
    deleteError: 'Erro ao excluir conta.',
    user: 'Usuário',
    logout: 'Sair',
    preferences: 'Preferências',
    preferencesDesc: 'Configurações de idioma e tema',
    language: 'Idioma',
    theme: 'Tema',
    themeSystem: 'Sistema',
    themeLight: 'Claro',
    themeDark: 'Escuro',
    username: 'Username',
    usernamePlaceholder: 'Seu nome de usuário',
    usernameDesc: '3-20 caracteres: letras, números, underscores',
    usernameSuccess: 'Username atualizado!',
    usernameError: 'Erro ao atualizar username.',
    usernameTaken: 'Username já em uso.'
  },
  en: {
    settings: 'Settings',
    profile: 'Public Profile',
    profileDesc: 'How you appear on TSLab',
    email: 'Email',
    emailCantChange: 'Email cannot be changed.',
    fullName: 'Full Name',
    namePlaceholder: 'Your name',
    saveChanges: 'Save Changes',
    security: 'Security',
    securityDesc: 'Change your access password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm New Password',
    updatePassword: 'Update Password',
    dangerZone: 'Danger Zone',
    dangerDesc: 'Irreversible actions',
    deleteAccount: 'Delete account and notebooks',
    deleteWarning: 'By deleting your account, all your data will be permanently lost.',
    deleteBtn: 'Delete Account',
    deleteConfirm: 'This action is irreversible. All your notebooks will be deleted.\n\nType "DELETE" to confirm:',
    deleteKeyword: 'DELETE',
    profileSuccess: 'Profile updated successfully!',
    profileError: 'Error updating profile.',
    passwordMismatch: 'New passwords do not match.',
    passwordTooShort: 'New password must be at least 6 characters.',
    passwordSuccess: 'Password changed successfully!',
    passwordWrong: 'Current password is incorrect.',
    passwordError: 'Error changing password.',
    deleteError: 'Error deleting account.',
    user: 'User',
    logout: 'Logout',
    preferences: 'Preferences',
    preferencesDesc: 'Language and theme settings',
    language: 'Language',
    theme: 'Theme',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    username: 'Username',
    usernamePlaceholder: 'Your username',
    usernameDesc: '3-20 characters: letters, numbers, underscores',
    usernameSuccess: 'Username updated!',
    usernameError: 'Error updating username.',
    usernameTaken: 'Username already taken.'
  }
};

export default function SettingsPage() {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<'pt' | 'en'>('en');
  const t = settingsT[lang];

  // Estados dos formulários
  const [name, setName] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  // Feedback visual
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, msg: string }>({ type: null, msg: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  useEffect(() => {
    setMounted(true);
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setName(data.user.name || '');
        setUsernameInput(data.user.username || '');
        // Apply user preferences from database
        if (data.user.language) {
          setLang(data.user.language as 'pt' | 'en');
        }
        if (data.user.theme) {
          setTheme(data.user.theme);
        }
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = async (newLang: 'pt' | 'en') => {
    setLang(newLang);
    if (user?.id) {
      await updateUserPreferences(user.id, { language: newLang });
    }
  };

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    if (user?.id) {
      await updateUserPreferences(user.id, { theme: newTheme });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatus({ type: null, msg: '' });

    try {
      await updateUserProfile(user.id, name);
      setStatus({ type: 'success', msg: t.profileSuccess });
      // Atualiza o estado local do usuário também
      setUser({ ...user, name });
    } catch (err) {
      setStatus({ type: 'error', msg: t.profileError });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!usernameInput.trim()) return;
    setIsSaving(true);
    setStatus({ type: null, msg: '' });

    try {
      await updateUsername(user.id, usernameInput.trim());
      setStatus({ type: 'success', msg: t.usernameSuccess });
      setUser({ ...user, username: usernameInput.trim() });
    } catch (err: any) {
      if (err.message.includes('already taken')) {
        setStatus({ type: 'error', msg: t.usernameTaken });
      } else {
        setStatus({ type: 'error', msg: t.usernameError });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: null, msg: '' });

    if (passwords.new !== passwords.confirm) {
      setStatus({ type: 'error', msg: t.passwordMismatch });
      return;
    }

    if (passwords.new.length < 6) {
      setStatus({ type: 'error', msg: t.passwordTooShort });
      return;
    }

    setIsSaving(true);
    try {
      await changePassword(user.id, passwords.current, passwords.new);
      setStatus({ type: 'success', msg: t.passwordSuccess });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      // Tenta pegar a mensagem de erro da Server Action (ex: "Senha atual incorreta")
      setStatus({ type: 'error', msg: err.message.includes('incorreta') || err.message.includes('incorrect') ? t.passwordWrong : t.passwordError });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmText = prompt(t.deleteConfirm);
    if (confirmText !== t.deleteKeyword) return;

    setIsSaving(true);
    try {
      await deleteAccount(user.id);
      // Chama a API de logout para limpar o cookie
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/'); // Auth component vai assumir
      router.refresh();
    } catch (err) {
      alert(t.deleteError);
      setIsSaving(false);
    }
  };

  const toggleLang = () => setLang(prev => prev === 'pt' ? 'en' : 'pt');
  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">

      {/* Header padrão da aplicação */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                TSLab
              </span>
              <span className="font-medium text-sm text-slate-800 dark:text-slate-100">{t.settings}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {user?.name || t.user}
              </span>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors cursor-pointer" title={t.logout}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Feedback de Status Global */}
        {status.msg && (
          <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${status.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/50'
            : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/50'
            }`}>
            {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="font-medium text-sm">{status.msg}</span>
          </div>
        )}

        {/* Preferências / Preferences */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
              <Languages size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg">{t.preferences}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.preferencesDesc}</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Language Selector */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2 ml-1">{t.language}</label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${lang === 'en'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                  🇺🇸 English
                </button>
                <button
                  onClick={() => handleLanguageChange('pt')}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${lang === 'pt'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                  🇧🇷 Português
                </button>
              </div>
            </div>

            {/* Theme Selector */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2 ml-1">{t.theme}</label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleThemeChange('system')}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${resolvedTheme === undefined || (!['light', 'dark'].includes(resolvedTheme || ''))
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                  {t.themeSystem}
                </button>
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${resolvedTheme === 'light'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                  <Sun size={16} /> {t.themeLight}
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${resolvedTheme === 'dark'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                  <Moon size={16} /> {t.themeDark}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Cartão de Perfil */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
              <User size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg">{t.profile}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.profileDesc}</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 ml-1">{t.email}</label>
              <input
                type="email"
                value={user?.email}
                disabled
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed opacity-70"
              />
              <p className="text-[10px] text-slate-400 mt-1 ml-1">{t.emailCantChange}</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 ml-1">{t.username}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  placeholder={t.usernamePlaceholder}
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={handleUpdateUsername}
                  disabled={isSaving || usernameInput === user?.username}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Save size={16} />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 ml-1">{t.usernameDesc}</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 ml-1">{t.fullName}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-3 text-sm outline-none transition-all"
                placeholder={t.namePlaceholder}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none cursor-pointer"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {t.saveChanges}
              </button>
            </div>
          </form>
        </section>

        {/* Cartão de Segurança */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600">
              <Lock size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg">{t.security}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.securityDesc}</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 ml-1">{t.currentPassword}</label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  required
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl px-4 py-3 pr-12 text-sm outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 ml-1">{t.newPassword}</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    required
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl px-4 py-3 pr-12 text-sm outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 ml-1">{t.confirmPassword}</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    required
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl px-4 py-3 pr-12 text-sm outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                {t.updatePassword}
              </button>
            </div>
          </form>
        </section>

        {/* Zona de Perigo */}
        <section className="bg-red-50/50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-red-700 dark:text-red-400">{t.dangerZone}</h2>
              <p className="text-xs text-red-600/70 dark:text-red-400/70">{t.dangerDesc}</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.deleteAccount}</p>
              <p className="text-xs text-slate-500">{t.deleteWarning}</p>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="px-5 py-2.5 bg-white dark:bg-slate-950 border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-800 hover:scale-[1.02] hover:shadow-md hover:shadow-red-500/10 active:scale-[0.98] rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-200 shadow-sm shrink-0 cursor-pointer"
            >
              <Trash2 size={16} /> {t.deleteBtn}
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}