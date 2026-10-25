-- ==============================================================================
-- કૃષિ ટ્રેડ (SHREE NANDINI SEEDS) - PostgreSQL Seed Initial Data
-- ==============================================================================

-- 1. USERS & STAFF
INSERT INTO users (id, email, password_hash, display_name, mobile, role, permissions, is_active)
VALUES 
('usr_admin_1', 'admin@nandiniseeds.com', crypt('Admin@123', gen_salt('bf')), 'Ravi Chaudhary', '9825000001', 'admin', 
 '{"farmerMaster": true, "supplierMaster": true, "seedMaster": true, "purchaseEntry": true, "salesBilling": true, "stockManagement": true, "payments": true, "reports": true, "viewRates": true}'::jsonb, true),
('usr_staff_1', 'staff1@nandiniseeds.com', crypt('Staff@123', gen_salt('bf')), 'Bhargav Chaudhary', '9825000002', 'sub_user',
 '{"farmerMaster": true, "supplierMaster": false, "seedMaster": true, "purchaseEntry": true, "salesBilling": true, "stockManagement": true, "payments": true, "reports": false, "viewRates": false}'::jsonb, true)
ON CONFLICT (id) DO NOTHING;

-- 2. SEED VARIETIES (35 KG Standard Bag • ₹/Man Rates)
INSERT INTO seed_varieties (id, variety_name, crop_type, company, bag_weight_kg, hsn_code, default_purchase_rate_per_man, default_sale_rate_per_man, min_stock_alert_bags, is_active)
VALUES
('seed_1', 'GJG-22', 'મગફળી (Groundnut)', 'જૂનાગઢ કૃષિ યુનિવર્સિટી', 35.00, '1209', 2400.00, 2800.00, 15, true),
('seed_2', 'GJG-23', 'મગફળી (Groundnut)', 'સરદાર કૃષિ નગર', 35.00, '1209', 2450.00, 2900.00, 12, true),
('seed_3', 'GG-20', 'મગફળી (Groundnut)', 'જૂનાગઢ એગ્રીકલ્ચર', 35.00, '1209', 2350.00, 2750.00, 10, true),
('seed_4', 'GJ-39', 'જીરૂ (Cumin)', 'ગુજરાત સીડ્સ નિગમ', 35.00, '1209', 7600.00, 8400.00, 8, true),
('seed_5', 'GW-496', 'ઘઉં (Wheat)', 'મહાગુજરાત સીડ્સ', 35.00, '1209', 820.00, 960.00, 20, true)
ON CONFLICT (id) DO NOTHING;

-- 3. LIVE STOCK LEDGER
INSERT INTO stock_ledger (id, seed_id, variety_name, batch_no, bag_weight_kg, available_bags, available_loose_kg, last_purchase_rate)
VALUES
('stock_1', 'seed_1', 'GJG-22', 'MAIN', 35.00, 150, 20.00, 2400.00),
('stock_2', 'seed_2', 'GJG-23', 'MAIN', 35.00, 90, 15.00, 2450.00),
('stock_3', 'seed_3', 'GG-20', 'MAIN', 35.00, 110, 0.00, 2350.00),
('stock_4', 'seed_4', 'GJ-39', 'MAIN', 35.00, 30, 10.00, 7600.00),
('stock_5', 'seed_5', 'GW-496', 'MAIN', 35.00, 180, 0.00, 820.00)
ON CONFLICT (id) DO NOTHING;

