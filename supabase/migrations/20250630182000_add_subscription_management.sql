
-- Create subscription_status table
CREATE TABLE IF NOT EXISTS subscription_status (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  revenuecat_customer_id text,
  has_subscription boolean NOT NULL DEFAULT false,
  active_entitlements text[] DEFAULT '{}',
  current_product text,
  is_trial boolean DEFAULT false,
  subscription_end_date timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscription_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own subscription status"
  ON subscription_status FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription status"
  ON subscription_status FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription status"
  ON subscription_status FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to update subscription status
CREATE OR REPLACE FUNCTION update_subscription_status(
  p_user_id uuid,
  p_customer_id text,
  p_has_subscription boolean,
  p_entitlements text[],
  p_product_id text,
  p_subscription_end_date timestamptz,
  p_is_trial boolean
)
RETURNS void AS $$
BEGIN
  INSERT INTO subscription_status (
    user_id,
    revenuecat_customer_id,
    has_subscription,
    active_entitlements,
    current_product,
    is_trial,
    subscription_end_date,
    updated_at
  ) VALUES (
    p_user_id,
    p_customer_id,
    p_has_subscription,
    p_entitlements,
    p_product_id,
    p_is_trial,
    p_subscription_end_date,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    revenuecat_customer_id = EXCLUDED.revenuecat_customer_id,
    has_subscription = EXCLUDED.has_subscription,
    active_entitlements = EXCLUDED.active_entitlements,
    current_product = EXCLUDED.current_product,
    is_trial = EXCLUDED.is_trial,
    subscription_end_date = EXCLUDED.subscription_end_date,
    updated_at = now();
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
    ss.has_subscription,
    ss.active_entitlements,
    ss.current_product,
    ss.is_trial,
    ss.subscription_end_date
  FROM subscription_status ss
  WHERE ss.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to authenticated users for the functions
GRANT EXECUTE ON FUNCTION update_subscription_status(uuid, text, boolean, text[], text, timestamptz, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subscription_status(uuid) TO authenticated;
