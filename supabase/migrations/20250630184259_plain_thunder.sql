/*
  # Complete Database Reset and Recreation

  This migration completely resets the database and recreates all tables with proper schema.
  
  ## What this does:
  1. Drops all existing tables and dependencies
  2. Removes sequences, views, and custom types
  3. Recreates all tables with correct schema
  4. Establishes proper relationships and constraints
  5. Enables RLS and creates security policies
  6. Creates necessary functions and triggers
*/

-- =============================================================================
-- STEP 1: DROP ALL EXISTING OBJECTS
-- =============================================================================

-- Drop all existing policies first
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.tablename || '_policy') || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Drop all tables with CASCADE to handle dependencies
DROP TABLE IF EXISTS public.onboarding_sessions CASCADE;
DROP TABLE IF EXISTS public.auth_attempts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.coaching_sessions CASCADE;
DROP TABLE IF EXISTS public.goals CASCADE;
DROP TABLE IF EXISTS public.motivational_dna CASCADE;
DROP TABLE IF EXISTS public.subscription_status CASCADE;
DROP TABLE IF EXISTS public.subscription_events CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.update_onboarding_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.update_users_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_creation() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_subscription_status(uuid, text, boolean, text[], text, timestamptz, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_subscription_status(uuid) CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS public.user_role CASCADE;

-- Drop sequences if they exist
DROP SEQUENCE IF EXISTS public.users_id_seq CASCADE;

-- =============================================================================
-- STEP 2: CREATE CUSTOM TYPES
-- =============================================================================

CREATE TYPE public.user_role AS ENUM ('user', 'coach', 'admin');

-- =============================================================================
-- STEP 3: CREATE UTILITY FUNCTIONS
-- =============================================================================

-- Function to update updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update users updated_at
CREATE OR REPLACE FUNCTION public.update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update onboarding sessions updated_at
CREATE OR REPLACE FUNCTION public.update_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================================================
-- STEP 4: CREATE CORE TABLES
-- =============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    is_active boolean DEFAULT true
);

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    updated_at timestamptz,
    username text UNIQUE,
    full_name text,
    avatar_url text,
    website text,
    subscription_status text DEFAULT 'free',
    revenuecat_customer_id text,
    role user_role DEFAULT 'user',
    email_verified boolean DEFAULT false,
    last_sign_in_at timestamptz,
    sign_in_count integer DEFAULT 0,
    failed_sign_in_attempts integer DEFAULT 0,
    locked_at timestamptz,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- =============================================================================
-- STEP 5: CREATE SUBSCRIPTION TABLES
-- =============================================================================

-- Subscription events table
CREATE TABLE IF NOT EXISTS public.subscription_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    revenuecat_customer_id text NOT NULL,
    event_type text NOT NULL,
    product_id text,
    entitlement_id text,
    purchase_date timestamptz,
    expiration_date timestamptz,
    is_trial boolean DEFAULT false,
    raw_event jsonb NOT NULL,
    processed_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

-- Subscription status table
CREATE TABLE IF NOT EXISTS public.subscription_status (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    revenuecat_customer_id text NOT NULL,
    has_active_subscription boolean DEFAULT false,
    active_entitlements text[] DEFAULT '{}',
    current_product_id text,
    subscription_start_date timestamptz,
    subscription_end_date timestamptz,
    is_trial boolean DEFAULT false,
    trial_end_date timestamptz,
    billing_status text,
    last_updated timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- STEP 6: CREATE PSYCHOLOGICAL PROFILE TABLES
-- =============================================================================

-- Motivational DNA table
CREATE TABLE IF NOT EXISTS public.motivational_dna (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    locus_of_control text,
    mindset text,
    regulatory_focus text,
    big_five_ocean jsonb,
    updated_at timestamptz DEFAULT now()
);

-- =============================================================================
-- STEP 7: CREATE GOAL AND COACHING TABLES
-- =============================================================================

-- Goals table
CREATE TABLE IF NOT EXISTS public.goals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    description text NOT NULL,
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now()
);

