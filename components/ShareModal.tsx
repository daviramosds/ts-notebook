'use client';

import { useState, useEffect } from 'react';
import {
  X, Share2, Globe, Lock, Users, Clock, Eye, EyeOff,
  Copy, Check, Loader2, Trash2, Shield, User, Calendar,
  AlertCircle, CheckCircle2
} from 'lucide-react';
import { getShareSettings, updateShareSettings, getAccessLogs, disableShare } from '@/app/_actions/share';

type ShareSettings = {
  id?: string;
  isEnabled: boolean;
  hasPassword: boolean;
  expiresAt: Date | null;
  accessType: 'public' | 'authenticated' | 'restricted';
  allowedEmails: string[];
  createdAt?: Date;
};

type AccessLog = {
  id: string;
  userEmail: string | null;
  userName: string | null;
  accessedAt: Date;
  ipAddress: string | null;
};

type Props = {
  notebookId: string;
  notebookName: string;
  isOpen: boolean;
  onClose: () => void;
  lang: 'pt' | 'en';
};

const translations = {
  pt: {
    title: 'Compartilhar Notebook',
    enableShare: 'Ativar compartilhamento',
    shareLink: 'Link de compartilhamento',
    copied: 'Copiado!',
    copy: 'Copiar',
    accessType: 'Tipo de acesso',
    public: 'Público',
    publicDesc: 'Qualquer pessoa com o link',
    authenticated: 'Autenticado',
    authenticatedDesc: 'Apenas usuários logados',
    restricted: 'Restrito',
    restrictedDesc: 'Apenas emails específicos',
    allowedEmails: 'Emails permitidos',
    addEmail: 'Adicionar email',
    password: 'Senha',
    passwordProtection: 'Proteção por senha',
    addPassword: 'Adicionar senha',
    removePassword: 'Remover senha',
    expiration: 'Expiração',
    never: 'Nunca',
    custom: 'Data específica',
    expiresAt: 'Expira em',
    accessLogs: 'Histórico de acessos',
    noLogs: 'Nenhum acesso registrado',
    anonymous: 'Anônimo',
    save: 'Salvar',
    saving: 'Salvando...',
    cancel: 'Cancelar',
    disableShare: 'Desativar compartilhamento',
    settings: 'Configurações',
    logs: 'Acessos'
  },
  en: {
    title: 'Share Notebook',
    enableShare: 'Enable sharing',
    shareLink: 'Share link',
    copied: 'Copied!',
    copy: 'Copy',
    accessType: 'Access type',
    public: 'Public',
    publicDesc: 'Anyone with the link',
    authenticated: 'Authenticated',
    authenticatedDesc: 'Only logged-in users',
    restricted: 'Restricted',
    restrictedDesc: 'Only specific emails',
    allowedEmails: 'Allowed emails',
    addEmail: 'Add email',
    password: 'Password',
    passwordProtection: 'Password protection',
    addPassword: 'Add password',
    removePassword: 'Remove password',
    expiration: 'Expiration',
    never: 'Never',
    custom: 'Custom date',
    expiresAt: 'Expires at',
    accessLogs: 'Access history',
    noLogs: 'No access recorded',
    anonymous: 'Anonymous',
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    disableShare: 'Disable sharing',
    settings: 'Settings',
    logs: 'Access'
  }
};

