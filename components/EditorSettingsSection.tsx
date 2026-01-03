'use client';

import React, { useState, useEffect } from 'react';
import { Code, Loader2, Save, RotateCcw } from 'lucide-react';
import {
  EditorSettings,
  DEFAULT_EDITOR_SETTINGS,
  FONT_FAMILIES,
  CURSOR_STYLES,
  LINE_NUMBER_OPTIONS,
  WORD_WRAP_OPTIONS,
  WHITESPACE_OPTIONS
} from '@/lib/editor-settings';

interface EditorSettingsSectionProps {
  lang: 'pt' | 'en';
}

const translations = {
  pt: {
    title: 'Editor',
    desc: 'Personalize o editor de código',
    appearance: 'Aparência',
    display: 'Exibição',
    behavior: 'Comportamento',
    formatting: 'Formatação',
    fontSize: 'Tamanho da fonte',
    fontFamily: 'Fonte',
    cursorStyle: 'Estilo do cursor',
    lineNumbers: 'Números de linha',
    minimap: 'Mostrar minimap',
    wordWrap: 'Quebra de linha',
    whitespace: 'Exibir espaços',
    tabSize: 'Tamanho do Tab',
    insertSpaces: 'Usar espaços (não tabs)',
    scrollBeyondLastLine: 'Rolar além da última linha',
    bracketColorization: 'Colorir pares de colchetes',
    formatOnSave: 'Formatar ao salvar',
    formatOnPaste: 'Formatar ao colar',
    autoSave: 'Salvar automaticamente',
    autoSaveDelay: 'Delay do auto-save (segundos)',
    save: 'Salvar Configurações',
    reset: 'Restaurar Padrões',
    success: 'Configurações do editor salvas!',
    error: 'Erro ao salvar configurações.',
    resetSuccess: 'Configurações restauradas!',
  },
  en: {
    title: 'Editor',
    desc: 'Customize the code editor',
    appearance: 'Appearance',
    display: 'Display',
    behavior: 'Behavior',
    formatting: 'Formatting',
    fontSize: 'Font size',
    fontFamily: 'Font family',
    cursorStyle: 'Cursor style',
    lineNumbers: 'Line numbers',
    minimap: 'Show minimap',
    wordWrap: 'Word wrap',
    whitespace: 'Show whitespace',
    tabSize: 'Tab size',
    insertSpaces: 'Use spaces (not tabs)',
    scrollBeyondLastLine: 'Scroll beyond last line',
    bracketColorization: 'Bracket pair colorization',
    formatOnSave: 'Format on save',
    formatOnPaste: 'Format on paste',
    autoSave: 'Auto-save',
    autoSaveDelay: 'Auto-save delay (seconds)',
    save: 'Save Settings',
    reset: 'Reset to Defaults',
    success: 'Editor settings saved!',
    error: 'Error saving settings.',
    resetSuccess: 'Settings reset!',
  }
};

