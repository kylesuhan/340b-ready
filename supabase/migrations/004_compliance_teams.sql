-- ============================================================
-- Migration 004: Compliance Team Seats
-- ============================================================

-- Organizations — one per compliance subscription
CREATE TABLE IF NOT EXISTS compliance_orgs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT '340B Compliance Team',
  seat_limit  INT NOT NULL DEFAULT 3,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id)
);

-- Members — invited users under an org
CREATE TABLE IF NOT EXISTS compliance_org_members (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID NOT NULL REFERENCES compliance_orgs(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  invited_email  TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'member',  -- 'owner' | 'member'
  status         TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'active'
  invite_token   TEXT UNIQUE,
  invited_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  joined_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, invited_email)
);

-- Indexes
CREATE INDEX IF NOT EXISTS compliance_org_members_org_id_idx ON compliance_org_members (org_id);
CREATE INDEX IF NOT EXISTS compliance_org_members_user_id_idx ON compliance_org_members (user_id);
CREATE INDEX IF NOT EXISTS compliance_org_members_invite_token_idx ON compliance_org_members (invite_token);

-- updated_at triggers
CREATE TRIGGER set_compliance_orgs_updated_at
  BEFORE UPDATE ON compliance_orgs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_compliance_org_members_updated_at
  BEFORE UPDATE ON compliance_org_members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE compliance_orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_org_members ENABLE ROW LEVEL SECURITY;

-- Org owners can see and manage their org
CREATE POLICY "compliance_orgs_owner" ON compliance_orgs
  FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Members can see their org
CREATE POLICY "compliance_orgs_member_select" ON compliance_orgs
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT org_id FROM compliance_org_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Members can see their own membership rows
CREATE POLICY "compliance_org_members_select" ON compliance_org_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR org_id IN (SELECT id FROM compliance_orgs WHERE owner_id = auth.uid())
  );

-- Only org owner can insert/update/delete members (via service role in API)
CREATE POLICY "compliance_org_members_service_all" ON compliance_org_members
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- Update user_compliance_reviews to support org-shared state
-- Add org_id column so reviews can be shared across team members
-- ============================================================

ALTER TABLE user_compliance_reviews
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES compliance_orgs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS user_compliance_reviews_org_id_idx ON user_compliance_reviews (org_id);
