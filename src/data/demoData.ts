// Demo data types (local, to avoid strict Supabase type requirements)
export interface DemoAsset {
  id: string;
  user_id: string;
  name: string;
  type: string;
  country: string;
  currency: string;
  current_value: number;
  rental_income: number | null;
  purchase_value: number | null;
  purchase_date: string | null;
  ownership_percentage: number | null;
  institution: string | null;
  ticker: string | null;
  quantity: number | null;
  platform: string | null;
  reference_balance: number | null;
  reference_date: string | null;
  notes: string | null;
  image_url: string | null;
  entity_id: string | null;
  acquisition_type: string | null;
  acquisition_from: string | null;
  // Off-plan fields
  property_status: string | null;
  total_price: number | null;
  amount_paid: number | null;
  expected_delivery: string | null;
  developer: string | null;
  unit_number: string | null;
  project_name: string | null;
  // Islamic finance (optional - defaults to false/null)
  is_shariah_compliant?: boolean;
  shariah_certification?: string | null;
  // UK/International fields
  tenure_type?: string | null;
  lease_end_date?: string | null;
  liquidity_status?: string | null;
  // Location fields for real estate
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  // Property details for real estate
  property_type?: string | null;
  rooms?: number | null;
  size_sqm?: number | null;
  // Certainty
  certainty?: string | null;
  // Ownership allocation for shared ownership
  ownership_allocation?: { entity_id: string; percentage: number }[] | null;
  created_at: string;
  updated_at: string;
}

export interface DemoCollection {
  id: string;
  user_id: string;
  name: string;
  type: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  country: string;
  currency: string;
  current_value: number;
  purchase_value: number | null;
  purchase_date: string | null;
  description: string | null;
  notes: string | null;
  fund_name: string | null;
  commitment_amount: number | null;
  called_amount: number | null;
  distribution_status: string | null;
  image_url: string | null;
  entity_id: string | null;
  acquisition_type: string | null;
  acquisition_from: string | null;
  certainty?: string | null;
  // Ownership allocation for shared ownership
  ownership_allocation?: { entity_id: string; percentage: number }[] | null;
  created_at: string;
  updated_at: string;
}

