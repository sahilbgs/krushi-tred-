-- ==============================================================================
-- KRUSHI TRADE (SHREE NANDINI SEEDS) - DATA CLEANUP SCRIPT
-- Erases all transactions, sales, purchases, parties, vouchers, and users.
-- PRESERVES: Seed Varieties Master (બિયારણની જાતો - GJG-22, GJG-23, GG-20, GJ-39, GW-496)
-- RESETS: Stock Ledger counts to 0 for all existing varieties
-- ==============================================================================

TRUNCATE TABLE 
    sale_items,
    sales,
    purchase_items,
    purchases,
    party_transactions,
    rojmel,
    payments,
    parties,
    users
RESTART IDENTITY CASCADE;

-- Reset stock ledger counts to 0 while keeping variety records
UPDATE stock_ledger 
SET available_bags = 0,
    available_loose_kg = 0.00,
    last_purchase_rate = 0.00,
    updated_at = CURRENT_TIMESTAMP;