-- Coaching sessions table
CREATE TABLE IF NOT EXISTS public.coaching_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_id uuid REFERENCES public.goals(id) ON DELETE CASCADE,
    transcript jsonb,
    diagnosed_block text,
    prescribed_intervention text,
    created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- STEP 8: CREATE ONBOARDING AND AUTH TABLES
-- =============================================================================

-- Onboarding sessions table
CREATE TABLE IF NOT EXISTS public.onboarding_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    session_data jsonb DEFAULT '{}' NOT NULL,
    current_step text DEFAULT 'start' NOT NULL,
    completed_steps text[] DEFAULT '{}',
    progress_percentage integer DEFAULT 0,
    started_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    expires_at timestamptz DEFAULT (now() + '7 days'::interval),
    is_abandoned boolean DEFAULT false,
    CONSTRAINT onboarding_sessions_progress_percentage_check 
        CHECK (progress_percentage >= 0 AND progress_percentage <= 100)
);

-- Auth attempts table for security tracking
CREATE TABLE IF NOT EXISTS public.auth_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address inet NOT NULL,
    email text,
    attempt_type text NOT NULL,
    success boolean DEFAULT false,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- STEP 9: CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS users_created_at_idx ON public.users(created_at);
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS users_is_active_idx ON public.users(is_active);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS profiles_email_verified_idx ON public.profiles(email_verified);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

-- Subscription events indexes
CREATE INDEX IF NOT EXISTS subscription_events_created_at_idx ON public.subscription_events(created_at);
CREATE INDEX IF NOT EXISTS subscription_events_customer_id_idx ON public.subscription_events(revenuecat_customer_id);
CREATE INDEX IF NOT EXISTS subscription_events_user_id_idx ON public.subscription_events(user_id);

-- Subscription status indexes
CREATE INDEX IF NOT EXISTS subscription_status_customer_id_idx ON public.subscription_status(revenuecat_customer_id);

-- Onboarding sessions indexes
CREATE INDEX IF NOT EXISTS onboarding_sessions_expires_at_idx ON public.onboarding_sessions(expires_at);
CREATE INDEX IF NOT EXISTS onboarding_sessions_progress_idx ON public.onboarding_sessions(progress_percentage);
CREATE INDEX IF NOT EXISTS onboarding_sessions_updated_at_idx ON public.onboarding_sessions(updated_at);
CREATE INDEX IF NOT EXISTS onboarding_sessions_user_id_idx ON public.onboarding_sessions(user_id);

-- Auth attempts indexes
CREATE INDEX IF NOT EXISTS auth_attempts_created_idx ON public.auth_attempts(created_at);
CREATE INDEX IF NOT EXISTS auth_attempts_email_created_idx ON public.auth_attempts(email, created_at);
CREATE INDEX IF NOT EXISTS auth_attempts_ip_created_idx ON public.auth_attempts(ip_address, created_at);

-- =============================================================================
-- STEP 10: CREATE TRIGGERS
-- =============================================================================

-- Users updated_at trigger
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_users_updated_at();

-- Profiles updated_at trigger
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Onboarding sessions updated_at trigger
CREATE TRIGGER update_onboarding_sessions_updated_at 
    BEFORE UPDATE ON public.onboarding_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_onboarding_updated_at();

-- =============================================================================
-- STEP 11: ENABLE ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motivational_dna ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_attempts ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 12: CREATE RLS POLICIES
-- =============================================================================

-- Users policies
CREATE POLICY "Users can read their own data" ON public.users
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Service role can manage all users" ON public.users
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Profiles policies
CREATE POLICY "Users can view own profile and public profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING ((auth.uid() = id) OR (auth.uid() IS NOT NULL AND email_verified = true));

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Subscription events policies
CREATE POLICY "Users can view their own subscription events" ON public.subscription_events
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscription events" ON public.subscription_events
    FOR ALL TO service_role
    USING (true);

