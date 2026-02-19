import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { StatusBadge, PlatformBadge } from './StatusBadge';
import type { Post } from '../types';

const STATUS_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'partial', label: 'Parciais' },
  { value: 'completed', label: 'Publicados' },
  { value: 'failed', label: 'Falharam' },
];

export const PostsTable: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      setPosts((data ?? []) as Post[]);
      setTotal(count ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleRetry = async (postId: string) => {
    setRetrying(postId);
    try {
      const res = await fetch('/api/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, platform: 'all' }),
      });
      if (!res.ok) throw new Error('Retry failed');
      await loadPosts();
    } catch (err) {
      alert('Erro ao tentar novamente: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    } finally {
      setRetrying(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Header + Filtros */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-black mono uppercase tracking-tight">Posts</h2>
          <p className="text-xs text-slate-500 mt-0.5">{total} matérias no banco</p>
        </div>
        <div className="flex items-center gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
              className={`px-2.5 py-1 text-[10px] mono uppercase tracking-wider rounded border transition-colors ${
                statusFilter === f.value
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
              }`}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={loadPosts}
            className="px-2.5 py-1 text-[10px] mono uppercase tracking-wider rounded border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            ↺
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-slate-100 rounded-lg overflow-hidden">
        {loading ? (
          <div className="text-sm text-slate-400 py-12 text-center mono">Carregando...</div>
        ) : posts.length === 0 ? (
          <div className="text-sm text-slate-400 py-12 text-center mono">Nenhum post encontrado</div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-3 py-2 font-bold mono uppercase tracking-wider text-slate-500 text-[10px]">Data</th>
                <th className="text-left px-3 py-2 font-bold mono uppercase tracking-wider text-slate-500 text-[10px]">Chapéu</th>
                <th className="text-left px-3 py-2 font-bold mono uppercase tracking-wider text-slate-500 text-[10px] hidden md:table-cell">Título</th>
                <th className="text-center px-3 py-2 font-bold mono uppercase tracking-wider text-slate-500 text-[10px]">Redes</th>
                <th className="text-center px-3 py-2 font-bold mono uppercase tracking-wider text-slate-500 text-[10px]">Status</th>
                <th className="text-center px-3 py-2 font-bold mono uppercase tracking-wider text-slate-500 text-[10px]">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3 py-2.5 text-slate-500 mono whitespace-nowrap">
                    {post.created_at
                      ? new Date(post.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-slate-700 mono font-medium uppercase text-[10px] max-w-[100px] truncate">
                    {post.chapeu ?? '—'}
                  </td>
                  <td className="px-3 py-2.5 text-slate-700 max-w-[200px] hidden md:table-cell">
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 line-clamp-1 block"
                      title={post.titulo ?? undefined}
                    >
                      {post.titulo ?? post.url}
                    </a>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <PlatformBadge
                        platform="twitter"
                        posted={post.twitter_posted}
                        error={post.twitter_error}
                      />
                      <PlatformBadge
                        platform="facebook"
                        posted={post.facebook_posted}
                        error={post.facebook_error}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <StatusBadge status={post.status} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {(post.status === 'failed' || post.status === 'partial' || post.status === 'pending') && (
                      <button
                        onClick={() => handleRetry(post.id)}
                        disabled={retrying === post.id}
                        className="px-2 py-0.5 text-[10px] mono border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 transition-colors"
                      >
                        {retrying === post.id ? '...' : 'Retry'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
