-- ============================================================
-- ACritica Social Automation — Supabase Schema
-- Execute no Supabase SQL Editor
-- ============================================================

-- Tabela principal de posts (matérias do RSS)
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  chapeu TEXT,
  titulo TEXT,
  subtitulo TEXT,
  pub_date TIMESTAMP WITH TIME ZONE,

  -- Twitter
  twitter_posted BOOLEAN DEFAULT FALSE,
  twitter_posted_at TIMESTAMP WITH TIME ZONE,
  twitter_post_id TEXT,
  twitter_error TEXT,
  twitter_retry_count INTEGER DEFAULT 0,

  -- Facebook
  facebook_posted BOOLEAN DEFAULT FALSE,
  facebook_posted_at TIMESTAMP WITH TIME ZONE,
  facebook_post_id TEXT,
  facebook_error TEXT,
  facebook_retry_count INTEGER DEFAULT 0,

  -- Controle geral
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' -- pending | partial | completed | failed
);

-- Índice único por URL (garante que nenhum link seja publicado duas vezes)
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_url ON posts(url);

-- Índices para queries frequentes
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_pub_date ON posts(pub_date DESC);

-- ============================================================
-- Tabela de configurações (tokens, flags)
-- ============================================================
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Valores padrão
INSERT INTO config (key, value) VALUES
  ('automation_enabled', 'true'),
  ('twitter_enabled', 'true'),
  ('facebook_enabled', 'true'),
  ('rss_url', 'https://acritica.com/feedrss/acritica_.xml'),
  ('max_retry_count', '5')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- Tabela de logs (histórico de ações e erros)
-- ============================================================
CREATE TABLE IF NOT EXISTS logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'rss_fetch' | 'twitter_post' | 'facebook_post' | 'error' | 'retry'
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_action ON logs(action);
CREATE INDEX IF NOT EXISTS idx_logs_post_id ON logs(post_id);

-- ============================================================
-- Trigger: atualiza updated_at automaticamente em posts
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_posts_updated_at ON posts;
CREATE TRIGGER trigger_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS: desabilitar para uso com service role key no backend
-- (o frontend usa anon key com RLS ativado)
-- ============================================================

-- Habilitar RLS nas tabelas
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública de posts e logs (para o dashboard)
-- Ajuste conforme sua política de acesso
DROP POLICY IF EXISTS "Allow read posts" ON posts;
DROP POLICY IF EXISTS "Allow read logs" ON logs;
DROP POLICY IF EXISTS "Allow read config" ON config;

CREATE POLICY "Allow read posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Allow read logs" ON logs FOR SELECT USING (true);
CREATE POLICY "Allow read config" ON config FOR SELECT USING (true);

-- Escrita apenas via service role (API routes usam SUPABASE_SERVICE_ROLE_KEY)
-- O service role bypassa RLS automaticamente
