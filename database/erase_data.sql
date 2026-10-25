-- Script to truncate all data from krushi_trade database while preserving schema
TRUNCATE TABLE 
    sale_items,
    sales,
    purchase_items,
    purchases,
    party_transactions,
    rojmel,
    payments,
    stock_ledger,
    seed_varieties,
    parties,
    users
RESTART IDENTITY CASCADE;
