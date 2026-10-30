import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5005;

process.on('uncaughtException', (err) => {
  console.error('CRITICAL UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL UNHANDLED REJECTION:', reason);
});

app.use(cors());
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

// APK Download endpoint for Sub User Android App
app.get('/api/download/subuser-apk', (req, res) => {
  const apkPath = path.join(__dirname, 'public', 'krushi-trade-subuser.apk');
  res.download(apkPath, 'krushi-trade-subuser.apk', (err) => {
    if (err) {
      console.error('Error downloading APK:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'APK download failed' });
      }
    }
  });
});

// Centralized party balance calculation based on ledger transactions & opening balance
export async function recalculatePartyBalance(clientOrPool, partyId) {
  if (!partyId) return null;
  const partyRes = await clientOrPool.query(
    `SELECT id, opening_balance, COALESCE(opening_balance_type, balance_type, 'dr') AS opening_balance_type FROM parties WHERE id = $1`,
    [partyId]
  );
  if (partyRes.rows.length === 0) return null;
  const party = partyRes.rows[0];

  const openingAmount = parseFloat(party.opening_balance || 0);
  const openingDr = (party.opening_balance_type || 'dr').toLowerCase() === 'dr' ? openingAmount : 0;
  const openingCr = (party.opening_balance_type || 'dr').toLowerCase() === 'cr' ? openingAmount : 0;

  const txRes = await clientOrPool.query(
    `SELECT 
       COALESCE(SUM(debit), 0) AS total_debit,
       COALESCE(SUM(credit), 0) AS total_credit
     FROM party_transactions 
     WHERE party_id = $1`,
    [partyId]
  );

  const totalDebit = parseFloat(txRes.rows[0]?.total_debit || 0);
  const totalCredit = parseFloat(txRes.rows[0]?.total_credit || 0);

  // netDiff > 0 means DR (Receivable / ઉધાર - લેવાના)
  // netDiff < 0 means CR (Payable / જમા - આપવાના)
  const netDiff = (openingDr + totalDebit) - (openingCr + totalCredit);
  const currentBalance = Math.abs(netDiff);
  const balanceType = netDiff < 0 ? 'cr' : 'dr';

  await clientOrPool.query(
    `UPDATE parties 
     SET current_balance = $1, balance_type = $2 
     WHERE id = $3`,
    [currentBalance, balanceType, partyId]
  );

  return { partyId, totalDebit, totalCredit, netDiff, currentBalance, balanceType };
}

export async function recalculateAllParties() {
  const partiesRes = await pool.query('SELECT id FROM parties');
  for (const row of partiesRes.rows) {
    await recalculatePartyBalance(pool, row.id);
  }
  console.log(`✅ Recalculated balances for ${partiesRes.rows.length} parties.`);
}

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
      pool.query(`SELECT id, party_type AS "partyType", code, name, firm_name AS "firmName", mobile, village, taluka, opening_balance AS "openingBalance", COALESCE(opening_balance_type, balance_type, 'dr') AS "openingBalanceType", balance_type AS "balanceType", current_balance AS "currentBalance", credit_limit AS "creditLimit" FROM parties WHERE is_active = true ORDER BY name ASC`),
      pool.query(`SELECT id, seed_id AS "seedId", variety_name AS "varietyName", bag_weight_kg AS "bagWeightKg", available_bags AS "availableBags", available_loose_kg AS "availableLooseKg", total_weight_kg AS "totalWeightKg", total_man AS "totalMan", last_purchase_rate AS "lastPurchaseRate" FROM stock_ledger ORDER BY variety_name ASC`),
      pool.query(`SELECT id, bill_no AS "billNo", TO_CHAR(purchase_date, 'YYYY-MM-DD') AS "purchaseDate", purchase_type AS "purchaseType", party_id AS "partyId", party_name AS "partyName", firm_name AS "firmName", village, mobile, truck_no AS "truckNo", truck_no AS "truckNumber", truck_owner AS "truckOwner", truck_owner AS "truckOwnerName", items_sub_total AS "itemsSubTotal", majuri_amount AS "majuriAmount", market_commission AS "marketCommission", firm_commission AS "firmCommission", total_expenses AS "totalExpenses", net_total AS "netTotal", paid_amount AS "paidAmount", due_amount AS "dueAmount", payment_mode AS "paymentMode", remarks, created_by AS "createdBy", created_at AS "createdAt" FROM purchases ORDER BY purchase_date DESC, created_at DESC LIMIT 100`),
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