-- Subscription status policies
CREATE POLICY "Users can view their own subscription status" ON public.subscription_status
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscription status" ON public.subscription_status
    FOR ALL TO service_role
    USING (true);

-- Motivational DNA policies
CREATE POLICY "Users can view their own motivational DNA" ON public.motivational_dna
    FOR SELECT TO public
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own motivational DNA" ON public.motivational_dna
    FOR INSERT TO public
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own motivational DNA" ON public.motivational_dna
    FOR UPDATE TO public
    USING (auth.uid() = user_id);

-- Goals policies
CREATE POLICY "Users can manage their own goals" ON public.goals
    FOR ALL TO public
    USING (auth.uid() = user_id);

-- Coaching sessions policies
CREATE POLICY "Users can manage their own coaching sessions" ON public.coaching_sessions
    FOR ALL TO public
    USING (auth.uid() = user_id);

-- Onboarding sessions policies
CREATE POLICY "Users can manage their own onboarding sessions" ON public.onboarding_sessions
    FOR ALL TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all onboarding sessions" ON public.onboarding_sessions
    FOR ALL TO service_role
    USING (true);

-- Auth attempts policies
CREATE POLICY "System can insert auth attempts" ON public.auth_attempts
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Admins can view auth attempts" ON public.auth_attempts
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

-- =============================================================================
-- STEP 13: CREATE SUBSCRIPTION MANAGEMENT FUNCTIONS
-- =============================================================================

-- Function to update subscription status
CREATE OR REPLACE FUNCTION public.update_subscription_status(
    p_user_id uuid,
    p_customer_id text,
    p_has_subscription boolean,
    p_entitlements text[],
    p_product_id text DEFAULT NULL,
    p_subscription_end_date timestamptz DEFAULT NULL,
    p_is_trial boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.subscription_status (
        user_id,
        revenuecat_customer_id,
        has_active_subscription,
        active_entitlements,
        current_product_id,
        subscription_end_date,
        is_trial,
        last_updated
    ) VALUES (
        p_user_id,
        p_customer_id,
        p_has_subscription,
        p_entitlements,
        p_product_id,
        p_subscription_end_date,
        p_is_trial,
        now()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        revenuecat_customer_id = EXCLUDED.revenuecat_customer_id,
        has_active_subscription = EXCLUDED.has_active_subscription,
        active_entitlements = EXCLUDED.active_entitlements,
        current_product_id = EXCLUDED.current_product_id,
        subscription_end_date = EXCLUDED.subscription_end_date,
        is_trial = EXCLUDED.is_trial,
        last_updated = EXCLUDED.last_updated;
END;
$$;

-- Function to get user subscription status
CREATE OR REPLACE FUNCTION public.get_user_subscription_status(p_user_id uuid)
RETURNS TABLE(
    has_subscription boolean,
    active_entitlements text[],
    current_product text,
    is_trial boolean,
    subscription_end_date timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ss.has_active_subscription,
        ss.active_entitlements,
        ss.current_product_id,
        ss.is_trial,
        ss.subscription_end_date
    FROM public.subscription_status ss
    WHERE ss.user_id = p_user_id;
END;
$$;

-- =============================================================================
-- STEP 14: CREATE USER MANAGEMENT FUNCTIONS
-- =============================================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, email_verified)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.email_confirmed_at IS NOT NULL
    );
    RETURN NEW;
END;
$$;

-- Create trigger for new user handling
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =============================================================================
-- STEP 15: VERIFY SETUP
-- =============================================================================

DO $$
DECLARE
    table_count integer;
    function_count integer;
    policy_count integer;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    -- Count functions
    SELECT COUNT(*) INTO function_count 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    RAISE NOTICE 'Database reset complete!';
    RAISE NOTICE 'Created % tables, % functions, % policies', table_count, function_count, policy_count;
    
    -- Verify key tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Critical error: profiles table not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_status' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Critical error: subscription_status table not created';
    END IF;
    
    RAISE NOTICE 'All critical tables verified successfully';
END;
$$;