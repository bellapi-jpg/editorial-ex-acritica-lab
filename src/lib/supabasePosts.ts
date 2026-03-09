import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Post, Log, RSSItem } from '../types';

/**
 * Cliente Supabase com service role key — usar APENAS em API routes (backend).
 * Bypassa RLS para escrita.
 */
export function getServiceClient(): SupabaseClient {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

  if (!url || !key) {
    throw new Error('Supabase service role credentials not configured');
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// ============================================================
// Posts
// ============================================================

/**
 * Salva novos itens do RSS no banco. Ignora duplicatas (url UNIQUE).
 * Retorna quantos itens foram inseridos.
 */
export async function saveNewPosts(db: SupabaseClient, items: RSSItem[]): Promise<number> {
  if (items.length === 0) return 0;

  const rows = items.map((item) => ({
    url: item.url,
    chapeu: item.chapeu || null,
    titulo: item.titulo || null,
    subtitulo: item.subtitulo || null,
    pub_date: parsePubDate(item.pub_date),
    status: 'pending',
  }));

  const { data, error } = await db
    .from('posts')
    .upsert(rows, { onConflict: 'url', ignoreDuplicates: true })
    .select('id');

  if (error) throw new Error(`saveNewPosts error: ${error.message}`);
  return data?.length ?? 0;
}

/**
 * Busca posts que ainda precisam ser publicados em alguma rede.
 */
export async function getPendingPosts(db: SupabaseClient, maxRetry: number): Promise<Post[]> {
  const { data, error } = await db
    .from('posts')
    .select('*')
    .in('status', ['pending', 'partial'])
    .or(
      `and(twitter_posted.eq.false,twitter_retry_count.lt.${maxRetry}),` +
        `and(facebook_posted.eq.false,facebook_retry_count.lt.${maxRetry})`
    )
    .order('pub_date', { ascending: false })
    .limit(50);

  if (error) throw new Error(`getPendingPosts error: ${error.message}`);
  return (data ?? []) as Post[];
}

/**
 * Atualiza o status de publicação do Twitter.
 */
export async function markTwitterPosted(
  db: SupabaseClient,
  postId: string,
  tweetId: string
): Promise<void> {
  const { error } = await db
    .from('posts')
    .update({
      twitter_posted: true,
      twitter_posted_at: new Date().toISOString(),
      twitter_post_id: tweetId,
      twitter_error: null,
    })
    .eq('id', postId);

  if (error) throw new Error(`markTwitterPosted error: ${error.message}`);
  await updatePostStatus(db, postId);
}

/**
 * Registra erro do Twitter e incrementa retry_count.
 */
export async function markTwitterError(
  db: SupabaseClient,
  postId: string,
  errorMessage: string
): Promise<void> {
  const { error } = await db.rpc('increment_twitter_retry', {
    p_post_id: postId,
    p_error: errorMessage,
  });

  // Se a RPC não existir, faz o update manualmente
  if (error) {
    const { data: post } = await db.from('posts').select('twitter_retry_count').eq('id', postId).single();
    const retryCount = ((post as Record<string, number>)?.twitter_retry_count ?? 0) + 1;
    await db
      .from('posts')
      .update({ twitter_error: errorMessage, twitter_retry_count: retryCount })
      .eq('id', postId);
  }

  await updatePostStatus(db, postId);
}

/**
 * Atualiza o status de publicação do Facebook.
 */
export async function markFacebookPosted(
  db: SupabaseClient,
  postId: string,
  fbPostId: string
): Promise<void> {
  const { error } = await db
    .from('posts')
    .update({
      facebook_posted: true,
      facebook_posted_at: new Date().toISOString(),
      facebook_post_id: fbPostId,
      facebook_error: null,
    })
    .eq('id', postId);

  if (error) throw new Error(`markFacebookPosted error: ${error.message}`);
  await updatePostStatus(db, postId);
}

/**
 * Registra erro do Facebook e incrementa retry_count.
 */
export async function markFacebookError(
  db: SupabaseClient,
  postId: string,
  errorMessage: string
): Promise<void> {
  const { data: post } = await db
    .from('posts')
    .select('facebook_retry_count')
    .eq('id', postId)
    .single();
  const retryCount = ((post as Record<string, number>)?.facebook_retry_count ?? 0) + 1;
  await db
    .from('posts')
    .update({ facebook_error: errorMessage, facebook_retry_count: retryCount })
    .eq('id', postId);

  await updatePostStatus(db, postId);
}

/**
 * Recalcula e atualiza o campo `status` do post baseado no estado atual.
 */
async function updatePostStatus(db: SupabaseClient, postId: string): Promise<void> {
  const { data } = await db
    .from('posts')
    .select('twitter_posted, facebook_posted, twitter_retry_count, facebook_retry_count')
    .eq('id', postId)
    .single();

  if (!data) return;

  const maxRetry = 5;
  const p = data as {
    twitter_posted: boolean;
    facebook_posted: boolean;
    twitter_retry_count: number;
    facebook_retry_count: number;
  };

  let status: Post['status'];
  if (p.twitter_posted && p.facebook_posted) {
    status = 'completed';
  } else if (p.twitter_posted || p.facebook_posted) {
    status = 'partial';
  } else if (p.twitter_retry_count >= maxRetry && p.facebook_retry_count >= maxRetry) {
    status = 'failed';
  } else {
    status = 'pending';
  }

  await db.from('posts').update({ status }).eq('id', postId);
}

/**
 * Reseta os contadores de retry de um post para tentar novamente.
 */
export async function resetPostForRetry(db: SupabaseClient, postId: string): Promise<void> {
  const { error } = await db
    .from('posts')
    .update({
      twitter_retry_count: 0,
      facebook_retry_count: 0,
      twitter_error: null,
      facebook_error: null,
      status: 'pending',
    })
    .eq('id', postId);

  if (error) throw new Error(`resetPostForRetry error: ${error.message}`);
}

// ============================================================
// Logs
// ============================================================

export async function addLog(
  db: SupabaseClient,
  action: Log['action'],
  message: string,
  postId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await db.from('logs').insert({
    post_id: postId ?? null,
    action,
    message,
    metadata: metadata ?? null,
  });
}

// ============================================================
// Config
// ============================================================

export async function getConfig(db: SupabaseClient): Promise<Record<string, string>> {
  const { data, error } = await db.from('config').select('key, value');
  if (error) throw new Error(`getConfig error: ${error.message}`);

  return Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));
}

// ============================================================
// Helpers
// ============================================================

function parsePubDate(dateStr: string): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}