export interface DemoLiability {
  id: string;
  user_id: string;
  name: string;
  type: string;
  country: string;
  currency: string;
  current_balance: number;
  original_amount: number | null;
  interest_rate: number | null;
  monthly_payment: number | null;
  start_date: string | null;
  end_date: string | null;
  linked_asset_id: string | null;
  institution: string | null;
  notes: string | null;
  entity_id: string | null;
  // Islamic finance (optional - defaults)
  financing_type?: string;
  is_shariah_compliant?: boolean;
  shariah_advisor?: string | null;
  cost_price?: number | null;
  profit_margin?: number | null;
  monthly_rental?: number | null;
  residual_value?: number | null;
  bank_ownership_percentage?: number | null;
  // Certainty
  certainty?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DemoReceivable {
  id: string;
  user_id: string;
  name: string;
  type: string;
  debtor_name: string;
  debtor_type?: string | null;
  debtor_contact?: string | null;
  currency: string;
  original_amount: number;
  current_balance: number;
  issue_date?: string | null;
  due_date: string | null;
  status: string;
  recovery_probability?: string | null;
  repayment_schedule?: string | null;
  interest_rate?: number | null;
  notes?: string | null;
  entity_id?: string | null;
  linked_asset_id?: string | null;
  deposit_type?: string | null;
  refund_conditions?: string | null;
  certainty?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DemoLoanSchedule {
  id: string;
  liability_id: string;
  user_id: string;
  loan_type: 'amortizing' | 'bullet' | 'balloon' | 'interest_only';
  principal_amount: number;
  interest_rate: number | null;
  rate_type: 'fixed' | 'variable' | 'capped';
  start_date: string;
  end_date: string | null;
  term_months: number | null;
  payment_frequency: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  monthly_payment: number | null;
  total_interest: number | null;
  total_cost: number | null;
  payments_made: number;
  next_payment_date: string | null;
  remaining_principal: number | null;
}

export interface DemoEntity {
  id: string;
  user_id: string;
  name: string;
  type: string;
  legal_name: string | null;
  registration_number: string | null;
  country: string | null;
  jurisdiction: string | null;
  is_active: boolean;
  formation_date: string | null;
  dissolution_date: string | null;
  owned_by_entity_id: string | null;
  ownership_percentage: number;
  color: string;
  icon: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DemoProfile {
  id: string;
  email: string;
  full_name: string;
  base_currency: string;
  secondary_currency_1: string;
  secondary_currency_2: string;
  dark_mode: boolean;
  compliance_mode: string;
  favorite_cities: { name: string; timezone: string }[];
  dashboard_widgets: string[];
  blur_amounts: boolean;
  fiscal_year_start: string;
  area_unit: 'sqm' | 'sqft';
  monthly_income: number | null;
  monthly_income_currency: string;
  created_at: string;
  updated_at: string;
}

// Demo Profile
export const demoProfile: DemoProfile = {
  id: 'demo-user-lucas-soleil',
  email: 'lucas.soleil@example.com',
  full_name: 'Lucas Soleil',
  base_currency: 'EUR',
  secondary_currency_1: 'USD',
  secondary_currency_2: 'AED',
  dark_mode: true,
  compliance_mode: 'all',
  favorite_cities: [
    { name: 'Dubai', timezone: 'Asia/Dubai' },
    { name: 'Paris', timezone: 'Europe/Paris' },
    { name: 'Singapore', timezone: 'Asia/Singapore' },
  ],
  dashboard_widgets: [
    'net_worth', 'chart', 'certainty_breakdown', 'debt_to_income', 'breakdown_type', 'breakdown_country', 'breakdown_currency',
    'leasehold_reminders', 'expiring_documents', 'world_clocks', 'weather_with_clocks', 'pending_receivables', 'upcoming_loan_payments'
  ],
  blur_amounts: false,
  fiscal_year_start: '01-01',
  area_unit: 'sqm',
  monthly_income: 18500,
  monthly_income_currency: 'EUR',
  created_at: '2019-01-01T10:00:00Z',
  updated_at: '2024-12-01T10:00:00Z',
};

const DEMO_USER_ID = 'demo-user-lucas-soleil';
const DEMO_ENTITY_PERSONAL = 'demo-entity-personal';
const DEMO_ENTITY_PARTNER = 'demo-entity-partner';
const DEMO_ENTITY_COMPANY = 'demo-entity-company';
const DEMO_ENTITY_HOLDING = 'demo-entity-holding';

// Demo Entities
export const demoEntities: DemoEntity[] = [
  {
    id: DEMO_ENTITY_PERSONAL,
    user_id: DEMO_USER_ID,
    name: 'Personal',
    type: 'personal',
    legal_name: null,
    registration_number: null,
    country: 'FR',
    jurisdiction: null,
    is_active: true,
    formation_date: null,
    dissolution_date: null,
    owned_by_entity_id: null,
    ownership_percentage: 100,
    color: '#C4785A',
    icon: 'User',
    notes: null,
    created_at: '2019-01-01T10:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
  {
    id: DEMO_ENTITY_PARTNER,
    user_id: DEMO_USER_ID,
    name: 'Darya',
    type: 'partner',
    legal_name: null,
    registration_number: null,
    country: 'AE',
    jurisdiction: null,
    is_active: true,
    formation_date: null,
    dissolution_date: null,
    owned_by_entity_id: null,
    ownership_percentage: 100,
    color: '#9B6B6B',
    icon: 'UserCircle',
    notes: 'Life partner',
    created_at: '2020-01-01T10:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
  {
    id: DEMO_ENTITY_COMPANY,
    user_id: DEMO_USER_ID,
    name: 'Oolala FZ LLC',
    type: 'company',
    legal_name: 'Oolala Free Zone Limited Liability Company',
    registration_number: 'FZ-12345',
    country: 'AE',
    jurisdiction: 'DMCC',
    is_active: true,
    formation_date: '2020-06-01',
    dissolution_date: null,
    owned_by_entity_id: DEMO_ENTITY_PERSONAL,
    ownership_percentage: 100,
    color: '#6B7B9B',
    icon: 'Building2',
    notes: 'Dubai freezone consulting company',
    created_at: '2020-06-01T10:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
  {
    id: DEMO_ENTITY_HOLDING,
    user_id: DEMO_USER_ID,
    name: 'Soleil Holdings',
    type: 'holding',
    legal_name: 'Soleil Holdings Ltd',
    registration_number: 'BVI-78901',
    country: 'VG',
    jurisdiction: 'BVI',
    is_active: true,
    formation_date: '2021-01-15',
    dissolution_date: null,
    owned_by_entity_id: DEMO_ENTITY_PERSONAL,
    ownership_percentage: 100,
    color: '#7D8B75',
    icon: 'Landmark',
    notes: 'Holding company for investment assets',
    created_at: '2021-01-15T10:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
];

// Real Estate (4 properties + 1 off-plan)
export const demoAssets: DemoAsset[] = [
  // Off-plan property example - uncertain as delivery not guaranteed
  {
    id: 'asset-real-estate-offplan',
    user_id: DEMO_USER_ID,
    name: 'Creek Views Tower 2 - Unit 1804',
    type: 'real-estate',
    country: 'AE',
    currency: 'AED',
    current_value: 855000, // = amount_paid for off-plan
    rental_income: null,
    purchase_value: null,
    purchase_date: '2024-03-15',
    ownership_percentage: 100,
    institution: null,
    ticker: null,
    quantity: null,
    platform: null,
    reference_balance: null,
    reference_date: null,
    notes: '2BR with creek views, post-handover payment plan',
    image_url: null,
    entity_id: DEMO_ENTITY_PERSONAL,
    acquisition_type: 'purchase',
    acquisition_from: null,
    property_status: 'off_plan',
    total_price: 2850000,
    amount_paid: 855000,
    expected_delivery: '2026-09-30',
    developer: 'Emaar',
    unit_number: 'CV2-1804',
    project_name: 'Dubai Creek Harbour',
    address: 'Dubai Creek Harbour, Dubai, UAE',
    latitude: 25.2048,
    longitude: 55.2708,
    property_type: 'apartment',
    rooms: 2,
    size_sqm: 120,
    certainty: 'optional', // Off-plan - may not complete as planned
    created_at: '2024-03-15T10:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
  {
    id: 'asset-real-estate-1',
    user_id: DEMO_USER_ID,
    name: 'Dubai Marina Apartment',
    type: 'real-estate',
    country: 'AE',
    currency: 'AED',
    current_value: 3200000,
    rental_income: 180000,
    purchase_value: 2800000,
    purchase_date: '2021-03-15',
    ownership_percentage: 100,
    institution: null,
    ticker: null,
    quantity: null,
    platform: null,
    reference_balance: null,
    reference_date: null,
    notes: 'Two-bedroom apartment with marina view',
    image_url: null,
    entity_id: DEMO_ENTITY_COMPANY,
    acquisition_type: 'purchase',
    acquisition_from: null,
    property_status: 'rented_out',
    total_price: null,
    amount_paid: null,
    expected_delivery: null,
    developer: null,
    unit_number: null,
    project_name: null,
    address: 'Marina Walk, Dubai Marina, Dubai, UAE',
    latitude: 25.0805,
    longitude: 55.1403,
    property_type: 'apartment',
    rooms: 2,
    size_sqm: 145,
    certainty: 'certain', // Owned property with verified value
    created_at: '2021-03-15T10:00:00Z',
    updated_at: '2024-11-01T10:00:00Z',
  },
  {
    id: 'asset-real-estate-2a',
    user_id: DEMO_USER_ID,
    name: 'Cascais Villa',
    type: 'real-estate',
    country: 'PT',
    currency: 'EUR',
    current_value: 850000,
    rental_income: null,
    purchase_value: 720000,
    purchase_date: '2022-06-20',
    ownership_percentage: 100,
    institution: null,
    ticker: null,
    quantity: null,
    platform: null,
    reference_balance: null,
    reference_date: null,
    notes: 'Primary residence, Golden Visa property',
    image_url: null,
    entity_id: DEMO_ENTITY_PERSONAL,
    acquisition_type: 'purchase',
    acquisition_from: null,
    property_status: 'owned',
    total_price: null,
    amount_paid: null,
    expected_delivery: null,
    developer: null,
    unit_number: null,
    project_name: null,
    address: 'Rua da Boca do Inferno, Cascais, Portugal',
    latitude: 38.6913,
    longitude: -9.4215,
    property_type: 'villa',
    rooms: 4,
    size_sqm: 280,
    certainty: 'certain', // Owned, verified
    created_at: '2022-06-20T10:00:00Z',
    updated_at: '2024-10-15T10:00:00Z',
  },
  {
    id: 'asset-real-estate-3',
    user_id: DEMO_USER_ID,
    name: 'Paris Pied-à-terre',
    type: 'real-estate',
    country: 'FR',
    currency: 'EUR',
    current_value: 520000,
    rental_income: 24000,
    purchase_value: 480000,
    purchase_date: '2020-09-10',
    ownership_percentage: 100,
    institution: null,
    ticker: null,
    quantity: null,
    platform: null,
    reference_balance: null,
    reference_date: null,
    notes: 'Studio in Le Marais, short-term rental',
    image_url: null,
    entity_id: DEMO_ENTITY_PERSONAL,
    acquisition_type: 'inheritance',
    acquisition_from: 'Family estate',
    property_status: 'rented_out',
    total_price: null,
    amount_paid: null,
    expected_delivery: null,
    developer: null,
    unit_number: null,
    project_name: null,
    address: 'Rue des Francs-Bourgeois, Le Marais, Paris, France',
    latitude: 48.8566,
    longitude: 2.3522,
    property_type: 'studio',
    rooms: 1,
    size_sqm: 42,
    created_at: '2020-09-10T10:00:00Z',
    updated_at: '2024-09-20T10:00:00Z',
  },
  // UK Leasehold property
  {
    id: 'asset-real-estate-uk-leasehold',
    user_id: DEMO_USER_ID,
    name: 'Chelsea Mansion Flat',
    type: 'real-estate',
    country: 'GB',
    currency: 'GBP',
    current_value: 1250000,
    rental_income: 48000,
    purchase_value: 980000,
    purchase_date: '2019-05-15',
    ownership_percentage: 100,
    institution: null,
    ticker: null,
    quantity: null,
    platform: null,
    reference_balance: null,
    reference_date: null,
    notes: 'Period conversion flat, share of freehold being negotiated',
    image_url: null,
    entity_id: DEMO_ENTITY_PERSONAL,
    acquisition_type: 'purchase',
    acquisition_from: null,
    property_status: 'rented_out',
    total_price: null,
    amount_paid: null,
    expected_delivery: null,
    developer: null,
    unit_number: null,
    project_name: null,
    tenure_type: 'leasehold',
    lease_end_date: '2089-03-25', // ~65 years remaining - warning
    liquidity_status: 'liquid',
    address: 'Cheyne Walk, Chelsea, London, UK',
    latitude: 51.4826,
    longitude: -0.1707,
    property_type: 'apartment',
    rooms: 3,
    size_sqm: 130,
    created_at: '2019-05-15T10:00:00Z',
    updated_at: '2024-11-15T10:00:00Z',
  },
  // Frozen Russian asset
  {
    id: 'asset-bank-frozen-ru',
    user_id: DEMO_USER_ID,
    name: 'Sberbank RUB Account',
    type: 'bank',
    country: 'RU',
    currency: 'RUB',
    current_value: 8500000,
    rental_income: null,
    purchase_value: null,
    purchase_date: null,
    ownership_percentage: null,
    institution: 'Sberbank',
    ticker: null,
    quantity: null,
    platform: null,
    reference_balance: 8500000,
    reference_date: '2022-02-20',
    notes: 'Account frozen due to sanctions',
    image_url: null,
    entity_id: DEMO_ENTITY_PERSONAL,
    acquisition_type: null,
    acquisition_from: null,
    property_status: null,
    total_price: null,
    amount_paid: null,
    expected_delivery: null,
    developer: null,
    unit_number: null,
    project_name: null,
    tenure_type: null,
    lease_end_date: null,
    liquidity_status: 'frozen',
    created_at: '2018-06-01T10:00:00Z',
    updated_at: '2022-02-28T10:00:00Z',
  },

  // Bank Accounts (5 accounts)
  {
    id: 'asset-bank-1',
    user_id: DEMO_USER_ID,
    name: 'Emirates NBD Current',
    type: 'bank',
    country: 'AE',
    currency: 'AED',
    current_value: 450000,
    rental_income: null,
    purchase_value: null,
    purchase_date: null,
    ownership_percentage: null,
    institution: 'Emirates NBD',
    ticker: null,
    quantity: null,
    platform: null,
    reference_balance: 380000,
    reference_date: '2024-01-01',
    notes: 'Primary business account',
    image_url: null,
    entity_id: DEMO_ENTITY_COMPANY,
    acquisition_type: null,
    acquisition_from: null,
    property_status: null,
    total_price: null,
    amount_paid: null,
    expected_delivery: null,
    developer: null,
    unit_number: null,
    project_name: null,
    certainty: 'certain', // Bank balance verified
    created_at: '2021-01-15T10:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
  {
    id: 'asset-bank-2',
    user_id: DEMO_USER_ID,
    name: 'Wise Multi-currency',
    type: 'bank',
    country: 'GB',
    currency: 'EUR',
    current_value: 85000,
    rental_income: null,
    purchase_value: null,
    purchase_date: null,
    ownership_percentage: null,
    institution: 'Wise',
    ticker: null,
    quantity: null,
    platform: null,
    reference_balance: 72000,
    reference_date: '2024-01-01',
    notes: 'Multi-currency transfers and spending',
    image_url: null,
    entity_id: DEMO_ENTITY_PERSONAL,
    acquisition_type: null,
    acquisition_from: null,
    property_status: null,
    total_price: null,
    amount_paid: null,
    expected_delivery: null,
    developer: null,
    unit_number: null,
    project_name: null,
    created_at: '2020-05-01T10:00:00Z',
    updated_at: '2024-12-05T10:00:00Z',
  },
  {
    id: 'asset-bank-3',
    user_id: DEMO_USER_ID,
    name: 'BNP Paribas Savings',
    type: 'bank',
    country: 'FR',
    currency: 'EUR',
    current_value: 120000,
    rental_income: null,
    purchase_value: null,
    purchase_date: null,
    ownership_percentage: null,
    institution: 'BNP Paribas',
    ticker: null,
    quantity: null,
    platform: null,
    reference_balance: 100000,
    reference_date: '2024-01-01',
    notes: 'Euro savings account',
    image_url: null,
    entity_id: DEMO_ENTITY_PERSONAL,
    acquisition_type: null,
    acquisition_from: null,
    property_status: null,
    total_price: null,
    amount_paid: null,
    expected_delivery: null,
    developer: null,
    unit_number: null,
    project_name: null,
    created_at: '2019-03-01T10:00:00Z',
    updated_at: '2024-11-20T10:00:00Z',
  },
  {
    id: 'asset-bank-4',
    user_id: DEMO_USER_ID,
    name: 'Bank of Georgia',
    type: 'bank',
    country: 'GE',
    currency: 'GEL',
    current_value: 95000,
    rental_income: null,
    purchase_value: null,
    purchase_date: null,
    ownership_percentage: null,
    institution: 'Bank of Georgia',
    ticker: null,
    quantity: null,
    platform: null,
    reference_balance: 60000,
    reference_date: '2024-01-01',
    notes: 'Rental income deposits',
    image_url: null,
    entity_id: DEMO_ENTITY_HOLDING,
    acquisition_type: null,
    acquisition_from: null,
    property_status: null,
    total_price: null,
    amount_paid: null,
    expected_delivery: null,
    developer: null,
    unit_number: null,
    project_name: null,
    created_at: '2023-02-15T10:00:00Z',
    updated_at: '2024-11-25T10:00:00Z',
  },
  {
    id: 'asset-bank-5',
    user_id: DEMO_USER_ID,
    name: 'Millennium BCP',
    type: 'bank',
    country: 'PT',
    currency: 'EUR',
    current_value: 45000,
    rental_income: null,
    purchase_value: null,
    purchase_date: null,
    ownership_percentage: null,
    institution: 'Millennium BCP',
    ticker: null,
    quantity: null,
    platform: null,
    reference_balance: 35000,
    reference_date: '2024-01-01',
    notes: 'Portugal expenses account',
    image_url: null,
    entity_id: DEMO_ENTITY_PERSONAL,
    acquisition_type: null,
    acquisition_from: null,
    property_status: null,
    total_price: null,
    amount_paid: null,
    expected_delivery: null,
    developer: null,
    unit_number: null,
    project_name: null,
    created_at: '2022-07-01T10:00:00Z',
    updated_at: '2024-12-03T10:00:00Z',
  },

  // Investments (4 positions)
  {
    id: 'asset-investment-1',
    user_id: DEMO_USER_ID,
    name: 'Interactive Brokers Portfolio',
    type: 'investment',
    country: 'US',
    currency: 'USD',
    current_value: 320000,
    rental_income: null,
    purchase_value: 250000,
    purchase_date: '2020-01-15',
    ownership_percentage: null,
    institution: 'Interactive Brokers',
    ticker: null,
    quantity: null,
    platform: null,
    reference_balance: null,
    reference_date: null,
    notes: 'US tech stocks and ETFs',
    image_url: null,
    entity_id: DEMO_ENTITY_HOLDING,
    acquisition_type: 'purchase',
    acquisition_from: null,
    property_status: null,
    total_price: null,
    amount_paid: null,
    expected_delivery: null,
    developer: null,
    unit_number: null,
    project_name: null,
    created_at: '2020-01-15T10:00:00Z',
    updated_at: '2024-12-08T10:00:00Z',
  },
  {
    id: 'asset-investment-2',
    user_id: DEMO_USER_ID,
    name: 'Swissquote ETFs',
    type: 'investment',
    country: 'CH',
    currency: 'CHF',
    current_value: 180000,
    rental_income: null,
    purchase_value: 150000,
    purchase_date: '2021-06-01',
    ownership_percentage: null,
    institution: 'Swissquote',
    ticker: null,
    quantity: null,
    platform: null,
    reference_balance: null,
    reference_date: null,
    notes: 'Global diversified ETF portfolio',
    image_url: null,
    entity_id: DEMO_ENTITY_PERSONAL,
    acquisition_type: 'purchase',
    acquisition_from: null,
    property_status: null,
    total_price: null,
    amount_paid: null,
    expected_delivery: null,
    developer: null,
    unit_number: null,
    project_name: null,
    created_at: '2021-06-01T10:00:00Z',
    updated_at: '2024-12-06T10:00:00Z',
  },
  {
    id: 'asset-investment-3',
    user_id: DEMO_USER_ID,
    name: 'Degiro European Stocks',
    type: 'investment',
    country: 'NL',
    currency: 'EUR',
    current_value: 75000,
    rental_income: null,
    purchase_value: 60000,
    purchase_date: '2022-03-15',
    ownership_percentage: null,
    institution: 'Degiro',
    ticker: null,
    quantity: null,
    platform: null,
    reference_balance: null,
    reference_date: null,
    notes: 'European value stocks',
    image_url: null,
    entity_id: DEMO_ENTITY_PERSONAL,
    acquisition_type: 'purchase',
    acquisition_from: null,
    property_status: null,
    total_price: null,
    amount_paid: null,
    expected_delivery: null,
    developer: null,
    unit_number: null,
    project_name: null,
    created_at: '2022-03-15T10:00:00Z',
    updated_at: '2024-11-30T10:00:00Z',
  },
  {
    id: 'asset-investment-4',
    user_id: DEMO_USER_ID,
    name: 'Treasury Bills UAE',
    type: 'investment',
    country: 'AE',
    currency: 'AED',
    current_value: 200000,
    rental_income: null,
    purchase_value: 195000,
    purchase_date: '2024-01-10',
    ownership_percentage: null,
    institution: 'Emirates NBD',
    ticker: null,
    quantity: null,
    platform: null,
    reference_balance: null,
    reference_date: null,
    notes: '6-month T-bills, 5.2% yield',
    image_url: null,
    entity_id: DEMO_ENTITY_COMPANY,
    acquisition_type: 'purchase',
    acquisition_from: null,
    property_status: null,
    total_price: null,
    amount_paid: null,
    expected_delivery: null,
    developer: null,
    unit_number: null,
    project_name: null,
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },

  // Digital Assets (3 holdings)
  {
    id: 'asset-crypto-1',
    user_id: DEMO_USER_ID,
    name: 'Bitcoin',
    type: 'crypto',
    country: 'XX',
    currency: 'USD',
    current_value: 250000,
    rental_income: null,
    purchase_value: 85000,
    purchase_date: '2021-01-15',
    ownership_percentage: null,
    institution: 'Ledger',
    ticker: 'BTC',
    quantity: 2.5,
    platform: 'Ledger',
    reference_balance: null,
    reference_date: null,
    notes: 'Hardware wallet, cold storage',
    image_url: null,
    entity_id: DEMO_ENTITY_PERSONAL,
    acquisition_type: 'purchase',
    acquisition_from: null,
    property_status: null,
    total_price: null,
    amount_paid: null,
    expected_delivery: null,
    developer: null,
    unit_number: null,
    project_name: null,
    created_at: '2021-01-15T10:00:00Z',
    updated_at: '2024-12-10T10:00:00Z',
  },
  {
    id: 'asset-crypto-2',
    user_id: DEMO_USER_ID,
    name: 'Ethereum',
    type: 'crypto',
    country: 'XX',
    currency: 'USD',
    current_value: 55000,
    rental_income: null,
    purchase_value: 25000,
    purchase_date: '2021-03-20',
    ownership_percentage: null,
    institution: 'Ledger',
    ticker: 'ETH',
    quantity: 15,
    platform: 'Ledger',
    reference_balance: null,
    reference_date: null,
    notes: 'Hardware wallet, cold storage',
    image_url: null,
    entity_id: DEMO_ENTITY_PERSONAL,
    acquisition_type: 'purchase',
    acquisition_from: null,
    property_status: null,
    total_price: null,
    amount_paid: null,
    expected_delivery: null,
    developer: null,
    unit_number: null,
    project_name: null,
    created_at: '2021-03-20T10:00:00Z',
    updated_at: '2024-12-10T10:00:00Z',
  },
  {
    id: 'asset-crypto-3',
    user_id: DEMO_USER_ID,
    name: 'Solana',
    type: 'crypto',
    country: 'XX',
    currency: 'USD',
    current_value: 35000,
    rental_income: null,
    purchase_value: 8000,
    purchase_date: '2022-06-01',
    ownership_percentage: null,
    institution: 'Phantom',
    ticker: 'SOL',
    quantity: 150,
    platform: 'MetaMask',
    reference_balance: null,
    reference_date: null,
    notes: 'Software wallet',
    image_url: null,
    entity_id: DEMO_ENTITY_PERSONAL,
    acquisition_type: 'purchase',
    acquisition_from: null,
    property_status: null,
    total_price: null,
    amount_paid: null,
    expected_delivery: null,
    developer: null,
    unit_number: null,
    project_name: null,
    created_at: '2022-06-01T10:00:00Z',
    updated_at: '2024-12-10T10:00:00Z',
  },

  // Business Equity (2 companies)
  {
    id: 'asset-business-1',
    user_id: DEMO_USER_ID,
    name: 'Oolala FZ LLC',
    type: 'business',
    country: 'AE',
    currency: 'USD',
    current_value: 150000,
    rental_income: null,
    purchase_value: 50000,
    purchase_date: '2020-06-01',
    ownership_percentage: 100,
    institution: null,
    ticker: null,
    quantity: null,
    platform: null,
    reference_balance: null,
    reference_date: null,
    notes: 'Consulting and advisory freezone company',
    image_url: null,
    entity_id: DEMO_ENTITY_PERSONAL,
    acquisition_type: 'creation',
    acquisition_from: null,
    property_status: null,
    total_price: null,
    amount_paid: null,
    expected_delivery: null,
    developer: null,
    unit_number: null,
    project_name: null,
    certainty: 'likely', // Own business - valuation is estimate
    created_at: '2020-06-01T10:00:00Z',
    updated_at: '2024-10-01T10:00:00Z',
  },
  {
    id: 'asset-business-2',
    user_id: DEMO_USER_ID,
    name: 'District 267 Ltd',
    type: 'business',
    country: 'BW',
    currency: 'USD',
    current_value: 300000,
    rental_income: null,
    purchase_value: 75000,
    purchase_date: '2019-09-15',
    ownership_percentage: 25,
    institution: null,
    ticker: null,
    quantity: null,
    platform: null,
    reference_balance: null,
    reference_date: null,
    notes: 'Safari lodge investment, minority stake',
    image_url: null,
    entity_id: DEMO_ENTITY_PERSONAL,
    acquisition_type: 'purchase',
    acquisition_from: null,
    property_status: null,
    total_price: null,
    amount_paid: null,
    expected_delivery: null,
    developer: null,
    unit_number: null,
    project_name: null,
    certainty: 'uncertain', // Minority stake in private company - hard to value
    created_at: '2019-09-15T10:00:00Z',
    updated_at: '2024-09-01T10:00:00Z',
  },
];

// Collections
export const demoCollections: DemoCollection[] = [
  // Watches (3)
  {
    id: 'collection-watch-1',
    user_id: DEMO_USER_ID,
    name: 'Rolex Daytona 116500LN',
    type: 'watch',
    brand: 'Rolex',
    model: 'Daytona',
    year: 2019,
    country: 'CH',
    currency: 'CHF',
    current_value: 42000,
    purchase_value: 13500,
    purchase_date: '2019-05-10',
    description: 'White dial, ceramic bezel',
    notes: 'Purchased from AD, full set with papers',
    fund_name: null,
    commitment_amount: null,
    called_amount: null,
    distribution_status: null,
    image_url: null,
    entity_id: DEMO_ENTITY_PERSONAL,
    acquisition_type: 'purchase',
    acquisition_from: null,
    certainty: 'certain', // Physical asset with known value
    created_at: '2019-05-10T10:00:00Z',
    updated_at: '2024-11-15T10:00:00Z',
  },
  {
    id: 'collection-watch-2',
    user_id: DEMO_USER_ID,
    name: 'Audemars Piguet Royal Oak',
    type: 'watch',
    brand: 'Audemars Piguet',
    model: 'Royal Oak 15500',
    year: 2021,
    country: 'CH',
    currency: 'CHF',
    current_value: 38000,
    purchase_value: 25000,
    purchase_date: '2021-08-20',
    description: 'Blue dial, 41mm',
    notes: 'Secondary market purchase, excellent condition',
    fund_name: null,
    commitment_amount: null,
    called_amount: null,
    distribution_status: null,
    image_url: null,
    entity_id: DEMO_ENTITY_PERSONAL,
    acquisition_type: 'purchase',
    acquisition_from: null,
    certainty: 'likely', // Secondary market value estimate
    created_at: '2021-08-20T10:00:00Z',
    updated_at: '2024-10-20T10:00:00Z',
  },
  {
    id: 'collection-watch-3',
    user_id: DEMO_USER_ID,
    name: 'Omega Speedmaster',
    type: 'watch',
    brand: 'Omega',
    model: 'Moonwatch',
    year: 2020,
    country: 'CH',
    currency: 'EUR',
    current_value: 8500,
    purchase_value: 6200,
    purchase_date: '2020-07-15',
    description: 'Professional Moonwatch, sapphire caseback',
    notes: 'Daily wear piece',
    fund_name: null,
    commitment_amount: null,
    called_amount: null,
    distribution_status: null,
    image_url: null,
    entity_id: DEMO_ENTITY_PERSONAL,
    acquisition_type: 'purchase',
    acquisition_from: null,
    certainty: 'certain',
    created_at: '2020-07-15T10:00:00Z',
    updated_at: '2024-09-10T10:00:00Z',
  },

  // Vehicles (2)
  {
    id: 'collection-vehicle-1',
    user_id: DEMO_USER_ID,
    name: 'Porsche 911 Carrera S',
    type: 'vehicle',
    brand: 'Porsche',
    model: '992 Carrera S',
    year: 2022,
    country: 'DE',
    currency: 'EUR',
    current_value: 135000,
    purchase_value: 142000,
    purchase_date: '2022-04-01',
    description: 'GT Silver Metallic, Sport Chrono Package',
    notes: 'Registered in Portugal, stored in Cascais',
    fund_name: null,
    commitment_amount: null,
    called_amount: null,
    distribution_status: null,
    image_url: null,
    entity_id: DEMO_ENTITY_PERSONAL,
    acquisition_type: 'purchase',
    acquisition_from: null,
    certainty: 'likely', // Depreciation estimated
    created_at: '2022-04-01T10:00:00Z',
    updated_at: '2024-11-01T10:00:00Z',
  },
  {
    id: 'collection-vehicle-2',
    user_id: DEMO_USER_ID,
    name: 'Land Rover Defender',
    type: 'vehicle',
    brand: 'Land Rover',
    model: '110 V8',
    year: 2023,
    country: 'AE',
    currency: 'AED',
    current_value: 380000,
    purchase_value: 420000,
    purchase_date: '2023-01-15',
    description: 'Carpathian Grey, full spec',
    notes: 'Dubai registered, daily driver',
    fund_name: null,
    commitment_amount: null,
    called_amount: null,
    distribution_status: null,
    image_url: null,
    entity_id: DEMO_ENTITY_COMPANY,
    acquisition_type: 'purchase',
    acquisition_from: null,
    certainty: 'estimated', // Vehicle value estimated from market
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2024-10-15T10:00:00Z',
  },

  // Art (2)
  {
    id: 'collection-art-1',
    user_id: DEMO_USER_ID,
    name: 'Contemporary Abstract',
    type: 'art',
    brand: 'Emerging Artist',
    model: null,
    year: 2022,
    country: 'FR',
    currency: 'EUR',
    current_value: 25000,
    purchase_value: 15000,
    purchase_date: '2022-09-01',
    description: 'Large-scale oil on canvas',
    notes: 'Acquired at Art Paris fair',
    fund_name: null,
    commitment_amount: null,
    called_amount: null,
    distribution_status: null,
    image_url: null,
    entity_id: DEMO_ENTITY_PERSONAL,
    acquisition_type: 'purchase',
    acquisition_from: null,
    certainty: 'projected', // Emerging artist value uncertain
    created_at: '2022-09-01T10:00:00Z',
    updated_at: '2024-09-01T10:00:00Z',
  },
  {
    id: 'collection-art-2',
    user_id: DEMO_USER_ID,
    name: 'Limited Edition Print',
    type: 'art',
    brand: 'Banksy',
    model: null,
    year: 2019,
    country: 'GB',
    currency: 'GBP',
    current_value: 45000,
    purchase_value: 28000,
    purchase_date: '2019-11-15',
    description: 'Signed, numbered edition of 150',
    notes: "Acquired through Sotheby's, authenticated",
    fund_name: null,
    commitment_amount: null,
    called_amount: null,
    distribution_status: null,
    image_url: null,
    entity_id: DEMO_ENTITY_PERSONAL,
    acquisition_type: 'purchase',
    acquisition_from: null,
    certainty: 'estimated', // Art auction value estimated
    created_at: '2019-11-15T10:00:00Z',
    updated_at: '2024-08-01T10:00:00Z',
  },

  // Wine (1)
  {
    id: 'collection-wine-1',
    user_id: DEMO_USER_ID,
    name: 'Bordeaux Collection',
    type: 'wine',
    brand: null,
    model: null,
    year: null,
    country: 'FR',
    currency: 'EUR',
    current_value: 28000,
    purchase_value: 18000,
    purchase_date: '2018-06-01',
    description: 'Château Margaux, Pétrus, Lafite Rothschild vintages',
    notes: 'Stored at London City Bond, professional storage',
    fund_name: null,
    commitment_amount: null,
    called_amount: null,
    distribution_status: null,
    image_url: null,
    entity_id: DEMO_ENTITY_PERSONAL,
    acquisition_type: 'purchase',
    acquisition_from: null,
    certainty: 'estimated', // Wine value based on Liv-ex index
    created_at: '2018-06-01T10:00:00Z',
    updated_at: '2024-07-01T10:00:00Z',
  },

  // Physical Gold (1)
  {
    id: 'collection-gold-1',
    user_id: DEMO_USER_ID,
    name: 'Gold Bullion',
    type: 'other',
    brand: 'Perth Mint',
    model: null,
    year: null,
    country: 'AE',
    currency: 'USD',
    current_value: 22000,
    purchase_value: 18500,
    purchase_date: '2022-02-01',
    description: '10x 1oz Gold Bars',
    notes: 'Stored in Dubai safe deposit box',
    fund_name: null,
    commitment_amount: null,
    called_amount: null,
    distribution_status: null,
    image_url: null,
    entity_id: DEMO_ENTITY_PERSONAL,
    acquisition_type: 'purchase',
    acquisition_from: null,
    certainty: 'certain', // Gold bullion with known spot value
    created_at: '2022-02-01T10:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },

  // Vinyls (2)
  {
    id: 'collection-vinyl-1',
    user_id: DEMO_USER_ID,
    name: 'The Dark Side of the Moon - Pink Floyd',
    type: 'vinyl',
    brand: 'Harvest',
    model: 'First Press UK',
    year: 1973,
    country: 'GB',
    currency: 'EUR',
    current_value: 2500,
    purchase_value: 800,
    purchase_date: '2018-06-15',
    description: 'Original 1973 UK pressing with posters',
    notes: 'Near mint condition, includes original posters and stickers',
    fund_name: null,
    commitment_amount: null,
    called_amount: null,
    distribution_status: null,
    image_url: null,
    entity_id: DEMO_ENTITY_PERSONAL,
    acquisition_type: 'purchase',
    acquisition_from: 'Discogs seller',
    certainty: 'probable',
    created_at: '2018-06-15T10:00:00Z',
    updated_at: '2024-11-01T10:00:00Z',
  },
  {
    id: 'collection-vinyl-2',
    user_id: DEMO_USER_ID,
    name: 'Kind of Blue - Miles Davis',
    type: 'vinyl',
    brand: 'Columbia',
    model: '6 Eye Mono',
    year: 1959,
    country: 'US',
    currency: 'USD',
    current_value: 8000,
    purchase_value: 3500,
    purchase_date: '2020-03-01',
    description: 'Original 1959 mono pressing',
    notes: 'Rare 6-eye Columbia label, VG+ condition',
    fund_name: null,
    commitment_amount: null,
    called_amount: null,
    distribution_status: null,
    image_url: null,
    entity_id: DEMO_ENTITY_PERSONAL,
    acquisition_type: 'purchase',
    acquisition_from: 'Heritage Auctions',
    certainty: 'probable',
    created_at: '2020-03-01T10:00:00Z',
    updated_at: '2024-10-01T10:00:00Z',
  },
];

// Liabilities (4)
export const demoLiabilities: DemoLiability[] = [
  {
    id: 'liability-1',
    user_id: DEMO_USER_ID,
    name: 'Dubai Apartment Mortgage',
    type: 'mortgage',
    country: 'AE',
    currency: 'AED',
    current_balance: 1800000,
    original_amount: 2400000,
    interest_rate: 4.5,
    monthly_payment: 15000,
    start_date: '2021-03-15',
    end_date: '2036-03-15',
    linked_asset_id: 'asset-real-estate-1',
    institution: 'Emirates NBD',
    notes: '15-year fixed rate mortgage',
    entity_id: DEMO_ENTITY_COMPANY,
    financing_type: 'conventional',
    is_shariah_compliant: false,
    shariah_advisor: null,
    cost_price: null,
    profit_margin: null,
    monthly_rental: null,
    residual_value: null,
    bank_ownership_percentage: null,
    certainty: 'certain',
    created_at: '2021-03-15T10:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
  {
    id: 'liability-2',
    user_id: DEMO_USER_ID,
    name: 'Porsche Financing',
    type: 'car_loan',
    country: 'DE',
    currency: 'EUR',
    current_balance: 45000,
    original_amount: 80000,
    interest_rate: 3.2,
    monthly_payment: 1800,
    start_date: '2022-04-01',
    end_date: '2026-04-01',
    linked_asset_id: 'collection-vehicle-1',
    institution: 'Porsche Financial Services',
    notes: '4-year financing, balloon payment option',
    entity_id: DEMO_ENTITY_PERSONAL,
    financing_type: 'conventional',
    is_shariah_compliant: false,
    shariah_advisor: null,
    cost_price: null,
    profit_margin: null,
    monthly_rental: null,
    residual_value: null,
    bank_ownership_percentage: null,
    certainty: 'certain',
    created_at: '2022-04-01T10:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
  // Islamic Finance Demo - Diminishing Musharaka
  {
    id: 'liability-3',
    user_id: DEMO_USER_ID,
    name: 'Palm Jumeirah Villa - DIB Financing',
    type: 'mortgage',
    country: 'AE',
    currency: 'AED',
    current_balance: 3200000,
    original_amount: 5000000,
    interest_rate: null,
    monthly_payment: 28000,
    start_date: '2022-01-15',
    end_date: '2037-01-15',
    linked_asset_id: null,
    institution: 'Dubai Islamic Bank',
    notes: 'Diminishing Musharaka - bank owns 64% currently',
    entity_id: DEMO_ENTITY_PERSONAL,
    financing_type: 'diminishing_musharaka',
    is_shariah_compliant: true,
    shariah_advisor: 'Dubai Islamic Bank Shariah Board',
    cost_price: null,
    profit_margin: null,
    monthly_rental: 18000,
    residual_value: null,
    bank_ownership_percentage: 64,
    certainty: 'likely',
    created_at: '2022-01-15T10:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
  // Credit Card
  {
    id: 'liability-4',
    user_id: DEMO_USER_ID,
    name: 'AMEX Platinum Balance',
    type: 'credit_card',
    country: 'AE',
    currency: 'AED',
    current_balance: 18500,
    original_amount: null,
    interest_rate: 0,
    monthly_payment: null,
    start_date: null,
    end_date: null,
    linked_asset_id: null,
    institution: 'American Express',
    notes: 'Paid in full monthly, current outstanding balance',
    entity_id: DEMO_ENTITY_PERSONAL,
    financing_type: 'conventional',
    is_shariah_compliant: false,
    shariah_advisor: null,
    cost_price: null,
    profit_margin: null,
    monthly_rental: null,
    residual_value: null,
    bank_ownership_percentage: null,
    certainty: 'optional',
    created_at: '2023-01-01T10:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
];

// Demo Receivables
export const demoReceivables: DemoReceivable[] = [
  {
    id: 'receivable-1',
    user_id: DEMO_USER_ID,
    name: 'Prêt à Pierre',
    type: 'personal_loan',
    debtor_name: 'Pierre Martin',
    debtor_type: 'individual',
    currency: 'EUR',
    original_amount: 5000,
    current_balance: 5000,
    issue_date: '2024-06-15',
    due_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pending',
    recovery_probability: 'likely',
    certainty: 'likely',
    created_at: '2024-06-15T10:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
  {
    id: 'receivable-2',
    user_id: DEMO_USER_ID,
    name: 'Caution Appartement Paris',
    type: 'deposit',
    debtor_name: 'Agence Immobilière Paris',
    debtor_type: 'company',
    deposit_type: 'rental',
    refund_conditions: 'End of lease, subject to inspection',
    currency: 'EUR',
    original_amount: 2400,
    current_balance: 2400,
    issue_date: '2020-09-10',
    due_date: null,
    status: 'pending',
    recovery_probability: 'certain',
    certainty: 'certain',
    linked_asset_id: 'asset-real-estate-3',
    created_at: '2020-09-10T10:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
  {
    id: 'receivable-3',
    user_id: DEMO_USER_ID,
    name: 'Note de frais Q4',
    type: 'expense_reimbursement',
    debtor_name: 'Employer SA',
    debtor_type: 'employer',
    currency: 'EUR',
    original_amount: 850,
    current_balance: 850,
    issue_date: '2024-10-01',
    due_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pending',
    recovery_probability: 'uncertain',
    certainty: 'optional',
    created_at: '2024-10-01T10:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
];

// Demo Loan Schedules
export interface DemoLoanPayment {
  id: string;
  loan_schedule_id: string;
  user_id: string;
  payment_number: number;
  payment_date: string;
  principal_amount: number;
  interest_amount: number;
  total_amount: number;
  remaining_principal: number;
  status: 'scheduled' | 'paid' | 'late' | 'missed';
  actual_payment_date: string | null;
  actual_amount: number | null;
}

// Generate demo loan payments for Dubai Apartment Mortgage
const generateDemoLoanPayments = (): DemoLoanPayment[] => {
  const payments: DemoLoanPayment[] = [];
  const startDate = new Date('2021-03-15');
  const principal = 2400000;
  const rate = 4.5 / 100 / 12;
  const term = 180;
  const monthlyPayment = 18358; // Calculated using amortization formula
  
  let remainingPrincipal = principal;
  
  for (let i = 1; i <= term; i++) {
    const interestAmount = remainingPrincipal * rate;
    const principalAmount = monthlyPayment - interestAmount;
    remainingPrincipal -= principalAmount;
    if (remainingPrincipal < 0) remainingPrincipal = 0;
    
    const paymentDate = new Date(startDate);
    paymentDate.setMonth(paymentDate.getMonth() + i);
    
    // First 45 payments are paid (March 2021 to November 2024)
    const isPaid = i <= 45;
    
    payments.push({
      id: `demo-payment-${i}`,
      loan_schedule_id: 'demo-loan-schedule-1',
      user_id: DEMO_USER_ID,
      payment_number: i,
      payment_date: paymentDate.toISOString().split('T')[0],
      principal_amount: Math.round(principalAmount * 100) / 100,
      interest_amount: Math.round(interestAmount * 100) / 100,
      total_amount: Math.round(monthlyPayment * 100) / 100,
      remaining_principal: Math.round(remainingPrincipal * 100) / 100,
      status: isPaid ? 'paid' : 'scheduled',
      actual_payment_date: isPaid ? paymentDate.toISOString().split('T')[0] : null,
      actual_amount: isPaid ? monthlyPayment : null,
    });
  }
  
  return payments;
};

export const demoLoanSchedules: DemoLoanSchedule[] = [
  {
    id: 'demo-loan-schedule-1',
    liability_id: 'liability-1',
    user_id: DEMO_USER_ID,
    loan_type: 'amortizing',
    principal_amount: 2400000,
    interest_rate: 4.5,
    rate_type: 'fixed',
    start_date: '2021-03-15',
    end_date: '2036-03-15',
    term_months: 180,
    payment_frequency: 'monthly',
    monthly_payment: 18358,
    total_interest: 904440,
    total_cost: 3304440,
    payments_made: 45,
    next_payment_date: '2024-12-15',
    remaining_principal: 1800000,
  }
];

export const demoLoanPayments: DemoLoanPayment[] = generateDemoLoanPayments();

// Net worth history for the chart (12 months)
export const demoNetWorthHistory = [
  { 
    snapshot_date: '2024-01-01', 
    net_worth_eur: 2850000,
    certainty_breakdown_assets: { certain: 2200000, contractual: 400000, probable: 350000, optional: 100000 },
    certainty_breakdown_liabilities: { certain: 150000, contractual: 50000, probable: 0, optional: 0 },
  },
  { 
    snapshot_date: '2024-02-01', 
    net_worth_eur: 2890000,
    certainty_breakdown_assets: { certain: 2230000, contractual: 410000, probable: 360000, optional: 100000 },
    certainty_breakdown_liabilities: { certain: 155000, contractual: 55000, probable: 0, optional: 0 },
  },
  { 
    snapshot_date: '2024-03-01', 
    net_worth_eur: 2920000,
    certainty_breakdown_assets: { certain: 2250000, contractual: 420000, probable: 370000, optional: 100000 },
    certainty_breakdown_liabilities: { certain: 160000, contractual: 60000, probable: 0, optional: 0 },
  },
  { 
    snapshot_date: '2024-04-01', 
    net_worth_eur: 2880000,
    certainty_breakdown_assets: { certain: 2220000, contractual: 400000, probable: 360000, optional: 100000 },
    certainty_breakdown_liabilities: { certain: 150000, contractual: 50000, probable: 0, optional: 0 },
  },
  { 
    snapshot_date: '2024-05-01', 
    net_worth_eur: 2950000,
    certainty_breakdown_assets: { certain: 2280000, contractual: 430000, probable: 370000, optional: 100000 },
    certainty_breakdown_liabilities: { certain: 170000, contractual: 60000, probable: 0, optional: 0 },
  },
  { 
    snapshot_date: '2024-06-01', 
    net_worth_eur: 3010000,
    certainty_breakdown_assets: { certain: 2320000, contractual: 450000, probable: 380000, optional: 110000 },
    certainty_breakdown_liabilities: { certain: 180000, contractual: 70000, probable: 0, optional: 0 },
  },
  { 
    snapshot_date: '2024-07-01', 
    net_worth_eur: 3050000,
    certainty_breakdown_assets: { certain: 2350000, contractual: 460000, probable: 390000, optional: 110000 },
    certainty_breakdown_liabilities: { certain: 185000, contractual: 75000, probable: 0, optional: 0 },
  },
  { 
    snapshot_date: '2024-08-01', 
    net_worth_eur: 3020000,
    certainty_breakdown_assets: { certain: 2330000, contractual: 450000, probable: 385000, optional: 105000 },
    certainty_breakdown_liabilities: { certain: 180000, contractual: 70000, probable: 0, optional: 0 },
  },
  { 
    snapshot_date: '2024-09-01', 
    net_worth_eur: 3080000,
    certainty_breakdown_assets: { certain: 2370000, contractual: 470000, probable: 400000, optional: 110000 },
    certainty_breakdown_liabilities: { certain: 190000, contractual: 80000, probable: 0, optional: 0 },
  },
  { 
    snapshot_date: '2024-10-01', 
    net_worth_eur: 3120000,
    certainty_breakdown_assets: { certain: 2400000, contractual: 480000, probable: 410000, optional: 110000 },
    certainty_breakdown_liabilities: { certain: 195000, contractual: 85000, probable: 0, optional: 0 },
  },
  { 
    snapshot_date: '2024-11-01', 
    net_worth_eur: 3150000,
    certainty_breakdown_assets: { certain: 2420000, contractual: 490000, probable: 420000, optional: 110000 },
    certainty_breakdown_liabilities: { certain: 200000, contractual: 90000, probable: 0, optional: 0 },
  },
  { 
    snapshot_date: '2024-12-01', 
    net_worth_eur: 3180000,
    certainty_breakdown_assets: { certain: 2450000, contractual: 500000, probable: 420000, optional: 110000 },
    certainty_breakdown_liabilities: { certain: 205000, contractual: 95000, probable: 0, optional: 0 },
  },
];