-- 4. PARTIES MASTER
-- 4.1 Firms / Pethis
INSERT INTO parties (id, party_type, code, name, firm_name, mobile, village, taluka, opening_balance, balance_type, current_balance, credit_limit)
VALUES
('firm_1', 'firm', 'FIRM-01', 'શ્રી ગણેશ ટ્રેડિંગ કંપની', 'શ્રી ગણેશ ટ્રેડિંગ કંપની', '9426012345', 'રાજકોટ માર્કેટિંગ યાર્ડ', 'રાજકોટ', 85000.00, 'cr', 85000.00, 200000.00),
('firm_2', 'firm', 'FIRM-02', 'જય સરદાર એન્ટરપ્રાઇઝ', 'જય સરદાર એન્ટરપ્રાઇઝ', '9824054321', 'ગોંડલ માર્કેટ યાર્ડ', 'ગોંડલ', 42000.00, 'cr', 42000.00, 150000.00),
('firm_3', 'firm', 'FIRM-03', 'ઉમિયા એગ્રો એજન્સી', 'ઉમિયા એગ્રો એજન્સી', '9824411223', 'જૂનાગઢ માર્કેટ યાર્ડ', 'જૂનાગઢ', 25000.00, 'cr', 25000.00, 100000.00)
ON CONFLICT (id) DO NOTHING;

-- 4.2 Traders (Linked to Firms)
INSERT INTO parties (id, party_type, code, name, firm_name, firm_id, mobile, village, taluka, opening_balance, balance_type, current_balance, credit_limit)
VALUES
('trader_1', 'trader', 'TRD-01', 'રાજુભાઈ પટેલ (દલાલ/વેપારી)', 'શ્રી ગણેશ ટ્રેડિંગ કંપની', 'firm_1', '9879011223', 'રાજકોટ', 'રાજકોટ', 0.00, 'dr', 0.00, 50000.00),
('trader_2', 'trader', 'TRD-02', 'દિનેશભાઈ આહીર', 'જય સરદાર એન્ટરપ્રાઇઝ', 'firm_2', '9825599887', 'ગોંડલ', 'ગોંડલ', 0.00, 'dr', 0.00, 50000.00)
ON CONFLICT (id) DO NOTHING;

-- 4.3 Farmers (ખેડૂતો)
INSERT INTO parties (id, party_type, code, name, firm_name, mobile, village, taluka, opening_balance, balance_type, current_balance, credit_limit)
VALUES
('party_f1', 'farmer', 'KH-001', 'મનસુખભાઈ કાનજીભાઈ પટેલ', '', '9825123456', 'વડાલ', 'જૂનાગઢ', 12500.00, 'dr', 12500.00, 50000.00),
('party_f2', 'farmer', 'KH-002', 'ભરતભાઈ અરજણભાઈ આહીર', '', '9712345678', 'ગોંડલ (ગુંદાળા)', 'ગોંડલ', 0.00, 'dr', 0.00, 40000.00),
('party_f3', 'farmer', 'KH-003', 'પ્રવીણભાઈ વાળા (ખેડૂત/ડીલર)', '', '9909012345', 'ધારી', 'અમરેલી', 34000.00, 'dr', 34000.00, 100000.00),
('party_f4', 'farmer', 'KH-004', 'લાખાભાઈ રામજીભાઈ રબારી', '', '9824198765', 'વિસાવદર', 'વિસાવદર', 8500.00, 'dr', 8500.00, 30000.00),
('party_f5', 'farmer', 'KH-005', 'હરેશભાઈ પટેલ', '', '9427011223', 'શાપુર', 'વંથલી', 0.00, 'dr', 0.00, 25000.00)
ON CONFLICT (id) DO NOTHING;

-- 4.4 Transporters / Truck Owners
INSERT INTO parties (id, party_type, code, name, firm_name, mobile, village, taluka, opening_balance, balance_type, current_balance, credit_limit)
VALUES
('truck_1', 'transporter', 'TRK-01', 'જય ખોડિયાર ટ્રાન્સપોર્ટ (GJ-11-X-4589)', 'જય ખોડિયાર ટ્રાન્સપોર્ટ', '9898012345', 'જૂનાગઢ', 'જૂનાગઢ', 0.00, 'cr', 0.00, 50000.00)
ON CONFLICT (id) DO NOTHING;

