/*
  # Optimize RLS Policies and Function Security

  ## Overview
  This migration optimizes Row Level Security policies for better performance at scale
  and improves function security by setting stable search paths.

  ## Changes

  ### 1. RLS Policy Optimization
  - Replace all `auth.uid()` calls with `(select auth.uid())` in RLS policies
  - This prevents re-evaluation of auth.uid() for each row, significantly improving query performance
  - Applies to all four policies: SELECT, INSERT, UPDATE, DELETE

  ### 2. Function Security
  - Set stable search_path for `update_missions_updated_at` function
  - Prevents potential security issues from search_path manipulation

  ## Performance Impact
  - Dramatically improves query performance for tables with many rows
  - Single auth.uid() evaluation per query instead of per-row evaluation
  - Recommended best practice by Supabase for production applications

  ## Notes
  - Indexes on user_id and created_at remain in place for query optimization
  - Auth DB connection strategy should be changed to percentage-based in Supabase Dashboard
    (Project Settings > Database > Connection Pooling)
*/

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view own missions" ON missions;
DROP POLICY IF EXISTS "Users can insert own missions" ON missions;
DROP POLICY IF EXISTS "Users can update own missions" ON missions;
DROP POLICY IF EXISTS "Users can delete own missions" ON missions;

-- Recreate optimized RLS policies with subquery for auth.uid()
-- This ensures auth.uid() is evaluated once per query, not per row

CREATE POLICY "Users can view own missions"
  ON missions
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own missions"
  ON missions
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own missions"
  ON missions
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own missions"
  ON missions
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Update function with stable search_path for security
CREATE OR REPLACE FUNCTION update_missions_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
