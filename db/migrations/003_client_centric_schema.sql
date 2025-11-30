-- ============================================
-- Client-Centric Schema Migration
-- ============================================

-- Drop old constraints and tables
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS agency_configs CASCADE;

-- Remove old foreign keys from existing tables
ALTER TABLE call_sessions DROP CONSTRAINT IF EXISTS call_sessions_agency_config_id_agency_configs_id_fk;
ALTER TABLE checklist_items DROP CONSTRAINT IF EXISTS checklist_items_agency_config_id_agency_configs_id_fk;

-- Drop old columns
ALTER TABLE call_sessions DROP COLUMN IF EXISTS agency_config_id;
ALTER TABLE call_sessions DROP COLUMN IF EXISTS client_email;
ALTER TABLE checklist_items DROP COLUMN IF EXISTS agency_config_id;

-- ============================================
-- Create new tables
-- ============================================

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  email TEXT,
  company TEXT,
  role TEXT,
  phone TEXT,
  linkedin_url TEXT,
  notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  last_contacted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS clients_user_id_idx ON clients(user_id);
CREATE INDEX IF NOT EXISTS clients_normalized_name_idx ON clients(normalized_name);
CREATE INDEX IF NOT EXISTS clients_created_at_idx ON clients(created_at);

-- Client insights table
CREATE TABLE IF NOT EXISTS client_insights (
  id SERIAL PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 1.0,
  source_session_id TEXT REFERENCES call_sessions(id),
  source_transcript_id INTEGER REFERENCES transcript_segments(id),
  extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS client_insights_client_id_idx ON client_insights(client_id);
CREATE INDEX IF NOT EXISTS client_insights_category_idx ON client_insights(category);
CREATE INDEX IF NOT EXISTS client_insights_key_idx ON client_insights(key);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS chat_messages_client_id_idx ON chat_messages(client_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages(created_at);

-- ============================================
-- Update existing tables
-- ============================================

-- Update call_sessions
ALTER TABLE call_sessions ADD COLUMN IF NOT EXISTS client_id TEXT REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE call_sessions ADD COLUMN IF NOT EXISTS key_takeaways JSONB;
ALTER TABLE call_sessions ADD COLUMN IF NOT EXISTS action_items JSONB;
ALTER TABLE call_sessions ADD COLUMN IF NOT EXISTS sentiment TEXT;

CREATE INDEX IF NOT EXISTS call_sessions_client_id_idx ON call_sessions(client_id);

-- Update transcript_segments
ALTER TABLE transcript_segments ADD COLUMN IF NOT EXISTS client_id TEXT REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS transcript_segments_client_id_idx ON transcript_segments(client_id);
CREATE INDEX IF NOT EXISTS transcript_segments_speaker_idx ON transcript_segments(speaker);

-- Update checklist_items
ALTER TABLE checklist_items ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;

-- Migrate existing checklist items to first user (if any exist)
UPDATE checklist_items 
SET user_id = (SELECT id FROM users LIMIT 1)
WHERE user_id IS NULL;

-- Now make it NOT NULL
ALTER TABLE checklist_items ALTER COLUMN user_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS checklist_items_user_id_idx ON checklist_items(user_id);

-- Update checklist_completions
ALTER TABLE checklist_completions ADD COLUMN IF NOT EXISTS client_id TEXT REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS checklist_completions_client_id_idx ON checklist_completions(client_id);

-- ============================================
-- Done!
-- ============================================