-- 5. PURCHASES & INWARD
INSERT INTO purchases (id, purchase_type, bill_no, purchase_date, party_id, party_name, village, mobile, items_sub_total, majuri_rate_per_bag, majuri_amount, total_expenses, net_total, paid_amount, due_amount, payment_mode, remarks, created_by)
VALUES
('pur_001', 'farmer', 'SN-PUR-2026-0001', '2026-10-24', 'party_f1', 'મનસુખભાઈ કાનજીભાઈ પટેલ', 'વડાલ', '9825123456', 84000.00, 10.00, 200.00, 200.00, 84200.00, 50000.00, 34200.00, 'bank', 'સીધી ખેડૂત પાસેથી ખરીદી - બેંક ટ્રાન્સફર', 'Ravi Chaudhary'),
('pur_002', 'market', 'SN-PUR-2026-0002', '2026-10-25', 'firm_1', 'શ્રી ગણેશ ટ્રેડિંગ કંપની (રાજુભાઈ પટેલ)', 'રાજકોટ માર્કેટિંગ યાર્ડ', '9879011223', 128013.00, 12.00, 600.00, 3420.00, 131433.00, 100000.00, 31433.00, 'bank', 'માર્કેટ યાર્ડમાંથી ખરીદી', 'Ravi Chaudhary')
ON CONFLICT (id) DO NOTHING;

INSERT INTO purchase_items (id, purchase_id, seed_id, variety_name, bag_weight_kg, bags, last_bag_kg, net_weight_kg, total_man, rate_per_man, rate_per_kg, item_total)
VALUES
('pi_001', 'pur_001', 'seed_1', 'GJG-22', 35.00, 20, 35.00, 700.00, 35.00, 2400.00, 120.00, 84000.00),
('pi_002', 'pur_002', 'seed_2', 'GJG-23', 35.00, 30, 30.00, 1045.00, 52.25, 2450.00, 122.50, 128013.00)
ON CONFLICT (id) DO NOTHING;

-- 6. SALES BILLING
INSERT INTO sales (id, bill_no, bill_date, bill_type, party_id, farmer_name, farmer_mobile, farmer_village, sale_category, sub_total, majuri_amount, discount, net_amount, paid_amount, due_amount, payment_mode, status, remarks, created_by)
VALUES
('sale_001', 'SN-BILL-2026-00101', '2026-10-25', 'simple_bill', 'party_f1', 'મનસુખભાઈ કાનજીભાઈ પટેલ', '9825123456', 'વડાલ', 'retail', 11200.00, 50.00, 250.00, 11000.00, 6000.00, 5000.00, 'cash_and_credit', 'completed', 'રોકડ વેચાણ + બાકી ઉધાર', 'Bhargav Chaudhary')
ON CONFLICT (id) DO NOTHING;

INSERT INTO sale_items (id, sale_id, seed_id, variety_name, bag_weight_kg, bags, loose_kg, total_weight_kg, total_man, rate_unit, rate, item_total)
VALUES
('si_001', 'sale_001', 'seed_1', 'GJG-22', 35.00, 2, 10.00, 80.00, 4.00, 'man', 2800.00, 11200.00)
ON CONFLICT (id) DO NOTHING;

