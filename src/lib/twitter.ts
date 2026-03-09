import { TwitterApi } from 'twitter-api-v2';

const TWITTER_URL_LENGTH = 23; // Twitter sempre conta URLs como 23 chars
const TWITTER_MAX_CHARS = 280;

export function getTwitterClient(): TwitterApi {
  const appKey = process.env.TWITTER_API_KEY;
  const appSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

  if (!appKey || !appSecret || !accessToken || !accessSecret) {
    throw new Error('Credenciais do Twitter não configuradas');
  }

  return new TwitterApi({ appKey, appSecret, accessToken, accessSecret });
}

/**
 * Formata o texto do tweet respeitando o limite de 280 caracteres.
 * Formato:
 *   CHAPÉU
 *
 *   Título da matéria
 *
 *   Subtítulo (truncado se necessário)
 *
 *   https://link
 */
export function formatTwitterPost(post: {
  chapeu: string;
  titulo: string;
  subtitulo: string;
  url: string;
}): string {
  const { chapeu, titulo, url } = post;
  let { subtitulo } = post;

  // Calcula o espaço disponível para o subtítulo
  // "\n\n" = 2 chars entre cada bloco
  const fixedPart = [chapeu, titulo, url].join('\n\n');
  const fixedChars = fixedPart.length - url.length + TWITTER_URL_LENGTH + 4; // 4 = "\n\n" antes do subtítulo + "\n\n" após
  const remainingForSubtitulo = TWITTER_MAX_CHARS - fixedChars;

  if (subtitulo.length > remainingForSubtitulo) {
    subtitulo = subtitulo.slice(0, remainingForSubtitulo - 1) + '…';
  }

  const parts: string[] = [];
  if (chapeu) parts.push(chapeu);
  if (titulo) parts.push(titulo);
  if (subtitulo) parts.push(subtitulo);
  parts.push(url);

  return parts.join('\n\n');
}

/**
 * Publica no Twitter e retorna o ID do tweet.
 */
export async function postToTwitter(post: {
  chapeu: string;
  titulo: string;
  subtitulo: string;
  url: string;
}): Promise<string> {
  const client = getTwitterClient();
  const text = formatTwitterPost(post);

  const { data } = await client.v2.tweet(text);
  return data.id;
}

/**
 * Verifica se as credenciais do Twitter são válidas.
 */
export async function verifyTwitterCredentials(): Promise<{ valid: boolean; username?: string; error?: string }> {
  try {
    const client = getTwitterClient();
    const me = await client.v2.me();
    return { valid: true, username: me.data.username };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return { valid: false, error: message };
  }
}