export default function ShareModal({ notebookId, notebookName, isOpen, onClose, lang }: Props) {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'settings' | 'logs'>('settings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Settings state
  const [isEnabled, setIsEnabled] = useState(false);
  const [accessType, setAccessType] = useState<'public' | 'authenticated' | 'restricted'>('public');
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [removePassword, setRemovePassword] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [neverExpires, setNeverExpires] = useState(true);
  const [allowedEmails, setAllowedEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');

  // Logs state
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/share/${notebookId}`
    : '';

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen, notebookId]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const settings = await getShareSettings(notebookId);
      if (settings) {
        setIsEnabled(settings.isEnabled);
        setAccessType(settings.accessType);
        setHasPassword(settings.hasPassword);
        setAllowedEmails(settings.allowedEmails);
        if (settings.expiresAt) {
          setNeverExpires(false);
          setExpiresAt(new Date(settings.expiresAt).toISOString().slice(0, 16));
        } else {
          setNeverExpires(true);
          setExpiresAt('');
        }
      }
    } catch (err) {
      console.error('Error loading share settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const accessLogs = await getAccessLogs(notebookId);
      setLogs(accessLogs);
    } catch (err) {
      console.error('Error loading access logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs' && logs.length === 0) {
      loadLogs();
    }
  }, [activeTab]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateShareSettings(notebookId, {
        isEnabled,
        accessType,
        password: password || undefined,
        removePassword: removePassword,
        expiresAt: neverExpires ? null : expiresAt ? new Date(expiresAt) : null,
        allowedEmails
      });
      setPassword('');
      setRemovePassword(false);
      setHasPassword(!!password || (hasPassword && !removePassword));
      onClose();
    } catch (err) {
      console.error('Error saving share settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (email && email.includes('@') && !allowedEmails.includes(email)) {
      setAllowedEmails([...allowedEmails, email]);
      setNewEmail('');
    }
  };

  const handleRemoveEmail = (email: string) => {
    setAllowedEmails(allowedEmails.filter(e => e !== email));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
              <Share2 size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">{t.title}</h2>
              <p className="text-xs text-slate-500 truncate max-w-[200px]">{notebookName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 text-sm font-medium transition-colors cursor-pointer ${activeTab === 'settings'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            {t.settings}
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 py-3 text-sm font-medium transition-colors cursor-pointer ${activeTab === 'logs'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            {t.logs}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="animate-spin text-blue-600" size={24} />
            </div>
          ) : activeTab === 'settings' ? (
            <div className="space-y-6">
              {/* Enable toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe size={18} className={isEnabled ? 'text-green-500' : 'text-slate-400'} />
                  <span className="font-medium text-slate-700 dark:text-slate-200">{t.enableShare}</span>
                </div>
                <button
                  onClick={() => setIsEnabled(!isEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${isEnabled ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                </button>
              </div>

              {isEnabled && (
                <>
                  {/* Share Link */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2">{t.shareLink}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-400"
                      />
                      <button
                        onClick={handleCopyLink}
                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer ${copied
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? t.copied : t.copy}
                      </button>
                    </div>
                  </div>

                  {/* Access Type */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-3">{t.accessType}</label>
                    <div className="space-y-2">
                      {[
                        { value: 'public', icon: Globe, label: t.public, desc: t.publicDesc },
                        { value: 'authenticated', icon: User, label: t.authenticated, desc: t.authenticatedDesc },
                        { value: 'restricted', icon: Users, label: t.restricted, desc: t.restrictedDesc }
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => setAccessType(option.value as typeof accessType)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${accessType === option.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                        >
                          <option.icon size={18} className={accessType === option.value ? 'text-blue-600' : 'text-slate-400'} />
                          <div className="text-left">
                            <div className={`font-medium text-sm ${accessType === option.value ? 'text-blue-600' : 'text-slate-700 dark:text-slate-200'}`}>
                              {option.label}
                            </div>
                            <div className="text-xs text-slate-500">{option.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Allowed Emails (for restricted) */}
                  {accessType === 'restricted' && (
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2">{t.allowedEmails}</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="email"
                          value={newEmail}
                          onChange={e => setNewEmail(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddEmail()}
                          placeholder="email@example.com"
                          className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                        />
                        <button
                          onClick={handleAddEmail}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          {t.addEmail}
                        </button>
                      </div>
                      {allowedEmails.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {allowedEmails.map(email => (
                            <span
                              key={email}
                              className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-xs font-medium rounded-lg"
                            >
                              {email}
                              <button
                                onClick={() => handleRemoveEmail(email)}
                                className="p-0.5 hover:bg-blue-100 dark:hover:bg-blue-800 rounded cursor-pointer"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2">{t.passwordProtection}</label>
                    {hasPassword && !removePassword ? (
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Lock size={14} className="text-green-500" />
                          <span>{t.password}: ••••••••</span>
                        </div>
                        <button
                          onClick={() => setRemovePassword(true)}
                          className="text-xs text-red-500 hover:text-red-600 font-medium cursor-pointer"
                        >
                          {t.removePassword}
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder={hasPassword ? t.password + ' (' + (lang === 'pt' ? 'nova' : 'new') + ')' : t.addPassword}
                          className="w-full px-3 py-2 pr-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                        />
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Expiration */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2">{t.expiration}</label>
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => { setNeverExpires(true); setExpiresAt(''); }}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${neverExpires
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                      >
                        {t.never}
                      </button>
                      <button
                        onClick={() => setNeverExpires(false)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${!neverExpires
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                      >
                        {t.custom}
                      </button>
                    </div>
                    {!neverExpires && (
                      <input
                        type="datetime-local"
                        value={expiresAt}
                        onChange={e => setExpiresAt(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Access Logs Tab */
            <div>
              {logsLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="animate-spin text-blue-600" size={24} />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Clock size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t.noLogs}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map(log => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-slate-700 rounded-lg">
                          <User size={14} className="text-slate-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            {log.userName || log.userEmail || t.anonymous}
                          </div>
                          {log.userEmail && log.userName && (
                            <div className="text-xs text-slate-400">{log.userEmail}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(log.accessedAt).toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'settings' && (
          <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? t.saving : t.save}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
