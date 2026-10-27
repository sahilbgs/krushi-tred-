-- ==============================================================================
-- કૃષિ ટ્રેડ (SHREE NANDINI SEEDS) - PostgreSQL Database Schema
-- Version: 1.0.0
-- Database: krushi_trade
-- Target RDBMS: PostgreSQL 16+
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. ENUM / HELPER DOMAINS & TRIGGER FUNCTIONS
-- ==============================================================================

-- Function: Auto update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. CORE MASTER TABLES
-- ==============================================================================

-- 3.1 USERS & PERMISSIONS (સ્ટાફ અને અધિકાર વ્યવસ્થાપન)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    display_name VARCHAR(150) NOT NULL,
    mobile VARCHAR(20),
    role VARCHAR(30) NOT NULL DEFAULT 'sub_user' CHECK (role IN ('admin', 'sub_user')),
    permissions JSONB NOT NULL DEFAULT '{
        "farmerMaster": true,
        "supplierMaster": true,
        "seedMaster": true,
        "purchaseEntry": true,
        "salesBilling": true,
        "stockManagement": true,
        "payments": true,
        "reports": false,
        "viewRates": false
    }'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 3.2 SEED VARIETIES MASTER (બીજની જાતો - 35 KG Standard બોરી • ₹/મણ)
