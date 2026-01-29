/*
  # Add Questions Array and Advanced Targeting

  1. Schema Changes
    - Add `questions` JSONB column to store array of question objects
    - Add `targeting_config` JSONB column to store complex targeting filters
    - Add `pricing_breakdown` JSONB column to store itemized pricing
    - Add `mission_objective` TEXT column for editable mission statement

  2. Notes
    - questions: Array of {id, text, type, options, aiRefined}
    - targeting_config: Object with {geography, demographics, professional, behavior}
    - pricing_breakdown: Object with {base, questionSurcharge, targetingSurcharge, total}
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'missions' AND column_name = 'questions'
  ) THEN
    ALTER TABLE missions ADD COLUMN questions JSONB DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'missions' AND column_name = 'targeting_config'
  ) THEN
    ALTER TABLE missions ADD COLUMN targeting_config JSONB DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'missions' AND column_name = 'pricing_breakdown'
  ) THEN
    ALTER TABLE missions ADD COLUMN pricing_breakdown JSONB DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'missions' AND column_name = 'mission_objective'
  ) THEN
    ALTER TABLE missions ADD COLUMN mission_objective TEXT DEFAULT '';
  END IF;
END $$;
