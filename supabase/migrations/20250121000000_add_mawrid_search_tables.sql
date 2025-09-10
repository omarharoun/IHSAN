-- Add Mawrid Search Functionality to IHSAN Database
-- This migration adds tables and functionality to support the integrated search feature

-- Search History table to track user searches
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  processing_time DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Search History policies
CREATE POLICY "Users can read own search history"
  ON search_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search history"
  ON search_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own search history"
  ON search_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Search Bookmarks table to save interesting search results
CREATE TABLE IF NOT EXISTS search_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  snippet TEXT,
  domain TEXT,
  favicon_url TEXT,
  query TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE search_bookmarks ENABLE ROW LEVEL SECURITY;

-- Search Bookmarks policies
CREATE POLICY "Users can read own search bookmarks"
  ON search_bookmarks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search bookmarks"
  ON search_bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own search bookmarks"
  ON search_bookmarks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own search bookmarks"
  ON search_bookmarks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Search Sessions table to track search sessions
CREATE TABLE IF NOT EXISTS search_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_name TEXT,
  queries JSONB DEFAULT '[]'::jsonb,
  clicked_links JSONB DEFAULT '[]'::jsonb,
  duration_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE search_sessions ENABLE ROW LEVEL SECURITY;

-- Search Sessions policies
CREATE POLICY "Users can read own search sessions"
  ON search_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search sessions"
  ON search_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own search sessions"
  ON search_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own search sessions"
  ON search_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(query);

CREATE INDEX IF NOT EXISTS idx_search_bookmarks_user_id ON search_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_search_bookmarks_created_at ON search_bookmarks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_bookmarks_domain ON search_bookmarks(domain);

CREATE INDEX IF NOT EXISTS idx_search_sessions_user_id ON search_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_search_sessions_created_at ON search_sessions(created_at DESC);

-- Create triggers for updated_at
CREATE TRIGGER update_search_sessions_updated_at
  BEFORE UPDATE ON search_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add search preferences to user profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS search_preferences JSONB DEFAULT '{
  "default_search_engine": "tavily",
  "results_per_page": 10,
  "enable_ai_summary": true,
  "enable_images": true,
  "enable_suggestions": true,
  "safe_search": true,
  "language": "en"
}'::jsonb;

-- Create function to clean up old search history (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_search_history()
RETURNS void AS $$
BEGIN
  DELETE FROM search_history 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create function to get search suggestions based on user history
CREATE OR REPLACE FUNCTION get_search_suggestions(user_uuid UUID, query_text TEXT, limit_count INTEGER DEFAULT 10)
RETURNS TABLE(suggestion TEXT, frequency INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sh.query as suggestion,
    COUNT(*)::INTEGER as frequency
  FROM search_history sh
  WHERE sh.user_id = user_uuid
    AND sh.query ILIKE '%' || query_text || '%'
    AND sh.created_at > NOW() - INTERVAL '7 days'
  GROUP BY sh.query
  ORDER BY frequency DESC, sh.query
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON search_history TO authenticated;
GRANT ALL ON search_bookmarks TO authenticated;
GRANT ALL ON search_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION get_search_suggestions TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_search_history TO authenticated;