export default function EditorSettingsSection({ lang }: EditorSettingsSectionProps) {
  const t = translations[lang];
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_EDITOR_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, msg: string }>({ type: null, msg: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/user/editor-settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading editor settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatus({ type: null, msg: '' });

    try {
      const res = await fetch('/api/user/editor-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });

      if (res.ok) {
        setStatus({ type: 'success', msg: t.success });
        setTimeout(() => setStatus({ type: null, msg: '' }), 3000);
      } else {
        setStatus({ type: 'error', msg: t.error });
      }
    } catch (error) {
      setStatus({ type: 'error', msg: t.error });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm(lang === 'pt' ? 'Restaurar configurações padrão?' : 'Reset to default settings?')) return;

    setIsSaving(true);
    setStatus({ type: null, msg: '' });

    try {
      const res = await fetch('/api/user/editor-settings', {
        method: 'POST'
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setStatus({ type: 'success', msg: t.resetSuccess });
        setTimeout(() => setStatus({ type: null, msg: '' }), 3000);
      } else {
        setStatus({ type: 'error', msg: t.error });
      }
    } catch (error) {
      setStatus({ type: 'error', msg: t.error });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-blue-600" size={24} />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600">
          <Code size={20} />
        </div>
        <div>
          <h2 className="font-bold text-lg">{t.title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.desc}</p>
        </div>
      </div>

      {status.msg && (
        <div className={`p-3 rounded-lg mb-4 text-sm ${status.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300'
            : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300'
          }`}>
          {status.msg}
        </div>
      )}

      <div className="space-y-6">
        {/* Appearance */}
        <div>
          <h3 className="text-xs font-bold uppercase text-slate-400 mb-3">{t.appearance}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t.fontSize}: {settings.fontSize}px
              </label>
              <input
                type="range"
                min="10"
                max="30"
                value={settings.fontSize}
                onChange={(e) => setSettings({ ...settings, fontSize: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t.fontFamily}
              </label>
              <select
                value={settings.fontFamily}
                onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm"
              >
                {FONT_FAMILIES.map(font => (
                  <option key={font.value} value={font.value}>{font.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t.cursorStyle}
              </label>
              <select
                value={settings.cursorStyle}
                onChange={(e) => setSettings({ ...settings, cursorStyle: e.target.value as any })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm"
              >
                {CURSOR_STYLES.map(style => (
                  <option key={style.value} value={style.value}>{style.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Display */}
        <div>
          <h3 className="text-xs font-bold uppercase text-slate-400 mb-3">{t.display}</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t.lineNumbers}
              </label>
              <select
                value={settings.lineNumbers}
                onChange={(e) => setSettings({ ...settings, lineNumbers: e.target.value as any })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm"
              >
                {LINE_NUMBER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.minimap}
                onChange={(e) => setSettings({ ...settings, minimap: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.minimap}</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t.wordWrap}
              </label>
              <select
                value={settings.wordWrap}
                onChange={(e) => setSettings({ ...settings, wordWrap: e.target.value as any })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm"
              >
                {WORD_WRAP_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t.whitespace}
              </label>
              <select
                value={settings.renderWhitespace}
                onChange={(e) => setSettings({ ...settings, renderWhitespace: e.target.value as any })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm"
              >
                {WHITESPACE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Behavior */}
        <div>
          <h3 className="text-xs font-bold uppercase text-slate-400 mb-3">{t.behavior}</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t.tabSize}
              </label>
              <select
                value={settings.tabSize}
                onChange={(e) => setSettings({ ...settings, tabSize: parseInt(e.target.value) })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm"
              >
                <option value="2">2</option>
                <option value="4">4</option>
                <option value="8">8</option>
              </select>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.insertSpaces}
                onChange={(e) => setSettings({ ...settings, insertSpaces: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.insertSpaces}</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.scrollBeyondLastLine}
                onChange={(e) => setSettings({ ...settings, scrollBeyondLastLine: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.scrollBeyondLastLine}</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.bracketPairColorization}
                onChange={(e) => setSettings({ ...settings, bracketPairColorization: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.bracketColorization}</span>
            </label>
          </div>
        </div>

        {/* Formatting */}
        <div>
          <h3 className="text-xs font-bold uppercase text-slate-400 mb-3">{t.formatting}</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.formatOnSave}
                onChange={(e) => setSettings({ ...settings, formatOnSave: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.formatOnSave}</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.formatOnPaste}
                onChange={(e) => setSettings({ ...settings, formatOnPaste: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.formatOnPaste}</span>
            </label>
          </div>
        </div>

        {/* Auto-save */}
        <div>
          <h3 className="text-xs font-bold uppercase text-slate-400 mb-3">Auto-save</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) => setSettings({ ...settings, autoSave: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.autoSave}</span>
            </label>

            {settings.autoSave && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t.autoSaveDelay}: {settings.autoSaveDelay / 1000}s
                </label>
                <input
                  type="range"
                  min="1000"
                  max="10000"
                  step="1000"
                  value={settings.autoSaveDelay}
                  onChange={(e) => setSettings({ ...settings, autoSaveDelay: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleReset}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw size={16} />
            {t.reset}
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {t.save}
          </button>
        </div>
      </div>
    </section>
  );
}
