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

// Seed Variety Master (35 KG Standard Bag Weight)
const initialSeeds = [
  {
    id: "seed_1",
    varietyName: "GJG-22 (ગુજરાત જૂનાગઢ મગફળી)",
    cropType: "મગફળી (Groundnut)",
    company: "જૂનાગઢ કૃષિ યુનિવર્સિટી",
    bagWeightKg: 35,
    defaultSaleRatePerMan: 2800, // ₹ પ્રતિ મણ (20 KG)
    defaultPurchaseRatePerMan: 2400,
    minStockAlertBags: 15
  },
  {
    id: "seed_2",
    varietyName: "GJG-23 (અર્ધવેલડી મગફળી)",
    cropType: "મગફળી (Groundnut)",
    company: "સરદાર કૃષિ નગર",
    bagWeightKg: 35,
    defaultSaleRatePerMan: 2900,
    defaultPurchaseRatePerMan: 2450,
    minStockAlertBags: 12
  },
  {
    id: "seed_3",
    varietyName: "GG-20 (ગુજરાત ગ્રાઉન્ડનટ - ૨૦)",
    cropType: "મગફળી (Groundnut)",
    company: "જૂનાગઢ એગ્રીકલ્ચર",
    bagWeightKg: 35,
    defaultSaleRatePerMan: 2750,
    defaultPurchaseRatePerMan: 2350,
    minStockAlertBags: 10
  },
  {
    id: "seed_4",
    varietyName: "GJ-39 (જીરૂ રિસર્ચ બિયારણ)",
    cropType: "જીરૂ (Cumin)",
    company: "ગુજરાત સીડ્સ નિગમ",
    bagWeightKg: 35,
    defaultSaleRatePerMan: 8400,
    defaultPurchaseRatePerMan: 7600,
    minStockAlertBags: 8
  },
  {
    id: "seed_5",
    varietyName: "GW-496 (ટુકડી ઘઉં બિયારણ)",
    cropType: "ઘઉં (Wheat)",
    company: "મહાગુજરાત સીડ્સ",
    bagWeightKg: 35,
    defaultSaleRatePerMan: 960,
    defaultPurchaseRatePerMan: 820,
    minStockAlertBags: 20
  }
];

// Initial Stock based on 35 KG bags & 20 KG man calculation
const initialStock = [
  {
    id: "stock_1",
    seedId: "seed_1",
    varietyName: "GJG-22 (ગુજરાત જૂનાગઢ મગફળી)",
    bagWeightKg: 35,
    availableBags: 150,
    availableLooseKg: 20,
    totalWeightKg: (150 * 35) + 20, // 5270 KG
    totalMan: ((150 * 35) + 20) / 20, // 263.5 મણ
    lastPurchaseRate: 2400
  },
  {
    id: "stock_2",
    seedId: "seed_2",
    varietyName: "GJG-23 (અર્ધવેલડી મગફળી)",
    bagWeightKg: 35,
    availableBags: 90,
    availableLooseKg: 15,
    totalWeightKg: (90 * 35) + 15, // 3165 KG
    totalMan: ((90 * 35) + 15) / 20, // 158.25 મણ
    lastPurchaseRate: 2450
  },
  {
    id: "stock_3",
    seedId: "seed_3",
    varietyName: "GG-20 (ગુજરાત ગ્રાઉન્ડનટ - ૨૦)",
    bagWeightKg: 35,
    availableBags: 110,
    availableLooseKg: 0,
    totalWeightKg: 110 * 35, // 3850 KG
    totalMan: (110 * 35) / 20, // 192.5 મણ
    lastPurchaseRate: 2350
  },
  {
    id: "stock_4",
    seedId: "seed_4",
    varietyName: "GJ-39 (જીરૂ રિસર્ચ બિયારણ)",
    bagWeightKg: 35,
    availableBags: 30,
    availableLooseKg: 10,
    totalWeightKg: (30 * 35) + 10, // 1060 KG
    totalMan: ((30 * 35) + 10) / 20, // 53 મણ
    lastPurchaseRate: 7600
  },
  {
    id: "stock_5",
    seedId: "seed_5",
    varietyName: "GW-496 (ટુકડી ઘઉં બિયારણ)",
    bagWeightKg: 35,
    availableBags: 180,
    availableLooseKg: 0,
    totalWeightKg: 180 * 35, // 6300 KG
    totalMan: (180 * 35) / 20, // 315 મણ
    lastPurchaseRate: 820
  }
];

