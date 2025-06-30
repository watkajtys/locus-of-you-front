/*
  # Onboarding Data Persistence System

  1. New Tables
    - `onboarding_sessions` - Track user onboarding progress
    - `motivational_dna` updates - Enhanced with better defaults
  
  2. Security
    - Enable RLS on new tables
    - Add policies for user data access
    
  3. Functions
    - Auto-cleanup for abandoned sessions
    - Progress validation functions
*/

-- Create onboarding sessions table
CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
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

-- RLS Policies
CREATE POLICY "Users can manage their own onboarding sessions"
  ON onboarding_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

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
    ELSE (array_length(p_completed_steps, 1) * 100) / 7 -- 7 total steps
  END;

  -- Upsert onboarding session
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
  ON CONFLICT (user_id) 
  DO UPDATE SET
    session_data = EXCLUDED.session_data,
    current_step = EXCLUDED.current_step,
    completed_steps = EXCLUDED.completed_steps,
    progress_percentage = EXCLUDED.progress_percentage,
    updated_at = now(),
    completed_at = CASE 
      WHEN EXCLUDED.progress_percentage = 100 THEN now()
      ELSE onboarding_sessions.completed_at
    END
  RETURNING id INTO session_id;

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
  is_completed boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    os.id,
    os.session_data,
    os.current_step,
    os.completed_steps,
    os.progress_percentage,
    (os.completed_at IS NOT NULL) as is_completed
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
RETURNS void AS $$
BEGIN
  -- Mark expired sessions as abandoned
  UPDATE onboarding_sessions 
  SET is_abandoned = true
  WHERE expires_at < now() 
    AND completed_at IS NULL
    AND NOT is_abandoned;
    
  -- Delete very old abandoned sessions (older than 30 days)
  DELETE FROM onboarding_sessions
  WHERE is_abandoned = true 
    AND updated_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique constraint to prevent multiple active sessions per user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'onboarding_sessions_user_id_active_unique'
  ) THEN
    ALTER TABLE onboarding_sessions 
    ADD CONSTRAINT onboarding_sessions_user_id_active_unique 
    UNIQUE (user_id) 
    WHERE (completed_at IS NULL AND NOT is_abandoned);
  END IF;
END $$;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_onboarding_sessions_updated_at ON onboarding_sessions;
CREATE TRIGGER update_onboarding_sessions_updated_at
    BEFORE UPDATE ON onboarding_sessions
    FOR EACH ROW
    EXECUTE PROCEDURE update_onboarding_updated_at();