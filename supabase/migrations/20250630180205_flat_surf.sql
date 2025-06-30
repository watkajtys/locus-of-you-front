/*
  # Fix Profiles RLS Policies - Prevent Infinite Recursion

  1. Changes Made
    - Remove problematic admin policies that cause infinite recursion
    - Simplify RLS policies to prevent self-referential queries
    - Maintain proper access control without circular dependencies

  2. Security
    - Users can still manage their own profiles
    - Public profiles remain accessible to authenticated users
    - Admin functionality will be handled through service role or separate approach

  3. Notes
    - The previous admin policies were causing infinite recursion by querying the profiles table
      within the policies for the profiles table itself
    - This migration removes the problematic policies and keeps the working ones
*/

-- Drop the problematic admin policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Keep the existing working policies:
-- 1. "Users can insert their own profile" - allows profile creation
-- 2. "Users can update own profile" - allows users to update their own data
-- 3. "Users can view own profile and public profiles" - allows viewing own profile and public profiles

-- Optional: If admin functionality is needed, it should be handled through:
-- 1. Service role bypassing RLS
-- 2. A separate admin_users table
-- 3. Or using auth.jwt() claims instead of querying the profiles table