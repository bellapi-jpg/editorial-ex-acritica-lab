import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyTwitterCredentials } from '../src/lib/twitter';
import { verifyFacebookCredentials } from '../src/lib/facebook';

/**
 * GET /api/test-connection
 * Verifica se as credenciais do Twitter e Facebook estão configuradas e válidas.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const [twitter, facebook] = await Promise.allSettled([
    verifyTwitterCredentials(),
    verifyFacebookCredentials(),
  ]);

  return res.status(200).json({
    twitter:
      twitter.status === 'fulfilled'
        ? twitter.value
        : { valid: false, error: (twitter.reason as Error)?.message ?? 'Unknown error' },
    facebook:
      facebook.status === 'fulfilled'
        ? facebook.value
        : { valid: false, error: (facebook.reason as Error)?.message ?? 'Unknown error' },
  });
}
