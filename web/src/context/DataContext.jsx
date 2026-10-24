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

// Initial sample data in Gujarati for seeds, farmers, suppliers & stock
const initialSeeds = [
  {
    id: "seed_1",
    varietyName: "GJG-22 (ગુજરાત જૂનાગઢ મગફળી)",
    cropType: "મગફળી (Groundnut)",
    company: "જૂનાગઢ કૃષિ યુનિવર્સિટી",
    bagWeightKg: 50,
    defaultSaleRatePerKg: 140,
    defaultSaleRatePerBag: 7000,
    minStockAlertBags: 10
  },
  {
    id: "seed_2",
    varietyName: "GJG-23 (અર્ધવેલડી મગફળી)",
    cropType: "મગફળી (Groundnut)",
    company: "સરદાર કૃષિ નગર",
    bagWeightKg: 50,
    defaultSaleRatePerKg: 145,
    defaultSaleRatePerBag: 7250,
    minStockAlertBags: 8
  },
  {
    id: "seed_3",
    varietyName: "GJ-39 (જીરૂ રિસર્ચ બિયારણ)",
    cropType: "જીરૂ (Cumin)",
    company: "ગુજરાત સીડ્સ નિગમ",
    bagWeightKg: 30,
    defaultSaleRatePerKg: 420,
    defaultSaleRatePerBag: 12600,
    minStockAlertBags: 5
  },
  {
    id: "seed_4",
    varietyName: "GW-496 (ટુકડી ઘઉં બિયારણ)",
    cropType: "ઘઉં (Wheat)",
    company: "મહાગુજરાત સીડ્સ",
    bagWeightKg: 40,
    defaultSaleRatePerKg: 48,
    defaultSaleRatePerBag: 1920,
    minStockAlertBags: 15
  }
];

const initialStock = [
  {
    id: "stock_1",
    seedId: "seed_1",
    varietyName: "GJG-22 (ગુજરાત જૂનાગઢ મગફળી)",
    bagWeightKg: 50,
    availableBags: 120,
    availableLooseKg: 25,
    totalWeightKg: (120 * 50) + 25, // 6025 kg
    lastPurchaseRate: 122
  },
  {
    id: "stock_2",
    seedId: "seed_2",
    varietyName: "GJG-23 (અર્ધવેલડી મગફળી)",
    bagWeightKg: 50,
    availableBags: 80,
    availableLooseKg: 40,
    totalWeightKg: (80 * 50) + 40, // 4040 kg
    lastPurchaseRate: 128
  },
  {
    id: "stock_3",
    seedId: "seed_3",
    varietyName: "GJ-39 (જીરૂ રિસર્ચ બિયારણ)",
    bagWeightKg: 30,
    availableBags: 24,
    availableLooseKg: 10,
    totalWeightKg: (24 * 30) + 10, // 730 kg
    lastPurchaseRate: 380
  },
  {
    id: "stock_4",
    seedId: "seed_4",
    varietyName: "GW-496 (ટુકડી ઘઉં બિયારણ)",
    bagWeightKg: 40,
    availableBags: 150,
    availableLooseKg: 0,
    totalWeightKg: 150 * 40, // 6000 kg
    lastPurchaseRate: 41
  }
];

const initialFarmers = [
  {
    id: "farmer_1",
    code: "KH-001",
    name: "મનસુખભાઈ કાનજીભાઈ પટેલ",
    mobile: "9825123456",
    village: "વડાલ",
    taluka: "જૂનાગઢ",
    farmerType: "farmer",
    currentBalance: 12500, // બાકી ઉધાર
    creditLimit: 50000
  },
  {
    id: "farmer_2",
    code: "KH-002",
    name: "ભરતભાઈ અરજણભાઈ આહીર",
    mobile: "9712345678",
    village: "ગોંડલ (ગુંદાળા)",
    taluka: "ગોંડલ",
    farmerType: "farmer",
    currentBalance: 0,
    creditLimit: 40000
  },
  {
    id: "farmer_3",
    code: "KH-003",
    name: "પ્રવીણભાઈ વાળા (ડીલર)",
    mobile: "9909012345",
    village: "ધારી",
    taluka: "અમરેલી",
    farmerType: "dealer",
    currentBalance: 34000,
    creditLimit: 100000
  }
];