// Unified Party Master (Farmers, Traders, Firms, Truck Owners)
const initialParties = [
  // ૧. ખેડૂતો (Farmers)
  {
    id: "party_f1",
    partyType: "farmer",
    code: "KH-001",
    name: "મનસુખભાઈ કાનજીભાઈ પટેલ",
    firmName: "",
    mobile: "9825123456",
    village: "વડાલ",
    taluka: "જૂનાગઢ",
    openingBalance: 12500, // Dr (લેવાના બાકી)
    balanceType: "dr",
    currentBalance: 12500,
    creditLimit: 50000
  },
  {
    id: "party_f2",
    partyType: "farmer",
    code: "KH-002",
    name: "ભરતભાઈ અરજણભાઈ આહીર",
    firmName: "",
    mobile: "9712345678",
    village: "ગોંડલ (ગુંદાળા)",
    taluka: "ગોંડલ",
    openingBalance: 0,
    balanceType: "dr",
    currentBalance: 0,
    creditLimit: 40000
  },
  {
    id: "party_f3",
    partyType: "farmer",
    code: "KH-003",
    name: "પ્રવીણભાઈ વાળા (ખેડૂત/ડીલર)",
    firmName: "",
    mobile: "9909012345",
    village: "ધારી",
    taluka: "અમરેલી",
    openingBalance: 34000,
    balanceType: "dr",
    currentBalance: 34000,
    creditLimit: 100000
  },
  {
    id: "party_f4",
    partyType: "farmer",
    code: "KH-004",
    name: "હસમુખભાઈ રવજીભાઈ ચોવટિયા",
    firmName: "",
    mobile: "9898124578",
    village: "વિસાવદર",
    taluka: "વિસાવદર",
    openingBalance: 0,
    balanceType: "dr",
    currentBalance: 0,
    creditLimit: 75000
  },

  // ૨. પેઢીઓ (Firms / Pethis)
  {
    id: "firm_1",
    partyType: "firm",
    code: "FIRM-01",
    name: "શ્રી ગણેશ ટ્રેડિંગ કંપની",
    firmName: "શ્રી ગણેશ ટ્રેડિંગ કંપની",
    mobile: "9426012345",
    village: "રાજકોટ માર્કેટિંગ યાર્ડ",
    taluka: "રાજકોટ",
    openingBalance: 85000, // Cr (આપવાના બાકી)
    balanceType: "cr",
    currentBalance: 85000
  },
  {
    id: "firm_2",
    partyType: "firm",
    code: "FIRM-02",
    name: "જય સરદાર એન્ટરપ્રાઇઝ",
    firmName: "જય સરદાર એન્ટરપ્રાઇઝ",
    mobile: "9824054321",
    village: "ગોંડલ માર્કેટ યાર્ડ",
    taluka: "ગોંડલ",
    openingBalance: 42000,
    balanceType: "cr",
    currentBalance: 42000
  },
  {
    id: "firm_3",
    partyType: "firm",
    code: "FIRM-03",
    name: "ઉમિયા એગ્રો એજન્સી",
    firmName: "ઉમિયા એગ્રો એજન્સી",
    mobile: "9824411223",
    village: "જૂનાગઢ માર્કેટ યાર્ડ",
    taluka: "જૂનાગઢ",
    openingBalance: 25000,
    balanceType: "cr",
    currentBalance: 25000
  },

  // ૩. વેપારીઓ (Traders - Linked to Firms for auto-filter)
  {
    id: "trader_1",
    partyType: "trader",
    code: "TRD-01",
    name: "રાજુભાઈ પટેલ (દલાલ/વેપારી)",
    firmId: "firm_1",
    firmName: "શ્રી ગણેશ ટ્રેડિંગ કંપની",
    mobile: "9879011223",
    village: "રાજકોટ",
    taluka: "રાજકોટ",
    openingBalance: 0,
    balanceType: "cr",
    currentBalance: 0
  },
  {
    id: "trader_2",
    partyType: "trader",
    code: "TRD-02",
    name: "વિપુલભાઈ શાહ (બ્રોકર)",
    firmId: "firm_1",
    firmName: "શ્રી ગણેશ ટ્રેડિંગ કંપની",
    mobile: "9825599887",
    village: "રાજકોટ",
    taluka: "રાજકોટ",
    openingBalance: 0,
    balanceType: "cr",
    currentBalance: 0
  },
  {
    id: "trader_3",
    partyType: "trader",
    code: "TRD-03",
    name: "અલ્પેશભાઈ ચોવટિયા",
    firmId: "firm_2",
    firmName: "જય સરદાર એન્ટરપ્રાઇઝ",
    mobile: "9428877665",
    village: "ગોંડલ",
    taluka: "ગોંડલ",
    openingBalance: 0,
    balanceType: "cr",
    currentBalance: 0
  },
  {
    id: "trader_4",
    partyType: "trader",
    code: "TRD-04",
    name: "દિનેશભાઈ દોંગા",
    firmId: "firm_3",
    firmName: "ઉમિયા એગ્રો એજન્સી",
    mobile: "9824133445",
    village: "જૂનાગઢ",
    taluka: "જૂનાગઢ",
    openingBalance: 0,
    balanceType: "cr",
    currentBalance: 0
  },

  // ૪. ટ્રક માલિકો (Truck Owners)
  {
    id: "truck_1",
    partyType: "truck_owner",
    code: "TRK-01",
    name: "જય ખોડિયાર ટ્રાન્સપોર્ટ (કાળુભાઈ)",
    firmName: "",
    mobile: "9825000111",
    village: "ગોંડલ",
    truckNo: "GJ-11-X-4589",
    openingBalance: 0,
    balanceType: "cr",
    currentBalance: 0
  },
  {
    id: "truck_2",
    partyType: "truck_owner",
    code: "TRK-02",
    name: "શ્રી રામ રોડવેઝ (વિજયભાઈ)",
    firmName: "",
    mobile: "9825000222",
    village: "રાજકોટ",
    truckNo: "GJ-03-BW-7812",
    openingBalance: 0,
    balanceType: "cr",
    currentBalance: 0
  }
];

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
const initialPurchases = [
  {
    id: "pur_001",
    purchaseType: "farmer", // farmer | market
    billNo: "SN-PUR-2026-0001",
    purchaseDate: "2026-10-24",
    partyId: "party_f1",
    partyName: "મનસુખભાઈ કાનજીભાઈ પટેલ",
    village: "વડાલ",
    mobile: "9825123456",
    truckNo: "",
    truckOwner: "",
    items: [
      {
        seedId: "seed_1",
        varietyName: "GJG-22 (ગુજરાત જૂનાગઢ મગફળી)",
        bags: 20,
        lastBagKg: 35, // 0 to 35
        netWeightKg: ((20 - 1) * 35) + 35, // 700 KG
        totalMan: 700 / 20, // 35 મણ
        ratePerMan: 2400, // ₹/મણ
        itemTotal: 35 * 2400 // 84,000
      }
    ],
    itemsSubTotal: 84000,
    majuriRatePerBag: 10,
    majuriAmount: 200, // 20 * 10
    marketCommission: 0,
    firmCommission: 0,
    bardanExpense: 0,
    totalExpenses: 200,
    netTotal: 84200,
    paidAmount: 50000,
    dueAmount: 34200,
    paymentMode: "bank",
    remarks: "સીધી ખેડૂત પાસેથી ખરીદી - બેંક ટ્રાન્સફર",
    createdBy: "Ravi Chaudhary"
  },
  {
    id: "pur_002",
    purchaseType: "market",
    billNo: "SN-PUR-2026-0002",
    purchaseDate: "2026-10-25",
    firmId: "firm_1",
    firmName: "શ્રી ગણેશ ટ્રેડિંગ કંપની",
    traderId: "trader_1",
    traderName: "રાજુભાઈ પટેલ (દલાલ/વેપારી)",
    partyId: "firm_1",
    partyName: "શ્રી ગણેશ ટ્રેડિંગ કંપની (રાજુભાઈ પટેલ)",
    village: "રાજકોટ માર્કેટિંગ યાર્ડ",
    mobile: "9879011223",
    truckNo: "GJ-11-X-4589",
    truckOwner: "જય ખોડિયાર ટ્રાન્સપોર્ટ",
    items: [
      {
        seedId: "seed_2",
        varietyName: "GJG-23 (અર્ધવેલડી મગફળી)",
        bags: 30,
        lastBagKg: 30, // 29 bags * 35 + 30 = 1045 KG
        netWeightKg: ((30 - 1) * 35) + 30, // 1045 KG
        totalMan: 1045 / 20, // 52.25 મણ
        ratePerMan: 2450,
        itemTotal: Math.round(52.25 * 2450) // 128,013
      }
    ],
    itemsSubTotal: 128013,
    marketCommission: 1280,
    firmCommission: 640,
    bardanExpense: 900,
    majuriAmount: 600,
    totalExpenses: 3420,
    netTotal: 131433,
    paidAmount: 100000,
    dueAmount: 31433,
    paymentMode: "bank",
    remarks: "માર્કેટ યાર્ડમાંથી માલ ખરીદ્યો",
    createdBy: "Ravi Chaudhary"
  }
];

