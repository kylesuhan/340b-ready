-- ============================================================
-- Migration 002: Compliance Monitoring Feature
-- ============================================================

-- Compliance items — detected regulatory changes
CREATE TABLE IF NOT EXISTS compliance_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id           TEXT NOT NULL,        -- e.g. Federal Register document_number or URL hash
  source_type         TEXT NOT NULL,        -- 'federal_register' | 'hrsa' | 'oig'
  source_url          TEXT NOT NULL,
  source_label        TEXT NOT NULL,
  title               TEXT NOT NULL,
  raw_summary         TEXT,                 -- original abstract / scraped excerpt
  ai_summary          TEXT,                 -- Claude plain-English summary
  urgency             TEXT NOT NULL DEFAULT 'informational',
                                            -- 'informational' | 'action-required' | 'deadline'
  affected_entities   TEXT[] DEFAULT '{}',  -- 'covered-entity','manufacturer','contract-pharmacy','tpa','all'
  publication_date    DATE,
  effective_date      DATE,
  detected_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  published           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_id)
);

-- Per-user review state for each compliance item
CREATE TABLE IF NOT EXISTS user_compliance_reviews (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  compliance_item_id    UUID NOT NULL REFERENCES compliance_items(id) ON DELETE CASCADE,
  status                TEXT NOT NULL DEFAULT 'unread',
                                          -- 'unread' | 'reviewed' | 'actioned' | 'dismissed'
  notes                 TEXT,
  reviewed_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, compliance_item_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS compliance_items_detected_at_idx ON compliance_items (detected_at DESC);
CREATE INDEX IF NOT EXISTS compliance_items_urgency_idx ON compliance_items (urgency);
CREATE INDEX IF NOT EXISTS compliance_items_source_type_idx ON compliance_items (source_type);
CREATE INDEX IF NOT EXISTS user_compliance_reviews_user_id_idx ON user_compliance_reviews (user_id);

-- updated_at triggers
CREATE TRIGGER set_compliance_items_updated_at
  BEFORE UPDATE ON compliance_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_user_compliance_reviews_updated_at
  BEFORE UPDATE ON user_compliance_reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE compliance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_compliance_reviews ENABLE ROW LEVEL SECURITY;

-- Compliance items: any authenticated user can read published items
CREATE POLICY "compliance_items_select" ON compliance_items
  FOR SELECT TO authenticated
  USING (published = true);

-- Service role can do everything on compliance_items (cron inserts)
CREATE POLICY "compliance_items_service_all" ON compliance_items
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- User compliance reviews: users manage their own rows only
CREATE POLICY "user_compliance_reviews_select" ON user_compliance_reviews
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_compliance_reviews_insert" ON user_compliance_reviews
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_compliance_reviews_update" ON user_compliance_reviews
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
