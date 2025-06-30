/*
  # Enhanced Authentication Security

  1. Security Enhancements
    - Add better RLS policies with role-based access
    - Create admin and user roles
    - Add rate limiting tables
    - Enhance profile security

  2. Tables
    - Update profiles table with better constraints
    - Add auth_attempts table for rate limiting
    - Add user_roles table for RBAC

  3. Security
    - Enhanced RLS policies
    - Role-based access control
    - Rate limiting tracking
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user roles enum
CREATE TYPE user_role AS ENUM ('user', 'coach', 'admin');

-- Update profiles table with additional security fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user',
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_sign_in_at timestamptz,
ADD COLUMN IF NOT EXISTS sign_in_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS failed_sign_in_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_at timestamptz,
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
CREATE INDEX IF NOT EXISTS profiles_email_verified_idx ON profiles(email_verified);

-- Create auth attempts tracking table for rate limiting
CREATE TABLE IF NOT EXISTS auth_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address inet NOT NULL,
  email text,
  attempt_type text NOT NULL, -- 'signin', 'signup', 'reset'
  success boolean DEFAULT false,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Add RLS to auth_attempts
ALTER TABLE auth_attempts ENABLE ROW LEVEL SECURITY;

-- Create index for auth attempts cleanup and queries
CREATE INDEX IF NOT EXISTS auth_attempts_ip_created_idx ON auth_attempts(ip_address, created_at);
CREATE INDEX IF NOT EXISTS auth_attempts_email_created_idx ON auth_attempts(email, created_at);
CREATE INDEX IF NOT EXISTS auth_attempts_created_idx ON auth_attempts(created_at);

-- Enhanced RLS policies for profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;

-- New enhanced policies
CREATE POLICY "Users can view own profile and public profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR
    (auth.uid() IS NOT NULL AND email_verified = true)
  );

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can update any profile
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS policies for auth_attempts (admin only)
CREATE POLICY "Admins can view auth attempts"
  ON auth_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert auth attempts"
  ON auth_attempts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (
    id, 
    username, 
    full_name, 
    avatar_url,
    email_verified,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(new.email_confirmed_at IS NOT NULL, false),
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Function to update profile timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating timestamps
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Function to clean up old auth attempts (called by cron)
CREATE OR REPLACE FUNCTION cleanup_auth_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM auth_attempts 
  WHERE created_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rate limiting
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_ip_address inet,
  p_email text DEFAULT NULL,
  p_attempt_type text DEFAULT 'signin',
  p_window_minutes integer DEFAULT 15,
  p_max_attempts integer DEFAULT 5
)
RETURNS boolean AS $$
DECLARE
  attempt_count integer;
BEGIN
  -- Count recent attempts from this IP or email
  SELECT COUNT(*) INTO attempt_count
  FROM auth_attempts
  WHERE 
    (ip_address = p_ip_address OR (p_email IS NOT NULL AND email = p_email))
    AND attempt_type = p_attempt_type
    AND success = false
    AND created_at > now() - interval '1 minute' * p_window_minutes;
  
  RETURN attempt_count < p_max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log authentication attempts
CREATE OR REPLACE FUNCTION log_auth_attempt(
  p_ip_address inet,
  p_email text,
  p_attempt_type text,
  p_success boolean,
  p_user_agent text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO auth_attempts (
    ip_address,
    email,
    attempt_type,
    success,
    user_agent
  ) VALUES (
    p_ip_address,
    p_email,
    p_attempt_type,
    p_success,
    p_user_agent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update profile sign-in tracking
CREATE OR REPLACE FUNCTION update_sign_in_stats(user_id uuid, success boolean)
RETURNS void AS $$
BEGIN
  IF success THEN
    UPDATE profiles 
    SET 
      last_sign_in_at = now(),
      sign_in_count = sign_in_count + 1,
      failed_sign_in_attempts = 0,
      locked_at = NULL
    WHERE id = user_id;
  ELSE
    UPDATE profiles 
    SET 
      failed_sign_in_attempts = failed_sign_in_attempts + 1,
      locked_at = CASE 
        WHEN failed_sign_in_attempts + 1 >= 5 THEN now() 
        ELSE locked_at 
      END
    WHERE id = user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;