// Initial Sales
const initialSales = [
  {
    id: "sale_001",
    billNo: "SN-BILL-2026-00101",
    billDate: "2026-10-25",
    farmerId: "party_f1",
    farmerName: "મનસુખભાઈ કાનજીભાઈ પટેલ",
    farmerMobile: "9825123456",
    farmerVillage: "વડાલ",
    items: [
      {
        seedId: "seed_1",
        varietyName: "GJG-22 (ગુજરાત જૂનાગઢ મગફળી)",
        bagWeightKg: 35,
        bags: 2,
        looseKg: 10,
        totalWeightKg: 80, // 2*35 + 10
        totalMan: 4, // 80 / 20
        rateUnit: "man",
        rate: 2800,
        itemTotal: 4 * 2800 // 11,200
      }
    ],
    subTotal: 11200,
    majuriAmount: 50,
    discount: 250,
    netAmount: 11000,
    paidAmount: 6000,
    dueAmount: 5000,
    paymentMode: "cash_and_credit",
    createdBy: "Bhargav Chaudhary",
    createdAt: new Date().toISOString()
  }
];

// Initial Party Ledger Transactions
const initialPartyTransactions = [
  {
    id: "tx_001",
    date: "2026-10-24",
    time: "10:30 AM",
    partyId: "party_f1",
    partyName: "મનસુખભાઈ કાનજીભાઈ પટેલ",
    partyType: "farmer",
    voucherNo: "SN-PUR-2026-0001",
    voucherType: "purchase",
    particulars: "બિયારણ ખરીદી (ખેડૂત પાસેથી)",
    varietyName: "GJG-22",
    bags: 20,
    weightKg: 700,
    totalMan: 35,
    ratePerMan: 2400,
    debit: 0,
    credit: 84200, // જમા (આપવાના)
    paymentMode: "—",
    remarks: "૨૦ બેગ ખરીદી",
    billId: "pur_001"
  },
  {
    id: "tx_002",
    date: "2026-10-24",
    time: "11:00 AM",
    partyId: "party_f1",
    partyName: "મનસુખભાઈ કાનજીભાઈ પટેલ",
    partyType: "farmer",
    voucherNo: "REC-PAY-001",
    voucherType: "payment",
    particulars: "રોકડ/બેંક ચુકવણી ખરીદી પેટે",
    varietyName: "—",
    bags: 0,
    weightKg: 0,
    totalMan: 0,
    ratePerMan: 0,
    debit: 50000, // ઉધાર (ખાતેદારના ખાતામાં ડેબિટ / ચૂકવ્યા)
    credit: 0,
    paymentMode: "bank",
    remarks: "NEFT ચુકવણી",
    billId: "pur_001"
  },
  {
    id: "tx_003",
    date: "2026-10-25",
    time: "02:15 PM",
    partyId: "party_f1",
    partyName: "મનસુખભાઈ કાનજીભાઈ પટેલ",
    partyType: "farmer",
    voucherNo: "SN-BILL-2026-00101",
    voucherType: "sale",
    particulars: "બિયારણ વેચાણ બિલ",
    varietyName: "GJG-22",
    bags: 2,
    weightKg: 80,
    totalMan: 4,
    ratePerMan: 2800,
    debit: 11000, // ઉધાર (લેવાના)
    credit: 6000, // રોકડ જમા
    paymentMode: "cash",
    remarks: "૨ બેગ + ૧૦ કિલો વેચાણ",
    billId: "sale_001"
  }
];

