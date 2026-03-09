import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import type { Log } from '../types';

const ACTION_CONFIG: Record<string, { label: string; className: string }> = {
  rss_fetch: { label: 'RSS', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  twitter_post: { label: 'Twitter', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  facebook_post: { label: 'Facebook', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  error: { label: 'Erro', className: 'bg-red-50 text-red-700 border-red-200' },
  retry: { label: 'Retry', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  info: { label: 'Info', className: 'bg-slate-50 text-slate-600 border-slate-200' },
};

const ACTION_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'error', label: 'Erros' },
  { value: 'twitter_post', label: 'Twitter' },
  { value: 'facebook_post', label: 'Facebook' },
  { value: 'rss_fetch', label: 'RSS' },
  { value: 'info', label: 'Info' },
];

export const LogsPanel: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 30;

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (actionFilter) {
        query = query.eq('action', actionFilter);
      }

      const { data, count, error } = await query;
      if (error) throw error;

      setLogs((data ?? []) as Log[]);
      setTotal(count ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Header + Filtros */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-black mono uppercase tracking-tight">Logs</h2>
          <p className="text-xs text-slate-500 mt-0.5">{total} eventos registrados</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {ACTION_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setActionFilter(f.value); setPage(1); }}
              className={`px-2.5 py-1 text-[10px] mono uppercase tracking-wider rounded border transition-colors ${
                actionFilter === f.value
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
              }`}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={loadLogs}
            className="px-2.5 py-1 text-[10px] mono uppercase tracking-wider rounded border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            ↺
          </button>
        </div>
      </div>

      {/* Logs List */}
      <div className="border border-slate-100 rounded-lg overflow-hidden">
        {loading ? (
          <div className="text-sm text-slate-400 py-12 text-center mono">Carregando...</div>
        ) : logs.length === 0 ? (
          <div className="text-sm text-slate-400 py-12 text-center mono">Nenhum log encontrado</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {logs.map((log) => {
              const actionConf = ACTION_CONFIG[log.action] ?? ACTION_CONFIG['info'];
              return (
                <div key={log.id} className="px-4 py-3 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] mono uppercase tracking-widest font-bold flex-shrink-0 mt-0.5 ${actionConf.className}`}>
                      {actionConf.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 leading-snug">{log.message ?? '—'}</p>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-1">
                          <summary className="text-[10px] mono text-slate-400 cursor-pointer hover:text-slate-600">
                            metadata
                          </summary>
                          <pre className="text-[10px] mono text-slate-500 bg-slate-50 rounded p-2 mt-1 overflow-auto max-h-32">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    <span className="text-[10px] mono text-slate-400 whitespace-nowrap flex-shrink-0">
                      {log.created_at
                        ? new Date(log.created_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })
                        : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs mono text-slate-500">
          <span>{((page - 1) * limit) + 1}–{Math.min(page * limit, total)} de {total}</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2 py-1 border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50"
            >
              ←
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2 py-1 border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
