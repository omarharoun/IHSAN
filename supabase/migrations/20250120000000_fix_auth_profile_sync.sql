/*
  # Fix Auth-Profile Sync Configuration
  
  This migration fixes the authentication to profile synchronization by:
  
  1. Ensuring the profiles table exists with all required fields
  2. Creating a robust trigger function that handles all profile fields
  3. Adding proper error handling and safety checks
  4. Ensuring the trigger works correctly with Supabase Auth
*/

-- First, ensure the profiles table exists with all required fields
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  xp integer DEFAULT 0,
  streak integer DEFAULT 0,
  last_activity timestamptz DEFAULT now(),
  last_opened date DEFAULT CURRENT_DATE,
  daily_xp_goal integer DEFAULT 100,
  daily_xp_streak integer DEFAULT 0,
  perfect_weeks integer DEFAULT 0,
  weekend_streak integer DEFAULT 0,
  night_owl_sessions integer DEFAULT 0,
  early_bird_sessions integer DEFAULT 0,
  speed_learner_count integer DEFAULT 0,
  consistent_days integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add any missing columns if they don't exist
DO $$ 
BEGIN
  -- Add columns that might not exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_activity') THEN
    ALTER TABLE profiles ADD COLUMN last_activity timestamptz DEFAULT now();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'daily_xp_goal') THEN
    ALTER TABLE profiles ADD COLUMN daily_xp_goal integer DEFAULT 100;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'daily_xp_streak') THEN
    ALTER TABLE profiles ADD COLUMN daily_xp_streak integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'perfect_weeks') THEN
    ALTER TABLE profiles ADD COLUMN perfect_weeks integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'weekend_streak') THEN
    ALTER TABLE profiles ADD COLUMN weekend_streak integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'night_owl_sessions') THEN
    ALTER TABLE profiles ADD COLUMN night_owl_sessions integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'early_bird_sessions') THEN
    ALTER TABLE profiles ADD COLUMN early_bird_sessions integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'speed_learner_count') THEN
    ALTER TABLE profiles ADD COLUMN speed_learner_count integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'consistent_days') THEN
    ALTER TABLE profiles ADD COLUMN consistent_days integer DEFAULT 0;
  END IF;
END $$;

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policies for profiles
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create a robust trigger function for handling new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name text;
  user_email text;
BEGIN
  -- Extract user information from auth.users
  user_email := NEW.email;
  
  -- Get name from metadata or use email as fallback
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name', 
    split_part(user_email, '@', 1),
    'User'
  );
  
  -- Only create profile if it doesn't already exist
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (
      id, 
      email, 
      name,
      xp,
      streak,
      last_activity,
      last_opened,
      daily_xp_goal,
      daily_xp_streak,
      perfect_weeks,
      weekend_streak,
      night_owl_sessions,
      early_bird_sessions,
      speed_learner_count,
      consistent_days
    ) VALUES (
      NEW.id,
      user_email,
      user_name,
      0, -- xp
      0, -- streak
      now(), -- last_activity
      CURRENT_DATE, -- last_opened
      100, -- daily_xp_goal
      0, -- daily_xp_streak
      0, -- perfect_weeks
      0, -- weekend_streak
      0, -- night_owl_sessions
      0, -- early_bird_sessions
      0, -- speed_learner_count
      0  -- consistent_days
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating updated_at if it doesn't exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_last_activity ON profiles(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_last_opened ON profiles(last_opened DESC);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated; 