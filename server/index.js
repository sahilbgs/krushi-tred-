import express from 'express';
import cors from 'cors';
import { pool } from './db.js';

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());

// 1. Health Check
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as db_time, current_database() as db_name');
    res.json({ status: 'ok', database: result.rows[0] });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 2. Initial Data Load for all connected clients
app.get('/api/initial-data', async (req, res) => {
  try {
    const [
      seedsRes, 
      partiesRes, 
      stockRes, 
      purchasesRes, 
      purchaseItemsRes, 
      salesRes, 
      saleItemsRes, 
      txRes, 
      rojmelRes
    ] = await Promise.all([
      pool.query(`SELECT id, variety_name AS "varietyName", crop_type AS "cropType", company, bag_weight_kg AS "bagWeightKg", default_purchase_rate_per_man AS "defaultPurchaseRatePerMan", default_sale_rate_per_man AS "defaultSaleRatePerMan", default_sale_rate_per_bag AS "defaultSaleRatePerBag", default_sale_rate_per_kg AS "defaultSaleRatePerKg", min_stock_alert_bags AS "minStockAlertBags" FROM seed_varieties WHERE is_active = true ORDER BY created_at ASC`),
      pool.query(`SELECT id, party_type AS "partyType", code, name, firm_name AS "firmName", mobile, village, taluka, opening_balance AS "openingBalance", balance_type AS "balanceType", current_balance AS "currentBalance", credit_limit AS "creditLimit" FROM parties WHERE is_active = true ORDER BY name ASC`),
      pool.query(`SELECT id, seed_id AS "seedId", variety_name AS "varietyName", bag_weight_kg AS "bagWeightKg", available_bags AS "availableBags", available_loose_kg AS "availableLooseKg", total_weight_kg AS "totalWeightKg", total_man AS "totalMan", last_purchase_rate AS "lastPurchaseRate" FROM stock_ledger ORDER BY variety_name ASC`),
      pool.query(`SELECT id, bill_no AS "billNo", TO_CHAR(purchase_date, 'YYYY-MM-DD') AS "purchaseDate", purchase_type AS "purchaseType", party_id AS "partyId", party_name AS "partyName", firm_name AS "firmName", village, mobile, truck_no AS "truckNo", items_sub_total AS "itemsSubTotal", majuri_amount AS "majuriAmount", market_commission AS "marketCommission", firm_commission AS "firmCommission", total_expenses AS "totalExpenses", net_total AS "netTotal", paid_amount AS "paidAmount", due_amount AS "dueAmount", payment_mode AS "paymentMode", remarks, created_by AS "createdBy", created_at AS "createdAt" FROM purchases ORDER BY purchase_date DESC, created_at DESC LIMIT 100`),
      pool.query(`SELECT id, purchase_id AS "purchaseId", seed_id AS "seedId", variety_name AS "varietyName", bag_weight_kg AS "bagWeightKg", bags, last_bag_kg AS "lastBagKg", net_weight_kg AS "netWeightKg", total_man AS "totalMan", rate_per_man AS "ratePerMan", rate_per_kg AS "ratePerKg", item_total AS "itemTotal" FROM purchase_items`),
      pool.query(`SELECT id, bill_no AS "billNo", TO_CHAR(bill_date, 'YYYY-MM-DD') AS "billDate", party_id AS "partyId", farmer_name AS "farmerName", farmer_mobile AS "farmerMobile", farmer_village AS "farmerVillage", sub_total AS "subTotal", majuri_amount AS "majuriAmount", discount, net_amount AS "netAmount", paid_amount AS "paidAmount", due_amount AS "dueAmount", payment_mode AS "paymentMode", remarks, created_by AS "createdBy", created_at AS "createdAt" FROM sales ORDER BY bill_date DESC, created_at DESC LIMIT 100`),
      pool.query(`SELECT id, sale_id AS "saleId", seed_id AS "seedId", variety_name AS "varietyName", bag_weight_kg AS "bagWeightKg", bags, loose_kg AS "looseKg", total_weight_kg AS "totalWeightKg", total_man AS "totalMan", rate_unit AS "rateUnit", rate, item_total AS "itemTotal" FROM sale_items`),
      pool.query(`SELECT id, TO_CHAR(date, 'YYYY-MM-DD') AS date, time, party_id AS "partyId", party_name AS "partyName", party_type AS "partyType", voucher_no AS "voucherNo", voucher_type AS "voucherType", particulars, variety_name AS "varietyName", bags, weight_kg AS "weightKg", total_man AS "totalMan", rate_per_man AS "ratePerMan", debit, credit, running_balance AS "runningBalance", payment_mode AS "paymentMode", remarks, bill_id AS "billId" FROM party_transactions ORDER BY date DESC, created_at DESC LIMIT 200`),
      pool.query(`SELECT id, TO_CHAR(date, 'YYYY-MM-DD') AS date, time, voucher_no AS "voucherNo", voucher_type AS "voucherType", party_name AS "partyName", particulars, variety_name AS "varietyName", bags, weight_kg AS "weightKg", total_man AS "totalMan", account, debit, credit, payment_mode AS "paymentMode", remarks FROM rojmel ORDER BY date DESC, created_at DESC LIMIT 200`)
    ]);

    const purchasesWithItems = purchasesRes.rows.map(p => ({
      ...p,
      items: purchaseItemsRes.rows.filter(it => it.purchaseId === p.id)
    }));

    const salesWithItems = salesRes.rows.map(s => ({
      ...s,
      items: saleItemsRes.rows.filter(it => it.saleId === s.id)
    }));

    res.json({
      success: true,
      data: {
        seeds: seedsRes.rows.map(s => ({
          ...s,
          bagWeightKg: parseFloat(s.bagWeightKg),
          defaultPurchaseRatePerMan: parseFloat(s.defaultPurchaseRatePerMan),
          defaultSaleRatePerMan: parseFloat(s.defaultSaleRatePerMan),
          defaultSaleRatePerBag: parseFloat(s.defaultSaleRatePerBag),
          defaultSaleRatePerKg: parseFloat(s.defaultSaleRatePerKg),
          minStockAlertBags: parseInt(s.minStockAlertBags)
        })),
        parties: partiesRes.rows.map(p => ({
          ...p,
          openingBalance: parseFloat(p.openingBalance || 0),
          currentBalance: parseFloat(p.currentBalance || 0),
          creditLimit: parseFloat(p.creditLimit || 50000)
        })),
        stock: stockRes.rows.map(st => ({
          ...st,
          bagWeightKg: parseFloat(st.bagWeightKg || 35),
          availableBags: parseInt(st.availableBags || 0),
          availableLooseKg: parseFloat(st.availableLooseKg || 0),
          totalWeightKg: parseFloat(st.totalWeightKg || 0),
          totalMan: parseFloat(st.totalMan || 0),
          lastPurchaseRate: parseFloat(st.lastPurchaseRate || 0)
        })),
        purchases: purchasesWithItems,
        sales: salesWithItems,
        partyTransactions: txRes.rows.map(tx => ({
          ...tx,
          bags: parseInt(tx.bags || 0),
          weightKg: parseFloat(tx.weightKg || 0),
          totalMan: parseFloat(tx.totalMan || 0),
          ratePerMan: parseFloat(tx.ratePerMan || 0),
          debit: parseFloat(tx.debit || 0),
          credit: parseFloat(tx.credit || 0),
          runningBalance: parseFloat(tx.runningBalance || 0)
        })),
        rojmel: rojmelRes.rows.map(r => ({
          ...r,
          bags: parseInt(r.bags || 0),
          weightKg: parseFloat(r.weightKg || 0),
          totalMan: parseFloat(r.totalMan || 0),
          debit: parseFloat(r.debit || 0),
          credit: parseFloat(r.credit || 0)
        }))
      }
    });
  } catch (err) {
    console.error('Error fetching initial data from PostgreSQL:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Parties (ખેડૂતો અને પેઢી/વેપારીઓ)
app.post('/api/parties', async (req, res) => {
  const p = req.body;
  const id = p.id || 'party_' + Date.now();
  let partyType = p.partyType === 'supplier' ? 'firm' : (p.partyType || 'farmer');
  if (!['farmer', 'firm', 'trader', 'transporter'].includes(partyType)) {
    partyType = 'farmer';
  }
  const code = p.code || (partyType === 'farmer' ? `FAR-${Date.now().toString().slice(-4)}` : `FIRM-${Date.now().toString().slice(-4)}`);
  const openingBal = parseFloat(p.openingBalance || 0);

  try {
    const result = await pool.query(
      `INSERT INTO parties (id, party_type, code, name, firm_name, mobile, village, taluka, opening_balance, balance_type, current_balance, credit_limit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         firm_name = EXCLUDED.firm_name,
         mobile = EXCLUDED.mobile,
         village = EXCLUDED.village,
         taluka = EXCLUDED.taluka,
         current_balance = EXCLUDED.current_balance
       RETURNING id, party_type AS "partyType", code, name, firm_name AS "firmName", mobile, village, taluka, opening_balance AS "openingBalance", balance_type AS "balanceType", current_balance AS "currentBalance", credit_limit AS "creditLimit"`,
      [
        id, 
        partyType, 
        code, 
        p.name || p.companyName || 'ખાતેદાર', 
        p.firmName || p.companyName || '', 
        p.mobile || '', 
        p.village || p.city || '', 
        p.taluka || '', 
        openingBal, 
        p.balanceType || 'dr', 
        openingBal, 
        parseFloat(p.creditLimit || 50000)
      ]
    );
    res.json({ success: true, party: result.rows[0] });
  } catch (err) {
    console.error('Error creating party in PostgreSQL:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Seeds Variety (બીજ જાત)
app.post('/api/seeds', async (req, res) => {
  const s = req.body;
  const id = s.id || 'seed_' + Date.now();
  const varietyName = (s.varietyName || '').replace(/\s*\(.*?\)\s*/g, '').trim();
  const buyRate = parseFloat(s.defaultPurchaseRatePerMan || 2400);
  const saleRate = parseFloat(s.defaultSaleRatePerMan || 2800);
  const bagWeight = parseFloat(s.bagWeightKg || 35);
  const minStock = parseInt(s.minStockAlertBags || 10);

  try {
    const result = await pool.query(
      `INSERT INTO seed_varieties (id, variety_name, crop_type, company, bag_weight_kg, default_purchase_rate_per_man, default_sale_rate_per_man, min_stock_alert_bags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (variety_name) DO UPDATE SET
         default_purchase_rate_per_man = EXCLUDED.default_purchase_rate_per_man,
         default_sale_rate_per_man = EXCLUDED.default_sale_rate_per_man
       RETURNING id, variety_name AS "varietyName", crop_type AS "cropType", company, bag_weight_kg AS "bagWeightKg", default_purchase_rate_per_man AS "defaultPurchaseRatePerMan", default_sale_rate_per_man AS "defaultSaleRatePerMan", default_sale_rate_per_bag AS "defaultSaleRatePerBag", default_sale_rate_per_kg AS "defaultSaleRatePerKg", min_stock_alert_bags AS "minStockAlertBags"`,
      [id, varietyName, s.cropType || 'મગફળી', s.company || 'SHREE NANDINI SEEDS', bagWeight, buyRate, saleRate, minStock]
    );

    await pool.query(
      `INSERT INTO stock_ledger (id, seed_id, variety_name, batch_no, bag_weight_kg, available_bags, available_loose_kg, last_purchase_rate)
       VALUES ($1, $2, $3, 'MAIN', $4, 0, 0, $5)
       ON CONFLICT (seed_id, batch_no) DO NOTHING`,
      ['stock_' + Date.now(), result.rows[0].id, varietyName, bagWeight, buyRate]
    );

    res.json({ success: true, seed: result.rows[0] });
  } catch (err) {
    console.error('Error creating seed in PostgreSQL:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Purchases (ખરીદી વાઉચર)
app.post('/api/purchases', async (req, res) => {
  const purchaseData = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const timestamp = new Date();
    const purchaseId = purchaseData.id || ('pur_' + Date.now());
    const billNumber = purchaseData.billNo || `SN-PUR-${timestamp.getFullYear()}-${Date.now().toString().slice(-4)}`;
    const isFarmer = purchaseData.purchaseType === 'farmer';

    // 1. Ensure Party exists in parties table
    let finalPartyId = purchaseData.partyId || null;
    if (finalPartyId) {
      const checkParty = await client.query('SELECT id FROM parties WHERE id = $1', [finalPartyId]);
      if (checkParty.rows.length === 0) {
        await client.query(
          `INSERT INTO parties (id, party_type, code, name, mobile, village, opening_balance, balance_type, current_balance, credit_limit)
           VALUES ($1, $2, $3, $4, $5, $6, 0, 'dr', 0, 50000)
           ON CONFLICT (id) DO NOTHING`,
          [
            finalPartyId,
            isFarmer ? 'farmer' : 'firm',
            `P-${Date.now().toString().slice(-4)}`,
            purchaseData.partyName || 'ખાતેદાર',
            purchaseData.mobile || null,
            purchaseData.village || null
          ]
        );
      }
    } else if (purchaseData.partyName && purchaseData.partyName.trim()) {
      finalPartyId = 'party_' + Date.now();
      await client.query(
        `INSERT INTO parties (id, party_type, code, name, mobile, village, opening_balance, balance_type, current_balance, credit_limit)
         VALUES ($1, $2, $3, $4, $5, $6, 0, 'dr', 0, 50000)`,
        [
          finalPartyId,
          isFarmer ? 'farmer' : 'firm',
          `P-${Date.now().toString().slice(-4)}`,
          purchaseData.partyName.trim(),
          purchaseData.mobile || null,
          purchaseData.village || null
        ]
      );
    }

    // 2. Normalize payment mode to lowercase valid enum
    const rawMode = (purchaseData.paymentMode || 'credit').toString().toLowerCase().trim();
    const normalizedMode = ['cash', 'bank', 'upi', 'credit', 'cheque'].includes(rawMode) ? rawMode : 'credit';

    // 3. Insert Purchase
    await client.query(
      `INSERT INTO purchases (
        id, purchase_type, bill_no, purchase_date, party_id, party_name,
        firm_id, firm_name, trader_id, trader_name, village, mobile, truck_no, truck_owner,
        items_sub_total, majuri_rate_per_bag, majuri_amount, market_commission,
        firm_commission, bardan_expense, total_expenses, net_total, paid_amount,
        due_amount, payment_mode, remarks, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
      ON CONFLICT (bill_no) DO NOTHING`,
      [
        purchaseId,
        isFarmer ? 'farmer' : 'market',
        billNumber,
        purchaseData.purchaseDate || timestamp.toISOString().split('T')[0],
        finalPartyId,
        purchaseData.partyName || 'પરચુરણ',
        purchaseData.firmId || null,
        purchaseData.firmName || null,
        purchaseData.traderId || null,
        purchaseData.traderName || null,
        purchaseData.village || null,
        purchaseData.mobile || null,
        purchaseData.truckNo || null,
        purchaseData.truckOwner || null,
        parseFloat(purchaseData.itemsSubTotal || 0),
        parseFloat(purchaseData.majuriRatePerBag || 0),
        parseFloat(purchaseData.majuriAmount || 0),
        parseFloat(purchaseData.marketCommission || 0),
        parseFloat(purchaseData.firmCommission || 0),
        parseFloat(purchaseData.bardanExpense || 0),
        parseFloat(purchaseData.totalExpenses || 0),
        parseFloat(purchaseData.netTotal || 0),
        parseFloat(purchaseData.paidAmount || 0),
        parseFloat(purchaseData.dueAmount || 0),
        normalizedMode,
        purchaseData.remarks || null,
        purchaseData.createdBy || 'સ્ટાફ'
      ]
    );

    // 4. Insert Purchase Items & Update Stock Ledger
    if (Array.isArray(purchaseData.items)) {
      for (const item of purchaseData.items) {
        const itemId = item.id || ('pitm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4));
        const bagWeight = parseFloat(item.bagWeightKg || 35);
        const bags = parseInt(item.bags || 0);
        const netKg = parseFloat(item.netWeightKg || 0);
        const man = parseFloat(item.totalMan || (netKg / 20));
        const ratePerMan = parseFloat(item.ratePerMan || item.rate || 0);
        const total = parseFloat(item.itemTotal || 0);
        const lastBagKg = Math.min(bagWeight, Math.max(0, parseFloat(item.lastBagKg !== undefined ? item.lastBagKg : bagWeight)));

        await client.query(
          `INSERT INTO purchase_items (
            id, purchase_id, seed_id, variety_name, bag_weight_kg, bags, last_bag_kg, net_weight_kg, total_man, rate_per_man, rate_per_kg, item_total
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            itemId,
            purchaseId,
            item.seedId || null,
            item.varietyName,
            bagWeight,
            bags,
            lastBagKg,
            netKg,
            man,
            ratePerMan,
            parseFloat(item.ratePerKg || (ratePerMan / 20)),
            total
          ]
        );

        // Update Stock Ledger
        await client.query(
          `INSERT INTO stock_ledger (id, seed_id, variety_name, batch_no, bag_weight_kg, available_bags, available_loose_kg, last_purchase_rate)
           VALUES ($1, $2, $3, 'MAIN', $4, $5, $6, $7)
           ON CONFLICT (seed_id, batch_no) DO UPDATE SET
             available_bags = stock_ledger.available_bags + EXCLUDED.available_bags,
             available_loose_kg = stock_ledger.available_loose_kg + EXCLUDED.available_loose_kg,
             last_purchase_rate = EXCLUDED.last_purchase_rate`,
          [
            'stock_' + Date.now(),
            item.seedId || 'seed_1',
            item.varietyName,
            bagWeight,
            bags,
            Math.max(0, netKg - (bags * bagWeight)),
            ratePerMan
          ]
        );
      }
    }

    // 3. Update Party Balance
    const dueAmount = parseFloat(purchaseData.dueAmount || 0);
    if (purchaseData.partyId && dueAmount > 0) {
      await client.query(
        `UPDATE parties SET current_balance = current_balance + $1 WHERE id = $2`,
        [dueAmount, purchaseData.partyId]
      );
    }

    // 4. Insert Party Ledger Transaction
    if (purchaseData.partyId) {
      const totalBags = purchaseData.items?.reduce((s, it) => s + parseInt(it.bags || 0), 0) || 0;
      const totalKg = purchaseData.items?.reduce((s, it) => s + parseFloat(it.netWeightKg || 0), 0) || 0;
      const totalMan = purchaseData.items?.reduce((s, it) => s + parseFloat(it.totalMan || (totalKg / 20)), 0) || 0;
      const ratePerMan = purchaseData.items?.[0]?.ratePerMan || purchaseData.items?.[0]?.rate || 0;

      await client.query(
        `INSERT INTO party_transactions (
          id, date, time, party_id, party_name, party_type, voucher_no, voucher_type, particulars, variety_name, bags, weight_kg, total_man, rate_per_man, debit, credit, running_balance, payment_mode, bill_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
        [
          'tx_' + Date.now(),
          purchaseData.purchaseDate || timestamp.toISOString().split('T')[0],
          timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          purchaseData.partyId,
          purchaseData.partyName,
          isFarmer ? 'farmer' : 'firm',
          billNumber,
          'purchase',
          `${isFarmer ? 'ખેડૂત ખરીદી' : 'પેઢી ખરીદી'} (${purchaseData.items?.map(it => it.varietyName).join(', ')})`,
          purchaseData.items?.map(it => it.varietyName).join(', '),
          totalBags,
          totalKg,
          totalMan,
          ratePerMan,
          0,
          parseFloat(purchaseData.netTotal || 0),
          dueAmount,
          purchaseData.paymentMode || 'credit',
          purchaseId
        ]
      );
    }

    // 5. Insert Daily Rojmel
    const purBags = purchaseData.items?.reduce((s, it) => s + parseInt(it.bags || 0), 0) || 0;
    const purKg = purchaseData.items?.reduce((s, it) => s + parseFloat(it.netWeightKg || 0), 0) || 0;
    const purMan = purchaseData.items?.reduce((s, it) => s + parseFloat(it.totalMan || (purKg / 20)), 0) || 0;
    const purNetTotal = parseFloat(purchaseData.netTotal || 0);
    const purPaid = parseFloat(purchaseData.paidAmount || 0);

    await client.query(
      `INSERT INTO rojmel (
        id, date, time, voucher_no, voucher_type, party_name, particulars, variety_name, bags, weight_kg, total_man, account, debit, credit, payment_mode
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        'roj_' + Date.now(),
        purchaseData.purchaseDate || timestamp.toISOString().split('T')[0],
        timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        billNumber,
        'purchase',
        purchaseData.partyName,
        `ખરીદી: ${purchaseData.items?.map(it => it.varietyName).join(', ')}`,
        purchaseData.items?.map(it => it.varietyName).join(', '),
        purBags,
        purKg,
        purMan,
        'purchase',
        purPaid > 0 ? purPaid : 0,
        purPaid > 0 ? 0 : purNetTotal,
        normalizedMode
      ]
    );

    await client.query('COMMIT');
    res.json({ success: true, billNo: billNumber, purchaseId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error saving purchase in PostgreSQL:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// 6. Sales & Billing (વેચાણ બિલ)
app.post('/api/sales', async (req, res) => {
  const saleData = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const timestamp = new Date();
    const saleId = saleData.id || ('sale_' + Date.now());
    const billNumber = saleData.billNo || `SN-SALE-${timestamp.getFullYear()}-${Date.now().toString().slice(-4)}`;

    // 1. Ensure Party exists in parties table
    let finalSalePartyId = saleData.farmerId || saleData.partyId || null;
    if (finalSalePartyId) {
      const checkParty = await client.query('SELECT id FROM parties WHERE id = $1', [finalSalePartyId]);
      if (checkParty.rows.length === 0) {
        await client.query(
          `INSERT INTO parties (id, party_type, code, name, mobile, village, opening_balance, balance_type, current_balance, credit_limit)
           VALUES ($1, 'farmer', $2, $3, $4, $5, 0, 'dr', 0, 50000)
           ON CONFLICT (id) DO NOTHING`,
          [
            finalSalePartyId,
            `KH-${Date.now().toString().slice(-4)}`,
            saleData.farmerName || 'ખેડૂત ગ્રાહક',
            saleData.farmerMobile || '',
            saleData.farmerVillage || ''
          ]
        );
      }
    }

    const rawSaleMode = (saleData.paymentMode || 'cash').toString().toLowerCase().trim();
    const normalizedSaleMode = ['cash', 'bank', 'upi', 'credit', 'cheque', 'cash_and_credit'].includes(rawSaleMode) ? rawSaleMode : 'cash';

    // 2. Insert Sale
    await client.query(
      `INSERT INTO sales (
        id, bill_no, bill_date, party_id, farmer_name, farmer_mobile, farmer_village,
        sub_total, majuri_amount, discount, net_amount, paid_amount, due_amount, payment_mode, remarks, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (bill_no) DO NOTHING`,
      [
        saleId,
        billNumber,
        saleData.billDate || timestamp.toISOString().split('T')[0],
        finalSalePartyId,
        saleData.farmerName || 'ખેડૂત ગ્રાહક',
        saleData.farmerMobile || '',
        saleData.farmerVillage || '',
        parseFloat(saleData.subTotal || 0),
        parseFloat(saleData.majuriAmount || 0),
        parseFloat(saleData.discount || 0),
        parseFloat(saleData.netAmount || 0),
        parseFloat(saleData.paidAmount || 0),
        parseFloat(saleData.dueAmount || 0),
        normalizedSaleMode,
        saleData.remarks || '',
        saleData.createdBy || 'સ્ટાફ'
      ]
    );

    // 3. Insert Sale Items & Deduct Stock
    if (Array.isArray(saleData.items)) {
      for (const item of saleData.items) {
        const itemId = item.id || ('sitm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4));
        const bagWeight = parseFloat(item.bagWeightKg || 35);
        const bags = parseInt(item.bags || 0);
        const looseKg = parseFloat(item.looseKg || 0);
        const totalWeight = parseFloat(item.totalWeightKg || (bags * bagWeight + looseKg));
        const totalMan = parseFloat(item.totalMan || (totalWeight / 20));
        const rate = parseFloat(item.rate || 0);
        const itemTotal = parseFloat(item.itemTotal || 0);

        await client.query(
          `INSERT INTO sale_items (
            id, sale_id, seed_id, variety_name, bag_weight_kg, bags, loose_kg, total_weight_kg, total_man, rate_unit, rate, item_total
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            itemId,
            saleId,
            item.seedId || null,
            item.varietyName,
            bagWeight,
            bags,
            looseKg,
            totalWeight,
            totalMan,
            item.rateUnit || 'man',
            rate,
            itemTotal
          ]
        );

        // Deduct Stock
        if (item.seedId) {
          await client.query(
            `UPDATE stock_ledger
             SET available_bags = GREATEST(0, available_bags - $1),
                 available_loose_kg = GREATEST(0, available_loose_kg - $2)
             WHERE seed_id = $3`,
            [bags, looseKg, item.seedId]
          );
        }
      }
    }

    // 3. Update Party Balance
    const dueAmount = parseFloat(saleData.dueAmount || 0);
    const partyId = saleData.farmerId || saleData.partyId;
    if (partyId && dueAmount > 0) {
      await client.query(
        `UPDATE parties SET current_balance = current_balance + $1 WHERE id = $2`,
        [dueAmount, partyId]
      );
    }

    // 4. Insert Party Ledger Transaction
    if (partyId) {
      const saleBags = saleData.items?.reduce((s, it) => s + parseInt(it.bags || 0), 0) || 0;
      const saleKg = saleData.items?.reduce((s, it) => s + parseFloat(it.totalWeightKg || 0), 0) || 0;
      const saleMan = saleData.items?.reduce((s, it) => s + parseFloat(it.totalMan || (saleKg / 20)), 0) || 0;
      const saleRate = saleData.items?.[0]?.rate || 0;

      await client.query(
        `INSERT INTO party_transactions (
          id, date, time, party_id, party_name, party_type, voucher_no, voucher_type, particulars, variety_name, bags, weight_kg, total_man, rate_per_man, debit, credit, running_balance, payment_mode, bill_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
        [
          'tx_' + Date.now(),
          saleData.billDate || timestamp.toISOString().split('T')[0],
          timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          partyId,
          saleData.farmerName,
          'farmer',
          billNumber,
          'sale',
          `બિયારણ વેચાણ બિલ (${saleData.items?.map(it => it.varietyName).join(', ')})`,
          saleData.items?.map(it => it.varietyName).join(', '),
          saleBags,
          saleKg,
          saleMan,
          saleRate,
          parseFloat(saleData.netAmount || 0),
          parseFloat(saleData.paidAmount || 0),
          dueAmount,
          saleData.paymentMode || 'cash',
          saleId
        ]
      );
    }

    // 5. Insert Daily Rojmel
    const rojBags = saleData.items?.reduce((s, it) => s + parseInt(it.bags || 0), 0) || 0;
    const rojKg = saleData.items?.reduce((s, it) => s + parseFloat(it.totalWeightKg || 0), 0) || 0;
    const rojMan = saleData.items?.reduce((s, it) => s + parseFloat(it.totalMan || (rojKg / 20)), 0) || 0;
    const saleNetTotal = parseFloat(saleData.netAmount || 0);
    const salePaidAmount = parseFloat(saleData.paidAmount || 0);

    await client.query(
      `INSERT INTO rojmel (
        id, date, time, voucher_no, voucher_type, party_name, particulars, variety_name, bags, weight_kg, total_man, account, debit, credit, payment_mode
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        'roj_' + Date.now(),
        saleData.billDate || timestamp.toISOString().split('T')[0],
        timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        billNumber,
        'sale',
        saleData.farmerName,
        `વેચાણ: ${saleData.items?.map(it => it.varietyName).join(', ')}`,
        saleData.items?.map(it => it.varietyName).join(', '),
        rojBags,
        rojKg,
        rojMan,
        'sale',
        0,
        salePaidAmount > 0 ? salePaidAmount : saleNetTotal,
        normalizedSaleMode
      ]
    );

    await client.query('COMMIT');
    res.json({ success: true, billNo: billNumber, saleId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error saving sale in PostgreSQL:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// 7. Vouchers (જમા & ઉધાર)
app.post('/api/vouchers', async (req, res) => {
  const v = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const timestamp = new Date();
    const vId = v.id || ('vch_' + Date.now());
    const amount = parseFloat(v.amount || 0);
    const prefix = v.type === 'receipt' ? 'REC' : 'PAY';
    const voucherNumber = v.voucherNo || `${prefix}-${Date.now().toString().slice(-6)}`;
    const isReceipt = v.type === 'receipt';
    const rawVMode = (v.paymentMode || 'cash').toString().toLowerCase().trim();
    const normalizedVMode = ['cash', 'bank', 'upi', 'cheque', 'credit'].includes(rawVMode) ? rawVMode : 'cash';

    // 1. Insert into payments
    await client.query(
      `INSERT INTO payments (
        id, receipt_no, date, party_id, party_name, party_type, type, amount, payment_mode, reference_no, remarks, recorded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (receipt_no) DO NOTHING`,
      [
        vId,
        voucherNumber,
        v.date || timestamp.toISOString().split('T')[0],
        v.partyId || null,
        v.partyName || 'ખાતેદાર',
        v.partyType || 'farmer',
        v.type || 'receipt',
        amount,
        normalizedVMode,
        v.referenceNo || null,
        v.remarks || (isReceipt ? 'રોકડ/બેંક રકમ જમા થઈ' : 'રકમ ચૂકવણી કરવામાં આવી'),
        v.recordedBy || 'સ્ટાફ'
      ]
    );

    // 2. Update Party Balance
    if (v.partyId) {
      const isFarmer = v.partyType === 'farmer';
      let balanceDiff = 0;
      if (isReceipt) {
        balanceDiff = -amount;
      } else {
        balanceDiff = isFarmer ? amount : -amount;
      }

      await client.query(
        `UPDATE parties SET current_balance = current_balance + $1 WHERE id = $2`,
        [balanceDiff, v.partyId]
      );
    }

    // 3. Insert Party Ledger Transaction
    if (v.partyId) {
      await client.query(
        `INSERT INTO party_transactions (
          id, date, time, party_id, party_name, party_type, voucher_no, voucher_type, particulars, debit, credit, running_balance, payment_mode, remarks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          'tx_' + Date.now(),
          v.date || timestamp.toISOString().split('T')[0],
          timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          v.partyId,
          v.partyName,
          v.partyType || 'farmer',
          voucherNumber,
          v.type || 'receipt',
          v.remarks || (isReceipt ? 'રોકડ/બેંક રકમ જમા થઈ' : 'રકમ ચૂકવણી કરવામાં આવી'),
          isReceipt ? 0 : amount,
          isReceipt ? amount : 0,
          0,
          v.paymentMode || 'cash',
          v.remarks || ''
        ]
      );
    }

    // 4. Insert Daily Rojmel
    await client.query(
      `INSERT INTO rojmel (
        id, date, time, voucher_no, voucher_type, party_name, particulars, account, debit, credit, payment_mode, remarks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        'roj_' + Date.now(),
        v.date || timestamp.toISOString().split('T')[0],
        timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        voucherNumber,
        v.type || 'receipt',
        v.partyName || 'ખાતેદાર',
        v.remarks || `${isReceipt ? 'જમા' : 'ઉધાર'} એન્ટ્રી`,
        v.paymentMode === 'cash' ? 'cash' : 'bank',
        isReceipt ? 0 : amount,
        isReceipt ? amount : 0,
        v.paymentMode || 'cash',
        v.remarks || ''
      ]
    );

    await client.query('COMMIT');
    res.json({ success: true, voucherNo: voucherNumber, id: vId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error saving voucher in PostgreSQL:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// 8. Delete Voucher
app.delete('/api/vouchers/:voucherNo', async (req, res) => {
  const { voucherNo } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Find transaction to reverse balance
    const txRes = await client.query(
      `SELECT party_id, party_type, voucher_type, debit, credit FROM party_transactions WHERE voucher_no = $1 LIMIT 1`,
      [voucherNo]
    );

    if (txRes.rows.length > 0) {
      const tx = txRes.rows[0];
      const amount = parseFloat(tx.credit || tx.debit || 0);
      const isReceipt = tx.voucher_type === 'receipt';
      const isFarmer = tx.party_type === 'farmer';

      let balanceDiff = 0;
      if (isReceipt) {
        balanceDiff = amount;
      } else {
        balanceDiff = isFarmer ? -amount : amount;
      }

      if (tx.party_id) {
        await client.query(
          `UPDATE parties SET current_balance = current_balance + $1 WHERE id = $2`,
          [balanceDiff, tx.party_id]
        );
      }
    }

    // 2. Delete from tables
    await client.query(`DELETE FROM payments WHERE receipt_no = $1`, [voucherNo]);
    await client.query(`DELETE FROM party_transactions WHERE voucher_no = $1`, [voucherNo]);
    await client.query(`DELETE FROM rojmel WHERE voucher_no = $1`, [voucherNo]);

    await client.query('COMMIT');
    res.json({ success: true, message: `Voucher ${voucherNo} deleted successfully` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting voucher from PostgreSQL:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// 9. Stock Adjustment
app.post('/api/stock/adjust', async (req, res) => {
  const { stockId, bagDiff, kgDiff, reason } = req.body;
  try {
    const result = await pool.query(
      `UPDATE stock_ledger
       SET available_bags = GREATEST(0, available_bags + $1),
           available_loose_kg = GREATEST(0, available_loose_kg + $2)
       WHERE id = $3
       RETURNING *`,
      [parseInt(bagDiff || 0), parseFloat(kgDiff || 0), stockId]
    );
    res.json({ success: true, stock: result.rows[0] });
  } catch (err) {
    console.error('Error adjusting stock in PostgreSQL:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Krushi Trade PostgreSQL API running dynamically on port ${PORT}`);
});
