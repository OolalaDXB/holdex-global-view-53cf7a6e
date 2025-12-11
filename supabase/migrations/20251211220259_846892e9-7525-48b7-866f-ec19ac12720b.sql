-- 1. PROFILES (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  base_currency TEXT DEFAULT 'EUR' CHECK (base_currency IN ('EUR', 'USD', 'AED', 'GBP', 'CHF')),
  dark_mode BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. ASSETS (core financial assets)
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('real-estate', 'bank', 'investment', 'crypto', 'business')),
  country TEXT NOT NULL,
  currency TEXT NOT NULL,
  current_value DECIMAL(15,2) NOT NULL,
  purchase_value DECIMAL(15,2),
  purchase_date DATE,
  institution TEXT,
  quantity DECIMAL(18,8),
  ticker TEXT,
  ownership_percentage DECIMAL(5,2) DEFAULT 100,
  rental_income DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assets_user_id ON assets(user_id);
CREATE INDEX idx_assets_type ON assets(type);

-- 3. COLLECTIONS (alternative assets)
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('watch', 'vehicle', 'art', 'jewelry', 'wine', 'lp-position', 'other')),
  country TEXT NOT NULL,
  currency TEXT NOT NULL,
  current_value DECIMAL(15,2) NOT NULL,
  purchase_value DECIMAL(15,2),
  purchase_date DATE,
  brand TEXT,
  model TEXT,
  year INTEGER,
  description TEXT,
  fund_name TEXT,
  commitment_amount DECIMAL(15,2),
  called_amount DECIMAL(15,2),
  distribution_status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collections_type ON collections(type);

-- 4. LIABILITIES (debts)
CREATE TABLE liabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mortgage', 'loan', 'credit-card', 'other')),
  country TEXT NOT NULL,
  currency TEXT NOT NULL,
  current_balance DECIMAL(15,2) NOT NULL,
  original_amount DECIMAL(15,2),
  interest_rate DECIMAL(5,2),
  monthly_payment DECIMAL(12,2),
  start_date DATE,
  end_date DATE,
  linked_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  institution TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_liabilities_user_id ON liabilities(user_id);

-- 5. SHARED ACCESS (partner read-only view)
CREATE TABLE shared_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  shared_with_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_shared_access_unique ON shared_access(owner_id, shared_with_email);

-- 6. NET WORTH HISTORY (monthly snapshots)
CREATE TABLE net_worth_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  total_assets_eur DECIMAL(15,2) NOT NULL,
  total_collections_eur DECIMAL(15,2) NOT NULL,
  total_liabilities_eur DECIMAL(15,2) NOT NULL,
  net_worth_eur DECIMAL(15,2) NOT NULL,
  breakdown_by_type JSONB,
  breakdown_by_country JSONB,
  breakdown_by_currency JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_net_worth_history_unique ON net_worth_history(user_id, snapshot_date);
CREATE INDEX idx_net_worth_history_user_date ON net_worth_history(user_id, snapshot_date DESC);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE net_worth_history ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ASSETS policies
CREATE POLICY "Users can view own assets"
  ON assets FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT owner_id FROM shared_access 
      WHERE shared_with_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "Users can insert own assets"
  ON assets FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own assets"
  ON assets FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own assets"
  ON assets FOR DELETE
  USING (user_id = auth.uid());

-- COLLECTIONS policies
CREATE POLICY "Users can view own collections"
  ON collections FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT owner_id FROM shared_access 
      WHERE shared_with_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "Users can insert own collections"
  ON collections FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own collections"
  ON collections FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own collections"
  ON collections FOR DELETE
  USING (user_id = auth.uid());

-- LIABILITIES policies
CREATE POLICY "Users can view own liabilities"
  ON liabilities FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT owner_id FROM shared_access 
      WHERE shared_with_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "Users can insert own liabilities"
  ON liabilities FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own liabilities"
  ON liabilities FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own liabilities"
  ON liabilities FOR DELETE
  USING (user_id = auth.uid());

-- SHARED ACCESS policies
CREATE POLICY "Users can view shares they own or received"
  ON shared_access FOR SELECT
  USING (owner_id = auth.uid() OR shared_with_id = auth.uid());

CREATE POLICY "Users can create shares"
  ON shared_access FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update shares they own or received"
  ON shared_access FOR UPDATE
  USING (owner_id = auth.uid() OR shared_with_id = auth.uid());

CREATE POLICY "Users can delete shares they own"
  ON shared_access FOR DELETE
  USING (owner_id = auth.uid());

-- NET WORTH HISTORY policies
CREATE POLICY "Users can view own history"
  ON net_worth_history FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT owner_id FROM shared_access 
      WHERE shared_with_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "Users can insert own history"
  ON net_worth_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_liabilities_updated_at
  BEFORE UPDATE ON liabilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();