// Initial Daily Rojmel (Day Book)
const initialRojmel = [
  {
    id: "roj_001",
    date: "2026-10-24",
    time: "10:30 AM",
    voucherNo: "SN-PUR-2026-0001",
    voucherType: "purchase",
    partyName: "મનસુખભાઈ કાનજીભાઈ પટેલ",
    particulars: "GJG-22 ખરીદી (૨૦ બેગ, ૭૦૦ KG)",
    varietyName: "GJG-22",
    bags: 20,
    weightKg: 700,
    totalMan: 35,
    credit: 84200, // ખરીદી ક્રેડિટ
    debit: 0,
    account: "purchase",
    paymentMode: "credit",
    remarks: "ખેડૂત ખરીદી બિલ"
  },
  {
    id: "roj_002",
    date: "2026-10-24",
    time: "11:00 AM",
    voucherNo: "REC-PAY-001",
    voucherType: "payment",
    partyName: "મનસુખભાઈ કાનજીભાઈ પટેલ",
    particulars: "બેંક ટ્રાન્સફર ચૂકવણી",
    varietyName: "—",
    bags: 0,
    weightKg: 0,
    totalMan: 0,
    credit: 0,
    debit: 50000, // બેંકમાંથી પૈસા ગયા (Debit)
    account: "bank",
    paymentMode: "bank",
    remarks: "HDFC Bank ટ્રાન્સફર"
  },
  {
    id: "roj_003",
    date: "2026-10-25",
    time: "02:15 PM",
    voucherNo: "SN-BILL-2026-00101",
    voucherType: "sale",
    partyName: "મનસુખભાઈ કાનજીભાઈ પટેલ",
    particulars: "GJG-22 વેચાણ (૨ બેગ, ૮૦ KG)",
    varietyName: "GJG-22",
    bags: 2,
    weightKg: 80,
    totalMan: 4,
    credit: 6000, // રોકડ આવક (Credit into Cash Book)
    debit: 0,
    account: "cash",
    paymentMode: "cash",
    remarks: "રોકડ વેચાણ જમા"
  }
];

