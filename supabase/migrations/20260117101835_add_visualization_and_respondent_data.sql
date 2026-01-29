/*
  # Add Visualization and Respondent Data

  ## Overview
  This migration adds columns to support mission visualization types, respondent
  counts, and pricing estimates for the dashboard results engine.

  ## Changes

  ### Columns Added to `missions` table
  - `visualization_type` (text) - Type of visualization: RATING, BINARY, TEXT, CHOICE
  - `respondent_count` (integer) - Target number of respondents (10-2000)
  - `estimated_price` (numeric) - Calculated estimated price based on respondent count

  ## Notes
  - Uses IF NOT EXISTS to prevent errors if columns already exist
  - Sets default values for backward compatibility
*/

-- Add visualization_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'missions' AND column_name = 'visualization_type'
  ) THEN
    ALTER TABLE missions ADD COLUMN visualization_type text DEFAULT 'RATING';
  END IF;
END $$;

-- Add respondent_count column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'missions' AND column_name = 'respondent_count'
  ) THEN
    ALTER TABLE missions ADD COLUMN respondent_count integer DEFAULT 50;
  END IF;
END $$;

-- Add estimated_price column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'missions' AND column_name = 'estimated_price'
  ) THEN
    ALTER TABLE missions ADD COLUMN estimated_price numeric DEFAULT 125.00;
  END IF;
END $$;