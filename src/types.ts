export interface User {
  email: string;
  name: string;
  photoUrl: string;
  role: string;
}

export interface InsightData {
  text: string;
  category: 'SEO' | 'ALGORITHM' | 'PSYCHOLOGY' | 'STRUCTURE';
}

export interface OptimizationResult {
  palavraChavePrincipal: string;
  palavrasChaveSecundarias: string[];
  titulo: string;
  tituloInsight: InsightData;
  linhaFina: string;
  linhaFinaInsight: InsightData;
  primeiroParagrafo: string;
  primeiroParagrafoInsight: InsightData;
  tags: string[];
  tagsInsight: InsightData;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type EditorialTone = 'COLD' | 'NEUTRAL' | 'HOT';

// ============================================================
// Social Automation Types
// ============================================================

export interface RSSItem {
  url: string;
  chapeu: string;
  titulo: string;
  subtitulo: string;
  pub_date: string;
}

export interface Post {
  id: string;
  url: string;
  chapeu: string | null;
  titulo: string | null;
  subtitulo: string | null;
  pub_date: string | null;

  twitter_posted: boolean;
  twitter_posted_at: string | null;
  twitter_post_id: string | null;
  twitter_error: string | null;
  twitter_retry_count: number;

  facebook_posted: boolean;
  facebook_posted_at: string | null;
  facebook_post_id: string | null;
  facebook_error: string | null;
  facebook_retry_count: number;

  created_at: string;
  updated_at: string;
  status: 'pending' | 'partial' | 'completed' | 'failed';
}

export interface Log {
  id: string;
  post_id: string | null;
  action: 'rss_fetch' | 'twitter_post' | 'facebook_post' | 'error' | 'retry' | 'info';
  message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ConfigEntry {
  key: string;
  value: string;
  updated_at: string;
}

export interface CronResult {
  success: boolean;
  rss_items: number;
  new_posts: number;
  twitter_posted: number;
  facebook_posted: number;
  errors: string[];
  duration_ms: number;
}

export interface ConnectionTestResult {
  twitter: { valid: boolean; username?: string; error?: string };
  facebook: { valid: boolean; pageName?: string; error?: string };
}

export interface PostStats {
  total: number;
  pending: number;
  partial: number;
  completed: number;
  failed: number;
  today: number;
  this_week: number;
}
