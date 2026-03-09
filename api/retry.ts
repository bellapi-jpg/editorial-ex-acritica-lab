import type { VercelRequest, VercelResponse } from '@vercel/node';
import { postToTwitter } from '../src/lib/twitter';
import { postToFacebook } from '../src/lib/facebook';
import {
  getServiceClient,
  markTwitterPosted,
  markTwitterError,
  markFacebookPosted,
  markFacebookError,
  resetPostForRetry,
  addLog,
} from '../src/lib/supabasePosts';
import type { Post } from '../src/types';

/**
 * POST /api/retry
 * Body: { post_id: string, platform?: 'twitter' | 'facebook' | 'all' }
 *
 * Reseta contadores de retry e tenta publicar novamente.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { post_id, platform = 'all' } = req.body ?? {};

  if (!post_id) {
    return res.status(400).json({ error: 'post_id is required' });
  }

  if (!['twitter', 'facebook', 'all'].includes(platform)) {
    return res.status(400).json({ error: 'platform must be twitter, facebook, or all' });
  }

  try {
    const db = getServiceClient();

    // Busca o post
    const { data, error: fetchError } = await db
      .from('posts')
      .select('*')
      .eq('id', post_id)
      .single();

    if (fetchError || !data) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = data as Post;

    // Reseta contadores
    await resetPostForRetry(db, post_id);
    await addLog(db, 'retry', `Retry manual solicitado (plataforma: ${platform})`, post_id);

    const results = {
      twitter: null as { success: boolean; id?: string; error?: string } | null,
      facebook: null as { success: boolean; id?: string; error?: string } | null,
    };

    // Tenta Twitter
    if ((platform === 'twitter' || platform === 'all') && !post.twitter_posted) {
      try {
        const tweetId = await postToTwitter({
          chapeu: post.chapeu ?? '',
          titulo: post.titulo ?? '',
          subtitulo: post.subtitulo ?? '',
          url: post.url,
        });
        await markTwitterPosted(db, post_id, tweetId);
        await addLog(db, 'twitter_post', `Retry Twitter: tweet publicado ${tweetId}`, post_id, {
          tweet_id: tweetId,
        });
        results.twitter = { success: true, id: tweetId };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Twitter failed';
        await markTwitterError(db, post_id, msg);
        await addLog(db, 'error', `Retry Twitter falhou: ${msg}`, post_id);
        results.twitter = { success: false, error: msg };
      }
    }

    // Tenta Facebook
    if ((platform === 'facebook' || platform === 'all') && !post.facebook_posted) {
      try {
        const fbPostId = await postToFacebook({
          chapeu: post.chapeu ?? '',
          subtitulo: post.subtitulo ?? '',
          url: post.url,
        });
        await markFacebookPosted(db, post_id, fbPostId);
        await addLog(db, 'facebook_post', `Retry Facebook: post publicado ${fbPostId}`, post_id, {
          fb_post_id: fbPostId,
        });
        results.facebook = { success: true, id: fbPostId };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Facebook failed';
        await markFacebookError(db, post_id, msg);
        await addLog(db, 'error', `Retry Facebook falhou: ${msg}`, post_id);
        results.facebook = { success: false, error: msg };
      }
    }

    return res.status(200).json({ success: true, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return res.status(500).json({ error: message });
  }
}