// 3. Parties (ખેડૂતો, પેઢીઓ, સપ્લાયર્સ અને વેપારીઓ/વ્યક્તિઓ)
app.post('/api/parties', async (req, res) => {
  const p = req.body;
  const id = p.id || 'party_' + Date.now();
  let partyType = (p.partyType || 'farmer').toLowerCase();
  if (!['farmer', 'firm', 'supplier', 'trader', 'transporter', 'other'].includes(partyType)) {
    partyType = 'farmer';
  }
  const prefixMap = {
    farmer: 'KH',
    firm: 'PDH',
    supplier: 'SUP',
    trader: 'TRD',
    transporter: 'TRK',
    other: 'PER'
  };
  const codePrefix = prefixMap[partyType] || 'PTY';
  const code = p.code || `${codePrefix}-${Date.now().toString().slice(-4)}`;
  const openingBal = parseFloat(p.openingBalance || 0);

  const opType = (p.openingBalanceType || p.balanceType || (partyType === 'farmer' ? 'dr' : 'cr')).toLowerCase();

  try {
    await pool.query(
      `INSERT INTO parties (id, party_type, code, name, firm_name, mobile, village, taluka, opening_balance, opening_balance_type, balance_type, current_balance, credit_limit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         firm_name = EXCLUDED.firm_name,
         mobile = EXCLUDED.mobile,
         village = EXCLUDED.village,
         taluka = EXCLUDED.taluka,
         opening_balance = EXCLUDED.opening_balance,
         opening_balance_type = EXCLUDED.opening_balance_type,
         balance_type = EXCLUDED.balance_type`,
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
        opType,
        opType, 
        openingBal, 
        parseFloat(p.creditLimit || 50000)
      ]
    );

    await recalculatePartyBalance(pool, id);

    const result = await pool.query(
      `SELECT id, party_type AS "partyType", code, name, firm_name AS "firmName", mobile, village, taluka, opening_balance AS "openingBalance", COALESCE(opening_balance_type, balance_type, 'dr') AS "openingBalanceType", balance_type AS "balanceType", current_balance AS "currentBalance", credit_limit AS "creditLimit" FROM parties WHERE id = $1`,
      [id]
    );

    res.json({ success: true, party: result.rows[0] });
  } catch (err) {
    console.error('Error creating party in PostgreSQL:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/parties/recalculate', async (req, res) => {
  try {
    await recalculateAllParties();
    res.json({ success: true, message: 'All parties recalculated successfully' });
  } catch (err) {
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
    let billNumber = purchaseData.billNo;
    if (!billNumber) {
      billNumber = `SN-PUR-${timestamp.getFullYear()}-${Date.now().toString().slice(-4)}`;
    }

    // Ensure billNumber is unique in purchases table
    const checkPurBill = await client.query('SELECT 1 FROM purchases WHERE bill_no = $1', [billNumber]);
    if (checkPurBill.rows.length > 0) {
      const maxRes = await client.query(
        `SELECT bill_no FROM purchases WHERE bill_no LIKE $1 ORDER BY bill_no DESC LIMIT 1`,
        [`SN-PUR-${timestamp.getFullYear()}-%`]
      );
      let nextNum = Date.now().toString().slice(-4);
      if (maxRes.rows.length > 0) {
        const m = maxRes.rows[0].bill_no.match(/SN-PUR-\d{4}-(\d+)/);
        if (m) {
          nextNum = (parseInt(m[1], 10) + 1).toString().padStart(4, '0');
        }
      }
      billNumber = `SN-PUR-${timestamp.getFullYear()}-${nextNum}`;
    }

    let determinedPartyType = (purchaseData.partyType || (purchaseData.purchaseType === 'market' ? 'firm' : 'farmer')).toLowerCase();
    if (!['farmer', 'firm', 'supplier', 'trader', 'transporter', 'other'].includes(determinedPartyType)) {
      determinedPartyType = 'farmer';
    }
    const isFarmer = determinedPartyType === 'farmer';

    // 1. Ensure Party exists in parties table
    let finalPartyId = purchaseData.partyId || null;
    if (finalPartyId) {
      const checkParty = await client.query('SELECT id, party_type FROM parties WHERE id = $1', [finalPartyId]);
      if (checkParty.rows.length === 0) {
        await client.query(
          `INSERT INTO parties (id, party_type, code, name, mobile, village, opening_balance, balance_type, current_balance, credit_limit)
           VALUES ($1, $2, $3, $4, $5, $6, 0, 'dr', 0, 50000)
           ON CONFLICT (id) DO NOTHING`,
          [
            finalPartyId,
            determinedPartyType,
            `P-${Date.now().toString(36).toUpperCase()}`,
            purchaseData.partyName || 'ખાતેદાર',
            purchaseData.mobile || null,
            purchaseData.village || null
          ]
        );
      } else if (checkParty.rows[0].party_type) {
        determinedPartyType = checkParty.rows[0].party_type;
      }
    } else if (purchaseData.partyName && purchaseData.partyName.trim()) {
      finalPartyId = 'party_' + Date.now();
      await client.query(
        `INSERT INTO parties (id, party_type, code, name, mobile, village, opening_balance, balance_type, current_balance, credit_limit)
         VALUES ($1, $2, $3, $4, $5, $6, 0, 'dr', 0, 50000)`,
        [
          finalPartyId,
          determinedPartyType,
          `P-${Date.now().toString(36).toUpperCase()}`,
          purchaseData.partyName.trim(),
          purchaseData.mobile || null,
          purchaseData.village || null
        ]
      );
    }

    // 2. Normalize payment mode to lowercase valid enum
    const rawMode = (purchaseData.paymentMode || 'credit').toString().toLowerCase().trim();
    const normalizedMode = ['cash', 'bank', 'upi', 'credit', 'cheque'].includes(rawMode) ? rawMode : 'credit';

    // Truck / Vehicle Information
    const cleanTruckNo = (purchaseData.truckNo || purchaseData.truckNumber || '').toString().trim().toUpperCase();
    const cleanTruckOwner = (purchaseData.truckOwner || purchaseData.truckOwnerName || '').toString().trim();
    const cleanTruckMobile = (purchaseData.truckMobile || '').toString().trim();

    // Auto-register Transporter in parties master if truck information is supplied
    if (cleanTruckNo || cleanTruckOwner) {
      const transporterLabel = cleanTruckOwner || cleanTruckNo;
      const transporterFirm = cleanTruckNo || cleanTruckOwner;
      const checkTrk = await client.query(
        `SELECT id FROM parties WHERE party_type = 'transporter' AND (UPPER(firm_name) = $1 OR UPPER(name) = $2) LIMIT 1`,
        [cleanTruckNo, transporterLabel.toUpperCase()]
      );
      if (checkTrk.rows.length === 0) {
        const trkPartyId = 'party_trk_' + Date.now();
        await client.query(
          `INSERT INTO parties (id, party_type, code, name, firm_name, mobile, village, opening_balance, balance_type, current_balance, credit_limit)
           VALUES ($1, 'transporter', $2, $3, $4, $5, 'વાહન / ટ્રાન્સપોર્ટ', 0, 'cr', 0, 50000)
           ON CONFLICT (id) DO NOTHING`,
          [
            trkPartyId,
            `TRK-${Date.now().toString(36).toUpperCase()}`,
            transporterLabel,
            transporterFirm,
            cleanTruckMobile || null
          ]
        );
      }
    }

    // 3. Insert Purchase
    await client.query(
      `INSERT INTO purchases (
        id, purchase_type, bill_no, purchase_date, party_id, party_name,
        firm_id, firm_name, trader_id, trader_name, village, mobile, truck_no, truck_owner,
        items_sub_total, majuri_rate_per_bag, majuri_amount, market_commission,
        firm_commission, bardan_expense, total_expenses, net_total, paid_amount,
        due_amount, payment_mode, remarks, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
      ON CONFLICT (id) DO UPDATE SET
        bill_no = EXCLUDED.bill_no,
        purchase_date = EXCLUDED.purchase_date,
        party_id = EXCLUDED.party_id,
        party_name = EXCLUDED.party_name,
        truck_no = EXCLUDED.truck_no,
        truck_owner = EXCLUDED.truck_owner,
        net_total = EXCLUDED.net_total,
        due_amount = EXCLUDED.due_amount`,
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
        cleanTruckNo || null,
        cleanTruckOwner || null,
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

        let validSeedId = item.seedId || null;
        if (validSeedId) {
          const chk = await client.query('SELECT id FROM seed_varieties WHERE id = $1', [validSeedId]);
          if (chk.rows.length === 0) {
            const match = await client.query('SELECT id FROM seed_varieties WHERE variety_name = $1 LIMIT 1', [item.varietyName]);
            validSeedId = match.rows[0]?.id || null;
          }
        }
        if (!validSeedId && item.varietyName) {
          const match = await client.query('SELECT id FROM seed_varieties WHERE variety_name = $1 LIMIT 1', [item.varietyName]);
          if (match.rows.length > 0) {
            validSeedId = match.rows[0].id;
          } else {
            // Auto-create missing seed variety so inventory integrity is maintained
            validSeedId = 'seed_' + Date.now();
            await client.query(
              `INSERT INTO seed_varieties (id, variety_name, crop_type, company, bag_weight_kg, default_purchase_rate_per_man, default_sale_rate_per_man, min_stock_alert_bags)
               VALUES ($1, $2, 'મગફળી', 'SHREE NANDINI SEEDS', $3, $4, $5, 10)
               ON CONFLICT (variety_name) DO NOTHING`,
              [validSeedId, item.varietyName, bagWeight, ratePerMan, ratePerMan * 1.15]
            );
            const refetch = await client.query('SELECT id FROM seed_varieties WHERE variety_name = $1 LIMIT 1', [item.varietyName]);
            validSeedId = refetch.rows[0]?.id || validSeedId;
          }
        }

        await client.query(
          `INSERT INTO purchase_items (
            id, purchase_id, seed_id, variety_name, bag_weight_kg, bags, last_bag_kg, net_weight_kg, total_man, rate_per_man, rate_per_kg, item_total
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            itemId,
            purchaseId,
            validSeedId,
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
        if (validSeedId) {
          await client.query(
            `INSERT INTO stock_ledger (id, seed_id, variety_name, batch_no, bag_weight_kg, available_bags, available_loose_kg, last_purchase_rate)
             VALUES ($1, $2, $3, 'MAIN', $4, $5, $6, $7)
             ON CONFLICT (seed_id, batch_no) DO UPDATE SET
               available_bags = stock_ledger.available_bags + EXCLUDED.available_bags,
               available_loose_kg = stock_ledger.available_loose_kg + EXCLUDED.available_loose_kg,
               last_purchase_rate = EXCLUDED.last_purchase_rate`,
            [
              'stock_' + Date.now(),
              validSeedId,
              item.varietyName,
              bagWeight,
              bags,
              Math.max(0, netKg - (bags * bagWeight)),
              ratePerMan
            ]
          );
        }
      }
    }

    const dueAmount = parseFloat(purchaseData.dueAmount || 0);

    // 3. Insert Party Ledger Transaction
    if (finalPartyId) {
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
          finalPartyId,
          purchaseData.partyName,
          determinedPartyType,
          billNumber,
          'purchase',
          `${determinedPartyType === 'farmer' ? 'ખેડૂત ખરીદી' : determinedPartyType === 'supplier' ? 'સપ્લાયર ખરીદી' : determinedPartyType === 'firm' ? 'પેઢી ખરીદી' : 'વેપારી ખરીદી'} (${purchaseData.items?.map(it => it.varietyName).join(', ')})`,
          purchaseData.items?.map(it => it.varietyName).join(', '),
          totalBags,
          totalKg,
          totalMan,
          ratePerMan,
          parseFloat(purchaseData.paidAmount || 0),
          parseFloat(purchaseData.netTotal || 0),
          dueAmount,
          purchaseData.paymentMode || 'credit',
          purchaseId
        ]
      );

      // Recalculate true balance from ledger transactions
      await recalculatePartyBalance(client, finalPartyId);
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
    let billNumber = saleData.billNo;
    if (!billNumber) {
      billNumber = `KT-S-${timestamp.getFullYear()}-${Date.now().toString().slice(-4)}`;
    }

    // Ensure billNumber is unique in sales table
    const checkSaleBill = await client.query('SELECT 1 FROM sales WHERE bill_no = $1', [billNumber]);
    if (checkSaleBill.rows.length > 0) {
      const maxRes = await client.query(
        `SELECT bill_no FROM sales WHERE bill_no LIKE $1 ORDER BY bill_no DESC LIMIT 1`,
        [`KT-S-${timestamp.getFullYear()}-%`]
      );
      let nextNum = Date.now().toString().slice(-4);
      if (maxRes.rows.length > 0) {
        const m = maxRes.rows[0].bill_no.match(/KT-S-\d{4}-(\d+)/);
        if (m) {
          nextNum = (parseInt(m[1], 10) + 1).toString().padStart(4, '0');
        }
      }
      billNumber = `KT-S-${timestamp.getFullYear()}-${nextNum}`;
    }

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
            `KH-${Date.now().toString(36).toUpperCase()}`,
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
      ON CONFLICT (id) DO UPDATE SET
        bill_no = EXCLUDED.bill_no,
        bill_date = EXCLUDED.bill_date,
        party_id = EXCLUDED.party_id,
        farmer_name = EXCLUDED.farmer_name,
        net_amount = EXCLUDED.net_amount,
        due_amount = EXCLUDED.due_amount`,
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
        const rawUnit = (item.rateUnit || 'man').toString().toLowerCase();
        const rateUnit = ['man', 'kg', 'bag'].includes(rawUnit) ? rawUnit : 'man';

        let validSaleSeedId = item.seedId || null;
        if (validSaleSeedId) {
          const chk = await client.query('SELECT id FROM seed_varieties WHERE id = $1', [validSaleSeedId]);
          if (chk.rows.length === 0) {
            const match = await client.query('SELECT id FROM seed_varieties WHERE variety_name = $1 LIMIT 1', [item.varietyName]);
            validSaleSeedId = match.rows[0]?.id || null;
          }
        }
        if (!validSaleSeedId && item.varietyName) {
          const match = await client.query('SELECT id FROM seed_varieties WHERE variety_name = $1 LIMIT 1', [item.varietyName]);
          if (match.rows.length > 0) {
            validSaleSeedId = match.rows[0].id;
          }
        }

        await client.query(
          `INSERT INTO sale_items (
            id, sale_id, seed_id, variety_name, bag_weight_kg, bags, loose_kg, total_weight_kg, total_man, rate_unit, rate, item_total
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            itemId,
            saleId,
            validSaleSeedId,
            item.varietyName,
            bagWeight,
            bags,
            looseKg,
            totalWeight,
            totalMan,
            rateUnit,
            rate,
            itemTotal
          ]
        );

        // Deduct Stock
        if (validSaleSeedId) {
          await client.query(
            `UPDATE stock_ledger
             SET available_bags = GREATEST(0, available_bags - $1),
                 available_loose_kg = GREATEST(0, available_loose_kg - $2)
             WHERE seed_id = $3`,
            [bags, looseKg, validSaleSeedId]
          );
        }
      }
    }

    const dueAmount = parseFloat(saleData.dueAmount || 0);

    // 3. Insert Party Ledger Transaction
    if (finalSalePartyId) {
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
          finalSalePartyId,
          saleData.farmerName || 'ખેડૂત ગ્રાહક',
          'farmer',
          billNumber,
          'sale',
          `બિયારણ વેચાણ બિલ (${saleData.items?.map(it => it.varietyName).join(', ')})`,
          saleData.items?.map(it => it.varietyName).join(', ') || '—',
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

      // Recalculate true balance from ledger transactions
      await recalculatePartyBalance(client, finalSalePartyId);
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
    let voucherNumber = v.voucherNo || `${prefix}-${Date.now().toString().slice(-6)}`;
    const checkVch = await client.query('SELECT 1 FROM payments WHERE receipt_no = $1', [voucherNumber]);
    if (checkVch.rows.length > 0) {
      voucherNumber = `${prefix}-${Date.now().toString().slice(-6)}`;
    }

    const isReceipt = v.type === 'receipt';
    const rawVMode = (v.paymentMode || 'cash').toString().toLowerCase().trim();
    const normalizedVMode = ['cash', 'bank', 'upi', 'cheque', 'credit'].includes(rawVMode) ? rawVMode : 'cash';

    // 1. Insert into payments
    await client.query(
      `INSERT INTO payments (
        id, receipt_no, date, party_id, party_name, party_type, type, amount, payment_mode, reference_no, remarks, recorded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        receipt_no = EXCLUDED.receipt_no,
        amount = EXCLUDED.amount,
        payment_mode = EXCLUDED.payment_mode`,
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

    // 2. Insert Party Ledger Transaction
    if (v.partyId) {
      await client.query(
        `INSERT INTO party_transactions (
          id, date, time, party_id, party_name, party_type, voucher_no, voucher_type, particulars, variety_name, debit, credit, running_balance, payment_mode, remarks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
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
          v.varietyName || '—',
          isReceipt ? 0 : amount,
          isReceipt ? amount : 0,
          0,
          normalizedVMode,
          v.remarks || ''
        ]
      );

      // Recalculate true balance from ledger transactions
      await recalculatePartyBalance(client, v.partyId);
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

    // 1. Find party_id to recalculate balance after deletion
    const txRes = await client.query(
      `SELECT party_id FROM party_transactions WHERE voucher_no = $1 LIMIT 1`,
      [voucherNo]
    );
    const partyId = txRes.rows[0]?.party_id;

    // 2. Delete from tables
    await client.query(`DELETE FROM payments WHERE receipt_no = $1`, [voucherNo]);
    await client.query(`DELETE FROM party_transactions WHERE voucher_no = $1`, [voucherNo]);
    await client.query(`DELETE FROM rojmel WHERE voucher_no = $1`, [voucherNo]);

    // 3. Recalculate true balance from remaining ledger transactions
    if (partyId) {
      await recalculatePartyBalance(client, partyId);
    }

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

// 8b. Delete Purchase
app.delete('/api/purchases/:billNo', async (req, res) => {
  const { billNo } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Find purchase
    const purRes = await client.query(
      `SELECT id, party_id, due_amount, net_total FROM purchases WHERE bill_no = $1 LIMIT 1`,
      [billNo]
    );

    if (purRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'ખરીદી બિલ મળ્યું નથી' });
    }

    const pur = purRes.rows[0];

    // 2. Revert Stock Ledger
    const itemsRes = await client.query(
      `SELECT seed_id, bags, net_weight_kg, total_man FROM purchase_items WHERE purchase_id = $1`,
      [pur.id]
    );

    for (const it of itemsRes.rows) {
      if (it.seed_id) {
        await client.query(
          `UPDATE stock_ledger
           SET available_bags = GREATEST(0, available_bags - $1)
           WHERE seed_id = $2`,
          [it.bags || 0, it.seed_id]
        );
      }
    }

    // 3. Delete items, purchase, transactions, rojmel
    await client.query(`DELETE FROM purchase_items WHERE purchase_id = $1`, [pur.id]);
    await client.query(`DELETE FROM purchases WHERE id = $1`, [pur.id]);
    await client.query(`DELETE FROM party_transactions WHERE voucher_no = $1 OR bill_id = $2`, [billNo, pur.id]);
    await client.query(`DELETE FROM rojmel WHERE voucher_no = $1`, [billNo]);

    // 4. Recalculate true balance from remaining ledger transactions
    if (pur.party_id) {
      await recalculatePartyBalance(client, pur.party_id);
    }

    await client.query('COMMIT');
    res.json({ success: true, message: `ખરીદી બિલ ${billNo} સફળતાપૂર્વક રદ/ડીલીટ થયું.` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting purchase from PostgreSQL:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// 8c. Delete Sale
app.delete('/api/sales/:billNo', async (req, res) => {
  const { billNo } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const saleRes = await client.query(
      `SELECT id, party_id, due_amount, net_amount FROM sales WHERE bill_no = $1 LIMIT 1`,
      [billNo]
    );

    if (saleRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'વેચાણ બિલ મળ્યું નથી' });
    }

    const sale = saleRes.rows[0];

    // Revert Stock Ledger
    const itemsRes = await client.query(
      `SELECT seed_id, bags, loose_kg FROM sale_items WHERE sale_id = $1`,
      [sale.id]
    );

    for (const it of itemsRes.rows) {
      if (it.seed_id) {
        await client.query(
          `UPDATE stock_ledger
           SET available_bags = available_bags + $1,
               available_loose_kg = available_loose_kg + $2
           WHERE seed_id = $3`,
          [it.bags || 0, it.loose_kg || 0, it.seed_id]
        );
      }
    }

    // Delete items, sale, transactions, rojmel
    await client.query(`DELETE FROM sale_items WHERE sale_id = $1`, [sale.id]);
    await client.query(`DELETE FROM sales WHERE id = $1`, [sale.id]);
    await client.query(`DELETE FROM party_transactions WHERE voucher_no = $1 OR bill_id = $2`, [billNo, sale.id]);
    await client.query(`DELETE FROM rojmel WHERE voucher_no = $1`, [billNo]);

    // Recalculate true balance from remaining ledger transactions
    if (sale.party_id) {
      await recalculatePartyBalance(client, sale.party_id);
    }

    await client.query('COMMIT');
    res.json({ success: true, message: `વેચાણ બિલ ${billNo} સફળતાપૂર્વક રદ/ડીલીટ થયું.` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting sale from PostgreSQL:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// 8d. Update Purchase (ખરીદી સુધારો)
app.put('/api/purchases/:billNo', async (req, res) => {
  const { billNo } = req.params;
  const purchaseData = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Fetch existing purchase
    const purRes = await client.query('SELECT * FROM purchases WHERE bill_no = $1 LIMIT 1', [billNo]);
    if (purRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'ખરીદી બિલ મળ્યું નથી.' });
    }
    const oldPur = purRes.rows[0];

    // 2. Revert Old Stock Ledger
    const oldItemsRes = await client.query('SELECT seed_id, bags, net_weight_kg FROM purchase_items WHERE purchase_id = $1', [oldPur.id]);
    for (const it of oldItemsRes.rows) {
      if (it.seed_id) {
        await client.query(
          `UPDATE stock_ledger
           SET available_bags = GREATEST(0, available_bags - $1)
           WHERE seed_id = $2`,
          [it.bags || 0, it.seed_id]
        );
      }
    }

    // 3. Delete old purchase items
    await client.query('DELETE FROM purchase_items WHERE purchase_id = $1', [oldPur.id]);

    // 4. Determine party
    let determinedPartyType = (purchaseData.partyType || (purchaseData.purchaseType === 'market' ? 'firm' : 'farmer')).toLowerCase();
    if (!['farmer', 'firm', 'supplier', 'trader', 'transporter', 'other'].includes(determinedPartyType)) {
      determinedPartyType = 'farmer';
    }
    const isFarmer = determinedPartyType === 'farmer';

    let finalPartyId = purchaseData.partyId || oldPur.party_id;
    if (finalPartyId) {
      const checkParty = await client.query('SELECT id, party_type FROM parties WHERE id = $1', [finalPartyId]);
      if (checkParty.rows.length === 0) {
        await client.query(
          `INSERT INTO parties (id, party_type, code, name, mobile, village, opening_balance, balance_type, current_balance, credit_limit)
           VALUES ($1, $2, $3, $4, $5, $6, 0, 'dr', 0, 50000)
           ON CONFLICT (id) DO NOTHING`,
          [
            finalPartyId,
            determinedPartyType,
            `P-${Date.now().toString(36).toUpperCase()}`,
            purchaseData.partyName || 'ખાતેદાર',
            purchaseData.mobile || null,
            purchaseData.village || null
          ]
        );
      }
    }

    const rawMode = (purchaseData.paymentMode || 'credit').toString().toLowerCase().trim();
    const normalizedMode = ['cash', 'bank', 'upi', 'credit', 'cheque'].includes(rawMode) ? rawMode : 'credit';

    // Truck / Vehicle Information
    const cleanTruckNo = (purchaseData.truckNo || purchaseData.truckNumber || '').toString().trim().toUpperCase();
    const cleanTruckOwner = (purchaseData.truckOwner || purchaseData.truckOwnerName || '').toString().trim();
    const cleanTruckMobile = (purchaseData.truckMobile || '').toString().trim();

    // Auto-register Transporter in parties master if truck information is supplied
    if (cleanTruckNo || cleanTruckOwner) {
      const transporterLabel = cleanTruckOwner || cleanTruckNo;
      const transporterFirm = cleanTruckNo || cleanTruckOwner;
      const checkTrk = await client.query(
        `SELECT id FROM parties WHERE party_type = 'transporter' AND (UPPER(firm_name) = $1 OR UPPER(name) = $2) LIMIT 1`,
        [cleanTruckNo, transporterLabel.toUpperCase()]
      );
      if (checkTrk.rows.length === 0) {
        const trkPartyId = 'party_trk_' + Date.now();
        await client.query(
          `INSERT INTO parties (id, party_type, code, name, firm_name, mobile, village, opening_balance, balance_type, current_balance, credit_limit)
           VALUES ($1, 'transporter', $2, $3, $4, $5, 'વાહન / ટ્રાન્સપોર્ટ', 0, 'cr', 0, 50000)
           ON CONFLICT (id) DO NOTHING`,
          [
            trkPartyId,
            `TRK-${Date.now().toString(36).toUpperCase()}`,
            transporterLabel,
            transporterFirm,
            cleanTruckMobile || null
          ]
        );
      }
    }

    // 5. Update purchase record
    await client.query(
      `UPDATE purchases SET
        purchase_type = $1,
        purchase_date = $2,
        party_id = $3,
        party_name = $4,
        firm_id = $5,
        firm_name = $6,
        trader_id = $7,
        trader_name = $8,
        village = $9,
        mobile = $10,
        truck_no = $11,
        truck_owner = $12,
        items_sub_total = $13,
        majuri_rate_per_bag = $14,
        majuri_amount = $15,
        market_commission = $16,
        firm_commission = $17,
        bardan_expense = $18,
        total_expenses = $19,
        net_total = $20,
        paid_amount = $21,
        due_amount = $22,
        payment_mode = $23,
        remarks = $24,
        updated_at = NOW()
      WHERE id = $25`,
      [
        isFarmer ? 'farmer' : 'market',
        purchaseData.purchaseDate || oldPur.purchase_date,
        finalPartyId,
        purchaseData.partyName || oldPur.party_name,
        purchaseData.firmId || null,
        purchaseData.firmName || null,
        purchaseData.traderId || null,
        purchaseData.traderName || null,
        purchaseData.village || null,
        purchaseData.mobile || null,
        cleanTruckNo || null,
        cleanTruckOwner || null,
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
        oldPur.id
      ]
    );

    // 6. Insert New Purchase Items & Add To Stock
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

        let validSeedId = item.seedId || null;
        if (validSeedId) {
          const chk = await client.query('SELECT id FROM seed_varieties WHERE id = $1', [validSeedId]);
          if (chk.rows.length === 0) {
            const match = await client.query('SELECT id FROM seed_varieties WHERE variety_name = $1 LIMIT 1', [item.varietyName]);
            validSeedId = match.rows[0]?.id || null;
          }
        }
        if (!validSeedId && item.varietyName) {
          const match = await client.query('SELECT id FROM seed_varieties WHERE variety_name = $1 LIMIT 1', [item.varietyName]);
          if (match.rows.length > 0) {
            validSeedId = match.rows[0].id;
          }
        }

        await client.query(
          `INSERT INTO purchase_items (
            id, purchase_id, seed_id, variety_name, bag_weight_kg, bags, last_bag_kg, net_weight_kg, total_man, rate_per_man, rate_per_kg, item_total
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            itemId,
            oldPur.id,
            validSeedId,
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

        if (validSeedId) {
          await client.query(
            `INSERT INTO stock_ledger (id, seed_id, variety_name, batch_no, bag_weight_kg, available_bags, available_loose_kg, last_purchase_rate)
             VALUES ($1, $2, $3, 'MAIN', $4, $5, $6, $7)
             ON CONFLICT (seed_id, batch_no) DO UPDATE SET
               available_bags = stock_ledger.available_bags + EXCLUDED.available_bags,
               last_purchase_rate = EXCLUDED.last_purchase_rate`,
            [
              'stock_' + Date.now(),
              validSeedId,
              item.varietyName,
              bagWeight,
              bags,
              Math.max(0, netKg - (bags * bagWeight)),
              ratePerMan
            ]
          );
        }
      }
    }

    // 7. Update Party Ledger Transaction
    await client.query(`DELETE FROM party_transactions WHERE voucher_no = $1 OR bill_id = $2`, [billNo, oldPur.id]);
    if (finalPartyId) {
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
          purchaseData.purchaseDate || oldPur.purchase_date,
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          finalPartyId,
          purchaseData.partyName || oldPur.party_name,
          determinedPartyType,
          billNo,
          'purchase',
          `${determinedPartyType === 'farmer' ? 'ખેડૂત ખરીદી (સુધારેલ)' : 'પેઢી/સપ્લાયર ખરીદી (સુધારેલ)'} (${purchaseData.items?.map(it => it.varietyName).join(', ')})`,
          purchaseData.items?.map(it => it.varietyName).join(', '),
          totalBags,
          totalKg,
          totalMan,
          ratePerMan,
          parseFloat(purchaseData.paidAmount || 0),
          parseFloat(purchaseData.netTotal || 0),
          parseFloat(purchaseData.dueAmount || 0),
          purchaseData.paymentMode || 'credit',
          oldPur.id
        ]
      );

      await recalculatePartyBalance(client, finalPartyId);
      if (oldPur.party_id && oldPur.party_id !== finalPartyId) {
        await recalculatePartyBalance(client, oldPur.party_id);
      }
    }

    // 8. Update Rojmel
    await client.query(`DELETE FROM rojmel WHERE voucher_no = $1`, [billNo]);
    const purBags = purchaseData.items?.reduce((s, it) => s + parseInt(it.bags || 0), 0) || 0;
    const purKg = purchaseData.items?.reduce((s, it) => s + parseFloat(it.netWeightKg || 0), 0) || 0;
    const purMan = purchaseData.items?.reduce((s, it) => s + parseFloat(it.totalMan || (purKg / 20)), 0) || 0;

    await client.query(
      `INSERT INTO rojmel (
        id, date, time, voucher_no, voucher_type, party_name, particulars, variety_name, bags, weight_kg, total_man, account, debit, credit, payment_mode
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        'roj_' + Date.now(),
        purchaseData.purchaseDate || oldPur.purchase_date,
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        billNo,
        'purchase',
        purchaseData.partyName || oldPur.party_name,
        `ખરીદી (સુધારેલ): ${purchaseData.items?.map(it => `${it.varietyName} (${it.bags}B/${it.netWeightKg}KG)`).join(', ')}`,
        purchaseData.items?.map(it => it.varietyName).join(', '),
        purBags,
        purKg,
        purMan,
        purchaseData.paymentMode === 'cash' ? 'cash' : 'bank',
        parseFloat(purchaseData.paidAmount || 0),
        parseFloat(purchaseData.paidAmount || 0) > 0 ? 0 : parseFloat(purchaseData.netTotal || 0),
        purchaseData.paymentMode || 'credit'
      ]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: `ખરીદી બિલ ${billNo} સફળતાપૂર્વક સુધારાઈ ગયું.` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating purchase in PostgreSQL:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// 8e. Update Sale (વેચાણ સુધારો)
app.put('/api/sales/:billNo', async (req, res) => {
  const { billNo } = req.params;
  const saleData = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const saleRes = await client.query('SELECT * FROM sales WHERE bill_no = $1 LIMIT 1', [billNo]);
    if (saleRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'વેચાણ બિલ મળ્યું નથી.' });
    }
    const oldSale = saleRes.rows[0];

    // Revert old sale items from stock
    const oldItemsRes = await client.query('SELECT seed_id, bags, loose_kg FROM sale_items WHERE sale_id = $1', [oldSale.id]);
    for (const it of oldItemsRes.rows) {
      if (it.seed_id) {
        await client.query(
          `UPDATE stock_ledger
           SET available_bags = available_bags + $1,
               available_loose_kg = available_loose_kg + $2
           WHERE seed_id = $3`,
          [it.bags || 0, it.loose_kg || 0, it.seed_id]
        );
      }
    }

    await client.query('DELETE FROM sale_items WHERE sale_id = $1', [oldSale.id]);

    let finalSalePartyId = saleData.farmerId || saleData.partyId || oldSale.party_id;
    const rawSaleMode = (saleData.paymentMode || 'cash').toString().toLowerCase().trim();
    const normalizedSaleMode = ['cash', 'bank', 'upi', 'credit', 'cheque', 'cash_and_credit'].includes(rawSaleMode) ? rawSaleMode : 'cash';

    await client.query(
      `UPDATE sales SET
        bill_date = $1,
        party_id = $2,
        farmer_name = $3,
        farmer_mobile = $4,
        farmer_village = $5,
        sub_total = $6,
        majuri_amount = $7,
        discount = $8,
        net_amount = $9,
        paid_amount = $10,
        due_amount = $11,
        payment_mode = $12,
        remarks = $13,
        updated_at = NOW()
      WHERE id = $14`,
      [
        saleData.billDate || oldSale.bill_date,
        finalSalePartyId,
        saleData.farmerName || oldSale.farmer_name,
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
        oldSale.id
      ]
    );

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
        const rawUnit = (item.rateUnit || 'man').toString().toLowerCase();
        const rateUnit = ['man', 'kg', 'bag'].includes(rawUnit) ? rawUnit : 'man';

        let validSaleSeedId = item.seedId || null;
        if (validSaleSeedId) {
          const chk = await client.query('SELECT id FROM seed_varieties WHERE id = $1', [validSaleSeedId]);
          if (chk.rows.length === 0) {
            const match = await client.query('SELECT id FROM seed_varieties WHERE variety_name = $1 LIMIT 1', [item.varietyName]);
            validSaleSeedId = match.rows[0]?.id || null;
          }
        }
        if (!validSaleSeedId && item.varietyName) {
          const match = await client.query('SELECT id FROM seed_varieties WHERE variety_name = $1 LIMIT 1', [item.varietyName]);
          if (match.rows.length > 0) validSaleSeedId = match.rows[0].id;
        }

        await client.query(
          `INSERT INTO sale_items (
            id, sale_id, seed_id, variety_name, bag_weight_kg, bags, loose_kg, total_weight_kg, total_man, rate_unit, rate, item_total
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            itemId,
            oldSale.id,
            validSaleSeedId,
            item.varietyName,
            bagWeight,
            bags,
            looseKg,
            totalWeight,
            totalMan,
            rateUnit,
            rate,
            itemTotal
          ]
        );

        if (validSaleSeedId) {
          await client.query(
            `UPDATE stock_ledger
             SET available_bags = GREATEST(0, available_bags - $1),
                 available_loose_kg = GREATEST(0, available_loose_kg - $2)
             WHERE seed_id = $3`,
            [bags, looseKg, validSaleSeedId]
          );
        }
      }
    }

    // Update transactions & rojmel
    await client.query('DELETE FROM party_transactions WHERE voucher_no = $1 OR bill_id = $2', [billNo, oldSale.id]);
    if (finalSalePartyId) {
      await client.query(
        `INSERT INTO party_transactions (
          id, date, time, party_id, party_name, party_type, voucher_no, voucher_type, particulars, variety_name, bags, weight_kg, total_man, rate_per_man, debit, credit, running_balance, payment_mode, bill_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
        [
          'tx_' + Date.now(),
          saleData.billDate || oldSale.bill_date,
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          finalSalePartyId,
          saleData.farmerName || oldSale.farmer_name,
          'farmer',
          billNo,
          'sale',
          `બિયારણ વેચાણ (સુધારેલ): ${saleData.items?.map(it => it.varietyName).join(', ')}`,
          saleData.items?.map(it => it.varietyName).join(', '),
          saleData.items?.reduce((s, it) => s + parseInt(it.bags || 0), 0) || 0,
          saleData.items?.reduce((s, it) => s + parseFloat(it.totalWeightKg || 0), 0) || 0,
          saleData.items?.reduce((s, it) => s + parseFloat(it.totalMan || 0), 0) || 0,
          saleData.items?.[0]?.rate || 0,
          parseFloat(saleData.netAmount || 0),
          parseFloat(saleData.paidAmount || 0),
          parseFloat(saleData.dueAmount || 0),
          normalizedSaleMode,
          oldSale.id
        ]
      );
      await recalculatePartyBalance(client, finalSalePartyId);
      if (oldSale.party_id && oldSale.party_id !== finalSalePartyId) {
        await recalculatePartyBalance(client, oldSale.party_id);
      }
    }

    await client.query('DELETE FROM rojmel WHERE voucher_no = $1', [billNo]);
    await client.query(
      `INSERT INTO rojmel (
        id, date, time, voucher_no, voucher_type, party_name, particulars, variety_name, bags, weight_kg, total_man, account, debit, credit, payment_mode
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        'roj_' + Date.now(),
        saleData.billDate || oldSale.bill_date,
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        billNo,
        'sale',
        saleData.farmerName || oldSale.farmer_name,
        `વેચાણ (સુધારેલ): ${saleData.items?.map(it => `${it.varietyName} (${it.bags}B/${it.totalWeightKg}KG)`).join(', ')}`,
        saleData.items?.map(it => it.varietyName).join(', '),
        saleData.items?.reduce((s, it) => s + parseInt(it.bags || 0), 0) || 0,
        saleData.items?.reduce((s, it) => s + parseFloat(it.totalWeightKg || 0), 0) || 0,
        saleData.items?.reduce((s, it) => s + parseFloat(it.totalMan || 0), 0) || 0,
        saleData.paymentMode === 'cash' ? 'cash' : 'bank',
        0,
        parseFloat(saleData.paidAmount || 0) > 0 ? parseFloat(saleData.paidAmount || 0) : parseFloat(saleData.netAmount || 0),
        normalizedSaleMode
      ]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: `વેચાણ બિલ ${billNo} સફળતાપૂર્વક સુધારાઈ ગયું.` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating sale in PostgreSQL:', err);
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

// Serve frontend dist for maximum resilience
const distPath = path.resolve(__dirname, '../web/dist');
app.use(express.static(distPath));
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/public')) return next();
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) next();
  });
});

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Krushi Trade PostgreSQL API running dynamically on port ${PORT}`);
  try {
    await recalculateAllParties();
  } catch (err) {
    console.error('Error recalculating party balances on startup:', err);
  }
});
