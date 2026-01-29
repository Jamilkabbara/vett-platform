/*
  # Create Missions Table

  ## Overview
  This migration creates the missions table to store user mission setup data including
  context, target audience, core questions, and builder profile information.

  ## New Tables
  
  ### `missions`
  - `id` (uuid, primary key) - Unique identifier for each mission
  - `user_id` (uuid, foreign key) - References auth.users, links mission to user
  - `context` (text) - The user's idea or project context
  - `target` (text) - Target audience description (e.g., "Gen Z Gamers")
  - `question` (text) - Core validation question to be answered
  - `role` (text) - User's role (Founder, Product Manager, etc.)
  - `industry` (text) - User's industry (SaaS/Tech, CPG, etc.)
  - `stage` (text) - Current project stage (Idea, MVP, Growth, etc.)
  - `created_at` (timestamptz) - Timestamp of mission creation
  - `updated_at` (timestamptz) - Timestamp of last update

  ## Security
  
  ### Row Level Security (RLS)
  - Enable RLS on missions table
  - Users can only view their own missions
  - Users can only insert their own missions
  - Users can only update their own missions
  - Users can only delete their own missions

  ## Indexes
  - Index on user_id for efficient user-specific queries
  - Index on created_at for chronological sorting
*/

-- Create missions table
CREATE TABLE IF NOT EXISTS missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  context text NOT NULL DEFAULT '',
  target text NOT NULL DEFAULT '',
  question text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT '',
  industry text NOT NULL DEFAULT '',
  stage text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own missions
CREATE POLICY "Users can view own missions"
  ON missions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own missions
CREATE POLICY "Users can insert own missions"
  ON missions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own missions
CREATE POLICY "Users can update own missions"
  ON missions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own missions
CREATE POLICY "Users can delete own missions"
  ON missions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_missions_user_id ON missions(user_id);
CREATE INDEX IF NOT EXISTS idx_missions_created_at ON missions(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_missions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_missions_updated_at_trigger ON missions;
CREATE TRIGGER update_missions_updated_at_trigger
  BEFORE UPDATE ON missions
  FOR EACH ROW
  EXECUTE FUNCTION update_missions_updated_at();
