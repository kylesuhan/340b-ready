-- ============================================================
-- Migration 005: Gamification — streaks, XP, badges, leaderboard
-- ============================================================

-- Gamification profile per user
CREATE TABLE IF NOT EXISTS user_gamification (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  xp                  INT NOT NULL DEFAULT 0,
  level               INT NOT NULL DEFAULT 1,
  current_streak      INT NOT NULL DEFAULT 0,
  longest_streak      INT NOT NULL DEFAULT 0,
  last_activity_date  DATE,
  leaderboard_opt_in  BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Badges earned by users
CREATE TABLE IF NOT EXISTS user_badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id    TEXT NOT NULL,   -- e.g. 'first_pass', 'perfect_score', '340b_ready'
  earned_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS user_gamification_user_id_idx ON user_gamification (user_id);
CREATE INDEX IF NOT EXISTS user_gamification_xp_idx ON user_gamification (xp DESC);
CREATE INDEX IF NOT EXISTS user_badges_user_id_idx ON user_badges (user_id);

-- updated_at trigger
CREATE TRIGGER set_user_gamification_updated_at
  BEFORE UPDATE ON user_gamification
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_gamification_own" ON user_gamification
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Leaderboard: users can read rows where leaderboard_opt_in = true
CREATE POLICY "user_gamification_leaderboard" ON user_gamification
  FOR SELECT TO authenticated
  USING (leaderboard_opt_in = true);

CREATE POLICY "user_badges_own" ON user_badges
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Service role full access
CREATE POLICY "user_gamification_service" ON user_gamification
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "user_badges_service" ON user_badges
  FOR ALL TO service_role USING (true) WITH CHECK (true);
