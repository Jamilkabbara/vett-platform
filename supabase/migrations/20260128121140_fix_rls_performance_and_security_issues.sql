/*
  # Fix RLS Performance and Security Issues

  1. RLS Policy Optimization
    - Update all `profiles` table policies to use `(select auth.uid())` instead of `auth.uid()`
    - This prevents re-evaluation of auth functions for each row, improving performance at scale
    
  2. Remove Unused Indexes
    - Drop `idx_missions_user_id` - unused index on missions table
    - Drop `idx_missions_created_at` - unused index on missions table
    
  3. Function Security
    - Add explicit search_path to `handle_new_user` function
    - Add explicit search_path to `handle_updated_at` function
    - This prevents search_path manipulation attacks

  4. Auth DB Connection Strategy
    - NOTE: The Auth server connection strategy should be changed to percentage-based
    - This requires manual configuration in Supabase Dashboard under Project Settings > Database
    - Cannot be automated via migration
*/

-- Drop existing policies on profiles table
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Recreate policies with optimized auth function calls
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- Drop unused indexes on missions table
DROP INDEX IF EXISTS idx_missions_user_id;
DROP INDEX IF EXISTS idx_missions_created_at;

-- Recreate handle_new_user function with explicit search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, company_name, vat_tax_id)
  VALUES (NEW.id, '', '', '');
  RETURN NEW;
END;
$$;

-- Recreate handle_updated_at function with explicit search_path
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;