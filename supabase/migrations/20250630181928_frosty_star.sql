/*
  # RevenueCat Integration Enhancement

  1. New Tables
    - Add RevenueCat customer info to profiles table
    - Create subscription_events table for webhook data
    - Create subscription_status table for current status

  2. Security
    - Enable RLS on new tables
    - Add policies for user data access

  3. Functions
    - Functions to sync subscription status
    - Webhook handling functions
*/

-- Add RevenueCat fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS revenuecat_customer_id text;

-- Create subscription events table for webhook data
CREATE TABLE IF NOT EXISTS subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  revenuecat_customer_id text NOT NULL,
  event_type text NOT NULL, -- 'initial_purchase', 'renewal', 'cancellation', 'billing_issue', etc.
  product_id text,
  entitlement_id text,
  purchase_date timestamptz,
  expiration_date timestamptz,
  is_trial boolean DEFAULT false,
  raw_event jsonb NOT NULL,
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create current subscription status table
CREATE TABLE IF NOT EXISTS subscription_status (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  revenuecat_customer_id text NOT NULL,
  has_active_subscription boolean DEFAULT false,
  active_entitlements text[] DEFAULT '{}',
  current_product_id text,
  subscription_start_date timestamptz,
  subscription_end_date timestamptz,
  is_trial boolean DEFAULT false,
  trial_end_date timestamptz,
  billing_status text, -- 'active', 'past_due', 'cancelled', 'expired'
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_status ENABLE ROW LEVEL SECURITY;

-- Policies for subscription_events
CREATE POLICY "Users can view their own subscription events"
  ON subscription_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscription events"
  ON subscription_events FOR ALL
  TO service_role
  USING (true);

-- Policies for subscription_status  
CREATE POLICY "Users can view their own subscription status"
  ON subscription_status FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscription status"
  ON subscription_status FOR ALL
  TO service_role
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS subscription_events_user_id_idx ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS subscription_events_customer_id_idx ON subscription_events(revenuecat_customer_id);
CREATE INDEX IF NOT EXISTS subscription_events_created_at_idx ON subscription_events(created_at);
CREATE INDEX IF NOT EXISTS subscription_status_customer_id_idx ON subscription_status(revenuecat_customer_id);

-- Function to update subscription status
CREATE OR REPLACE FUNCTION update_subscription_status(
  p_user_id uuid,
  p_customer_id text,
  p_has_subscription boolean,
  p_entitlements text[],
  p_product_id text DEFAULT NULL,
  p_subscription_end_date timestamptz DEFAULT NULL,
  p_is_trial boolean DEFAULT false
)
RETURNS void AS $$
BEGIN
  INSERT INTO subscription_status (
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
    last_updated = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user subscription status
CREATE OR REPLACE FUNCTION get_user_subscription_status(p_user_id uuid)
RETURNS TABLE(
  has_subscription boolean,
  active_entitlements text[],
  current_product text,
  is_trial boolean,
  subscription_end_date timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ss.has_active_subscription, false),
    COALESCE(ss.active_entitlements, '{}'),
    ss.current_product_id,
    COALESCE(ss.is_trial, false),
    ss.subscription_end_date
  FROM subscription_status ss
  WHERE ss.user_id = p_user_id;
  
  -- If no record found, return default values
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, '{}', NULL::text, false, NULL::timestamptz;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;