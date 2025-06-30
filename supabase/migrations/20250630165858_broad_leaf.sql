/*
  # Onboarding Sessions Persistence

  1. New Tables
    - `onboarding_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `session_data` (jsonb, stores onboarding answers)
      - `current_step` (text, current question/step)
      - `completed_steps` (text[], array of completed steps)
      - `progress_percentage` (integer, 0-100)
      - `started_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `completed_at` (timestamptz, null until completed)
      - `expires_at` (timestamptz, 7 days from creation)
      - `is_abandoned` (boolean, for cleanup)

  2. Security
    - Enable RLS on `onboarding_sessions` table
    - Add policy for authenticated users to manage their own sessions

  3. Functions
    - `update_onboarding_progress()` - Upsert session progress
    - `get_onboarding_progress()` - Retrieve user's current session
    - `cleanup_expired_onboarding_sessions()` - Maintenance function

  4. Indexes and Triggers
    - Performance indexes on user_id, updated_at, expires_at
    - Auto-update trigger for updated_at column
    - Unique constraint for active sessions per user
*/

-- Create onboarding sessions table
CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_data jsonb NOT NULL DEFAULT '{}',
  current_step text NOT NULL DEFAULT 'start',
  completed_steps text[] DEFAULT '{}',
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  started_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  is_abandoned boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS onboarding_sessions_user_id_idx ON onboarding_sessions(user_id);
CREATE INDEX IF NOT EXISTS onboarding_sessions_updated_at_idx ON onboarding_sessions(updated_at);
CREATE INDEX IF NOT EXISTS onboarding_sessions_expires_at_idx ON onboarding_sessions(expires_at);
CREATE INDEX IF NOT EXISTS onboarding_sessions_progress_idx ON onboarding_sessions(progress_percentage);

-- RLS Policies
CREATE POLICY "Users can manage their own onboarding sessions"
  ON onboarding_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow service role to access all sessions for cleanup
CREATE POLICY "Service role can manage all onboarding sessions"
  ON onboarding_sessions FOR ALL
  TO service_role
  USING (true);

-- Function to update session progress
CREATE OR REPLACE FUNCTION update_onboarding_progress(
  p_user_id uuid,
  p_session_data jsonb,
  p_current_step text,
  p_completed_steps text[] DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  session_id uuid;
  new_progress integer;
BEGIN
  -- Calculate progress based on completed steps
  new_progress := CASE 
    WHEN p_completed_steps IS NULL THEN 0
    WHEN array_length(p_completed_steps, 1) IS NULL THEN 0
    ELSE LEAST(100, (array_length(p_completed_steps, 1) * 100) / 7) -- 7 total steps, cap at 100
  END;

  -- Upsert onboarding session (delete old, insert new to avoid unique constraint issues)
  DELETE FROM onboarding_sessions WHERE user_id = p_user_id;
  
  INSERT INTO onboarding_sessions (
    user_id,
    session_data,
    current_step,
    completed_steps,
    progress_percentage,
    updated_at
  ) VALUES (
    p_user_id,
    p_session_data,
    p_current_step,
    COALESCE(p_completed_steps, '{}'),
    new_progress,
    now()
  )
  RETURNING id INTO session_id;

  -- Mark as completed if 100% progress
  IF new_progress = 100 THEN
    UPDATE onboarding_sessions 
    SET completed_at = now() 
    WHERE id = session_id;
  END IF;

  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get onboarding progress
CREATE OR REPLACE FUNCTION get_onboarding_progress(p_user_id uuid)
RETURNS TABLE(
  session_id uuid,
  session_data jsonb,
  current_step text,
  completed_steps text[],
  progress_percentage integer,
  is_completed boolean,
  expires_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    os.id,
    os.session_data,
    os.current_step,
    os.completed_steps,
    os.progress_percentage,
    (os.completed_at IS NOT NULL) as is_completed,
    os.expires_at
  FROM onboarding_sessions os
  WHERE os.user_id = p_user_id
    AND os.expires_at > now()
    AND NOT os.is_abandoned
  ORDER BY os.updated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_onboarding_sessions()
RETURNS integer AS $$
DECLARE
  abandoned_count integer;
  deleted_count integer;
BEGIN
  -- Mark expired sessions as abandoned
  UPDATE onboarding_sessions 
  SET is_abandoned = true
  WHERE expires_at < now() 
    AND completed_at IS NULL
    AND NOT is_abandoned;
  
  GET DIAGNOSTICS abandoned_count = ROW_COUNT;
    
  -- Delete very old abandoned sessions (older than 30 days)
  DELETE FROM onboarding_sessions
  WHERE is_abandoned = true 
    AND updated_at < now() - interval '30 days';
    
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Return total cleaned up sessions
  RETURN abandoned_count + deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_onboarding_sessions_updated_at ON onboarding_sessions;

-- Create trigger
CREATE TRIGGER update_onboarding_sessions_updated_at
    BEFORE UPDATE ON onboarding_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_onboarding_updated_at();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON onboarding_sessions TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions for functions
GRANT EXECUTE ON FUNCTION update_onboarding_progress(uuid, jsonb, text, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_onboarding_progress(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_onboarding_sessions() TO service_role;