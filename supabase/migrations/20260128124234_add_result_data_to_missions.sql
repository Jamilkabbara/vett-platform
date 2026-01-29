/*
  # Add Result Data Storage

  ## Overview
  This migration adds columns to store mission results and completion timestamps.

  ## Changes

  ### Columns Added to `missions` table
  - `result_data` (jsonb) - Stores the generated survey results data
  - `completed_at` (timestamptz) - Timestamp when mission was completed

  ## Notes
  - Uses IF NOT EXISTS to prevent errors if columns already exist
  - Sets nullable for backward compatibility
*/

-- Add result_data column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'missions' AND column_name = 'result_data'
  ) THEN
    ALTER TABLE missions ADD COLUMN result_data jsonb;
  END IF;
END $$;

-- Add completed_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'missions' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE missions ADD COLUMN completed_at timestamptz;
  END IF;
END $$;