const initialSuppliers = [
  {
    id: "sup_1",
    code: "SUP-01",
    companyName: "ગુજરાત રાજ્ય બીજ નિગમ (GSSCL)",
    contactPerson: "દિનેશભાઈ શાહ",
    mobile: "9426012345",
    city: "ગાંધીનગર",
    currentBalance: 85000
  },
  {
    id: "sup_2",
    code: "SUP-02",
    companyName: "જૂનાગઢ સીડ્સ પ્રોડ્યુસર કંપની",
    contactPerson: "કેતનભાઈ વ્યાસ",
    mobile: "9824054321",
    city: "જૂનાગઢ",
    currentBalance: 42000
  }
];

const initialSubUsers = [
  {
    uid: "subuser_staff_002",
    email: "staff@krushitrade.com",
    displayName: "રમેશભાઈ પટેલ (કાઉન્ટર સ્ટાફ)",
    mobile: "9876543210",
    role: "sub_user",
    permissions: {
      farmerMaster: true,
      supplierMaster: false,
      seedMaster: true,
      purchaseEntry: false,
      salesBilling: true,
      stockManagement: true,
      payments: true,
      reports: false,
      userManagement: false,
      viewRates: false
    }
  }
];

const initialSales = [
  {
    id: "sale_001",
    billNo: "KT-2026-00101",
    billDate: new Date().toISOString().split('T')[0],
    farmerId: "farmer_1",
    farmerName: "મનસુખભાઈ કાનજીભાઈ પટેલ",
    farmerMobile: "9825123456",
    farmerVillage: "વડાલ",
    items: [
      {
        seedId: "seed_1",
        varietyName: "GJG-22 (ગુજરાત જૂનાગઢ મગફળી)",
        bagWeightKg: 50,
        bags: 2,
        looseKg: 10,
        totalWeightKg: 110,
        rateUnit: "kg",
        rate: 140,
        itemTotal: 15400
      }
    ],
    subTotal: 15400,
    discount: 400,
    netAmount: 15000,
    paidAmount: 10000,
    dueAmount: 5000,
    paymentMode: "cash_and_credit",
    createdBy: "રમેશભાઈ (સ્ટાફ)",
    createdAt: new Date().toISOString()
  }
];

