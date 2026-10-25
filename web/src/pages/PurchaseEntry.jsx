import React, { useState, useId } from 'react';
import { useData, BAG_STD_KG, MAN_STD_KG } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { PurchaseBillModal } from '../components/PurchaseBillModal';
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Truck, 
  UserPlus, 
  X, 
  Eye, 
  Printer, 
  Filter, 
  Calendar, 
  FileText, 
  Calculator,
  Building2,
  UserCheck
} from 'lucide-react';

export const PurchaseEntry = ({ onPurchaseCompleted }) => {
  const { 
    companyName, 
    seeds, 
    parties, 
    purchases, 
    recordPurchase, 
    addParty 
  } = useData();
  const { userProfile } = useAuth();

  // Active Mode: 'farmer' (સીધા ખેડૂત પાસેથી) or 'market' (માર્કેટ પેઢી/વેપારી પાસેથી)
  const [purchaseType, setPurchaseType] = useState('farmer');

  // Form Fields - Common
  const [billNo, setBillNo] = useState(`SN-PUR-${new Date().getFullYear()}-${(purchases.length + 1).toString().padStart(4, '0')}`);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('bank'); // cash | bank | credit | partial
  const [paidAmount, setPaidAmount] = useState('');
  const [remarks, setRemarks] = useState('');

  // Mode 1: Farmer Specific Fields
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [farmerVillage, setFarmerVillage] = useState('');
  const [farmerMobile, setFarmerMobile] = useState('');
  const [majuriPerBag, setMajuriPerBag] = useState(10); // ₹ per bag

  // Mode 2: Market Specific Fields
  const [selectedFirmId, setSelectedFirmId] = useState('');
  const [selectedTraderId, setSelectedTraderId] = useState('');
  const [marketVillage, setMarketVillage] = useState('');
  const [truckNo, setTruckNo] = useState('');
  const [truckOwner, setTruckOwner] = useState('');
  const [marketCommission, setMarketCommission] = useState('');
  const [firmCommission, setFirmCommission] = useState('');
  const [bardanExpense, setBardanExpense] = useState('');
  const [marketMajuri, setMarketMajuri] = useState('');

  // Items in current bill
  const [items, setItems] = useState([]);

  // New Item Row being added
  const [currentItem, setCurrentItem] = useState({
    seedId: '',
    varietyName: '',
    bags: 10,
    lastBagKg: 35, // default 35 KG
    netWeightKg: 350,
    totalMan: 17.5,
    ratePerMan: 2400
  });

  // Validation & Feedback UI
  const [itemError, setItemError] = useState('');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Preview & Print Modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [viewedBill, setViewedBill] = useState(null);

  // Quick Add Party Modal
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickPartyType, setQuickPartyType] = useState('farmer');
  const [quickPartyForm, setQuickPartyForm] = useState({
    name: '',
    firmName: '',
    firmId: '',
    mobile: '',
    village: '',
    openingBalance: 0
  });

  // Filtered party lists
  const farmersList = parties.filter(p => p.partyType === 'farmer');
  const firmsList = parties.filter(p => p.partyType === 'firm');
  // Traders auto-filtered by selected Firm!
  const tradersList = parties.filter(p => p.partyType === 'trader' && (!selectedFirmId || p.firmId === selectedFirmId));

  // Handle Farmer Select
  const handleFarmerChange = (fId) => {
    setSelectedFarmerId(fId);
    const f = parties.find(p => p.id === fId);
    if (f) {
      setFarmerVillage(f.village || '');
      setFarmerMobile(f.mobile || '');
    }
  };

  // Handle Firm Select
  const handleFirmChange = (fId) => {
    setSelectedFirmId(fId);
    setSelectedTraderId(''); // reset trader
    const firm = parties.find(p => p.id === fId);
    if (firm) {
      setMarketVillage(firm.village || '');
    }
  };

  // Handle Trader Select
  const handleTraderChange = (tId) => {
    setSelectedTraderId(tId);
    const trd = parties.find(p => p.id === tId);
    if (trd && !selectedFirmId && trd.firmId) {
      setSelectedFirmId(trd.firmId);
    }
    if (trd && trd.village) {
      setMarketVillage(trd.village);
    }
  };

  // Handle Seed Selection
  const handleSeedSelect = (seedId) => {
    const seed = seeds.find(s => s.id === seedId);
    if (seed) {
      const b = currentItem.bags || 10;
      const l = currentItem.lastBagKg !== undefined ? currentItem.lastBagKg : 35;
      const totalKg = b > 0 ? ((b - 1) * BAG_STD_KG) + l : 0;
      const man = totalKg / MAN_STD_KG;

      setCurrentItem({
        seedId: seed.id,
        varietyName: seed.varietyName,
        bags: b,
        lastBagKg: l,
        netWeightKg: totalKg,
        totalMan: Number(man.toFixed(2)),
        ratePerMan: seed.defaultPurchaseRatePerMan || 2400
      });
    } else {
      setCurrentItem(prev => ({ ...prev, seedId: '' }));
    }
  };

  // Handle Bags & Last Bag Weight Input Changes with standard formula
  // Formula: Total KG = ((N - 1) * 35) + L
  const handleWeightCalculation = (bagsVal, lastBagVal, rateVal) => {
    setItemError('');
    const b = parseInt(bagsVal) || 0;
    const l = parseFloat(lastBagVal);
    const r = parseFloat(rateVal) || 0;

    if (l < 0 || l > BAG_STD_KG) {
      setItemError(`ચેતવણી: છેલ્લી બેગનું વજન ૦ થી ${BAG_STD_KG} KG ની વચ્ચે જ હોવું જોઈએ!`);
    }

    const validL = isNaN(l) ? 35 : Math.max(0, Math.min(BAG_STD_KG, l));
    const totalKg = b > 0 ? ((b - 1) * BAG_STD_KG) + validL : 0;
    const totalMan = totalKg / MAN_STD_KG;

    setCurrentItem(prev => ({
      ...prev,
      bags: b,
      lastBagKg: isNaN(l) ? '' : l,
      netWeightKg: totalKg,
      totalMan: Number(totalMan.toFixed(2)),
      ratePerMan: r
    }));
  };

  // Add Item to Bill
  const handleAddItem = (e) => {
    e.preventDefault();
    setItemError('');
    if (!currentItem.seedId) {
      setItemError("કૃપા કરીને બિયારણની જાત પસંદ કરો.");
      return;
    }
    if (currentItem.bags <= 0) {
      setItemError("બેગની સંખ્યા ૧ કે તેથી વધુ હોવી જરૂરી છે.");
      return;
    }
    const lastKg = parseFloat(currentItem.lastBagKg);
    if (isNaN(lastKg) || lastKg < 0 || lastKg > BAG_STD_KG) {
      setItemError(`છેલ્લી બેગનું વજન ૦ થી ${BAG_STD_KG} KG સુધીનું હોવું જોઈએ.`);
      return;
    }

    const calculatedKg = ((currentItem.bags - 1) * BAG_STD_KG) + lastKg;
    const calculatedMan = calculatedKg / MAN_STD_KG;
    const itemTotal = calculatedMan * currentItem.ratePerMan;

    const newItemRow = {
      seedId: currentItem.seedId,
      varietyName: currentItem.varietyName,
      bags: currentItem.bags,
      lastBagKg: lastKg,
      netWeightKg: calculatedKg,
      totalMan: Number(calculatedMan.toFixed(2)),
      ratePerMan: currentItem.ratePerMan,
      itemTotal: Math.round(itemTotal)
    };

    setItems(prev => [...prev, newItemRow]);

    // Reset item input
    setCurrentItem({
      seedId: '',
      varietyName: '',
      bags: 10,
      lastBagKg: 35,
      netWeightKg: 350,
      totalMan: 17.5,
      ratePerMan: 2400
    });
  };

  const handleRemoveItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Calculations for bill totals
  const totalBagsCount = items.reduce((sum, it) => sum + parseInt(it.bags || 0), 0);
  const totalWeightKg = items.reduce((sum, it) => sum + parseFloat(it.netWeightKg || 0), 0);
  const totalManCount = items.reduce((sum, it) => sum + parseFloat(it.totalMan || 0), 0);
  const itemsSubTotal = items.reduce((sum, it) => sum + it.itemTotal, 0);

  // Expenses Calculation
  let calculatedExpenses = 0;
  let farmerMajuriTotal = 0;
  if (purchaseType === 'farmer') {
    farmerMajuriTotal = totalBagsCount * (parseFloat(majuriPerBag) || 0);
    calculatedExpenses = farmerMajuriTotal;
  } else {
    calculatedExpenses = (parseFloat(marketCommission) || 0) +
                         (parseFloat(firmCommission) || 0) +
                         (parseFloat(bardanExpense) || 0) +
                         (parseFloat(marketMajuri) || 0);
  }

  const grandNetTotal = itemsSubTotal + calculatedExpenses;
  const numPaid = paidAmount === '' ? grandNetTotal : (parseFloat(paidAmount) || 0);
  const dueAmount = Math.max(0, grandNetTotal - numPaid);

  // Validate before opening preview
  const handleOpenPreview = (e) => {
    e.preventDefault();
    setFormError('');

    if (purchaseType === 'farmer') {
      if (!selectedFarmerId) {
        setFormError("કૃપા કરીને ખેડૂત પસંદ કરો.");
        return;
      }
    } else {
      if (!selectedFirmId) {
        setFormError("કૃપા કરીને માર્કેટ પેઢી પસંદ કરો.");
        return;
      }
    }

    if (items.length === 0) {
      setFormError("બિલમાં ઓછામાં ઓછી ૧ બિયારણ જાત ઉમેરવી ફરજિયાત છે.");
      return;
    }

    setPreviewModalOpen(true);
  };

  // Save Confirmed Purchase
  const handleConfirmSavePurchase = () => {
    const isFarmer = purchaseType === 'farmer';
    const farmer = parties.find(p => p.id === selectedFarmerId);
    const firm = parties.find(p => p.id === selectedFirmId);
    const trader = parties.find(p => p.id === selectedTraderId);

    const partyId = isFarmer ? selectedFarmerId : (selectedTraderId || selectedFirmId);
    const partyName = isFarmer 
      ? (farmer?.name || 'ખેડૂત') 
      : `${firm?.name || ''}${trader ? ` (${trader.name})` : ''}`;

    const purchasePayload = {
      purchaseType, // 'farmer' | 'market'
      billNo: billNo || `SN-PUR-${Date.now().toString().slice(-6)}`,
      purchaseDate,
      partyId,
      partyName,
      village: isFarmer ? farmerVillage : marketVillage,
      mobile: isFarmer ? farmerMobile : (trader?.mobile || firm?.mobile || ''),
      firmId: !isFarmer ? selectedFirmId : '',
      firmName: !isFarmer ? firm?.name : '',
      traderId: !isFarmer ? selectedTraderId : '',
      traderName: !isFarmer ? trader?.name : '',
      truckNo: !isFarmer ? truckNo : '',
      truckOwner: !isFarmer ? truckOwner : '',
      items,
      itemsSubTotal,
      majuriRatePerBag: isFarmer ? (parseFloat(majuriPerBag) || 0) : 0,
      majuriAmount: isFarmer ? farmerMajuriTotal : (parseFloat(marketMajuri) || 0),
      marketCommission: !isFarmer ? (parseFloat(marketCommission) || 0) : 0,
      firmCommission: !isFarmer ? (parseFloat(firmCommission) || 0) : 0,
      bardanExpense: !isFarmer ? (parseFloat(bardanExpense) || 0) : 0,
      totalExpenses: calculatedExpenses,
      netTotal: grandNetTotal,
      paidAmount: numPaid,
      dueAmount,
      paymentMode,
      remarks,
      createdBy: userProfile?.displayName || 'Ravi Chaudhary (Main Admin)'
    };

    const saved = recordPurchase(purchasePayload);
    setPreviewModalOpen(false);
    setSuccessMsg(`ખરીદી બિલ નં. ${saved.billNo} સફળતાપૂર્વક સેવ થયું છે અને ગોડાઉન સ્ટોક તથા ખાતાવહીમાં અસર અપાઈ ગઈ છે!`);
    setViewedBill(saved);

    // Reset Form
    setItems([]);
    setBillNo(`SN-PUR-${new Date().getFullYear()}-${(purchases.length + 2).toString().padStart(4, '0')}`);
    setPaidAmount('');
    setRemarks('');
    setTruckNo('');
    setTruckOwner('');
    setMarketCommission('');
    setFirmCommission('');
    setBardanExpense('');
    setMarketMajuri('');

    if (onPurchaseCompleted) {
      // optional callback
    }
  };

  // Quick Party Creation
  const handleSaveQuickParty = (e) => {
    e.preventDefault();
    if (!quickPartyForm.name) return;

    const created = addParty({
      partyType: quickPartyType,
      name: quickPartyForm.name,
      firmName: quickPartyForm.firmName,
      firmId: quickPartyForm.firmId,
      mobile: quickPartyForm.mobile,
      village: quickPartyForm.village,
      openingBalance: parseFloat(quickPartyForm.openingBalance || 0),
      balanceType: quickPartyType === 'farmer' ? 'dr' : 'cr'
    });

    if (quickPartyType === 'farmer') {
      setSelectedFarmerId(created.id);
      setFarmerVillage(created.village || '');
      setFarmerMobile(created.mobile || '');
    } else if (quickPartyType === 'firm') {
      setSelectedFirmId(created.id);
      setMarketVillage(created.village || '');
    } else if (quickPartyType === 'trader') {
      setSelectedTraderId(created.id);
    }

    setShowQuickAddModal(false);
    setQuickPartyForm({ name: '', firmName: '', firmId: '', mobile: '', village: '', openingBalance: 0 });
  };

  return (
    <div className="page-body">
      
      {/* Page Title & Standards Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.25rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ backgroundColor: '#064e3b', color: '#6ee7b7', padding: '0.45rem', borderRadius: '10px', display: 'flex' }}>
              <ShoppingCart size={22} />
            </span>
            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#064e3b', margin: 0 }}>
                બિયારણ ખરીદી મોડ્યુલ (Purchase Entry)
              </h2>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.2rem' }}>
                {companyName} • બોરી (૩૫ KG) & મણ (૨૦ KG) ગણતરી સાથે ખરીદી નોંધ
              </div>
            </div>
          </div>
        </div>

        {/* Standard Info Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', color: '#064e3b' }}>
            ૧ બોરી = ૩૫ KG
          </div>
          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', color: '#1e40af' }}>
            ૧ મણ = ૨૦ KG
          </div>
          <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', color: '#9a3412' }}>
            ભાવ: ₹ પ્રતિ મણ (₹/મણ)
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div style={{
          backgroundColor: '#dcfce7',
          border: '1px solid #86efac',
          padding: '0.85rem 1.25rem',
          borderRadius: '10px',
          color: '#166534',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={20} />
            <span style={{ fontWeight: '600', fontSize: '0.92rem' }}>{successMsg}</span>
          </div>
          {viewedBill && (
            <button
              onClick={() => setViewedBill(viewedBill)}
              className="btn btn-primary"
              style={{ padding: '0.3rem 0.8rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Printer size={15} />
              બિલ જુઓ / પ્રિન્ટ કરો
            </button>
          )}
        </div>
      )}

      {/* Error Banner */}
      {formError && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          padding: '0.85rem 1.25rem',
          borderRadius: '10px',
          color: '#991b1b',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={20} />
          <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{formError}</span>
        </div>
      )}

      {/* Purchase Type Selector (2 Tabs) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        backgroundColor: '#ffffff',
        padding: '0.5rem',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <button
          type="button"
          onClick={() => { setPurchaseType('farmer'); setFormError(''); }}
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '9px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            transition: 'all 0.15s ease',
            backgroundColor: purchaseType === 'farmer' ? '#064e3b' : '#f8fafc',
            color: purchaseType === 'farmer' ? '#ffffff' : '#475569',
            boxShadow: purchaseType === 'farmer' ? '0 4px 12px rgba(6, 78, 59, 0.25)' : 'none'
          }}>
          <UserCheck size={20} />
          વિકલ્પ ૧: ખેડૂત પાસેથી સીધી ખરીદી (Direct Farmer)
        </button>

        <button
          type="button"
          onClick={() => { setPurchaseType('market'); setFormError(''); }}
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '9px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            transition: 'all 0.15s ease',
            backgroundColor: purchaseType === 'market' ? '#064e3b' : '#f8fafc',
            color: purchaseType === 'market' ? '#ffffff' : '#475569',
            boxShadow: purchaseType === 'market' ? '0 4px 12px rgba(6, 78, 59, 0.25)' : 'none'
          }}>
          <Building2 size={20} />
          વિકલ્પ ૨: માર્કેટની પેઢી/વેપારી પાસેથી ખરીદી (Market / Trader)
        </button>
      </div>

      <form onSubmit={handleOpenPreview}>
        
        {/* Step 1: Party & Bill Information */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>૧. {purchaseType === 'farmer' ? 'ખેડૂત વિગત (Farmer Master)' : 'પેઢી / વેપારી & વાહન વિગત'}</span>
            </h3>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setQuickPartyType(purchaseType === 'farmer' ? 'farmer' : 'firm');
                setShowQuickAddModal(true);
              }}
              style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <UserPlus size={15} />
              + નવો ખાતેદાર ઉમેરો
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            
            {/* Purchase Bill No */}
            <div className="form-group">
              <label className="form-label">ખરીદી બિલ નંબર (Auto-generated) *</label>
              <input
                type="text"
                className="form-control"
                value={billNo}
                onChange={(e) => setBillNo(e.target.value)}
                required
                style={{ fontWeight: '700', color: '#064e3b' }}
              />
            </div>

            {/* Purchase Date */}
            <div className="form-group">
              <label className="form-label">ખરીદી તારીખ *</label>
              <input
                type="date"
                className="form-control"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
              />
            </div>

            {/* Mode 1: Farmer Selection */}
            {purchaseType === 'farmer' ? (
              <>
                <div className="form-group">
                  <label className="form-label">ખેડૂતનું નામ પસંદ કરો *</label>
                  <select
                    className="form-control"
                    value={selectedFarmerId}
                    onChange={(e) => handleFarmerChange(e.target.value)}
                    required>
                    <option value="">-- ખેડૂત પસંદ કરો ({farmersList.length}) --</option>
                    {farmersList.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.village || 'ગામ દર્શાવેલ નથી'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">ગામ (Village - Auto-filled)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={farmerVillage}
                    onChange={(e) => setFarmerVillage(e.target.value)}
                    placeholder="ગામ"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">મોબાઇલ નંબર (Mobile)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={farmerMobile}
                    onChange={(e) => setFarmerMobile(e.target.value)}
                    placeholder="મોબાઇલ નંબર"
                  />
                </div>
              </>
            ) : (
              /* Mode 2: Market Firm, Trader & Truck */
              <>
                <div className="form-group">
                  <label className="form-label">પેઢીનું નામ પસંદ કરો (Firm Master) *</label>
                  <select
                    className="form-control"
                    value={selectedFirmId}
                    onChange={(e) => handleFirmChange(e.target.value)}
                    required>
                    <option value="">-- માર્કેટ પેઢી પસંદ કરો ({firmsList.length}) --</option>
                    {firmsList.map(firm => (
                      <option key={firm.id} value={firm.id}>
                        {firm.name} ({firm.village})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    વેપારીનું નામ (Auto-filtered by Selected Firm)
                  </label>
                  <select
                    className="form-control"
                    value={selectedTraderId}
                    onChange={(e) => handleTraderChange(e.target.value)}>
                    <option value="">
                      {selectedFirmId 
                        ? `-- પેઢી સાથે જોડાયેલ વેપારી પસંદ કરો (${tradersList.length}) --`
                        : `-- પહેલા પેઢી પસંદ કરો --`}
                    </option>
                    {tradersList.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.village || t.firmName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">ગામ / યાર્ડ (Village/Market)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={marketVillage}
                    onChange={(e) => setMarketVillage(e.target.value)}
                    placeholder="દા.ત. રાજકોટ માર્કેટિંગ યાર્ડ"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ટ્રક નંબર (Truck No)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={truckNo}
                    onChange={(e) => setTruckNo(e.target.value)}
                    placeholder="દા.ત. GJ-11-X-4589"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ટ્રક માલિકનું નામ (Truck Owner)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={truckOwner}
                    onChange={(e) => setTruckOwner(e.target.value)}
                    placeholder="દા.ત. જય ખોડિયાર ટ્રાન્સપોર્ટ"
                  />
                </div>
              </>
            )}

          </div>
        </div>

        {/* Step 2: Multi-Item Add (Seed Varieties) */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">
              ૨. માલની જાત (Variety), બેગ, વજન & ₹/મણ ભાવ
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              એક બિલમાં એકથી વધુ જાતો ઉમેરી શકાય છે
            </span>
          </div>

          {/* Item Input Row with Live Formula */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.25rem'
          }}>
            {itemError && (
              <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={16} />
                <span>{itemError}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
              
              {/* Variety Selection */}
              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label">માલની જાત પસંદ કરો (Master) *</label>
                <select
                  className="form-control"
                  value={currentItem.seedId}
                  onChange={(e) => handleSeedSelect(e.target.value)}>
                  <option value="">-- બિયારણ જાત પસંદ કરો ({seeds.length}) --</option>
                  {seeds.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.varietyName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Total Bags N */}
              <div>
                <label className="form-label">કુલ બેગ (Bags) *</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={currentItem.bags}
                  onChange={(e) => handleWeightCalculation(e.target.value, currentItem.lastBagKg, currentItem.ratePerMan)}
                />
              </div>

              {/* Last Bag Weight L */}
              <div>
                <label className="form-label" style={{ color: '#064e3b', fontWeight: '700' }}>
                  છેલ્લી બેગ વજન (KG) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="35"
                  className="form-control"
                  value={currentItem.lastBagKg}
                  onChange={(e) => handleWeightCalculation(currentItem.bags, e.target.value, currentItem.ratePerMan)}
                  placeholder="0 થી 35"
                />
                <small style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  સામાન્ય રીતે 0 થી 35 KG
                </small>
              </div>

              {/* Auto Total KG */}
              <div>
                <label className="form-label">કુલ વજન (KG) [Auto]</label>
                <div style={{
                  padding: '0.55rem 0.75rem',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '6px',
                  fontWeight: '700',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  textAlign: 'right'
                }}>
                  {currentItem.netWeightKg} KG
                </div>
                <small style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  ((N-1)×35) + L
                </small>
              </div>

              {/* Auto Total Man */}
              <div>
                <label className="form-label">કુલ મણ (KG÷20) [Auto]</label>
                <div style={{
                  padding: '0.55rem 0.75rem',
                  backgroundColor: '#ecfdf5',
                  borderRadius: '6px',
                  fontWeight: '800',
                  color: '#064e3b',
                  border: '1px solid #a7f3d0',
                  textAlign: 'right'
                }}>
                  {currentItem.totalMan} મણ
                </div>
                <small style={{ fontSize: '0.7rem', color: '#059669' }}>
                  કુલ KG ÷ 20
                </small>
              </div>

              {/* Rate per Man */}
              <div>
                <label className="form-label">ભાવ પ્રતિ મણ (₹/મણ) *</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={currentItem.ratePerMan}
                  onChange={(e) => handleWeightCalculation(currentItem.bags, currentItem.lastBagKg, e.target.value)}
                  placeholder="દા.ત. 2400"
                />
                <small style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  ₹/મણ (૨૦ KG નો ભાવ)
                </small>
              </div>

              {/* Add Item Button */}
              <div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <Plus size={18} />
                  + ઉમેરો (Add Item)
                </button>
              </div>

            </div>

            {/* Live Calculation Preview Banner */}
            {currentItem.seedId && currentItem.bags > 0 && (
              <div style={{
                marginTop: '1rem',
                backgroundColor: '#ffffff',
                border: '1px dashed #059669',
                borderRadius: '8px',
                padding: '0.65rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.85rem'
              }}>
                <div>
                  <span style={{ color: '#64748b' }}>ગણતરી સમજ: </span>
                  <b>(({currentItem.bags} - 1) × 35 KG) + {currentItem.lastBagKg || 0} KG = {currentItem.netWeightKg} KG</b>
                  {' → '}
                  <span style={{ color: '#064e3b', fontWeight: '700' }}>{currentItem.totalMan} મણ</span>
                </div>
                <div style={{ fontWeight: '800', color: '#064e3b', fontSize: '0.95rem' }}>
                  અંદાજિત રકમ: ₹{Math.round(currentItem.totalMan * currentItem.ratePerMan).toLocaleString('en-IN')}
                </div>
              </div>
            )}
          </div>

          {/* Table of Added Items */}
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px dashed #e2e8f0' }}>
              બિલમાં હજુ સુધી કોઈ જાત ઉમેરેલ નથી. ઉપરથી બિયારણ જાત અને વજન નાખી "+ ઉમેરો" બટન દબાવો.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.82rem', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem' }}>ક્રમ</th>
                    <th style={{ padding: '0.75rem' }}>બિયારણ જાત</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>કુલ બેગ</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>છેલ્લી બેગ (KG)</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>કુલ વજન (KG)</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>કુલ મણ</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>ભાવ (₹/મણ)</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>માલની રકમ (₹)</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>ક્રિયા</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '0.88rem' }}>
                      <td style={{ padding: '0.75rem' }}>{idx + 1}</td>
                      <td style={{ padding: '0.75rem', fontWeight: '600', color: '#0f172a' }}>{it.varietyName}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}><b>{it.bags}</b> બેગ</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', color: '#64748b' }}>{it.lastBagKg} KG</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}><b>{it.netWeightKg}</b> kg</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: '#064e3b', fontWeight: '700' }}>
                        {it.totalMan} મણ
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>₹{it.ratePerMan.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '700' }}>
                        ₹{it.itemTotal.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0.2rem' }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#ecfdf5', fontWeight: '700', fontSize: '0.9rem', color: '#064e3b' }}>
                    <td colSpan={2} style={{ padding: '0.75rem' }}>કુલ સરવાળો</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{totalBagsCount} બેગ</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>—</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{totalWeightKg} KG</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{totalManCount.toFixed(2)} મણ</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>—</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      ₹{itemsSubTotal.toLocaleString('en-IN')}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Step 3: Expenses, Net Total & Payment */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          
          {/* Expenses Card */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>
              ૩. ખર્ચની વિગત ({purchaseType === 'farmer' ? 'ખેડૂત ખરીદી ખર્ચ' : 'માર્કેટિંગ યાર્ડ ખર્ચ'})
            </h3>

            {purchaseType === 'farmer' ? (
              <div className="form-group">
                <label className="form-label">મજૂરી પ્રતિ બેગ (₹/બેગ)</label>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={majuriPerBag}
                    onChange={(e) => setMajuriPerBag(e.target.value)}
                    style={{ maxWidth: '140px' }}
                  />
                  <span style={{ fontSize: '0.88rem', color: '#475569' }}>
                    × {totalBagsCount} બેગ = <b>₹{farmerMajuriTotal.toLocaleString('en-IN')}</b>
                  </span>
                </div>
                <small style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  કુલ બેગ × મજૂરી પ્રતિ બેગ
                </small>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">માર્કેટ કમિશન (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder="0"
                    value={marketCommission}
                    onChange={(e) => setMarketCommission(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">પેઢીનું કમિશન (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder="0"
                    value={firmCommission}
                    onChange={(e) => setFirmCommission(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">બારદાન ખર્ચ (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder="0"
                    value={bardanExpense}
                    onChange={(e) => setBardanExpense(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">મજૂરી (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder="0"
                    value={marketMajuri}
                    onChange={(e) => setMarketMajuri(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label">નોંધ (Remarks - વૈકલ્પિક)</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="દા.ત. ગુણવત્તા સારી, વજન બરાબર છે..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>

          {/* Net Total & Payment Card */}
          <div className="card" style={{ backgroundColor: '#fcfdfd', border: '1px solid #d1fae5' }}>
            <h3 className="card-title" style={{ color: '#064e3b', marginBottom: '1rem' }}>
              ૪. Net Total & ચુકવણી (Payment)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#475569' }}>
                <span>માલની કુલ રકમ:</span>
                <span style={{ fontWeight: '600' }}>₹{itemsSubTotal.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#475569' }}>
                <span>કુલ ખર્ચ (મજૂરી/કમિશન/બારદાન):</span>
                <span style={{ fontWeight: '600' }}>+ ₹{calculatedExpenses.toLocaleString('en-IN')}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.2rem',
                fontWeight: '800',
                color: '#064e3b',
                borderTop: '2px solid #a7f3d0',
                paddingTop: '0.5rem'
              }}>
                <span>Net Total:</span>
                <span>₹{grandNetTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">ચુકવણી પ્રકાર (Payment Type)</label>
              <select
                className="form-control"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}>
                <option value="bank">બેંક ટ્રાન્સફર / NEFT / RTGS / ચેક</option>
                <option value="cash">રોકડ (Cash)</option>
                <option value="credit">સંપૂર્ણ ઉધાર (Credit)</option>
                <option value="partial">આંશિક ચુકવણી (Partial)</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">ચૂકવેલ રકમ (Paid ₹)</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  placeholder={`દા.ત. ${grandNetTotal}`}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">બાકી રકમ (Balance Due ₹)</label>
                <div style={{
                  padding: '0.55rem 0.75rem',
                  backgroundColor: dueAmount > 0 ? '#ffedd5' : '#f0fdf4',
                  color: dueAmount > 0 ? '#c2410c' : '#15803d',
                  borderRadius: '6px',
                  fontWeight: '800',
                  border: dueAmount > 0 ? '1px solid #fed7aa' : '1px solid #bbf7d0',
                  textAlign: 'right'
                }}>
                  ₹{dueAmount.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '1.05rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.75rem'
              }}>
              <CheckCircle2 size={20} />
              ચકાસો અને પ્રિવ્યૂ જુઓ (Preview & Save)
            </button>
          </div>

        </div>

      </form>

      {/* Confirmation & Preview Modal */}
      {previewModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '680px',
            width: '100%',
            padding: '1.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#064e3b', margin: 0 }}>
                બિલ સેવ કરતા પહેલા ખાતરી કરો (Confirmation)
              </h3>
              <button onClick={() => setPreviewModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.88rem' }}>
                <div>
                  <span style={{ color: '#64748b' }}>કંપની: </span>
                  <b>{companyName}</b>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>બિલ નં: </span>
                  <b>{billNo}</b>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>ખરીદી પ્રકાર: </span>
                  <span className={`badge ${purchaseType === 'farmer' ? 'badge-primary' : 'badge-warning'}`}>
                    {purchaseType === 'farmer' ? 'ખેડૂત પાસેથી ખરીદી' : 'માર્કેટ પેઢી ખરીદી'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>ખાતેદાર: </span>
                  <b>
                    {purchaseType === 'farmer' 
                      ? parties.find(p => p.id === selectedFarmerId)?.name 
                      : parties.find(p => p.id === selectedFirmId)?.name}
                  </b>
                </div>
              </div>

              <div style={{ marginTop: '0.75rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.25rem' }}>માલની જાતો ({items.length}):</div>
                {items.map((it, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '0.2rem 0' }}>
                    <span>• {it.varietyName} ({it.bags} બેગ, {it.netWeightKg} KG = {it.totalMan} મણ)</span>
                    <b>₹{it.itemTotal.toLocaleString('en-IN')}</b>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '0.75rem', borderTop: '2px solid #064e3b', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: '#064e3b' }}>
                <span>Net Total:</span>
                <span>₹{grandNetTotal.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#15803d', marginTop: '0.25rem' }}>
                <span>ચૂકવેલ: ₹{numPaid.toLocaleString('en-IN')}</span>
                <span style={{ color: dueAmount > 0 ? '#c2410c' : '#15803d' }}>
                  બાકી રકમ: ₹{dueAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPreviewModalOpen(false)}>
                રદ કરો (Cancel)
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmSavePurchase}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.25rem', fontWeight: '700' }}>
                <CheckCircle2 size={18} />
                હા, પાકી ખરીદી નોંધો (Confirm & Save)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Party Modal */}
      {showQuickAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', maxWidth: '480px', width: '100%', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#064e3b', margin: 0 }}>
                + નવો ખાતેદાર ઉમેરો
              </h3>
              <button onClick={() => setShowQuickAddModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveQuickParty}>
              <div className="form-group">
                <label className="form-label">ખાતેદાર પ્રકાર *</label>
                <select
                  className="form-control"
                  value={quickPartyType}
                  onChange={(e) => setQuickPartyType(e.target.value)}>
                  <option value="farmer">ખેડૂત (Farmer)</option>
                  <option value="firm">માર્કેટ પેઢી (Firm / Pethi)</option>
                  <option value="trader">વેપારી (Trader / Broker)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">નામ *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="દા.ત. રમેશભાઈ પટેલ"
                  value={quickPartyForm.name}
                  onChange={(e) => setQuickPartyForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              {quickPartyType === 'trader' && (
                <div className="form-group">
                  <label className="form-label">જોડાયેલી પેઢી પસંદ કરો</label>
                  <select
                    className="form-control"
                    value={quickPartyForm.firmId}
                    onChange={(e) => {
                      const f = firmsList.find(firm => firm.id === e.target.value);
                      setQuickPartyForm(prev => ({ ...prev, firmId: e.target.value, firmName: f ? f.name : '' }));
                    }}>
                    <option value="">-- પેઢી પસંદ કરો --</option>
                    {firmsList.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">ગામ / સરનામું</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="ગામ / યાર્ડ"
                    value={quickPartyForm.village}
                    onChange={(e) => setQuickPartyForm(prev => ({ ...prev, village: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">મોબાઇલ નંબર</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="૧૦ આંકડાનો મોબાઇલ"
                    value={quickPartyForm.mobile}
                    onChange={(e) => setQuickPartyForm(prev => ({ ...prev, mobile: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowQuickAddModal(false)}>
                  રદ કરો
                </button>
                <button type="submit" className="btn btn-primary">
                  સેવ કરો
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill Print / View Modal */}
      {viewedBill && (
        <PurchaseBillModal
          purchase={viewedBill}
          onClose={() => setViewedBill(null)}
        />
      )}

      {/* Recent Purchases Register */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 className="card-title">તાજેતરની ખરીદી રજિસ્ટર (Purchase Register)</h3>
            <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
              સેવ થયેલા તમામ ખરીદી બિલો અને વાઉચર્સ
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', color: '#475569', fontSize: '0.82rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem' }}>બિલ નં</th>
                <th style={{ padding: '0.75rem' }}>તારીખ</th>
                <th style={{ padding: '0.75rem' }}>પ્રકાર</th>
                <th style={{ padding: '0.75rem' }}>ખાતેદાર / પેઢી</th>
                <th style={{ padding: '0.75rem' }}>માલની જાત</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>બેગ</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>કુલ KG</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>કુલ મણ</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Net Total</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>બાકી રકમ</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>ક્રિયા</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => {
                const totalBags = p.items?.reduce((s, it) => s + parseInt(it.bags || 0), 0) || 0;
                const totalKg = p.items?.reduce((s, it) => s + parseFloat(it.netWeightKg || 0), 0) || 0;
                const totalMan = p.items?.reduce((s, it) => s + parseFloat(it.totalMan || 0), 0) || 0;
                const varietyText = p.items?.map(it => it.varietyName).join(', ') || '—';

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.88rem' }}>
                    <td style={{ padding: '0.75rem', fontWeight: '700', color: '#064e3b' }}>
                      {p.billNo}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#64748b' }}>
                      {p.purchaseDate}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge ${p.purchaseType === 'farmer' ? 'badge-primary' : 'badge-warning'}`} style={{ fontSize: '0.72rem' }}>
                        {p.purchaseType === 'farmer' ? 'ખેડૂત' : 'માર્કેટ'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: '600', color: '#0f172a' }}>
                      {p.partyName}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#475569', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {varietyText}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <b>{totalBags}</b>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      {totalKg} kg
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '700', color: '#064e3b' }}>
                      {totalMan.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '700' }}>
                      ₹{Math.round(p.netTotal || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: p.dueAmount > 0 ? '#ea580c' : '#16a34a', fontWeight: '700' }}>
                      ₹{Math.round(p.dueAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button
                        onClick={() => setViewedBill(p)}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Eye size={14} />
                        જુઓ
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
