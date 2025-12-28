
import { ENV } from './env';

export interface DbConfig {
  type: 'local' | 'supabase' | 'rest';
  url: string;
  apiKey: string;
  isFromEnv?: boolean; 
}

const CONFIG_KEY = 'ts_lab_db_config';

export const getDbConfig = (): DbConfig => {
  if (ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY) {
    return {
      type: 'supabase',
      url: ENV.SUPABASE_URL,
      apiKey: ENV.SUPABASE_ANON_KEY,
      isFromEnv: true
    };
  }

  const saved = localStorage.getItem(CONFIG_KEY);
  if (saved) {
    return { ...JSON.parse(saved), isFromEnv: false };
  }

  return { type: 'local', url: '', apiKey: '', isFromEnv: false };
};

export const saveDbConfig = (config: DbConfig) => {
  if (!config.isFromEnv) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }
};

export const supabaseAuth = {
  signUp: async (config: DbConfig, email: string, password: string, name: string) => {
    if (!config.url || !config.apiKey) throw new Error("Supabase não configurado.");
    
    const res = await fetch(`${config.url}/auth/v1/signup`, {
      method: 'POST',
      headers: { 'apikey': config.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, data: { full_name: name } })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || data.error_description || "Erro no cadastro");
    return data;
  },

  signIn: async (config: DbConfig, email: string, password: string) => {
    if (!config.url || !config.apiKey) throw new Error("Supabase não configurado.");

    const res = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'apikey': config.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.msg || "Erro no login");
    return data;
  }
};

/**
 * Serviço de Notebooks para o Supabase
 */
export const notebookService = {
  list: async (config: DbConfig, token: string) => {
    if (!config.url || !config.apiKey) return [];
    const res = await fetch(`${config.url}/rest/v1/notebooks?select=id,name,updated_at&order=updated_at.desc`, {
      headers: {
        'apikey': config.apiKey,
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) return [];
    return await res.json();
  },

  get: async (config: DbConfig, token: string, id: string) => {
    const res = await fetch(`${config.url}/rest/v1/notebooks?id=eq.${id}&select=*`, {
      headers: {
        'apikey': config.apiKey,
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    return data[0];
  },

  upsert: async (config: DbConfig, token: string, notebook: any) => {
    // Extração segura do user_id do JWT do Supabase
    let userId;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub;
    } catch (e) {
      console.error("Falha ao decodificar token", e);
    }

    const res = await fetch(`${config.url}/rest/v1/notebooks`, {
      method: 'POST',
      headers: {
        'apikey': config.apiKey,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify({
        id: notebook.id,
        name: notebook.name,
        content: { cells: notebook.cells, theme: notebook.theme },
        updated_at: new Date().toISOString(),
        user_id: userId
      })
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Erro ao salvar no Supabase. Verifique se a tabela 'notebooks' foi criada e o RLS configurado.");
    }
    
    return await res.json();
  },

  delete: async (config: DbConfig, token: string, id: string) => {
    const res = await fetch(`${config.url}/rest/v1/notebooks?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': config.apiKey,
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error("Erro ao excluir notebook");
  }
};

export const createSupabaseClient = (config: DbConfig) => {
  if (!config.url || !config.apiKey) return null;
  return {
    from: (table: string) => ({
      select: async (columns: string = '*') => {
        const res = await fetch(`${config.url}/rest/v1/${table}?select=${columns}`, {
          headers: { 'apikey': config.apiKey, 'Authorization': `Bearer ${config.apiKey}` }
        });
        return await res.json();
      },
      insert: async (data: any) => {
        const res = await fetch(`${config.url}/rest/v1/${table}`, {
          method: 'POST',
          headers: { 'apikey': config.apiKey, 'Authorization': `Bearer ${config.apiKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
          body: JSON.stringify(data)
        });
        return await res.json();
      }
    })
  };
};

export const restClient = {
  get: async (url: string, headers = {}) => {
    const res = await fetch(url, { headers });
    return await res.json();
  },
  post: async (url: string, data: any, headers = {}) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(data)
    });
    return await res.json();
  }
};