CREATE TABLE IF NOT EXISTS seed_varieties (
    id VARCHAR(50) PRIMARY KEY,
    variety_name VARCHAR(100) NOT NULL UNIQUE,
    crop_type VARCHAR(100) NOT NULL,
    company VARCHAR(150),
    bag_weight_kg NUMERIC(8,2) NOT NULL DEFAULT 35.00 CHECK (bag_weight_kg > 0),
    hsn_code VARCHAR(20) DEFAULT '1209',
    default_purchase_rate_per_man NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (default_purchase_rate_per_man >= 0),
    default_sale_rate_per_man NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (default_sale_rate_per_man >= 0),
    default_sale_rate_per_bag NUMERIC(10,2) GENERATED ALWAYS AS (ROUND((default_sale_rate_per_man * (bag_weight_kg / 20.00)), 2)) STORED,
    default_sale_rate_per_kg NUMERIC(10,2) GENERATED ALWAYS AS (ROUND((default_sale_rate_per_man / 20.00), 2)) STORED,
    min_stock_alert_bags INTEGER NOT NULL DEFAULT 10 CHECK (min_stock_alert_bags >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_seed_varieties_updated_at
BEFORE UPDATE ON seed_varieties
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 3.3 PARTIES (ખેડૂતો, પેઢીઓ/સપ્લાયર્સ, દલાલ/વેપારીઓ, ટ્રાન્સપોર્ટરો)
CREATE TABLE IF NOT EXISTS parties (
    id VARCHAR(50) PRIMARY KEY,
    party_type VARCHAR(30) NOT NULL CHECK (party_type IN ('farmer', 'firm', 'supplier', 'trader', 'transporter', 'other')),
    code VARCHAR(50) UNIQUE,
    name VARCHAR(150) NOT NULL,
    firm_name VARCHAR(150),
    firm_id VARCHAR(50) REFERENCES parties(id) ON DELETE SET NULL,
    mobile VARCHAR(20),
    village VARCHAR(100),
    taluka VARCHAR(100),
    district VARCHAR(100),
    address TEXT,
    gst_no VARCHAR(30),
    opening_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    balance_type VARCHAR(2) NOT NULL DEFAULT 'dr' CHECK (balance_type IN ('dr', 'cr')),
    current_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    credit_limit NUMERIC(12,2) NOT NULL DEFAULT 50000.00,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_parties_updated_at
BEFORE UPDATE ON parties
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ==============================================================================
-- 4. INVENTORY / STOCK
-- ==============================================================================

-- 4.1 LIVE STOCK LEDGER (વાસ્તવિક સ્ટોક - બોરી + છૂટક કિલો)
CREATE TABLE IF NOT EXISTS stock_ledger (
    id VARCHAR(50) PRIMARY KEY,
    seed_id VARCHAR(50) NOT NULL REFERENCES seed_varieties(id) ON DELETE CASCADE,
    variety_name VARCHAR(100) NOT NULL,
    batch_no VARCHAR(50) NOT NULL DEFAULT 'MAIN',
    bag_weight_kg NUMERIC(8,2) NOT NULL DEFAULT 35.00,
    available_bags INTEGER NOT NULL DEFAULT 0 CHECK (available_bags >= 0),
    available_loose_kg NUMERIC(8,2) NOT NULL DEFAULT 0.00 CHECK (available_loose_kg >= 0 AND available_loose_kg < bag_weight_kg),
    total_weight_kg NUMERIC(12,2) GENERATED ALWAYS AS ((available_bags * bag_weight_kg) + available_loose_kg) STORED,
    total_man NUMERIC(12,2) GENERATED ALWAYS AS (ROUND(((available_bags * bag_weight_kg) + available_loose_kg) / 20.00, 2)) STORED,
    last_purchase_rate NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_stock_seed_batch UNIQUE(seed_id, batch_no)
);

CREATE TRIGGER trg_stock_ledger_updated_at
BEFORE UPDATE ON stock_ledger
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ==============================================================================
-- 5. PURCHASES & INWARD MODULE (બિયારણ ખરીદી)
-- ==============================================================================

-- 5.1 PURCHASES (ખરીદી વાઉચરો - ખેડૂત અથવા યાર્ડ પેઢી તરફથી)
CREATE TABLE IF NOT EXISTS purchases (
    id VARCHAR(50) PRIMARY KEY,
    purchase_type VARCHAR(30) NOT NULL DEFAULT 'farmer' CHECK (purchase_type IN ('farmer', 'market', 'firm', 'supplier', 'trader', 'other', 'direct')),
    bill_no VARCHAR(50) NOT NULL UNIQUE,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    party_id VARCHAR(50) REFERENCES parties(id) ON DELETE RESTRICT,
    party_name VARCHAR(150) NOT NULL,
    firm_id VARCHAR(50) REFERENCES parties(id) ON DELETE SET NULL,
    firm_name VARCHAR(150),
    trader_id VARCHAR(50) REFERENCES parties(id) ON DELETE SET NULL,
    trader_name VARCHAR(150),
    village VARCHAR(100),
    mobile VARCHAR(20),
    truck_no VARCHAR(30),
    truck_owner VARCHAR(150),
    items_sub_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    majuri_rate_per_bag NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    majuri_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    market_commission NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    firm_commission NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    bardan_expense NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_expenses NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    net_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    due_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    payment_mode VARCHAR(30) NOT NULL DEFAULT 'credit' CHECK (payment_mode IN ('cash', 'bank', 'upi', 'credit', 'cheque')),
    remarks TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_purchases_updated_at
BEFORE UPDATE ON purchases
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 5.2 PURCHASE ITEMS (ખરીદીની વિગતવાર આઇટમો)
CREATE TABLE IF NOT EXISTS purchase_items (
    id VARCHAR(50) PRIMARY KEY,
    purchase_id VARCHAR(50) NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    seed_id VARCHAR(50) REFERENCES seed_varieties(id) ON DELETE RESTRICT,
    variety_name VARCHAR(100) NOT NULL,
    bag_weight_kg NUMERIC(8,2) NOT NULL DEFAULT 35.00,
    bags INTEGER NOT NULL DEFAULT 0 CHECK (bags >= 0),
    last_bag_kg NUMERIC(8,2) NOT NULL DEFAULT 35.00 CHECK (last_bag_kg >= 0 AND last_bag_kg <= bag_weight_kg),
    net_weight_kg NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_man NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    rate_per_man NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    rate_per_kg NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    item_total NUMERIC(12,2) NOT NULL DEFAULT 0.00
);

-- ==============================================================================
-- 6. SALES & BILLING MODULE (વેચાણ / સાદું બિલ)
-- ==============================================================================

-- 6.1 SALES (વેચાણ બિલ - ખેડૂત/ગ્રાહક)
CREATE TABLE IF NOT EXISTS sales (
    id VARCHAR(50) PRIMARY KEY,
    bill_no VARCHAR(50) NOT NULL UNIQUE,
    bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
    bill_type VARCHAR(30) NOT NULL DEFAULT 'simple_bill',
    party_id VARCHAR(50) REFERENCES parties(id) ON DELETE SET NULL,
    farmer_name VARCHAR(150) NOT NULL,
    farmer_mobile VARCHAR(20),
    farmer_village VARCHAR(100),
    sale_category VARCHAR(30) NOT NULL DEFAULT 'retail' CHECK (sale_category IN ('retail', 'wholesale')),
    sub_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    majuri_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    net_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    due_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    payment_mode VARCHAR(30) NOT NULL DEFAULT 'cash' CHECK (payment_mode IN ('cash', 'upi', 'bank', 'credit', 'cash_and_credit')),
    status VARCHAR(30) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
    remarks TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_sales_updated_at
BEFORE UPDATE ON sales
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 6.2 SALE ITEMS (વેચાણ બિલની આઇટમો)
CREATE TABLE IF NOT EXISTS sale_items (
    id VARCHAR(50) PRIMARY KEY,
    sale_id VARCHAR(50) NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    seed_id VARCHAR(50) REFERENCES seed_varieties(id) ON DELETE RESTRICT,
    variety_name VARCHAR(100) NOT NULL,
    bag_weight_kg NUMERIC(8,2) NOT NULL DEFAULT 35.00,
    bags INTEGER NOT NULL DEFAULT 0 CHECK (bags >= 0),
    loose_kg NUMERIC(8,2) NOT NULL DEFAULT 0.00 CHECK (loose_kg >= 0),
    total_weight_kg NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_man NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    rate_unit VARCHAR(20) NOT NULL DEFAULT 'man' CHECK (rate_unit IN ('man', 'kg', 'bag')),
    rate NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    item_total NUMERIC(12,2) NOT NULL DEFAULT 0.00
);

-- ==============================================================================
-- 7. FINANCIAL ACCOUNTING: KHATA BOOK & DAILY ROJMEL
-- ==============================================================================

-- 7.1 PARTY TRANSACTIONS (પાર્ટી ખાતાવહી લેજર - જમા-ઉધાર વ્યવહારો)
CREATE TABLE IF NOT EXISTS party_transactions (
    id VARCHAR(50) PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time VARCHAR(20),
    party_id VARCHAR(50) NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    party_name VARCHAR(150) NOT NULL,
    party_type VARCHAR(30) NOT NULL,
    voucher_no VARCHAR(50),
    voucher_type VARCHAR(30) NOT NULL CHECK (voucher_type IN ('purchase', 'sale', 'payment', 'receipt', 'journal')),
    particulars TEXT NOT NULL,
    variety_name VARCHAR(100),
    bags INTEGER DEFAULT 0,
    weight_kg NUMERIC(10,2) DEFAULT 0.00,
    total_man NUMERIC(10,2) DEFAULT 0.00,
    rate_per_man NUMERIC(10,2) DEFAULT 0.00,
    debit NUMERIC(12,2) NOT NULL DEFAULT 0.00,   -- ઉધાર (લેવાના / ચૂકવ્યા)
    credit NUMERIC(12,2) NOT NULL DEFAULT 0.00,  -- જમા (આપવાના / મળ્યા)
    running_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    payment_mode VARCHAR(30),
    remarks TEXT,
    bill_id VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7.2 ROJMEL (દૈનિક રોજમેળ - કેશ અને બેંક બુક)
CREATE TABLE IF NOT EXISTS rojmel (
    id VARCHAR(50) PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time VARCHAR(20),
    voucher_no VARCHAR(50),
    voucher_type VARCHAR(30) NOT NULL CHECK (voucher_type IN ('purchase', 'sale', 'payment', 'receipt', 'expense')),
    party_name VARCHAR(150),
    particulars TEXT NOT NULL,
    variety_name VARCHAR(100),
    bags INTEGER DEFAULT 0,
    weight_kg NUMERIC(10,2) DEFAULT 0.00,
    total_man NUMERIC(10,2) DEFAULT 0.00,
    account VARCHAR(30) NOT NULL DEFAULT 'cash' CHECK (account IN ('cash', 'bank', 'purchase', 'sale', 'expense')),
    debit NUMERIC(12,2) NOT NULL DEFAULT 0.00,  -- રકમ ગઈ (Outflow)
    credit NUMERIC(12,2) NOT NULL DEFAULT 0.00, -- રકમ આવી (Inflow)
    payment_mode VARCHAR(30) NOT NULL DEFAULT 'cash',
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7.3 PAYMENTS & VOUCHERS (જમા-ઉધાર વાઉચર એન્ટ્રીઓ)
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(50) PRIMARY KEY,
    receipt_no VARCHAR(50) NOT NULL UNIQUE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    party_id VARCHAR(50) REFERENCES parties(id) ON DELETE SET NULL,
    party_name VARCHAR(150) NOT NULL,
    party_type VARCHAR(30) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('receipt', 'payment')),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_mode VARCHAR(30) NOT NULL DEFAULT 'cash' CHECK (payment_mode IN ('cash', 'upi', 'bank', 'cheque')),
    reference_no VARCHAR(100),
    remarks TEXT,
    recorded_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 8. HIGH PERFORMANCE INDEXES
-- ==============================================================================

-- 8.1 Users Indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- 8.2 Seed Varieties Indexes
CREATE INDEX IF NOT EXISTS idx_seed_varieties_name ON seed_varieties(variety_name);
CREATE INDEX IF NOT EXISTS idx_seed_varieties_crop ON seed_varieties(crop_type);

-- 8.3 Parties Indexes
CREATE INDEX IF NOT EXISTS idx_parties_type ON parties(party_type);
CREATE INDEX IF NOT EXISTS idx_parties_mobile ON parties(mobile);
CREATE INDEX IF NOT EXISTS idx_parties_name ON parties(name);
CREATE INDEX IF NOT EXISTS idx_parties_code ON parties(code);
CREATE INDEX IF NOT EXISTS idx_parties_firm_id ON parties(firm_id);
CREATE INDEX IF NOT EXISTS idx_parties_current_balance ON parties(current_balance);

-- 8.4 Stock Ledger Indexes
CREATE INDEX IF NOT EXISTS idx_stock_seed_id ON stock_ledger(seed_id);
CREATE INDEX IF NOT EXISTS idx_stock_variety ON stock_ledger(variety_name);
CREATE INDEX IF NOT EXISTS idx_stock_available_bags ON stock_ledger(available_bags);

-- 8.5 Purchases Indexes
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_party_id ON purchases(party_id);
CREATE INDEX IF NOT EXISTS idx_purchases_firm_id ON purchases(firm_id);
CREATE INDEX IF NOT EXISTS idx_purchases_bill_no ON purchases(bill_no);
CREATE INDEX IF NOT EXISTS idx_purchases_due_amount ON purchases(due_amount) WHERE due_amount > 0;

-- 8.6 Purchase Items Indexes
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_seed_id ON purchase_items(seed_id);

-- 8.7 Sales Indexes
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(bill_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_party_id ON sales(party_id);
CREATE INDEX IF NOT EXISTS idx_sales_bill_no ON sales(bill_no);
CREATE INDEX IF NOT EXISTS idx_sales_due_amount ON sales(due_amount) WHERE due_amount > 0;
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);

-- 8.8 Sale Items Indexes
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_seed_id ON sale_items(seed_id);

-- 8.9 Party Transactions Indexes (Optimized for instant Khata Book Statement loading)
CREATE INDEX IF NOT EXISTS idx_ptx_party_date ON party_transactions(party_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_ptx_voucher_no ON party_transactions(voucher_no);
CREATE INDEX IF NOT EXISTS idx_ptx_bill_id ON party_transactions(bill_id);

-- 8.10 Rojmel Indexes (Optimized for daily date filtering)
CREATE INDEX IF NOT EXISTS idx_rojmel_date ON rojmel(date DESC);
CREATE INDEX IF NOT EXISTS idx_rojmel_account ON rojmel(account, date DESC);
CREATE INDEX IF NOT EXISTS idx_rojmel_voucher ON rojmel(voucher_no);

-- 8.11 Payments Indexes
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_party_id ON payments(party_id);
CREATE INDEX IF NOT EXISTS idx_payments_receipt_no ON payments(receipt_no);

-- ==============================================================================
-- 9. ANALYTICAL VIEWS
-- ==============================================================================

-- 9.1 View: Live Stock Overview with Low Stock Alert
CREATE OR REPLACE VIEW view_current_stock AS
SELECT 
    sl.id AS stock_id,
    sv.id AS seed_id,
    sv.variety_name,
    sv.crop_type,
    sv.company,
    sl.bag_weight_kg,
    sl.available_bags,
    sl.available_loose_kg,
    sl.total_weight_kg,
    sl.total_man,
    sv.default_purchase_rate_per_man,
    sv.default_sale_rate_per_man,
    ROUND((sl.total_man * sv.default_sale_rate_per_man), 2) AS estimated_stock_valuation,
    CASE 
        WHEN sl.available_bags <= sv.min_stock_alert_bags THEN TRUE 
        ELSE FALSE 
    END AS is_low_stock
FROM stock_ledger sl
JOIN seed_varieties sv ON sl.seed_id = sv.id;

-- 9.2 View: Party Ledger Outstanding Summary
CREATE OR REPLACE VIEW view_party_outstanding_summary AS
SELECT 
    p.id AS party_id,
    p.code,
    p.name AS party_name,
    p.party_type,
    p.mobile,
    p.village,
    p.opening_balance,
    COALESCE(SUM(pt.debit), 0) AS total_debit,
    COALESCE(SUM(pt.credit), 0) AS total_credit,
    p.current_balance
FROM parties p
LEFT JOIN party_transactions pt ON p.id = pt.party_id
GROUP BY p.id, p.code, p.name, p.party_type, p.mobile, p.village, p.opening_balance, p.current_balance;

-- 9.3 View: Today's Dashboard Metrics
CREATE OR REPLACE VIEW view_today_dashboard_metrics AS
SELECT
    CURRENT_DATE AS report_date,
    (SELECT COUNT(*) FROM parties WHERE party_type = 'farmer') AS total_farmers,
    (SELECT COUNT(*) FROM seed_varieties WHERE is_active = TRUE) AS total_seed_varieties,
    (SELECT COALESCE(SUM(available_bags), 0) FROM stock_ledger) AS total_bags_in_stock,
    (SELECT COALESCE(SUM(total_weight_kg), 0) FROM stock_ledger) AS total_kg_in_stock,
    (SELECT COUNT(*) FROM sales WHERE bill_date = CURRENT_DATE AND status = 'completed') AS today_sales_count,
    (SELECT COALESCE(SUM(net_amount), 0) FROM sales WHERE bill_date = CURRENT_DATE AND status = 'completed') AS today_sales_amount,
    (SELECT COALESCE(SUM(paid_amount), 0) FROM sales WHERE bill_date = CURRENT_DATE AND status = 'completed') AS today_cash_collected;
