-- Table principale des posts LinkedIn
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  linkedin_urn TEXT UNIQUE NOT NULL,
  text TEXT,
  published_at TIMESTAMPTZ,
  media_url TEXT,
  media_type TEXT, -- 'image' | 'video' | null
  impressions INTEGER DEFAULT 0,
  reactions INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  reposts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les tris fréquents
CREATE INDEX IF NOT EXISTS posts_published_at_idx ON posts (published_at DESC);
CREATE INDEX IF NOT EXISTS posts_impressions_idx ON posts (impressions DESC);

-- Désactive RLS (usage personnel uniquement)
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
