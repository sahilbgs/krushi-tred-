import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  runTransaction 
} from 'firebase/firestore';

const DataContext = createContext(null);

// Standard constants for SHREE NANDINI SEEDS
export const BAG_STD_KG = 35; // 1 Bag = 35 KG
export const MAN_STD_KG = 20; // 1 Man (મણ) = 20 KG

// Seed Variety Master (35 KG Standard Bag Weight - Only Number/Code)
const initialSeeds = [
  {
    id: "seed_1",
    varietyName: "GJG-22",
    cropType: "મગફળી",
    company: "જૂનાગઢ કૃષિ યુનિવર્સિટી",
    bagWeightKg: 35,
    defaultPurchaseRatePerMan: 2400,
    defaultSaleRatePerMan: 2800,
    defaultSaleRatePerBag: 4900,
    defaultSaleRatePerKg: 140,
    minStockAlertBags: 15
  },
  {
    id: "seed_2",
    varietyName: "GJG-23",
    cropType: "મગફળી",
    company: "સરદાર કૃષિ નગર",
    bagWeightKg: 35,
    defaultPurchaseRatePerMan: 2450,
    defaultSaleRatePerMan: 2900,
    defaultSaleRatePerBag: 5075,
    defaultSaleRatePerKg: 145,
    minStockAlertBags: 12
  },
  {
    id: "seed_3",
    varietyName: "GG-20",
    cropType: "મગફળી",
    company: "જૂનાગઢ એગ્રીકલ્ચર",
    bagWeightKg: 35,
    defaultPurchaseRatePerMan: 2350,
    defaultSaleRatePerMan: 2750,
    defaultSaleRatePerBag: 4813,
    defaultSaleRatePerKg: 138,
    minStockAlertBags: 10
  },
  {
    id: "seed_4",
    varietyName: "GJ-39",
    cropType: "જીરૂ",
    company: "ગુજરાત સીડ્સ નિગમ",
    bagWeightKg: 35,
    defaultPurchaseRatePerMan: 7600,
    defaultSaleRatePerMan: 8400,
    defaultSaleRatePerBag: 14700,
    defaultSaleRatePerKg: 420,
    minStockAlertBags: 8
  },
  {
    id: "seed_5",
    varietyName: "GW-496",
    cropType: "ઘઉં",
    company: "મહાગુજરાત સીડ્સ",
    bagWeightKg: 35,
    defaultPurchaseRatePerMan: 820,
    defaultSaleRatePerMan: 960,
    defaultSaleRatePerBag: 1680,
    defaultSaleRatePerKg: 48,
    minStockAlertBags: 20
  }
];

// Initial Stock based on 35 KG bags & 20 KG man calculation
const initialStock = [
  { id: "stk_1", seedId: "seed_1", varietyName: "GJG-22", bagWeightKg: 35, availableBags: 0, availableLooseKg: 0, totalWeightKg: 0, totalMan: 0, lastPurchaseRate: 2400 },
  { id: "stk_2", seedId: "seed_2", varietyName: "GJG-23", bagWeightKg: 35, availableBags: 0, availableLooseKg: 0, totalWeightKg: 0, totalMan: 0, lastPurchaseRate: 2450 },
  { id: "stk_3", seedId: "seed_3", varietyName: "GG-20", bagWeightKg: 35, availableBags: 0, availableLooseKg: 0, totalWeightKg: 0, totalMan: 0, lastPurchaseRate: 2350 },
  { id: "stk_4", seedId: "seed_4", varietyName: "GJ-39", bagWeightKg: 35, availableBags: 0, availableLooseKg: 0, totalWeightKg: 0, totalMan: 0, lastPurchaseRate: 7600 },
  { id: "stk_5", seedId: "seed_5", varietyName: "GW-496", bagWeightKg: 35, availableBags: 0, availableLooseKg: 0, totalWeightKg: 0, totalMan: 0, lastPurchaseRate: 820 }
];

// Unified Party Master (Farmers, Traders, Firms, Truck Owners)
const initialParties = [];

// Initial Sub Users
const initialSubUsers = [
  {
    uid: "admin_ravi_001",
    email: "ravi@nandiniseeds.com",
    displayName: "Ravi Chaudhary (મુખ્ય સંચાલક)",
    mobile: "9825012345",
    role: "admin",
    company: "SHREE NANDINI SEEDS",
    permissions: {
      farmerMaster: true,
      supplierMaster: true,
      partyMaster: true,
      seedMaster: true,
      purchaseEntry: true,
      salesBilling: true,
      stockManagement: true,
      payments: true,
      khataBook: true,
      rojmel: true,
      reports: true,
      userManagement: true,
      viewRates: true
    }
  },
  {
    uid: "subuser_bhargav_002",
    email: "bhargav@nandiniseeds.com",
    displayName: "Bhargav Chaudhary (સબ યુઝર)",
    mobile: "9876543210",
    role: "sub_user",
    company: "SHREE NANDINI SEEDS",
    permissions: {
      farmerMaster: true,
      supplierMaster: true,
      partyMaster: true,
      seedMaster: true,
      purchaseEntry: true,
      salesBilling: true,
      stockManagement: true,
      payments: true,
      khataBook: true,
      rojmel: true,
      reports: false,
      userManagement: false,
      viewRates: true
    }
  }
];

