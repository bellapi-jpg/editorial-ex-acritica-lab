import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

interface ConfigState {
  automation_enabled: boolean;
  twitter_enabled: boolean;
  facebook_enabled: boolean;
  rss_url: string;
  max_retry_count: string;
}

const DEFAULT_CONFIG: ConfigState = {
  automation_enabled: true,
  twitter_enabled: true,
  facebook_enabled: true,
  rss_url: 'https://acritica.com/feedrss/acritica_.xml',
  max_retry_count: '5',
};

export const SocialConfig: React.FC = () => {
  const [config, setConfig] = useState<ConfigState>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testingConn, setTestingConn] = useState(false);
  const [connResult, setConnResult] = useState<{
    twitter: { valid: boolean; username?: string; error?: string };
    facebook: { valid: boolean; pageName?: string; error?: string };
  } | null>(null);

  const loadConfig = useCallback(async () => {
    const { data } = await supabase.from('config').select('key, value');
    if (data) {
      const map = Object.fromEntries(data.map((r: { key: string; value: string }) => [r.key, r.value]));
      setConfig({
        automation_enabled: map['automation_enabled'] !== 'false',
        twitter_enabled: map['twitter_enabled'] !== 'false',
        facebook_enabled: map['facebook_enabled'] !== 'false',
        rss_url: map['rss_url'] ?? DEFAULT_CONFIG.rss_url,
        max_retry_count: map['max_retry_count'] ?? '5',
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const saveConfig = async () => {
    setSaving(true);
    try {
      const rows = [
        { key: 'automation_enabled', value: String(config.automation_enabled) },
        { key: 'twitter_enabled', value: String(config.twitter_enabled) },
        { key: 'facebook_enabled', value: String(config.facebook_enabled) },
        { key: 'rss_url', value: config.rss_url },
        { key: 'max_retry_count', value: config.max_retry_count },
      ];

      const { error } = await supabase.from('config').upsert(rows, { onConflict: 'key' });
      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert('Erro ao salvar: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  const testConnections = async () => {
    setTestingConn(true);
    setConnResult(null);
    try {
      const res = await fetch('/api/test-connection');
      setConnResult(await res.json());
    } catch (err) {
      alert('Erro ao testar: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    } finally {
      setTestingConn(false);
    }
  };

  const Toggle: React.FC<{
    label: string;
    value: boolean;
    onChange: (v: boolean) => void;
    sublabel?: string;
  }> = ({ label, value, onChange, sublabel }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <div>
        <div className="text-sm font-medium text-slate-800">{label}</div>
        {sublabel && <div className="text-xs text-slate-400 mono">{sublabel}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-colors relative ${value ? 'bg-slate-900' : 'bg-slate-200'}`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  );

  if (loading) {
    return <div className="text-sm text-slate-400 py-8 text-center mono">Carregando...</div>;
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-lg font-black mono uppercase tracking-tight">Configurações</h2>
        <p className="text-xs text-slate-500 mt-0.5">Controles da automação</p>
      </div>

      {/* Automação */}
      <div className="border border-slate-100 rounded-lg p-4 space-y-1">
        <div className="text-[10px] mono uppercase tracking-widest text-slate-400 font-bold mb-3">Automação</div>
        <Toggle
          label="Automação ativa"
          sublabel="Liga/desliga o sistema por completo"
          value={config.automation_enabled}
          onChange={(v) => setConfig((c) => ({ ...c, automation_enabled: v }))}
        />
        <Toggle
          label="Publicar no Twitter/X"
          sublabel="Habilita postagem automática no Twitter"
          value={config.twitter_enabled}
          onChange={(v) => setConfig((c) => ({ ...c, twitter_enabled: v }))}
        />
        <Toggle
          label="Publicar no Facebook"
          sublabel="Habilita postagem automática no Facebook"
          value={config.facebook_enabled}
          onChange={(v) => setConfig((c) => ({ ...c, facebook_enabled: v }))}
        />
      </div>

      {/* RSS */}
      <div className="border border-slate-100 rounded-lg p-4 space-y-3">
        <div className="text-[10px] mono uppercase tracking-widest text-slate-400 font-bold">RSS</div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">URL do RSS</label>
          <input
            type="url"
            value={config.rss_url}
            onChange={(e) => setConfig((c) => ({ ...c, rss_url: e.target.value }))}
            className="w-full border border-slate-200 rounded px-3 py-2 text-sm mono focus:outline-none focus:border-slate-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Máximo de tentativas (retry)</label>
          <input
            type="number"
            min="1"
            max="20"
            value={config.max_retry_count}
            onChange={(e) => setConfig((c) => ({ ...c, max_retry_count: e.target.value }))}
            className="w-24 border border-slate-200 rounded px-3 py-2 text-sm mono focus:outline-none focus:border-slate-400"
          />
          <p className="text-[10px] text-slate-400 mono mt-1">Posts que falharem mais que X vezes são marcados como &quot;failed&quot;</p>
        </div>
      </div>

      {/* Credenciais (informativo — configurar no Vercel) */}
      <div className="border border-amber-100 rounded-lg p-4 bg-amber-50">
        <div className="text-[10px] mono uppercase tracking-widest text-amber-700 font-bold mb-2">Credenciais das APIs</div>
        <p className="text-xs text-amber-800 leading-relaxed">
          As credenciais do Twitter e Facebook são configuradas como <strong>variáveis de ambiente</strong> no painel do Vercel,
          não aqui. Isso garante segurança total — as chaves nunca ficam no banco de dados.
        </p>
        <div className="mt-3 space-y-1 mono text-[10px] text-amber-700">
          <div>TWITTER_API_KEY · TWITTER_API_SECRET</div>
          <div>TWITTER_ACCESS_TOKEN · TWITTER_ACCESS_TOKEN_SECRET</div>
          <div>FACEBOOK_PAGE_ID · FACEBOOK_PAGE_ACCESS_TOKEN</div>
          <div>SUPABASE_SERVICE_ROLE_KEY · CRON_SECRET</div>
        </div>
      </div>

      {/* Testar conexão */}
      {connResult && (
        <div className="border border-slate-100 rounded-lg p-4 space-y-2">
          <div className="text-[10px] mono uppercase tracking-widest text-slate-400 font-bold">Resultado do teste</div>
          {/* Twitter */}
          <div className="flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${connResult.twitter.valid ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="font-medium mono">Twitter/X</span>
            <span className={`text-xs ${connResult.twitter.valid ? 'text-slate-500' : 'text-red-600'}`}>
              {connResult.twitter.valid ? `@${connResult.twitter.username}` : connResult.twitter.error}
            </span>
          </div>
          {/* Facebook */}
          <div className="flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${connResult.facebook.valid ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="font-medium mono">Facebook</span>
            <span className={`text-xs ${connResult.facebook.valid ? 'text-slate-500' : 'text-red-600'}`}>
              {connResult.facebook.valid ? connResult.facebook.pageName : connResult.facebook.error}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={saveConfig}
          disabled={saving}
          className="px-4 py-2 text-sm mono bg-slate-900 text-white rounded hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Salvando...' : saved ? '✓ Salvo' : 'Salvar configurações'}
        </button>
        <button
          onClick={testConnections}
          disabled={testingConn}
          className="px-4 py-2 text-sm mono border border-slate-200 rounded hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          {testingConn ? 'Testando...' : 'Testar APIs'}
        </button>
      </div>
    </div>
  );
};
