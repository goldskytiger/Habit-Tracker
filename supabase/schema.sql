-- Habit Tracker schema
-- Run this in Supabase: SQL Editor → New Query → paste → Run

-- Habits
CREATE TABLE habits (
  id           UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID    REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name         TEXT    NOT NULL,
  emoji        TEXT    NOT NULL DEFAULT '✅',
  type         TEXT    NOT NULL DEFAULT 'daily' CHECK (type IN ('daily', 'volume')),
  target_count INTEGER NOT NULL DEFAULT 1,
  color        TEXT    NOT NULL DEFAULT '#6C47FF',
  created_at   TEXT    NOT NULL, -- YYYY-MM-DD
  inserted_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_habits" ON habits FOR ALL USING (auth.uid() = user_id);

-- Habit completions (one row per habit per day)
CREATE TABLE habit_completions (
  id       UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID    REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  user_id  UUID    REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date     TEXT    NOT NULL, -- YYYY-MM-DD
  count    INTEGER NOT NULL DEFAULT 0,
  UNIQUE (habit_id, date)
);

ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_completions" ON habit_completions FOR ALL USING (auth.uid() = user_id);

-- Challenges
CREATE TABLE challenges (
  id           UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID    REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  habit_id     UUID    REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  title        TEXT    NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 3,
  start_date   TEXT    NOT NULL, -- YYYY-MM-DD
  status       TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  inserted_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_challenges" ON challenges FOR ALL USING (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX habits_user_id_idx ON habits (user_id);
CREATE INDEX completions_habit_id_idx ON habit_completions (habit_id);
CREATE INDEX completions_user_date_idx ON habit_completions (user_id, date);
CREATE INDEX challenges_user_id_idx ON challenges (user_id);
