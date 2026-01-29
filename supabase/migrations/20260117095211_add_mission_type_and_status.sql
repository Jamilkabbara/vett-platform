/*
  # Add Mission Type and Status Columns

  ## Overview
  This migration adds two new columns to the missions table:
  - mission_type: to store the type of mission (pulse_check, ab_test, open_ended)
  - status: to store the mission status (DRAFT, ACTIVE, COMPLETED, etc.)

  ## Changes
  
  ### Columns Added
  - `mission_type` (text) - Type of mission: pulse_check, ab_test, or open_ended
  - `status` (text) - Mission status: DRAFT, ACTIVE, COMPLETED, PAUSED, ARCHIVED

  ## Notes
  - Uses IF NOT EXISTS to prevent errors if columns already exist
  - Sets default values for new columns
*/

-- Add mission_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'missions' AND column_name = 'mission_type'
  ) THEN
    ALTER TABLE missions ADD COLUMN mission_type text DEFAULT '';
  END IF;
END $$;

-- Add status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'missions' AND column_name = 'status'
  ) THEN
    ALTER TABLE missions ADD COLUMN status text DEFAULT 'DRAFT';
  END IF;
END $$;