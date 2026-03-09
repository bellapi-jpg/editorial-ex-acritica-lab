import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import type { PostStats, CronResult } from '../types';

export const AutoDashboard: React.FC = () => {
  const [stats, setStats] = useState<PostStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cronRunning, setCronRunning] = useState(false);
  const [lastCronResult, setLastCronResult] = useState<CronResult | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{
    twitter: { valid: boolean; username?: string; error?: string };
    facebook: { valid: boolean; pageName?: string; error?: string };
  } | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [allPosts, todayPosts, weekPosts] = await Promise.all([
        supabase.from('posts').select('status'),
        supabase.from('posts').select('id', { count: 'exact' }).gte('created_at', todayStart),
        supabase.from('posts').select('id', { count: 'exact' }).gte('created_at', weekStart),
      ]);

      const counts = { pending: 0, partial: 0, completed: 0, failed: 0 };
      (allPosts.data ?? []).forEach((r: { status: string }) => {
        const s = r.status as keyof typeof counts;
        if (s in counts) counts[s]++;
      });

      setStats({
        total: (allPosts.data?.length ?? 0),
        ...counts,
        today: todayPosts.count ?? 0,
        this_week: weekPosts.count ?? 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const checkConnections = useCallback(async () => {
    try {
      const res = await fetch('/api/test-connection');
      if (res.ok) setConnectionStatus(await res.json());
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    loadStats();
    checkConnections();
  }, [loadStats, checkConnections]);

  const triggerCron = async () => {
    setCronRunning(true);
    setLastCronResult(null);
    try {
      const res = await fetch('/api/cron', { method: 'POST' });
      const data: CronResult = await res.json();
      setLastCronResult(data);
      await loadStats();
    } catch (err) {
      setLastCronResult({
        success: false,
        rss_items: 0,
        new_posts: 0,
        twitter_posted: 0,
        facebook_posted: 0,
        errors: [err instanceof Error ? err.message : 'Erro desconhecido'],
        duration_ms: 0,
      });
    } finally {
      setCronRunning(false);
    }
  };

  const StatCard: React.FC<{
    label: string;
    value: number | string;
    accent?: string;
    sublabel?: string;
  }> = ({ label, value, accent = 'text-slate-900', sublabel }) => (
    <div className="border border-slate-100 rounded-lg p-4 bg-white">
      <div className="text-[10px] mono uppercase tracking-widest text-slate-400 font-bold mb-1">{label}</div>
      <div className={`text-3xl font-black mono ${accent}`}>{value}</div>
      {sublabel && <div className="text-[10px] text-slate-400 mt-1">{sublabel}</div>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black mono uppercase tracking-tight">Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">Automação de redes sociais</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadStats}
            className="px-3 py-1.5 text-xs mono border border-slate-200 rounded hover:bg-slate-50 transition-colors"
          >
            Atualizar
          </button>
          <button
            onClick={triggerCron}
            disabled={cronRunning}
            className="px-3 py-1.5 text-xs mono bg-slate-900 text-white rounded hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {cronRunning ? 'Executando...' : '▶ Executar agora'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="text-sm text-slate-400 py-8 text-center mono">Carregando...</div>
      ) : stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Hoje" value={stats.today} accent="text-blue-700" />
          <StatCard label="Esta semana" value={stats.this_week} />
          <StatCard label="Publicados" value={stats.completed} accent="text-emerald-700" />
          <StatCard label="Pendentes" value={stats.pending} accent="text-amber-700" />
          <StatCard label="Parciais" value={stats.partial} accent="text-blue-700" />
          <StatCard label="Falharam" value={stats.failed} accent="text-red-700" />
          <StatCard label="Taxa sucesso" value={stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}%` : '—'} />
        </div>
      ) : null}

      {/* Resultado do último cron */}
      {lastCronResult && (
        <div className={`border rounded-lg p-4 text-sm mono ${lastCronResult.success ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
          <div className={`font-bold text-xs uppercase tracking-wider mb-2 ${lastCronResult.success ? 'text-emerald-700' : 'text-red-700'}`}>
            {lastCronResult.success ? '✓ Execução concluída' : '✗ Execução com erros'} — {lastCronResult.duration_ms}ms
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600">
            <span>RSS: <strong>{lastCronResult.rss_items}</strong> itens</span>
            <span>Novos: <strong>{lastCronResult.new_posts}</strong></span>
            <span>Twitter: <strong>{lastCronResult.twitter_posted}</strong></span>
            <span>Facebook: <strong>{lastCronResult.facebook_posted}</strong></span>
          </div>
          {lastCronResult.errors.length > 0 && (
            <div className="mt-2 space-y-1">
              {lastCronResult.errors.map((e, i) => (
                <div key={i} className="text-xs text-red-700 bg-red-100 rounded px-2 py-1">{e}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Status das APIs */}
      {connectionStatus && (
        <div className="border border-slate-100 rounded-lg p-4">
          <div className="text-[10px] mono uppercase tracking-widest text-slate-400 font-bold mb-3">Status das APIs</div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${connectionStatus.twitter.valid ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-xs mono">
                Twitter/X {connectionStatus.twitter.valid ? `(@${connectionStatus.twitter.username})` : `— ${connectionStatus.twitter.error ?? 'desconectado'}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${connectionStatus.facebook.valid ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-xs mono">
                Facebook {connectionStatus.facebook.valid ? `(${connectionStatus.facebook.pageName})` : `— ${connectionStatus.facebook.error ?? 'desconectado'}`}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