// Sample Purchases (Direct Farmer & Market Trader)
const initialPurchases = [];

// Initial Sales
const initialSales = [];

// Initial Party Ledger Transactions
const initialPartyTransactions = [];

// Initial Daily Rojmel (Day Book)
const initialRojmel = [];

// Auto-reset demo localStorage in users' browsers
const APP_STORAGE_VERSION = 'krushi_clean_tx_keep_khedut_v9_20261025';
if (typeof window !== 'undefined' && localStorage.getItem('krushi_data_version') !== APP_STORAGE_VERSION) {
  // 1. KEEP sn_seeds (5 varieties kept)
  if (!localStorage.getItem('sn_seeds')) {
    localStorage.setItem('sn_seeds', JSON.stringify(initialSeeds));
  }

  // 2. KEEP sn_parties (All Farmer and party master data kept intact)
  try {
    const savedParties = JSON.parse(localStorage.getItem('sn_parties') || '[]');
    if (Array.isArray(savedParties) && savedParties.length > 0) {
      const resetParties = savedParties.map(p => ({
        ...p,
        currentBalance: parseFloat(p.openingBalance || 0)
      }));
      localStorage.setItem('sn_parties', JSON.stringify(resetParties));
    }
  } catch (e) {
    console.error(e);
  }

  // 3. DELETE purchases, sales, transactions, rojmel cache
  localStorage.removeItem('sn_purchases');
  localStorage.removeItem('sn_sales');
  localStorage.removeItem('sn_party_transactions');
  localStorage.removeItem('sn_rojmel');

  // 4. Reset stock to 0
  localStorage.setItem('sn_stock', JSON.stringify(initialStock));

  localStorage.setItem('krushi_data_version', APP_STORAGE_VERSION);
}

// Deduplication helpers to prevent duplicate entries
const dedupeById = (items) => {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  return items.filter(it => {
    if (!it || !it.id || seen.has(it.id)) return false;
    seen.add(it.id);
    return true;
  });
};

const dedupeTransactions = (items) => {
  if (!Array.isArray(items)) return [];
  const seenIds = new Set();
  const seenVouchers = new Set();
  return items.filter(it => {
    if (!it) return false;
    if (it.id && seenIds.has(it.id)) return false;
    if (it.voucherNo && it.voucherType && it.partyId) {
      const vKey = `${it.voucherNo}_${it.voucherType}_${it.partyId}`;
      if (seenVouchers.has(vKey)) return false;
      seenVouchers.add(vKey);
    }
    if (it.id) seenIds.add(it.id);
    return true;
  });
};

const dedupePurchases = (items) => {
  if (!Array.isArray(items)) return [];
  const seenIds = new Set();
  const seenBills = new Set();
  return items.filter(it => {
    if (!it) return false;
    if (it.id && seenIds.has(it.id)) return false;
    if (it.billNo && seenBills.has(it.billNo)) return false;
    if (it.id) seenIds.add(it.id);
    if (it.billNo) seenBills.add(it.billNo);
    return true;
  });
};
// Compute exact net balance: (Opening DR - Opening CR) + Total Debit - Total Credit
export const computePartyBalance = (party, allTransactions = []) => {
  if (!party) return { currentBalance: 0, balanceType: 'dr' };
  const opAmt = parseFloat(party.openingBalance || 0);
  const opType = (party.openingBalanceType || party.balanceType || 'dr').toLowerCase();
  const opDr = opType === 'dr' ? opAmt : 0;
  const opCr = opType === 'cr' ? opAmt : 0;
  let net = opDr - opCr;

  allTransactions.forEach(tx => {
    if (tx.partyId === party.id) {
      net += (parseFloat(tx.debit || 0) - parseFloat(tx.credit || 0));
    }
  });

  return {
    currentBalance: Math.abs(net),
    balanceType: net < 0 ? 'cr' : 'dr'
  };
};

