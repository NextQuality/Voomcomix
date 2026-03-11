-- ============================================
-- VOOMCOMIX PLATFORM — SUPABASE DATABASE SETUP
-- Run this in: Supabase → SQL Editor → New Query
-- ============================================

-- 1. PROFILES (writers + readers)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT DEFAULT 'reader', -- 'reader', 'writer', 'admin'
  is_approved_writer BOOLEAN DEFAULT false,
  upi_id TEXT, -- for revenue payments
  total_views BIGINT DEFAULT 0,
  total_earnings NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. STORIES
CREATE TABLE stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  cover_emoji TEXT DEFAULT '📖',
  type TEXT DEFAULT 'novel', -- 'novel', 'manga', 'comic'
  genre TEXT,
  tags TEXT[],
  language TEXT DEFAULT 'English',
  status TEXT DEFAULT 'ongoing', -- 'ongoing', 'complete', 'hiatus'
  approval_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  is_trending BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  total_views BIGINT DEFAULT 0,
  total_chapters INT DEFAULT 0,
  total_likes INT DEFAULT 0,
  total_followers INT DEFAULT 0,
  rating NUMERIC(3,1) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CHAPTERS
CREATE TABLE chapters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL,
  title TEXT NOT NULL,
  content TEXT, -- novel text
  word_count INT DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  views BIGINT DEFAULT 0,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CHAPTER PAGES (manga/comic)
CREATE TABLE chapter_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  page_number INT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BOOKMARKS
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  last_chapter_read INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, story_id)
);

-- 6. LIKES
CREATE TABLE likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, story_id)
);

-- 7. COMMENTS
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. VIEW TRACKING (for revenue)
CREATE TABLE story_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  viewer_ip TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. REVENUE RECORDS
CREATE TABLE revenue_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- '2025-03'
  total_views BIGINT DEFAULT 0,
  adsense_amount NUMERIC(10,2) DEFAULT 0,
  writer_share NUMERIC(10,2) DEFAULT 0,
  platform_share NUMERIC(10,2) DEFAULT 0,
  share_percent INT DEFAULT 70, -- writer gets 70%
  status TEXT DEFAULT 'pending', -- 'pending', 'paid'
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. WRITER APPLICATIONS
CREATE TABLE writer_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  sample_writing TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE writer_applications ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Public profiles viewable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- STORIES policies
CREATE POLICY "Approved stories viewable" ON stories FOR SELECT USING (approval_status = 'approved' OR author_id = auth.uid());
CREATE POLICY "Writers insert stories" ON stories FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Writers update own stories" ON stories FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Writers delete own stories" ON stories FOR DELETE USING (auth.uid() = author_id);

-- CHAPTERS policies
CREATE POLICY "Chapters of approved stories viewable" ON chapters FOR SELECT USING (true);
CREATE POLICY "Writers insert chapters" ON chapters FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM stories WHERE id = story_id AND author_id = auth.uid())
);
CREATE POLICY "Writers update own chapters" ON chapters FOR UPDATE USING (
  EXISTS (SELECT 1 FROM stories WHERE id = story_id AND author_id = auth.uid())
);
CREATE POLICY "Writers delete own chapters" ON chapters FOR DELETE USING (
  EXISTS (SELECT 1 FROM stories WHERE id = story_id AND author_id = auth.uid())
);

-- CHAPTER PAGES policies
CREATE POLICY "Pages viewable" ON chapter_pages FOR SELECT USING (true);
CREATE POLICY "Writers insert pages" ON chapter_pages FOR INSERT WITH CHECK (true);

-- BOOKMARKS policies
CREATE POLICY "Users see own bookmarks" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own bookmarks" ON bookmarks FOR ALL USING (auth.uid() = user_id);

-- LIKES policies
CREATE POLICY "Likes viewable" ON likes FOR SELECT USING (true);
CREATE POLICY "Users manage own likes" ON likes FOR ALL USING (auth.uid() = user_id);

-- COMMENTS policies
CREATE POLICY "Comments viewable" ON comments FOR SELECT USING (true);
CREATE POLICY "Logged in users comment" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- VIEWS policies
CREATE POLICY "Anyone can insert views" ON story_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Authors see own story views" ON story_views FOR SELECT USING (true);

-- REVENUE policies
CREATE POLICY "Authors see own revenue" ON revenue_records FOR SELECT USING (auth.uid() = author_id);

-- WRITER APPLICATIONS policies
CREATE POLICY "Users see own application" ON writer_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users submit application" ON writer_applications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, username, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'reader'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update story view count
CREATE OR REPLACE FUNCTION increment_story_views(story_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE stories SET total_views = total_views + 1 WHERE id = story_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update chapter count on insert
CREATE OR REPLACE FUNCTION update_chapter_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stories SET total_chapters = (
    SELECT COUNT(*) FROM chapters WHERE story_id = NEW.story_id
  ), updated_at = NOW()
  WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_chapter_insert
  AFTER INSERT OR DELETE ON chapters
  FOR EACH ROW EXECUTE FUNCTION update_chapter_count();

-- ============================================
-- STORAGE BUCKETS (run separately if needed)
-- ============================================
-- In Supabase Dashboard → Storage → Create buckets:
-- 1. "covers"   — public
-- 2. "pages"    — public  
-- 3. "avatars"  — public