export const DataProvider = ({ children }) => {
  const [seeds, setSeeds] = useState(() => {
    const saved = localStorage.getItem('sn_seeds');
    return saved ? JSON.parse(saved) : initialSeeds;
  });

  const [stock, setStock] = useState(() => {
    const saved = localStorage.getItem('sn_stock');
    return saved ? JSON.parse(saved) : initialStock;
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
    return saved ? JSON.parse(saved) : initialPartyTransactions;
  });

  const [rojmel, setRojmel] = useState(() => {
    const saved = localStorage.getItem('sn_rojmel');
    return saved ? JSON.parse(saved) : initialRojmel;
  });

  const [subUsers, setSubUsers] = useState(() => {
    const saved = localStorage.getItem('sn_subusers');
    return saved ? JSON.parse(saved) : initialSubUsers;
  });

  // Backward compatibility alias for legacy components
  const farmers = parties.filter(p => p.partyType === 'farmer');
  const suppliers = parties.filter(p => p.partyType === 'firm' || p.partyType === 'trader');

  // Local storage synchronization
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
      id: "pty_" + Date.now(),
      code: `${prefix}-${count.toString().padStart(3, '0')}`,
      openingBalance: parseFloat(partyData.openingBalance || 0),
      currentBalance: parseFloat(partyData.openingBalance || 0),
      balanceType: partyData.balanceType || (partyData.partyType === 'farmer' ? 'dr' : 'cr'),
      createdAt: new Date().toISOString(),
      ...partyData
    };

    setParties(prev => [newParty, ...prev]);
    return newParty;
  };

  const updateParty = (id, updatedData) => {
    setParties(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p));
  };

  // Backward-compatible wrappers for old farmer / supplier calls
  const addFarmer = (farmerData) => addParty({ ...farmerData, partyType: 'farmer' });
  const updateFarmer = updateParty;
  const addSupplier = (supplierData) => addParty({ ...supplierData, partyType: 'firm' });

  // ૨. બિયારણ જાત ઉમેરવી
  const addSeedProduct = (seedData) => {
    const newSeed = {
      id: "seed_" + Date.now(),
      bagWeightKg: BAG_STD_KG, // 35 KG standard
      defaultSaleRatePerMan: parseFloat(seedData.defaultSaleRatePerMan || 0),
      defaultPurchaseRatePerMan: parseFloat(seedData.defaultPurchaseRatePerMan || 0),
      minStockAlertBags: parseInt(seedData.minStockAlertBags || 10),
      ...seedData
    };
    setSeeds(prev => [...prev, newSeed]);
    return newSeed;
  };

  // ૩. નવી ખરીદી એન્ટ્રી (Purchase Entry) – ખેડૂત / માર્કેટ પેઢી
  // Formula: Total KG = ((N - 1) * 35) + L, Total Man = Total KG / 20, Rate = ₹/મણ
  const recordPurchase = (purchaseData) => {
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
        // If farmer supplies seeds, we owe them (due amount increases credit/decreases debit)
        const netChange = dueAmount; 
        const newBalance = (p.currentBalance || 0) + netChange;
        return {
          ...p,
          currentBalance: newBalance,
          balanceType: newBalance >= 0 ? (p.balanceType || 'cr') : 'dr'
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
      credit: paidAmount > 0 ? 0 : 0,
      debit: paidAmount > 0 ? paidAmount : 0, // જો રોકડ/બેંક ચુકવાયા હોય તો બુકમાંથી Debit
      account: purchaseData.paymentMode === 'cash' ? 'cash' : 'bank',
      paymentMode: purchaseData.paymentMode,
      remarks: purchaseData.remarks || 'ખરીદી નોંધાઈ'
    };

    setStock(updatedStock);
    setPurchases(prev => [purchaseRecord, ...prev]);
    setPartyTransactions(prev => [...newTxList, ...prev]);
    setRojmel(prev => [rojmelEntry, ...prev]);

    return purchaseRecord;
  };

  // ૪. વેચાણ બિલિંગ (Sales Billing)
  const recordSale = (saleData) => {
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
      credit: paidAmount, // રોકડ/બેંકમાં રકમ આવી (Credit into Cash/Bank book)
      debit: 0,
      account: saleData.paymentMode === 'cash' ? 'cash' : 'bank',
      paymentMode: saleData.paymentMode,
      remarks: "બિલ વેચાણ રોકડ જમા"
    };

    // Update Party current balance
    if (dueAmount > 0 && farmerId) {
      setParties(prev => prev.map(p => {
        if (p.id === farmerId) {
          return { ...p, currentBalance: (p.currentBalance || 0) + dueAmount };
        }
        return p;
      }));
    }

    setStock(updatedStock);
    setSales(prev => [saleRecord, ...prev]);
    setPartyTransactions(prev => [saleLedgerEntry, ...prev]);
    setRojmel(prev => [rojmelEntry, ...prev]);

    return saleRecord;
  };

  // ૫. જમા-ઉધાર વાઉચર એન્ટ્રી (Receipt, Payment, Journal, Return, Expense)
  const recordVoucher = (voucherData) => {
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

      setParties(prev => prev.map(p => {
        if (p.id === voucherData.partyId) {
          let updatedBal = p.currentBalance || 0;
          if (isReceipt) {
            updatedBal = Math.max(0, updatedBal - amount);
          } else if (isPayment) {
            updatedBal = Math.max(0, updatedBal - amount);
          }
          return { ...p, currentBalance: updatedBal };
        }
        return p;
      }));

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

    return vRecord;
  };

  // Backward compatibility alias for payments
  const recordPayment = (paymentData) => {
    return recordVoucher({
      type: 'receipt',
      partyId: paymentData.partyId,
      partyName: paymentData.partyName,
      amount: paymentData.amount,
      paymentMode: paymentData.paymentMode,
      remarks: paymentData.remarks
    });
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
      adjustStock,
      createSubUser,
      updateSubUserPermissions
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