export const DataProvider = ({ children }) => {
  const [seeds, setSeeds] = useState(() => {
    const saved = localStorage.getItem('sn_seeds');
    if (!saved) return initialSeeds;
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return initialSeeds;
      return parsed.map(s => ({
        ...s,
        varietyName: (s.varietyName || '').replace(/\s*\(.*?\)\s*/g, '').trim() || s.varietyName,
        bagWeightKg: parseFloat(s.bagWeightKg) || 35,
        defaultPurchaseRatePerMan: parseFloat(s.defaultPurchaseRatePerMan) || 2400,
        defaultSaleRatePerMan: parseFloat(s.defaultSaleRatePerMan) || 2800
      }));
    } catch {
      return initialSeeds;
    }
  });

  const [stock, setStock] = useState(() => {
    const saved = localStorage.getItem('sn_stock');
    if (!saved) return initialStock;
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return initialStock;
      return parsed.map(item => ({
        ...item,
        varietyName: (item.varietyName || '').replace(/\s*\(.*?\)\s*/g, '').trim() || item.varietyName
      }));
    } catch {
      return initialStock;
    }
  });

  const [parties, setParties] = useState(() => {
    const saved = localStorage.getItem('sn_parties');
    return saved ? JSON.parse(saved) : initialParties;
  });

  const [purchases, setPurchases] = useState(() => {
    const saved = localStorage.getItem('sn_purchases');
    return saved ? JSON.parse(saved) : initialPurchases;
  });

  const [sales, setSales] = useState(() => {
    const saved = localStorage.getItem('sn_sales');
    return saved ? JSON.parse(saved) : initialSales;
  });

  const [partyTransactions, setPartyTransactions] = useState(() => {
    const saved = localStorage.getItem('sn_party_transactions');
    if (!saved) return initialPartyTransactions;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(tx => tx.voucherNo !== 'REC-562983') : initialPartyTransactions;
    } catch {
      return initialPartyTransactions;
    }
  });

  const [rojmel, setRojmel] = useState(() => {
    const saved = localStorage.getItem('sn_rojmel');
    if (!saved) return initialRojmel;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(r => r.voucherNo !== 'REC-562983') : initialRojmel;
    } catch {
      return initialRojmel;
    }
  });

  const [subUsers, setSubUsers] = useState(() => {
    const saved = localStorage.getItem('sn_subusers');
    return saved ? JSON.parse(saved) : initialSubUsers;
  });

  // Backward compatibility alias for legacy components
  const farmers = parties.filter(p => p.partyType === 'farmer');
  const suppliers = parties.filter(p => p.partyType === 'firm' || p.partyType === 'trader');

  // Database Live Status ('connected' | 'syncing' | 'offline')
  const [dbStatus, setDbStatus] = useState('syncing');

  const loadFromBackend = async (silent = false) => {
    try {
      if (!silent) setDbStatus('syncing');
      const res = await fetch('/api/initial-data');
      if (!res.ok) throw new Error('API fetch error: ' + res.status);
      const json = await res.json();
      if (json.success && json.data) {
        const {
          seeds: apiSeeds,
          parties: apiParties,
          stock: apiStock,
          purchases: apiPurchases,
          sales: apiSales,
          partyTransactions: apiTransactions,
          rojmel: apiRojmel
        } = json.data;

        if (Array.isArray(apiSeeds) && apiSeeds.length > 0) setSeeds(dedupeById(apiSeeds));
        if (Array.isArray(apiParties)) setParties(dedupeById(apiParties));
        if (Array.isArray(apiStock) && apiStock.length > 0) setStock(dedupeById(apiStock));
        if (Array.isArray(apiPurchases)) setPurchases(dedupePurchases(apiPurchases));
        if (Array.isArray(apiSales)) setSales(dedupeById(apiSales));
        if (Array.isArray(apiTransactions)) setPartyTransactions(dedupeTransactions(apiTransactions));
        if (Array.isArray(apiRojmel)) setRojmel(dedupeTransactions(apiRojmel));

        setDbStatus('connected');
      }
    } catch (err) {
      console.warn('Backend PostgreSQL sync error:', err.message);
      setDbStatus('offline');
    }
  };

  useEffect(() => {
    loadFromBackend();

    // Auto-sync from PostgreSQL every 4 seconds so all phones & browsers see live data
    const interval = setInterval(() => {
      loadFromBackend(true);
    }, 4000);

    const onFocus = () => loadFromBackend(true);
    window.addEventListener('focus', onFocus);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') loadFromBackend(true);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  // Local storage synchronization (fast cache)
  useEffect(() => {
    localStorage.setItem('sn_seeds', JSON.stringify(seeds));
    localStorage.setItem('sn_stock', JSON.stringify(stock));
    localStorage.setItem('sn_parties', JSON.stringify(parties));
    localStorage.setItem('sn_purchases', JSON.stringify(purchases));
    localStorage.setItem('sn_sales', JSON.stringify(sales));
    localStorage.setItem('sn_party_transactions', JSON.stringify(partyTransactions));
    localStorage.setItem('sn_rojmel', JSON.stringify(rojmel));
    localStorage.setItem('sn_subusers', JSON.stringify(subUsers));
  }, [seeds, stock, parties, purchases, sales, partyTransactions, rojmel, subUsers]);

  // ૧. નવો ખાતેદાર (Party) ઉમેરવો
  const addParty = (partyData) => {
    const prefix = partyData.partyType === 'farmer' ? 'KH' : 
                   partyData.partyType === 'firm' ? 'FIRM' : 
                   partyData.partyType === 'trader' ? 'TRD' : 
                   partyData.partyType === 'truck_owner' ? 'TRK' : 'PTY';
    const count = parties.filter(p => p.partyType === partyData.partyType).length + 1;
    const newParty = {
      id: partyData.id || ("pty_" + Date.now()),
      code: partyData.code || `${prefix}-${count.toString().padStart(3, '0')}`,
      openingBalance: parseFloat(partyData.openingBalance || 0),
      currentBalance: parseFloat(partyData.openingBalance || 0),
      balanceType: partyData.balanceType || (partyData.partyType === 'farmer' ? 'dr' : 'cr'),
      createdAt: new Date().toISOString(),
      ...partyData
    };

    setParties(prev => [newParty, ...prev]);

    // Send to PostgreSQL Backend
    fetch('/api/parties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newParty)
    }).then(res => res.json()).then(res => {
      if (res.success) loadFromBackend(true);
    }).catch(err => console.error('Error saving party to PostgreSQL:', err));

    return newParty;
  };

  const updateParty = (id, updatedData) => {
    setParties(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p));
    const target = parties.find(p => p.id === id);
    if (target) {
      const merged = { ...target, ...updatedData };
      fetch('/api/parties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged)
      }).then(res => res.json()).then(res => {
        if (res.success) loadFromBackend(true);
      }).catch(err => console.error('Error updating party in PostgreSQL:', err));
    }
  };

  // Backward-compatible wrappers for old farmer / supplier calls
  const addFarmer = (farmerData) => addParty({ ...farmerData, partyType: 'farmer' });
  const updateFarmer = updateParty;
  const addSupplier = (supplierData) => addParty({ ...supplierData, partyType: 'firm' });

  // ૨. બિયારણ જાત ઉમેરવી
  const addSeedProduct = (seedData) => {
    const newSeed = {
      id: seedData.id || ("seed_" + Date.now()),
      bagWeightKg: BAG_STD_KG, // 35 KG standard
      defaultSaleRatePerMan: parseFloat(seedData.defaultSaleRatePerMan || 0),
      defaultPurchaseRatePerMan: parseFloat(seedData.defaultPurchaseRatePerMan || 0),
      minStockAlertBags: parseInt(seedData.minStockAlertBags || 10),
      ...seedData
    };
    setSeeds(prev => [...prev, newSeed]);

    fetch('/api/seeds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSeed)
    }).then(res => res.json()).then(res => {
      if (res.success) loadFromBackend(true);
    }).catch(err => console.error('Error saving seed to PostgreSQL:', err));

    return newSeed;
  };

  // ૩. નવી ખરીદી એન્ટ્રી (Purchase Entry) – ખેડૂત / માર્કેટ પેઢી
  // Formula: Total KG = ((N - 1) * 35) + L, Total Man = Total KG / 20, Rate = ₹/મણ
  const recordPurchase = async (purchaseData) => {
    const timestamp = new Date();
    const purchaseId = "pur_" + Date.now();
    const billNumber = purchaseData.billNo || `SN-PUR-${timestamp.getFullYear()}-${(purchases.length + 1).toString().padStart(4, '0')}`;

    const purchaseRecord = {
      id: purchaseId,
      billNo: billNumber,
      createdAt: timestamp.toISOString(),
      ...purchaseData
    };

    // A. Update Stock Ledger for each Variety
    let updatedStock = [...stock];
    purchaseData.items.forEach(item => {
      const existingIdx = updatedStock.findIndex(s => s.seedId === item.seedId);
      const addedBags = parseInt(item.bags || 0);
      const addedKg = parseFloat(item.netWeightKg || 0);
      const addedMan = parseFloat(item.totalMan || (addedKg / MAN_STD_KG));

      if (existingIdx >= 0) {
        const cur = updatedStock[existingIdx];
        const newBags = cur.availableBags + addedBags;
        const newTotalKg = cur.totalWeightKg + addedKg;
        const newLoose = newTotalKg - (newBags * BAG_STD_KG);

        updatedStock[existingIdx] = {
          ...cur,
          availableBags: newBags,
          availableLooseKg: Math.max(0, newLoose),
          totalWeightKg: newTotalKg,
          totalMan: newTotalKg / MAN_STD_KG,
          lastPurchaseRate: parseFloat(item.ratePerMan || cur.lastPurchaseRate)
        };
      } else {
        updatedStock.push({
          id: "stock_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
          seedId: item.seedId,
          varietyName: item.varietyName,
          bagWeightKg: BAG_STD_KG,
          availableBags: addedBags,
          availableLooseKg: Math.max(0, addedKg - (addedBags * BAG_STD_KG)),
          totalWeightKg: addedKg,
          totalMan: addedMan,
          lastPurchaseRate: parseFloat(item.ratePerMan || 0)
        });
      }
    });

    // B. Update Party Balance & Create Ledger Transaction
    const partyId = purchaseData.partyId;
    const netTotal = parseFloat(purchaseData.netTotal || 0);
    const paidAmount = parseFloat(purchaseData.paidAmount || 0);
    const dueAmount = parseFloat(purchaseData.dueAmount || 0);

    const isFarmer = purchaseData.purchaseType === 'farmer';
    const partyName = purchaseData.partyName;

    // Party Ledger Entries:
    // 1. Goods Purchase Credit to Party
    const purchaseLedgerEntry = {
      id: "tx_" + Date.now() + "_pur",
      date: purchaseData.purchaseDate || timestamp.toISOString().split('T')[0],
      time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      partyId: partyId,
      partyName: partyName,
      partyType: isFarmer ? 'farmer' : 'firm',
      voucherNo: billNumber,
      voucherType: "purchase",
      particulars: `${isFarmer ? 'ખેડૂત ખરીદી' : 'માર્કેટ પેઢી ખરીદી'} (${purchaseData.items.map(it => `${it.varietyName} x ${it.bags} બેગ`).join(', ')})`,
      varietyName: purchaseData.items.map(it => it.varietyName).join(', '),
      bags: purchaseData.items.reduce((sum, it) => sum + parseInt(it.bags || 0), 0),
      weightKg: purchaseData.items.reduce((sum, it) => sum + parseFloat(it.netWeightKg || 0), 0),
      totalMan: purchaseData.items.reduce((sum, it) => sum + parseFloat(it.totalMan || 0), 0),
      ratePerMan: purchaseData.items[0]?.ratePerMan || 0,
      debit: 0,
      credit: netTotal, // ખાતેદારને આપવાના (જમા)
      paymentMode: purchaseData.paymentMode,
      remarks: purchaseData.remarks || (isFarmer ? 'સીધા ખેડૂત પાસેથી ખરીદી' : 'માર્કેટિંગ યાર્ડ ખરીદી'),
      billId: purchaseId
    };

    const newTxList = [purchaseLedgerEntry];

    // 2. If immediate payment was made, record Debit to Party Ledger
    if (paidAmount > 0) {
      newTxList.push({
        id: "tx_" + Date.now() + "_pay",
        date: purchaseData.purchaseDate || timestamp.toISOString().split('T')[0],
        time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        partyId: partyId,
        partyName: partyName,
        partyType: isFarmer ? 'farmer' : 'firm',
        voucherNo: `PAY-${billNumber.slice(-6)}`,
        voucherType: "payment",
        particulars: `ખરીદી સમયે ચૂકવેલ રકમ (${purchaseData.paymentMode === 'cash' ? 'રોકડ' : 'બેંક'})`,
        varietyName: "—",
        bags: 0,
        weightKg: 0,
        totalMan: 0,
        ratePerMan: 0,
        debit: paidAmount, // ચૂકવેલ રકમ ઉધાર
        credit: 0,
        paymentMode: purchaseData.paymentMode,
        remarks: `બિલ ${billNumber} પેટે ચૂકવણી`,
        billId: purchaseId
      });
    }

    // C. Update Party balance in Party Master
    setParties(prev => prev.map(p => {
      if (p.id === partyId) {
        const nextTxList = [...newTxList, ...partyTransactions];
        const res = computePartyBalance(p, nextTxList);
        return {
          ...p,
          currentBalance: res.currentBalance,
          balanceType: res.balanceType
        };
      }
      return p;
    }));

    // D. Daily Rojmel (Day Book) Entry
    const rojmelEntry = {
      id: "roj_" + Date.now(),
      date: purchaseData.purchaseDate || timestamp.toISOString().split('T')[0],
      time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      voucherNo: billNumber,
      voucherType: "purchase",
      partyName: partyName,
      particulars: `${isFarmer ? 'ખેડૂત ખરીદી' : 'પેઢી ખરીદી'}: ${purchaseData.items.map(it => `${it.varietyName} (${it.bags}B/${it.netWeightKg}KG)`).join(', ')}`,
      varietyName: purchaseData.items.map(it => it.varietyName).join(', '),
      bags: purchaseData.items.reduce((sum, it) => sum + parseInt(it.bags || 0), 0),
      weightKg: purchaseData.items.reduce((sum, it) => sum + parseFloat(it.netWeightKg || 0), 0),
      totalMan: purchaseData.items.reduce((sum, it) => sum + parseFloat(it.totalMan || 0), 0),
      credit: paidAmount > 0 ? 0 : netTotal,
      debit: paidAmount > 0 ? paidAmount : 0, // જો રોકડ/બેંક ચુકવાયા હોય તો બુકમાંથી Debit
      account: purchaseData.paymentMode === 'cash' ? 'cash' : 'bank',
      paymentMode: purchaseData.paymentMode,
      remarks: purchaseData.remarks || 'ખરીદી નોંધાઈ'
    };

    setStock(updatedStock);
    setPurchases(prev => [purchaseRecord, ...prev]);
    setPartyTransactions(prev => [...newTxList, ...prev]);
    setRojmel(prev => [rojmelEntry, ...prev]);

    // Send to PostgreSQL Backend
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchaseRecord)
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'ખરીદી સેવ કરવામાં ભૂલ આવી.');
      }
      if (data.billNo) {
        purchaseRecord.billNo = data.billNo;
      }
      await loadFromBackend(true);
      return purchaseRecord;
    } catch (err) {
      console.error('Error saving purchase to PostgreSQL:', err);
      await loadFromBackend(true);
      throw err;
    }
  };

  // ૪. વેચાણ બિલિંગ (Sales Billing)
  const recordSale = async (saleData) => {
    const timestamp = new Date();
    const saleId = "sale_" + Date.now();
    const billNumber = saleData.billNo || `SN-BILL-${timestamp.getFullYear()}-${(sales.length + 102).toString().padStart(5, '0')}`;

    const saleRecord = {
      id: saleId,
      billNo: billNumber,
      createdAt: timestamp.toISOString(),
      ...saleData
    };

    // Stock deduction
    let updatedStock = [...stock];
    saleData.items.forEach(item => {
      const idx = updatedStock.findIndex(s => s.seedId === item.seedId);
      if (idx >= 0) {
        const cur = updatedStock[idx];
        const soldBags = parseInt(item.bags || 0);
        const soldLoose = parseFloat(item.looseKg || 0);
        const totalSoldKg = parseFloat(item.totalWeightKg || (soldBags * BAG_STD_KG + soldLoose));

        const remTotalKg = Math.max(0, cur.totalWeightKg - totalSoldKg);
        const remBags = Math.floor(remTotalKg / BAG_STD_KG);
        const remLoose = remTotalKg % BAG_STD_KG;

        updatedStock[idx] = {
          ...cur,
          availableBags: remBags,
          availableLooseKg: remLoose,
          totalWeightKg: remTotalKg,
          totalMan: remTotalKg / MAN_STD_KG
        };
      }
    });

    // Ledger & Party Update
    const farmerId = saleData.farmerId;
    const netAmount = parseFloat(saleData.netAmount || 0);
    const paidAmount = parseFloat(saleData.paidAmount || 0);
    const dueAmount = parseFloat(saleData.dueAmount || 0);

    const saleLedgerEntry = {
      id: "tx_" + Date.now() + "_sale",
      date: saleData.billDate || timestamp.toISOString().split('T')[0],
      time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      partyId: farmerId,
      partyName: saleData.farmerName,
      partyType: "farmer",
      voucherNo: billNumber,
      voucherType: "sale",
      particulars: `બિયારણ વેચાણ બિલ (${saleData.items.map(it => `${it.varietyName} x ${it.bags} બેગ`).join(', ')})`,
      varietyName: saleData.items.map(it => it.varietyName).join(', '),
      bags: saleData.items.reduce((s, it) => s + parseInt(it.bags || 0), 0),
      weightKg: saleData.items.reduce((s, it) => s + parseFloat(it.totalWeightKg || 0), 0),
      totalMan: saleData.items.reduce((s, it) => s + parseFloat(it.totalMan || (it.totalWeightKg / MAN_STD_KG)), 0),
      ratePerMan: saleData.items[0]?.rate || 0,
      debit: netAmount, // ગ્રાહક પાસેથી લેવાના (ઉધાર)
      credit: paidAmount, // તે વખતે જમા થયેલ રકમ
      paymentMode: saleData.paymentMode,
      remarks: "વેચાણ બિલ",
      billId: saleId
    };

    // Rojmel entry
    const rojmelEntry = {
      id: "roj_" + Date.now() + "_sale",
      date: saleData.billDate || timestamp.toISOString().split('T')[0],
      time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      voucherNo: billNumber,
      voucherType: "sale",
      partyName: saleData.farmerName,
      particulars: `વેચાણ: ${saleData.items.map(it => `${it.varietyName} (${it.bags}B/${it.totalWeightKg}KG)`).join(', ')}`,
      varietyName: saleData.items.map(it => it.varietyName).join(', '),
      bags: saleData.items.reduce((s, it) => s + parseInt(it.bags || 0), 0),
      weightKg: saleData.items.reduce((s, it) => s + parseFloat(it.totalWeightKg || 0), 0),
      totalMan: saleData.items.reduce((s, it) => s + parseFloat(it.totalMan || (it.totalWeightKg / MAN_STD_KG)), 0),
      credit: paidAmount > 0 ? paidAmount : netAmount, // આવક
      debit: 0,
      account: saleData.paymentMode === 'cash' ? 'cash' : 'bank',
      paymentMode: saleData.paymentMode,
      remarks: "બિલ વેચાણ રોકડ જમા"
    };

    // Update Party current balance
    if (farmerId) {
      setParties(prev => prev.map(p => {
        if (p.id === farmerId) {
          const nextTxList = [saleLedgerEntry, ...partyTransactions];
          const res = computePartyBalance(p, nextTxList);
          return {
            ...p,
            currentBalance: res.currentBalance,
            balanceType: res.balanceType
          };
        }
        return p;
      }));
    }

    setStock(updatedStock);
    setSales(prev => [saleRecord, ...prev]);
    setPartyTransactions(prev => [saleLedgerEntry, ...prev]);
    setRojmel(prev => [rojmelEntry, ...prev]);

    // Send to PostgreSQL Backend
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleRecord)
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'વેચાણ બિલ સેવ કરવામાં ભૂલ આવી.');
      }
      if (data.billNo) {
        saleRecord.billNo = data.billNo;
      }
      await loadFromBackend(true);
      return saleRecord;
    } catch (err) {
      console.error('Error saving sale to PostgreSQL:', err);
      await loadFromBackend(true);
      throw err;
    }
  };

  // ૫. જમા-ઉધાર વાઉચર એન્ટ્રી (Receipt, Payment, Journal, Return, Expense)
  const recordVoucher = async (voucherData) => {
    const timestamp = new Date();
    const vId = "vch_" + Date.now();
    const amount = parseFloat(voucherData.amount || 0);

    const prefix = voucherData.type === 'receipt' ? 'REC' :
                   voucherData.type === 'payment' ? 'PAY' :
                   voucherData.type === 'journal' ? 'JRN' :
                   voucherData.type === 'return' ? 'RET' : 'EXP';
    const voucherNumber = voucherData.voucherNo || `${prefix}-${Date.now().toString().slice(-6)}`;

    const vRecord = {
      id: vId,
      voucherNo: voucherNumber,
      date: voucherData.date || timestamp.toISOString().split('T')[0],
      time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...voucherData,
      createdAt: timestamp.toISOString()
    };

    // Update party balance & create ledger entry
    if (voucherData.partyId) {
      const party = parties.find(p => p.id === voucherData.partyId);
      const isReceipt = voucherData.type === 'receipt';
      const isPayment = voucherData.type === 'payment';

      // Ledger record
      const ledgerEntry = {
        id: "tx_" + Date.now(),
        date: voucherData.date || timestamp.toISOString().split('T')[0],
        time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        partyId: voucherData.partyId,
        partyName: party?.name || voucherData.partyName,
        partyType: party?.partyType || 'farmer',
        voucherNo: voucherNumber,
        voucherType: voucherData.type,
        particulars: voucherData.remarks || (isReceipt ? 'રોકડ/બેંક રકમ જમા થઈ' : 'રકમ ચૂકવણી કરવામાં આવી'),
        varietyName: voucherData.varietyName || "—",
        bags: parseInt(voucherData.bags || 0),
        weightKg: parseFloat(voucherData.weightKg || 0),
        totalMan: parseFloat(voucherData.totalMan || 0),
        ratePerMan: parseFloat(voucherData.ratePerMan || 0),
        debit: isPayment ? amount : 0, // પેમેન્ટ હોય તો ખાતેદારને ડેબિટ
        credit: isReceipt ? amount : 0, // રિસીપ્ટ હોય તો ખાતેદારને ક્રેડિટ
        paymentMode: voucherData.paymentMode || 'cash',
        remarks: voucherData.remarks || ''
      };

      setParties(prev => prev.map(p => {
        if (p.id === voucherData.partyId) {
          const nextTxList = [ledgerEntry, ...partyTransactions];
          const res = computePartyBalance(p, nextTxList);
          return {
            ...p,
            currentBalance: res.currentBalance,
            balanceType: res.balanceType
          };
        }
        return p;
      }));

      setPartyTransactions(prev => [ledgerEntry, ...prev]);
    }

    // Rojmel Entry
    const rojEntry = {
      id: "roj_" + Date.now(),
      date: voucherData.date || timestamp.toISOString().split('T')[0],
      time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      voucherNo: voucherNumber,
      voucherType: voucherData.type,
      partyName: voucherData.partyName || 'પરચુરણ',
      particulars: voucherData.remarks || `${voucherData.type} એન્ટ્રી`,
      varietyName: voucherData.varietyName || '—',
      bags: parseInt(voucherData.bags || 0),
      weightKg: parseFloat(voucherData.weightKg || 0),
      totalMan: parseFloat(voucherData.totalMan || 0),
      credit: voucherData.type === 'receipt' ? amount : 0, // આવક
      debit: (voucherData.type === 'payment' || voucherData.type === 'expense') ? amount : 0, // જાવક
      account: voucherData.paymentMode === 'cash' ? 'cash' : 'bank',
      paymentMode: voucherData.paymentMode || 'cash',
      remarks: voucherData.remarks || ''
    };
    setRojmel(prev => [rojEntry, ...prev]);

    // Send to PostgreSQL Backend
    try {
      const res = await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vRecord)
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'વાઉચર સેવ કરવામાં ભૂલ આવી.');
      }
      if (data.voucherNo) {
        vRecord.voucherNo = data.voucherNo;
      }
      await loadFromBackend(true);
      return vRecord;
    } catch (err) {
      console.error('Error saving voucher to PostgreSQL:', err);
      await loadFromBackend(true);
      throw err;
    }
  };

  // Backward compatibility alias for payments
  const recordPayment = async (paymentData) => {
    return await recordVoucher({
      type: paymentData.type || 'receipt',
      partyId: paymentData.partyId,
      partyName: paymentData.partyName,
      amount: paymentData.amount,
      paymentMode: paymentData.paymentMode,
      referenceNo: paymentData.referenceNo,
      remarks: paymentData.remarks
    });
  };

  // ૬. વાઉચર / રસીદ / પેમેન્ટ ડિલીટ કરવું (Delete Voucher)
  const deleteVoucher = (voucherNo, txId) => {
    const targetTx = partyTransactions.find(tx => (voucherNo && tx.voucherNo === voucherNo) || (txId && tx.id === txId));
    if (targetTx && targetTx.partyId) {
      const amount = parseFloat(targetTx.credit || targetTx.debit || 0);
      const isReceipt = targetTx.voucherType === 'receipt';
      const isPayment = targetTx.voucherType === 'payment';

      setParties(prev => prev.map(p => {
        if (p.id === targetTx.partyId) {
          const remainingTx = partyTransactions.filter(tx => (voucherNo ? tx.voucherNo !== voucherNo : true) && (txId ? tx.id !== txId : true));
          const res = computePartyBalance(p, remainingTx);
          return {
            ...p,
            currentBalance: res.currentBalance,
            balanceType: res.balanceType
          };
        }
        return p;
      }));
    }

    setPartyTransactions(prev => prev.filter(tx => (voucherNo ? tx.voucherNo !== voucherNo : true) && (txId ? tx.id !== txId : true)));
    setRojmel(prev => prev.filter(r => voucherNo ? r.voucherNo !== voucherNo : true));

    // Send to PostgreSQL Backend
    if (voucherNo) {
      fetch(`/api/vouchers/${encodeURIComponent(voucherNo)}`, {
        method: 'DELETE'
      }).then(res => res.json()).then(res => {
        if (res.success) loadFromBackend(true);
      }).catch(err => console.error('Error deleting voucher from PostgreSQL:', err));
    }
  };

  // ૬b. ખરીદી બિલ ડિલીટ કરવું (Delete Purchase)
  const deletePurchase = async (billNo) => {
    if (!billNo) return false;
    try {
      const res = await fetch(`/api/purchases/${encodeURIComponent(billNo)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setPurchases(prev => prev.filter(p => p.billNo !== billNo));
        setPartyTransactions(prev => prev.filter(tx => tx.voucherNo !== billNo));
        setRojmel(prev => prev.filter(r => r.voucherNo !== billNo));
        await loadFromBackend(true);
        return true;
      } else {
        alert(data.error || 'ખરીદી બિલ ડિલીટ કરવામાં ભૂલ આવી.');
        return false;
      }
    } catch (err) {
      console.error('Error deleting purchase:', err);
      alert('સર્વર સાથે કનેક્ટ થઈ શક્યું નથી.');
      return false;
    }
  };

  // ૬c. વેચાણ બિલ ડિલીટ કરવું (Delete Sale)
  const deleteSale = async (billNo) => {
    if (!billNo) return false;
    try {
      const res = await fetch(`/api/sales/${encodeURIComponent(billNo)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setSales(prev => prev.filter(s => s.billNo !== billNo));
        setPartyTransactions(prev => prev.filter(tx => tx.voucherNo !== billNo));
        setRojmel(prev => prev.filter(r => r.voucherNo !== billNo));
        await loadFromBackend(true);
        return true;
      } else {
        alert(data.error || 'વેચાણ બિલ ડિલીટ કરવામાં ભૂલ આવી.');
        return false;
      }
    } catch (err) {
      console.error('Error deleting sale:', err);
      alert('સર્વર સાથે કનેક્ટ થઈ શક્યું નથી.');
      return false;
    }
  };

  // ૬. સ્ટોક સુધારો (Manual Stock Adjustment)
  const adjustStock = (stockId, bagDiff, kgDiff, reason) => {
    setStock(prev => prev.map(s => {
      if (s.id === stockId) {
        const newBags = Math.max(0, s.availableBags + bagDiff);
        const newLoose = Math.max(0, s.availableLooseKg + kgDiff);
        const total = (newBags * BAG_STD_KG) + newLoose;
        return {
          ...s,
          availableBags: newBags,
          availableLooseKg: newLoose,
          totalWeightKg: total,
          totalMan: total / MAN_STD_KG,
          adjustmentNote: reason
        };
      }
      return s;
    }));

    // Send to PostgreSQL Backend
    fetch('/api/stock/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stockId, bagDiff, kgDiff, reason })
    }).then(res => res.json()).then(res => {
      if (res.success) loadFromBackend(true);
    }).catch(err => console.error('Error adjusting stock in PostgreSQL:', err));
  };

  // ૭. સબ-યુઝર સંચાલન (Admin only)
  const createSubUser = (userData) => {
    const newUser = {
      uid: "user_" + Date.now(),
      company: "SHREE NANDINI SEEDS",
      createdAt: new Date().toISOString(),
      ...userData
    };
    setSubUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateSubUserPermissions = (uid, permissions) => {
    setSubUsers(prev => prev.map(u => u.uid === uid ? { ...u, permissions } : u));
  };

  const eraseAllData = () => {
    setSeeds([]);
    setStock([]);
    setParties([]);
    setPurchases([]);
    setSales([]);
    setPartyTransactions([]);
    setRojmel([]);
    localStorage.removeItem('sn_seeds');
    localStorage.removeItem('sn_stock');
    localStorage.removeItem('sn_parties');
    localStorage.removeItem('sn_purchases');
    localStorage.removeItem('sn_sales');
    localStorage.removeItem('sn_party_transactions');
    localStorage.removeItem('sn_rojmel');
  };

  return (
    <DataContext.Provider value={{
      companyName: "SHREE NANDINI SEEDS",
      BAG_STD_KG,
      MAN_STD_KG,
      seeds,
      stock,
      parties,
      farmers,
      suppliers,
      purchases,
      sales,
      partyTransactions,
      rojmel,
      subUsers,
      dbStatus,
      refreshData: () => loadFromBackend(false),
      addParty,
      updateParty,
      addFarmer,
      updateFarmer,
      addSupplier,
      addSeedProduct,
      recordPurchase,
      recordSale,
      recordVoucher,
      recordPayment,
      deleteVoucher,
      deletePurchase,
      deleteSale,
      adjustStock,
      createSubUser,
      updateSubUserPermissions,
      eraseAllData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
