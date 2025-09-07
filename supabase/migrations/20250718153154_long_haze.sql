/*
  # Fix lesson series relationship

  1. Changes
    - Drop existing tables if they exist
    - Recreate lesson_series table with proper structure
    - Recreate series_lessons table with correct foreign key relationship
    - Add proper indexes and RLS policies
    - Ensure foreign key relationship is properly established

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Drop existing tables to recreate with proper relationships
DROP TABLE IF EXISTS series_lessons CASCADE;
DROP TABLE IF EXISTS lesson_series CASCADE;

-- Create lesson_series table
CREATE TABLE lesson_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'other',
  difficulty text NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  total_lessons integer NOT NULL DEFAULT 0,
  completed_lessons integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create series_lessons table with proper foreign key
CREATE TABLE series_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES lesson_series(id) ON DELETE CASCADE,
  lesson_number integer NOT NULL,
  title text NOT NULL,
  introduction text NOT NULL,
  core_definition text NOT NULL,
  examples jsonb NOT NULL DEFAULT '[]',
  assessment_question text NOT NULL,
  assessment_options jsonb NOT NULL DEFAULT '[]',
  correct_answer integer NOT NULL DEFAULT 0,
  completed boolean DEFAULT false,
  duration_minutes integer DEFAULT 15,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_lesson_series_user_id ON lesson_series(user_id);
CREATE INDEX idx_lesson_series_created_at ON lesson_series(created_at DESC);
CREATE INDEX idx_series_lessons_series_id ON series_lessons(series_id);
CREATE INDEX idx_series_lessons_lesson_number ON series_lessons(series_id, lesson_number);

-- Enable RLS
ALTER TABLE lesson_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE series_lessons ENABLE ROW LEVEL SECURITY;

-- RLS policies for lesson_series
CREATE POLICY "Users can read own lesson series"
  ON lesson_series
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own lesson series"
  ON lesson_series
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own lesson series"
  ON lesson_series
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own lesson series"
  ON lesson_series
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS policies for series_lessons
CREATE POLICY "Users can read own series lessons"
  ON series_lessons
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lesson_series 
      WHERE lesson_series.id = series_lessons.series_id 
      AND lesson_series.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own series lessons"
  ON series_lessons
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lesson_series 
      WHERE lesson_series.id = series_lessons.series_id 
      AND lesson_series.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own series lessons"
  ON series_lessons
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lesson_series 
      WHERE lesson_series.id = series_lessons.series_id 
      AND lesson_series.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own series lessons"
  ON series_lessons
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lesson_series 
      WHERE lesson_series.id = series_lessons.series_id 
      AND lesson_series.user_id = auth.uid()
    )
  );

-- Add trigger for updating updated_at
CREATE TRIGGER update_lesson_series_updated_at
  BEFORE UPDATE ON lesson_series
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();