export const DataProvider = ({ children }) => {
  const [seeds, setSeeds] = useState(() => {
    const saved = localStorage.getItem('krushi_seeds');
    return saved ? JSON.parse(saved) : initialSeeds;
  });

  const [stock, setStock] = useState(() => {
    const saved = localStorage.getItem('krushi_stock');
    return saved ? JSON.parse(saved) : initialStock;
  });

  const [farmers, setFarmers] = useState(() => {
    const saved = localStorage.getItem('krushi_farmers');
    return saved ? JSON.parse(saved) : initialFarmers;
  });

  const [suppliers, setSuppliers] = useState(() => {
    const saved = localStorage.getItem('krushi_suppliers');
    return saved ? JSON.parse(saved) : initialSuppliers;
  });

  const [sales, setSales] = useState(() => {
    const saved = localStorage.getItem('krushi_sales');
    return saved ? JSON.parse(saved) : initialSales;
  });

  const [purchases, setPurchases] = useState(() => {
    const saved = localStorage.getItem('krushi_purchases');
    return saved ? JSON.parse(saved) : [];
  });

  const [payments, setPayments] = useState(() => {
    const saved = localStorage.getItem('krushi_payments');
    return saved ? JSON.parse(saved) : [];
  });

  const [subUsers, setSubUsers] = useState(() => {
    const saved = localStorage.getItem('krushi_subusers');
    return saved ? JSON.parse(saved) : initialSubUsers;
  });

  // Save to localStorage whenever state updates
  useEffect(() => {
    localStorage.setItem('krushi_seeds', JSON.stringify(seeds));
    localStorage.setItem('krushi_stock', JSON.stringify(stock));
    localStorage.setItem('krushi_farmers', JSON.stringify(farmers));
    localStorage.setItem('krushi_suppliers', JSON.stringify(suppliers));
    localStorage.setItem('krushi_sales', JSON.stringify(sales));
    localStorage.setItem('krushi_purchases', JSON.stringify(purchases));
    localStorage.setItem('krushi_payments', JSON.stringify(payments));
    localStorage.setItem('krushi_subusers', JSON.stringify(subUsers));
  }, [seeds, stock, farmers, suppliers, sales, purchases, payments, subUsers]);

  // ૧. ખેડૂત ઉમેરવો / સુધારવો
  const addFarmer = (farmerData) => {
    const newFarmer = {
      id: "farmer_" + Date.now(),
      code: "KH-" + (farmers.length + 1).toString().padStart(3, '0'),
      currentBalance: parseFloat(farmerData.openingBalance || 0),
      ...farmerData
    };
    setFarmers(prev => [newFarmer, ...prev]);
    return newFarmer;
  };

  const updateFarmer = (id, updatedData) => {
    setFarmers(prev => prev.map(f => f.id === id ? { ...f, ...updatedData } : f));
  };

  // ૨. સપ્લાયર ઉમેરવો
  const addSupplier = (supplierData) => {
    const newSupplier = {
      id: "sup_" + Date.now(),
      code: "SUP-" + (suppliers.length + 1).toString().padStart(2, '0'),
      currentBalance: parseFloat(supplierData.openingBalance || 0),
      ...supplierData
    };
    setSuppliers(prev => [newSupplier, ...prev]);
    return newSupplier;
  };

  // ૩. બિયારણ જાત ઉમેરવી
  const addSeedProduct = (seedData) => {
    const newSeed = {
      id: "seed_" + Date.now(),
      ...seedData,
      bagWeightKg: parseFloat(seedData.bagWeightKg || 50),
      defaultSaleRatePerKg: parseFloat(seedData.defaultSaleRatePerKg || 0),
      defaultSaleRatePerBag: parseFloat(seedData.defaultSaleRatePerBag || 0),
      minStockAlertBags: parseInt(seedData.minStockAlertBags || 10)
    };
    setSeeds(prev => [...prev, newSeed]);
    return newSeed;
  };

  // ૪. ખરીદી એન્ટ્રી (Purchase Entry) - સ્ટોક અને સપ્લાયર લેજર વધારો
  const recordPurchase = (purchaseData) => {
    const newPurchaseId = "pur_" + Date.now();
    const purchaseRecord = {
      id: newPurchaseId,
      ...purchaseData,
      createdAt: new Date().toISOString()
    };

    // Update or Insert Stock for each item
    let updatedStock = [...stock];
    purchaseData.items.forEach(item => {
      const existingIdx = updatedStock.findIndex(
        s => s.seedId === item.seedId
      );

      const addedBags = parseInt(item.bags || 0);
      const addedKg = parseFloat(item.netWeightKg || 0);

      if (existingIdx >= 0) {
        const current = updatedStock[existingIdx];
        const newBags = current.availableBags + addedBags;
        const newTotalKg = current.totalWeightKg + addedKg;
        const looseKg = newTotalKg - (newBags * current.bagWeightKg);

        updatedStock[existingIdx] = {
          ...current,
          availableBags: newBags,
          availableLooseKg: Math.max(0, looseKg),
          totalWeightKg: newTotalKg,
          lastPurchaseRate: parseFloat(item.purchaseRate || current.lastPurchaseRate)
        };
      } else {
        updatedStock.push({
          id: "stock_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
          seedId: item.seedId,
          varietyName: item.varietyName,
          bagWeightKg: parseFloat(item.bagWeightKg || 50),
          availableBags: addedBags,
          availableLooseKg: 0,
          totalWeightKg: addedKg,
          lastPurchaseRate: parseFloat(item.purchaseRate || 0)
        });
      }
    });

    // Update Supplier Balance (due amount)
    if (purchaseData.dueAmount > 0 && purchaseData.supplierId) {
      setSuppliers(prev => prev.map(s => {
        if (s.id === purchaseData.supplierId) {
          return { ...s, currentBalance: s.currentBalance + parseFloat(purchaseData.dueAmount) };
        }
        return s;
      }));
    }

    setStock(updatedStock);
    setPurchases(prev => [purchaseRecord, ...prev]);
    return purchaseRecord;
  };

  // ૫. વેચાણ અને બિલિંગ (Sales & Billing) - સ્ટોક ઘટાડો અને ખેડૂત લેજર અપડેટ
  const recordSale = (saleData) => {
    const newSaleId = "sale_" + Date.now();
    const billNumber = "KT-2026-" + (sales.length + 102).toString().padStart(5, '0');

    const saleRecord = {
      id: newSaleId,
      billNo: billNumber,
      billDate: saleData.billDate || new Date().toISOString().split('T')[0],
      ...saleData,
      createdAt: new Date().toISOString()
    };

    // Deduct stock for each item sold
    let updatedStock = [...stock];
    saleData.items.forEach(item => {
      const idx = updatedStock.findIndex(
        s => s.seedId === item.seedId
      );

      if (idx >= 0) {
        const current = updatedStock[idx];
        const soldBags = parseInt(item.bags || 0);
        const soldLooseKg = parseFloat(item.looseKg || 0);
        const totalSoldKg = parseFloat(item.totalWeightKg || (soldBags * current.bagWeightKg + soldLooseKg));

        const remTotalKg = Math.max(0, current.totalWeightKg - totalSoldKg);
        const remBags = Math.floor(remTotalKg / current.bagWeightKg);
        const remLoose = remTotalKg % current.bagWeightKg;

        updatedStock[idx] = {
          ...current,
          availableBags: remBags,
          availableLooseKg: remLoose,
          totalWeightKg: remTotalKg
        };
      }
    });

    // Update Farmer Balance (if due amount > 0)
    if (saleData.dueAmount > 0 && saleData.farmerId) {
      setFarmers(prev => prev.map(f => {
        if (f.id === saleData.farmerId) {
          return { ...f, currentBalance: f.currentBalance + parseFloat(saleData.dueAmount) };
        }
        return f;
      }));
    }

    setStock(updatedStock);
    setSales(prev => [saleRecord, ...prev]);
    return saleRecord;
  };

  // ૬. જમા-ઉધાર ચુકવણી (Payment / Udhar Receipt)
  const recordPayment = (paymentData) => {
    const newPayment = {
      id: "pay_" + Date.now(),
      receiptNo: "REC-" + (payments.length + 1).toString().padStart(4, '0'),
      date: new Date().toISOString().split('T')[0],
      ...paymentData,
      createdAt: new Date().toISOString()
    };

    const amt = parseFloat(paymentData.amount || 0);

    if (paymentData.partyType === 'farmer') {
      setFarmers(prev => prev.map(f => {
        if (f.id === paymentData.partyId) {
          return { ...f, currentBalance: Math.max(0, f.currentBalance - amt) };
        }
        return f;
      }));
    } else if (paymentData.partyType === 'supplier') {
      setSuppliers(prev => prev.map(s => {
        if (s.id === paymentData.partyId) {
          return { ...s, currentBalance: Math.max(0, s.currentBalance - amt) };
        }
        return s;
      }));
    }

    setPayments(prev => [newPayment, ...prev]);
    return newPayment;
  };

  // ૭. સ્ટોક એડજસ્ટમેન્ટ (Manual Stock Adjustment - દા.ત. ડેમેજ, વધ-ઘટ)
  const adjustStock = (stockId, bagDiff, kgDiff, reason) => {
    setStock(prev => prev.map(s => {
      if (s.id === stockId) {
        const newBags = Math.max(0, s.availableBags + bagDiff);
        const newLoose = Math.max(0, s.availableLooseKg + kgDiff);
        const total = (newBags * s.bagWeightKg) + newLoose;
        return {
          ...s,
          availableBags: newBags,
          availableLooseKg: newLoose,
          totalWeightKg: total,
          adjustmentNote: reason
        };
      }
      return s;
    }));
  };

  // ૮. સબ યુઝર બનાવવો (Sub-user creation - Admin only)
  const createSubUser = (userData) => {
    const newUser = {
      uid: "user_" + Date.now(),
      ...userData,
      createdAt: new Date().toISOString()
    };
    setSubUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateSubUserPermissions = (uid, permissions) => {
    setSubUsers(prev => prev.map(u => u.uid === uid ? { ...u, permissions } : u));
  };

  return (
    <DataContext.Provider value={{
      seeds,
      stock,
      farmers,
      suppliers,
      sales,
      purchases,
      payments,
      subUsers,
      addFarmer,
      updateFarmer,
      addSupplier,
      addSeedProduct,
      recordPurchase,
      recordSale,
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
