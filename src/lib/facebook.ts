const GRAPH_API_VERSION = 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Formata o texto do post no Facebook.
 * Formato:
 *   CHAPÉU
 *
 *   Subtítulo
 *
 *   https://link
 *
 * (Facebook NÃO leva o título)
 */
export function formatFacebookPost(post: {
  chapeu: string;
  subtitulo: string;
  url: string;
}): string {
  const parts: string[] = [];
  if (post.chapeu) parts.push(post.chapeu);
  if (post.subtitulo) parts.push(post.subtitulo);
  parts.push(post.url);
  return parts.join('\n\n');
}

/**
 * Publica na página do Facebook e retorna o ID do post.
 */
export async function postToFacebook(post: {
  chapeu: string;
  subtitulo: string;
  url: string;
}): Promise<string> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  if (!pageId || !accessToken) {
    throw new Error('Credenciais do Facebook não configuradas');
  }

  const message = formatFacebookPost(post);

  const response = await fetch(`${GRAPH_BASE}/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, access_token: accessToken }),
    signal: AbortSignal.timeout(15_000),
  });

  const data = (await response.json()) as { id?: string; error?: { message: string; code: number } };

  if (!response.ok || !data.id) {
    const errMsg = data.error?.message ?? `HTTP ${response.status}`;
    throw new Error(`Facebook API error: ${errMsg}`);
  }

  return data.id;
}

/**
 * Verifica se as credenciais do Facebook são válidas.
 */
export async function verifyFacebookCredentials(): Promise<{
  valid: boolean;
  pageName?: string;
  error?: string;
}> {
  try {
    const pageId = process.env.FACEBOOK_PAGE_ID;
    const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    if (!pageId || !accessToken) {
      return { valid: false, error: 'Credenciais não configuradas' };
    }

    const res = await fetch(
      `${GRAPH_BASE}/${pageId}?fields=name,id&access_token=${accessToken}`,
      { signal: AbortSignal.timeout(10_000) }
    );

    const data = (await res.json()) as { name?: string; id?: string; error?: { message: string } };

    if (!res.ok || !data.id) {
      return { valid: false, error: data.error?.message ?? 'Página não encontrada' };
    }

    return { valid: true, pageName: data.name };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return { valid: false, error: message };
  }
}
