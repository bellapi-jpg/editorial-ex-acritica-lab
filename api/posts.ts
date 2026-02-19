import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceClient } from '../src/lib/supabasePosts';

/**
 * GET /api/posts — lista posts com filtros opcionais
 *   ?status=pending|partial|completed|failed
 *   ?page=1&limit=20
 *   ?platform=twitter|facebook  (filtra por não publicado)
 *
 * GET /api/posts/stats — retorna estatísticas dos posts
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getServiceClient();

    // Rota de stats
    if (req.url?.includes('/stats')) {
      return await handleStats(db, res);
    }

    // Parâmetros de query
    const status = req.query['status'] as string | undefined;
    const platform = req.query['platform'] as string | undefined;
    const page = parseInt(String(req.query['page'] ?? '1'), 10);
    const limit = Math.min(parseInt(String(req.query['limit'] ?? '20'), 10), 100);
    const offset = (page - 1) * limit;

    let query = db
      .from('posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (platform === 'twitter') {
      query = query.eq('twitter_posted', false);
    } else if (platform === 'facebook') {
      query = query.eq('facebook_posted', false);
    }

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      posts: data,
      total: count ?? 0,
      page,
      limit,
      pages: Math.ceil((count ?? 0) / limit),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return res.status(500).json({ error: message });
  }
}

async function handleStats(
  db: ReturnType<typeof getServiceClient>,
  res: VercelResponse
): Promise<VercelResponse> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [totalRes, todayRes, weekRes] = await Promise.all([
    db.from('posts').select('status', { count: 'exact' }),
    db.from('posts').select('id', { count: 'exact' }).gte('created_at', todayStart),
    db.from('posts').select('id', { count: 'exact' }).gte('created_at', weekStart),
  ]);

  // Contagem por status
  const statusCounts: Record<string, number> = {
    pending: 0,
    partial: 0,
    completed: 0,
    failed: 0,
  };

  (totalRes.data ?? []).forEach((row: { status: string }) => {
    if (row.status in statusCounts) statusCounts[row.status]++;
  });

  return res.status(200).json({
    total: totalRes.count ?? 0,
    pending: statusCounts['pending'],
    partial: statusCounts['partial'],
    completed: statusCounts['completed'],
    failed: statusCounts['failed'],
    today: todayRes.count ?? 0,
    this_week: weekRes.count ?? 0,
  });
}
