/*
  # Create lesson series and lessons tables

  1. New Tables
    - `lesson_series`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `title` (text)
      - `description` (text)
      - `category` (text)
      - `difficulty` (text)
      - `total_lessons` (integer)
      - `completed_lessons` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `series_lessons`
      - `id` (uuid, primary key)
      - `series_id` (uuid, foreign key to lesson_series)
      - `lesson_number` (integer)
      - `title` (text)
      - `introduction` (text)
      - `core_definition` (text)
      - `examples` (jsonb array)
      - `assessment_question` (text)
      - `assessment_options` (jsonb array)
      - `correct_answer` (integer)
      - `completed` (boolean)
      - `duration_minutes` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create lesson_series table
CREATE TABLE IF NOT EXISTS lesson_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'other',
  difficulty text NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  total_lessons integer NOT NULL DEFAULT 0,
  completed_lessons integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create series_lessons table
CREATE TABLE IF NOT EXISTS series_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid REFERENCES lesson_series(id) ON DELETE CASCADE NOT NULL,
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

-- Enable RLS
ALTER TABLE lesson_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE series_lessons ENABLE ROW LEVEL SECURITY;

-- Create policies for lesson_series
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

-- Create policies for series_lessons
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lesson_series_user_id ON lesson_series(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_series_created_at ON lesson_series(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_series_lessons_series_id ON series_lessons(series_id);
CREATE INDEX IF NOT EXISTS idx_series_lessons_lesson_number ON series_lessons(series_id, lesson_number);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lesson_series_updated_at
    BEFORE UPDATE ON lesson_series
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();