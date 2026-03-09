import { XMLParser } from 'fast-xml-parser';
import type { RSSItem } from '../types';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  cdataPropName: '__cdata',
  parseAttributeValue: false,
  trimValues: true,
});

/**
 * Busca o RSS e retorna os itens parseados.
 */
export async function fetchAndParseRSS(url: string): Promise<RSSItem[]> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'ACritica-SocialBot/1.0' },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`RSS fetch failed: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  return parseRSSXML(xml);
}

/**
 * Parseia o XML do RSS e extrai os campos necessários.
 */
export function parseRSSXML(xml: string): RSSItem[] {
  const parsed = parser.parse(xml);

  const channel = parsed?.rss?.channel;
  if (!channel) {
    throw new Error('RSS channel not found in XML');
  }

  const rawItems = channel.item;
  if (!rawItems) return [];

  const items: unknown[] = Array.isArray(rawItems) ? rawItems : [rawItems];

  return items
    .map((raw) => extractItem(raw as Record<string, unknown>))
    .filter((item): item is RSSItem => item !== null && Boolean(item.url));
}

function extractItem(raw: Record<string, unknown>): RSSItem | null {
  try {
    const url = extractString(raw['link']) || extractString(raw['guid']) || '';
    if (!url) return null;

    const chapeu = extractString(raw['category'])?.trim().toUpperCase() ?? '';
    const titulo = extractString(raw['title'])?.trim() ?? '';

    const contentEncoded =
      extractString(raw['content:encoded']) ||
      extractString(raw['description']) ||
      '';

    const subtitulo = extractFirstParagraph(contentEncoded);
    const pub_date = extractString(raw['pubDate']) ?? '';

    return { url, chapeu, titulo, subtitulo, pub_date };
  } catch {
    return null;
  }
}

/**
 * Extrai texto de campos que podem ser string, objeto CDATA ou objeto com #text.
 */
function extractString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (value === null || value === undefined) return '';

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (obj['__cdata']) return String(obj['__cdata']);
    if (obj['#text']) return String(obj['#text']);
    // Caso o parser aninha CDATA diferente
    const keys = Object.keys(obj);
    if (keys.length === 1) return String(obj[keys[0]]);
  }

  return '';
}

/**
 * Extrai o texto puro do primeiro parágrafo HTML.
 */
function extractFirstParagraph(html: string): string {
  if (!html) return '';

  // Tenta pegar o conteúdo do primeiro <p>
  const pMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const content = pMatch ? pMatch[1] : html;

  // Remove todas as tags HTML e decodifica entidades básicas
  return stripHtml(content).trim();
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')           // remove tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')              // colapsa espaços múltiplos
    .trim();
}
