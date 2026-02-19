import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchAndParseRSS } from '../src/lib/rss';
import { postToTwitter } from '../src/lib/twitter';
import { postToFacebook } from '../src/lib/facebook';
import {
  getServiceClient,
  saveNewPosts,
  getPendingPosts,
  markTwitterPosted,
  markTwitterError,
  markFacebookPosted,
  markFacebookError,
  addLog,
  getConfig,
} from '../src/lib/supabasePosts';
import type { CronResult, Post } from '../src/types';

const DEFAULT_RSS_URL = 'https://acritica.com/feedrss/acritica_.xml';
const DEFAULT_MAX_RETRY = 5;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel Cron Jobs enviam Authorization header automaticamente
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Aceita GET (Vercel cron) e POST (trigger manual)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  const result: CronResult = {
    success: false,
    rss_items: 0,
    new_posts: 0,
    twitter_posted: 0,
    facebook_posted: 0,
    errors: [],
    duration_ms: 0,
  };

  try {
    const db = getServiceClient();

    // Carrega configurações
    const config = await getConfig(db);
    const automationEnabled = config['automation_enabled'] !== 'false';

    if (!automationEnabled) {
      return res.status(200).json({ ...result, success: true, message: 'Automation disabled' });
    }

    const rssUrl = config['rss_url'] ?? DEFAULT_RSS_URL;
    const maxRetry = parseInt(config['max_retry_count'] ?? String(DEFAULT_MAX_RETRY), 10);
    const twitterEnabled = config['twitter_enabled'] !== 'false';
    const facebookEnabled = config['facebook_enabled'] !== 'false';

    // ── ETAPA 1: Buscar e parsear RSS ──────────────────────────────
    let rssItems;
    try {
      rssItems = await fetchAndParseRSS(rssUrl);
      result.rss_items = rssItems.length;
      await addLog(db, 'rss_fetch', `RSS buscado: ${rssItems.length} itens de ${rssUrl}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'RSS fetch failed';
      result.errors.push(`RSS: ${msg}`);
      await addLog(db, 'error', `Falha ao buscar RSS: ${msg}`);
      // Continua para processar posts pendentes anteriores
      rssItems = [];
    }

    // ── ETAPA 2: Salvar novos posts no banco ───────────────────────
    if (rssItems.length > 0) {
      try {
        const inserted = await saveNewPosts(db, rssItems);
        result.new_posts = inserted;
        if (inserted > 0) {
          await addLog(db, 'info', `${inserted} novos posts inseridos no banco`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'DB save failed';
        result.errors.push(`DB: ${msg}`);
        await addLog(db, 'error', `Falha ao salvar posts: ${msg}`);
      }
    }

    // ── ETAPA 3: Processar posts pendentes ─────────────────────────
    let pendingPosts: Post[] = [];
    try {
      pendingPosts = await getPendingPosts(db, maxRetry);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'DB query failed';
      result.errors.push(`DB query: ${msg}`);
    }

    for (const post of pendingPosts) {
      // Twitter
      if (twitterEnabled && !post.twitter_posted && post.twitter_retry_count < maxRetry) {
        try {
          const tweetId = await postToTwitter({
            chapeu: post.chapeu ?? '',
            titulo: post.titulo ?? '',
            subtitulo: post.subtitulo ?? '',
            url: post.url,
          });
          await markTwitterPosted(db, post.id, tweetId);
          await addLog(db, 'twitter_post', `Tweet publicado: ${tweetId}`, post.id, {
            tweet_id: tweetId,
            url: post.url,
          });
          result.twitter_posted++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Twitter post failed';
          await markTwitterError(db, post.id, msg);
          await addLog(db, 'error', `Falha no Twitter: ${msg}`, post.id, { url: post.url });
          result.errors.push(`Twitter (${post.url}): ${msg}`);
        }
      }

      // Facebook
      if (facebookEnabled && !post.facebook_posted && post.facebook_retry_count < maxRetry) {
        try {
          const fbPostId = await postToFacebook({
            chapeu: post.chapeu ?? '',
            subtitulo: post.subtitulo ?? '',
            url: post.url,
          });
          await markFacebookPosted(db, post.id, fbPostId);
          await addLog(db, 'facebook_post', `Post no Facebook publicado: ${fbPostId}`, post.id, {
            fb_post_id: fbPostId,
            url: post.url,
          });
          result.facebook_posted++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Facebook post failed';
          await markFacebookError(db, post.id, msg);
          await addLog(db, 'error', `Falha no Facebook: ${msg}`, post.id, { url: post.url });
          result.errors.push(`Facebook (${post.url}): ${msg}`);
        }
      }

      // Rate limiting: pausa pequena entre posts para não estourar limites das APIs
      await sleep(500);
    }

    result.success = true;
    result.duration_ms = Date.now() - startTime;

    await addLog(db, 'info', `Cron concluído em ${result.duration_ms}ms`, undefined, {
      ...result,
      pending_posts: pendingPosts.length,
    });

    return res.status(200).json(result);
  } catch (err) {
    result.duration_ms = Date.now() - startTime;
    const msg = err instanceof Error ? err.message : 'Unexpected error';
    result.errors.push(msg);
    console.error('[cron] Fatal error:', err);
    return res.status(500).json(result);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
