-- IHSAN Combined Dashboard Database Schema
-- This extends the existing MindFlow Dashboard schema with IHSAN-specific tables
-- Note: profiles, lessons, lesson_series, series_lessons, and chat_messages tables already exist

-- IHSAN Dashboard table
CREATE TABLE IF NOT EXISTS ihsan_dashboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  widgets JSONB DEFAULT '[]'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb,
  recent_activity JSONB DEFAULT '[]'::jsonb,
  bookmarks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ihsan_dashboard ENABLE ROW LEVEL SECURITY;

-- IHSAN Dashboard policies
CREATE POLICY "Users can read own dashboard"
  ON ihsan_dashboard
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own dashboard"
  ON ihsan_dashboard
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dashboard"
  ON ihsan_dashboard
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- IHSAN Feed table
CREATE TABLE IF NOT EXISTS ihsan_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  type TEXT NOT NULL DEFAULT 'video', -- video, article, podcast, etc.
  author TEXT,
  thumbnail_url TEXT,
  duration TEXT,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  category TEXT,
  tags TEXT[],
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ihsan_feed ENABLE ROW LEVEL SECURITY;

-- IHSAN Feed policies
CREATE POLICY "Users can read published feed items"
  ON ihsan_feed
  FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE POLICY "Users can manage own feed items"
  ON ihsan_feed
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- IHSAN Learning Resources table
CREATE TABLE IF NOT EXISTS ihsan_learning_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  duration_hours INTEGER,
  thumbnail_url TEXT,
  rating DECIMAL(3,2) DEFAULT 0,
  students_count INTEGER DEFAULT 0,
  instructor TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ihsan_learning_resources ENABLE ROW LEVEL SECURITY;

-- Learning Resources policies
CREATE POLICY "Anyone can read learning resources"
  ON ihsan_learning_resources
  FOR SELECT
  TO authenticated
  USING (true);

-- IHSAN Work Projects table
CREATE TABLE IF NOT EXISTS ihsan_work_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning', -- planning, in_progress, completed, on_hold
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  due_date DATE,
  team_members INTEGER DEFAULT 1,
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ihsan_work_projects ENABLE ROW LEVEL SECURITY;

-- Work Projects policies
CREATE POLICY "Users can manage own projects"
  ON ihsan_work_projects
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- IHSAN Work Tasks table
CREATE TABLE IF NOT EXISTS ihsan_work_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES ihsan_work_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  due_date DATE,
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ihsan_work_tasks ENABLE ROW LEVEL SECURITY;

-- Work Tasks policies
CREATE POLICY "Users can manage own tasks"
  ON ihsan_work_tasks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- IHSAN Tools table
CREATE TABLE IF NOT EXISTS ihsan_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT,
  url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ihsan_tools ENABLE ROW LEVEL SECURITY;

-- Tools policies
CREATE POLICY "Anyone can read active tools"
  ON ihsan_tools
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- IHSAN User Analytics table
CREATE TABLE IF NOT EXISTS ihsan_user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  lessons_created INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  chat_messages INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ihsan_user_analytics ENABLE ROW LEVEL SECURITY;

-- User Analytics policies
CREATE POLICY "Users can read own analytics"
  ON ihsan_user_analytics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert analytics"
  ON ihsan_user_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ihsan_dashboard_user_id ON ihsan_dashboard(user_id);
CREATE INDEX IF NOT EXISTS idx_ihsan_feed_user_id ON ihsan_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_ihsan_feed_category ON ihsan_feed(category);
CREATE INDEX IF NOT EXISTS idx_ihsan_feed_created_at ON ihsan_feed(created_at);
CREATE INDEX IF NOT EXISTS idx_ihsan_learning_resources_category ON ihsan_learning_resources(category);
CREATE INDEX IF NOT EXISTS idx_ihsan_learning_resources_difficulty ON ihsan_learning_resources(difficulty);
CREATE INDEX IF NOT EXISTS idx_ihsan_work_projects_user_id ON ihsan_work_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_ihsan_work_tasks_project_id ON ihsan_work_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_ihsan_work_tasks_user_id ON ihsan_work_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_ihsan_tools_category ON ihsan_tools(category);
CREATE INDEX IF NOT EXISTS idx_ihsan_user_analytics_user_id ON ihsan_user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_ihsan_user_analytics_date ON ihsan_user_analytics(date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ihsan_dashboard_updated_at BEFORE UPDATE ON ihsan_dashboard FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ihsan_feed_updated_at BEFORE UPDATE ON ihsan_feed FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ihsan_learning_resources_updated_at BEFORE UPDATE ON ihsan_learning_resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ihsan_work_projects_updated_at BEFORE UPDATE ON ihsan_work_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ihsan_work_tasks_updated_at BEFORE UPDATE ON ihsan_work_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ihsan_tools_updated_at BEFORE UPDATE ON ihsan_tools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