-- 7. PARTY TRANSACTIONS (KHATA BOOK)
INSERT INTO party_transactions (id, date, time, party_id, party_name, party_type, voucher_no, voucher_type, particulars, variety_name, bags, weight_kg, total_man, rate_per_man, debit, credit, running_balance, payment_mode, remarks, bill_id)
VALUES
('tx_001', '2026-10-24', '10:30 AM', 'party_f1', 'મનસુખભાઈ કાનજીભાઈ પટેલ', 'farmer', 'SN-PUR-2026-0001', 'purchase', 'બિયારણ ખરીદી (ખેડૂત પાસેથી)', 'GJG-22', 20, 700.00, 35.00, 2400.00, 0.00, 84200.00, 84200.00, '—', '૨૦ બેગ ખરીદી', 'pur_001'),
('tx_002', '2026-10-24', '11:00 AM', 'party_f1', 'મનસુખભાઈ કાનજીભાઈ પટેલ', 'farmer', 'REC-PAY-001', 'payment', 'રોકડ/બેંક ચુકવણી ખરીદી પેટે', '—', 0, 0.00, 0.00, 0.00, 50000.00, 0.00, 34200.00, 'bank', 'HDFC Bank RTGS ટ્રાન્સફર', 'pur_001'),
('tx_003', '2026-10-25', '02:15 PM', 'party_f1', 'મનસુખભાઈ કાનજીભાઈ પટેલ', 'farmer', 'SN-BILL-2026-00101', 'sale', 'બિયારણ વેચાણ બિલ', 'GJG-22', 2, 80.00, 4.00, 2800.00, 11000.00, 0.00, 45200.00, 'credit', '૨ બેગ + ૧૦ કિલો છૂટક', 'sale_001'),
('tx_004', '2026-10-25', '02:20 PM', 'party_f1', 'મનસુખભાઈ કાનજીભાઈ પટેલ', 'farmer', 'REC-001', 'receipt', 'રોકડ રકમ વેચાણ સમયે જમા', '—', 0, 0.00, 0.00, 0.00, 0.00, 6000.00, 39200.00, 'cash', 'કાઉન્ટર પર રોકડા મળ્યા', 'sale_001')
ON CONFLICT (id) DO NOTHING;

-- 8. DAILY ROJMEL
INSERT INTO rojmel (id, date, time, voucher_no, voucher_type, party_name, particulars, variety_name, bags, weight_kg, total_man, account, debit, credit, payment_mode, remarks)
VALUES
('roj_001', '2026-10-24', '10:30 AM', 'SN-PUR-2026-0001', 'purchase', 'મનસુખભાઈ કાનજીભાઈ પટેલ', 'GJG-22 ખરીદી (૨૦ બેગ, ૭૦૦ KG)', 'GJG-22', 20, 700.00, 35.00, 'purchase', 0.00, 84200.00, 'credit', 'ખેડૂત ખરીદી બિલ'),
('roj_002', '2026-10-24', '11:00 AM', 'REC-PAY-001', 'payment', 'મનસુખભાઈ કાનજીભાઈ પટેલ', 'બેંક ટ્રાન્સફર ચૂકવણી', '—', 0, 0.00, 0.00, 'bank', 50000.00, 0.00, 'bank', 'HDFC Bank ટ્રાન્સફર'),
('roj_003', '2026-10-25', '02:15 PM', 'SN-BILL-2026-00101', 'sale', 'મનસુખભાઈ કાનજીભાઈ પટેલ', 'GJG-22 વેચાણ (૨ બેગ, ૮૦ KG)', 'GJG-22', 2, 80.00, 4.00, 'cash', 0.00, 6000.00, 'cash', 'રોકડ વેચાણ જમા')
ON CONFLICT (id) DO NOTHING;

-- 9. PAYMENTS / VOUCHERS
INSERT INTO payments (id, receipt_no, date, party_id, party_name, party_type, type, amount, payment_mode, reference_no, remarks, recorded_by)
VALUES
('pay_001', 'REC-PAY-001', '2026-10-24', 'party_f1', 'મનસુખભાઈ કાનજીભાઈ પટેલ', 'farmer', 'payment', 50000.00, 'bank', 'RTGS-HDFC-99120', 'ખરીદી ચુકવણી', 'Ravi Chaudhary'),
('pay_002', 'REC-001', '2026-10-25', 'party_f1', 'મનસુખભાઈ કાનજીભાઈ પટેલ', 'farmer', 'receipt', 6000.00, 'cash', 'CASH-CNTR-01', 'વેચાણ બિલ પેટે રોકડા મળ્યા', 'Bhargav Chaudhary')
ON CONFLICT (id) DO NOTHING;
