'use client';
import React, { useState } from 'react';
import { X, Settings, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import { getDbConfig, saveDbConfig, DbConfig } from '@/lib/database-manager';

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  notebookContext: string;
}

export default function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const [dbConfig, setDbConfig] = useState<DbConfig>(getDbConfig());

  const handleSaveConfig = () => {
    saveDbConfig(dbConfig);
    alert('Configurações salvas!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-[60] flex flex-col animate-in slide-in-from-right duration-300">
      {/* Cabeçalho */}
      <div className="p-2 border-b border-slate-200 dark:border-slate-800 flex bg-slate-50 dark:bg-slate-950 gap-2">
        <div className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold rounded-md bg-white dark:bg-slate-800 text-blue-600 shadow-sm transition-all">
          <Settings size={12} /> CONEXÕES & CONFIG
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-400">
          <X size={14} />
        </button>
      </div>

      {/* Conteúdo de Configurações */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-2">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <LinkIcon size={16} className="text-blue-500" /> External Connections
          </h3>
          <p className="text-xs opacity-50">Conecte seu notebook a APIs externas.</p>
        </div>

        <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 font-bold text-xs">
            <ShieldCheck size={14} className="text-green-500" /> Supabase / API Config
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase opacity-50">Project URL</label>
            <input
              type="text"
              value={dbConfig.url}
              onChange={e => setDbConfig({ ...dbConfig, url: e.target.value })}
              placeholder="https://seu-projeto.supabase.co"
              className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase opacity-50">API Key</label>
            <input
              type="password"
              value={dbConfig.apiKey}
              onChange={e => setDbConfig({ ...dbConfig, apiKey: e.target.value })}
              placeholder="Key..."
              className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleSaveConfig}
            className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
          >
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}