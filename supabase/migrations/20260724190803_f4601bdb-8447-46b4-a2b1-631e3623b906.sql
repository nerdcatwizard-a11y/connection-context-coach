
-- =========================================================
-- Cyrano core schema
-- =========================================================

-- Enums
CREATE TYPE public.connection_stage AS ENUM (
  'new_match','messaging','planning_first_date','first_date_scheduled',
  'casually_dating','exclusively_dating','in_relationship','paused','ended','unsure'
);

CREATE TYPE public.subscription_tier AS ENUM ('free','premium');

CREATE TYPE public.chat_role AS ENUM ('user','assistant','system');

CREATE TYPE public.health_label AS ENUM ('strong','mixed','needs_more_info','concerning');

-- Shared updated_at helper
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

-- =========================================================
-- profiles
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  timezone TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Auto-create profile on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_preferences (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.subscriptions (user_id, tier) VALUES (NEW.id, 'free')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END $$;

-- =========================================================
-- user_preferences
-- =========================================================
CREATE TABLE public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  help_with TEXT[],                       -- top-level goals user selected
  dating_apps TEXT[],                     -- e.g. {'Hinge','Bumble'}
  relationship_goal TEXT,                 -- casual, serious, long-term, unsure, etc.
  communication_style TEXT,
  preferred_tone TEXT,
  writelikeme_enabled BOOLEAN NOT NULL DEFAULT false,
  journal_ai_context_optin BOOLEAN NOT NULL DEFAULT false,
  onboarding_skipped BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own prefs" ON public.user_preferences FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER prefs_set_updated_at BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Now that user_preferences exists, wire up the new-user trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- connections
-- =========================================================
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  nickname TEXT,
  private_label TEXT,
  dating_app TEXT,
  where_met TEXT,
  stage public.connection_stage NOT NULL DEFAULT 'new_match',
  matched_on DATE,
  intentions TEXT,
  user_goal TEXT,
  important_context TEXT,
  known_boundaries TEXT,
  concerns TEXT,
  positive_developments TEXT,
  status TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX connections_user_idx ON public.connections(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connections TO authenticated;
GRANT ALL ON public.connections TO service_role;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own connections" ON public.connections FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER connections_set_updated_at BEFORE UPDATE ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================
-- connection_timeline_events
-- =========================================================
CREATE TABLE public.connection_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,     -- match, first_message, date, cancel, boundary, note, status_change, etc.
  title TEXT NOT NULL,
  body TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX timeline_conn_idx ON public.connection_timeline_events(connection_id, occurred_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connection_timeline_events TO authenticated;
GRANT ALL ON public.connection_timeline_events TO service_role;
ALTER TABLE public.connection_timeline_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own timeline" ON public.connection_timeline_events FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- connection_insights
-- =========================================================
CREATE TABLE public.connection_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  observation TEXT NOT NULL,
  supporting_refs JSONB,
  dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connection_insights TO authenticated;
GRANT ALL ON public.connection_insights TO service_role;
ALTER TABLE public.connection_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own insights" ON public.connection_insights FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- connection_health_categories
-- =========================================================
CREATE TABLE public.connection_health_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  category TEXT NOT NULL,   -- reciprocity, consistency, respect, communication, boundaries, safety, alignment, follow_through
  label public.health_label NOT NULL,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connection_health_categories TO authenticated;
GRANT ALL ON public.connection_health_categories TO service_role;
ALTER TABLE public.connection_health_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own health" ON public.connection_health_categories FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- chats + chat_messages
-- =========================================================
CREATE TABLE public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  connection_id UUID REFERENCES public.connections(id) ON DELETE SET NULL,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX chats_user_idx ON public.chats(user_id, updated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chats TO authenticated;
GRANT ALL ON public.chats TO service_role;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own chats" ON public.chats FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER chats_set_updated_at BEFORE UPDATE ON public.chats
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.chat_role NOT NULL,
  content TEXT NOT NULL,
  parts JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX chat_messages_chat_idx ON public.chat_messages(chat_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own chat msgs" ON public.chat_messages FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- screenshots + screenshot_analyses
-- =========================================================
CREATE TABLE public.screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES public.connections(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,       -- {user_id}/{uuid}.png in 'screenshots' bucket
  ordinal INT NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX screenshots_user_idx ON public.screenshots(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.screenshots TO authenticated;
GRANT ALL ON public.screenshots TO service_role;
ALTER TABLE public.screenshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own screenshots" ON public.screenshots FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.screenshot_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES public.connections(id) ON DELETE SET NULL,
  screenshot_ids UUID[],
  request_type TEXT,        -- "what does this mean", "how should I respond", etc.
  user_context TEXT,
  analysis TEXT,
  suggested_responses JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.screenshot_analyses TO authenticated;
GRANT ALL ON public.screenshot_analyses TO service_role;
ALTER TABLE public.screenshot_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own analyses" ON public.screenshot_analyses FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- profile_reviews
-- =========================================================
CREATE TABLE public.profile_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dating_app TEXT,
  bio TEXT,
  prompts JSONB,
  photo_paths TEXT[],
  relationship_goal TEXT,
  desired_audience TEXT,
  what_isnt_working TEXT,
  voice_notes TEXT,
  feedback TEXT,
  suggested_bio TEXT,
  suggested_prompts JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_reviews TO authenticated;
GRANT ALL ON public.profile_reviews TO service_role;
ALTER TABLE public.profile_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile reviews" ON public.profile_reviews FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- saved_suggestions + conversation_starter_requests
-- =========================================================
CREATE TABLE public.saved_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES public.connections(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,           -- 'reply' | 'starter'
  input_context TEXT,
  desired_tone TEXT,
  desired_outcome TEXT,
  options JSONB NOT NULL,       -- [{ label, text, why }]
  chosen_option INT,
  sent_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_suggestions TO authenticated;
GRANT ALL ON public.saved_suggestions TO service_role;
ALTER TABLE public.saved_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own suggestions" ON public.saved_suggestions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.conversation_starter_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES public.connections(id) ON DELETE SET NULL,
  dating_app TEXT,
  match_bio TEXT,
  match_prompts JSONB,
  screenshot_ids UUID[],
  standout_details TEXT,
  desired_tone TEXT,
  goal TEXT,
  options JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_starter_requests TO authenticated;
GRANT ALL ON public.conversation_starter_requests TO service_role;
ALTER TABLE public.conversation_starter_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own starters" ON public.conversation_starter_requests FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- advice_outcomes
-- =========================================================
CREATE TABLE public.advice_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES public.connections(id) ON DELETE SET NULL,
  source_kind TEXT,          -- 'reply' | 'starter' | 'chat' | 'analysis'
  source_id UUID,
  sent_message TEXT,
  their_response TEXT,
  felt_natural BOOLEAN,
  moved_forward BOOLEAN,
  got_date BOOLEAN,
  reflection TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.advice_outcomes TO authenticated;
GRANT ALL ON public.advice_outcomes TO service_role;
ALTER TABLE public.advice_outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own outcomes" ON public.advice_outcomes FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- journal_entries + journal_connection_links
-- =========================================================
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  body TEXT NOT NULL,
  entry_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  mood TEXT,
  tags TEXT[],
  favorite BOOLEAN NOT NULL DEFAULT false,
  ai_context_optin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX journal_user_idx ON public.journal_entries(user_id, entry_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_entries TO authenticated;
GRANT ALL ON public.journal_entries TO service_role;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own journal" ON public.journal_entries FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER journal_set_updated_at BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.journal_connection_links (
  journal_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (journal_id, connection_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_connection_links TO authenticated;
GRANT ALL ON public.journal_connection_links TO service_role;
ALTER TABLE public.journal_connection_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own journal links" ON public.journal_connection_links FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- writelikeme_samples + communication_preferences
-- =========================================================
CREATE TABLE public.writelikeme_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sample TEXT NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.writelikeme_samples TO authenticated;
GRANT ALL ON public.writelikeme_samples TO service_role;
ALTER TABLE public.writelikeme_samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own samples" ON public.writelikeme_samples FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.communication_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  typical_length TEXT,
  formality TEXT,
  emoji_usage TEXT,
  humor_level TEXT,
  directness TEXT,
  warmth TEXT,
  flirting_style TEXT,
  words_i_use TEXT[],
  words_to_avoid TEXT[],
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communication_preferences TO authenticated;
GRANT ALL ON public.communication_preferences TO service_role;
ALTER TABLE public.communication_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own comm prefs" ON public.communication_preferences FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER comm_prefs_set_updated_at BEFORE UPDATE ON public.communication_preferences
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================
-- subscriptions + usage_limits
-- =========================================================
CREATE TABLE public.subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier public.subscription_tier NOT NULL DEFAULT 'free',
  renews_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own subscription" ON public.subscriptions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER subs_set_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,        -- 'ai_message','screenshot_analysis','profile_review'
  period TEXT NOT NULL,        -- 'daily','monthly'
  period_start DATE NOT NULL,
  count INT NOT NULL DEFAULT 0,
  UNIQUE (user_id, metric, period, period_start)
);
CREATE INDEX usage_user_idx ON public.usage_limits(user_id, metric, period_start DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usage_limits TO authenticated;
GRANT ALL ON public.usage_limits TO service_role;
ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own usage" ON public.usage_limits FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- Storage policies: user-scoped folders in private buckets
-- =========================================================
CREATE POLICY "screenshots read own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "screenshots write own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "screenshots update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "screenshots delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "profile-photos read own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "profile-photos write own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "profile-photos update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "profile-photos delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
