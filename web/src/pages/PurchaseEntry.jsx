import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useData, BAG_STD_KG, MAN_STD_KG, PARTY_TAGS, getPartyTagInfo } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { PurchaseBillModal } from '../components/PurchaseBillModal';

export const PurchaseEntry = ({ onPurchaseCompleted }) => {
  const { 
    seeds, 
    parties, 
    purchases, 
    recordPurchase,
    updatePurchase,
    addParty,
    deletePurchase
  } = useData();
  const { userProfile } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingBillNo, setEditingBillNo] = useState('');

  // Helper to compute next bill no
  const getNextBillNo = () => {
    let maxNum = 0;
    (purchases || []).forEach(p => {
      const match = (p.billNo || '').match(/SN-PUR-\d{4}-(\d+)/);
      if (match) {
        const val = parseInt(match[1], 10);
        if (val > maxNum) maxNum = val;
      }
    });
    return `SN-PUR-${new Date().getFullYear()}-${(maxNum + 1).toString().padStart(4, '0')}`;
  };

  // Filter tag for the customer selector: 'all' | 'farmer' | 'firm' | 'supplier' | 'trader'
  const [selectedTagFilter, setSelectedTagFilter] = useState('all');

  // Common Header State
  const [billNo, setBillNo] = useState(getNextBillNo);

  useEffect(() => {
    if (!isEditing) {
      setBillNo(getNextBillNo());
    }
  }, [purchases, isEditing]);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [partyId, setPartyId] = useState('');
  const [partyType, setPartyType] = useState('farmer'); // 'farmer' | 'firm' | 'supplier' | 'trader'
  const [partyName, setPartyName] = useState('');
  const [partyMobile, setPartyMobile] = useState('');
  const [village, setVillage] = useState('');
  const [paymentMode, setPaymentMode] = useState('bank');
  const [paymentReference, setPaymentReference] = useState('');
  const [paid, setPaid] = useState('0');
  const [note, setNote] = useState('');

  // Transport & Commission Fields
  const [showTransportDetails, setShowTransportDetails] = useState(false);
  const [pethiName, setPethiName] = useState('');
  const [selectedTruckId, setSelectedTruckId] = useState('');
  const [truckNumber, setTruckNumber] = useState('');
  const [truckOwnerName, setTruckOwnerName] = useState('');
  const [truckMobile, setTruckMobile] = useState('');
  const [marketCommission, setMarketCommission] = useState('0');
  const [pethiCommission, setPethiCommission] = useState('0');
  const [bardana, setBardana] = useState('0');
  const [labour, setLabour] = useState('10'); // per bag labour (default 10)

  // Multi-item rows (Bag 1 x KG 1 and Bag 2 x KG 2)
  const [items, setItems] = useState([
    { productId: seeds[0]?.id || '', bags1: '10', kg1: '35', bags2: '0', kg2: '0', rate: '2400' }
  ]);

  // Notice & Preview Modal
  const [notice, setNotice] = useState('');
  const [activeBillModal, setActiveBillModal] = useState(null);

  // Quick Add Party Modal
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [newPartyForm, setNewPartyForm] = useState({
    partyType: 'farmer',
    name: '',
    firmName: '',
    mobile: '',
    village: '',
    openingBalance: '0',
    balanceType: 'cr'
  });

  // Filtered Parties based on Tag selection (defaults to all)
  const activeParties = parties.filter(p => {
    if (selectedTagFilter === 'all') return true;
    if (selectedTagFilter === 'farmer') return p.partyType === 'farmer';
    if (selectedTagFilter === 'firm') return p.partyType === 'firm';
    if (selectedTagFilter === 'supplier') return p.partyType === 'supplier';
    if (selectedTagFilter === 'trader') return p.partyType === 'trader' || p.partyType === 'other';
    return true;
  });

  const transporterParties = parties.filter(p => p.partyType === 'transporter');

  const money = n => {
    const val = Number(n || 0);
    return '₹' + (val % 1 !== 0
      ? val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : Math.round(val).toLocaleString('en-IN'));
  };
  const num = v => Math.max(0, parseFloat(v) || 0);

  // Handle party select from dropdown
  const handlePartySelect = (id) => {
    setPartyId(id);
    const p = parties.find(x => x.id === id);
    if (p) {
      setPartyName(p.name || p.firmName || '');
      setPartyType(p.partyType || 'farmer');
      if (p.mobile) setPartyMobile(p.mobile);
      if (p.village || p.city) setVillage(p.village || p.city || '');
      if (p.firmName) {
        setPethiName(p.firmName);
      } else if (['firm', 'supplier'].includes(p.partyType)) {
        setPethiName(p.name);
      }

      // If supplier or firm, expand transport/commission details automatically
      if (['firm', 'supplier'].includes(p.partyType)) {
        setShowTransportDetails(true);
      }
    }
  };

  // Handle selecting an existing truck/transporter
  const handleSelectTruck = (tId) => {
    setSelectedTruckId(tId);
    const trk = parties.find(p => p.id === tId);
    if (trk) {
      setTruckOwnerName(trk.name || '');
      setTruckNumber(trk.firmName || trk.name || '');
      if (trk.mobile) setTruckMobile(trk.mobile);
      setShowTransportDetails(true);
    }
  };

  // Save current Malik / Goods Owner separately to master
  const handleSaveMalikSeparately = async () => {
    if (!partyName.trim()) {
      setNotice('કૃપા કરીને માલિક / ખાતેદારનું નામ દાખલ કરો.');
      return;
    }
    try {
      const created = await addParty({
        partyType,
        name: partyName.trim(),
        firmName: pethiName || partyName.trim(),
        mobile: partyMobile.trim(),
        village: village.trim(),
        city: village.trim(),
        openingBalance: 0,
        balanceType: 'cr'
      });
      if (created?.id) {
        setPartyId(created.id);
      }
      setNotice(`✅ માલિક / ખાતેદાર "${partyName}" સફળતાપૂર્વક અલગથી સેવ થઈ ગયા.`);
    } catch (err) {
      setNotice('માલિક સેવ કરવામાં ક્ષતિ આવી: ' + (err.message || 'Error'));
    }
  };

  // Save current Truck / Transporter separately to master
  const handleSaveTruckSeparately = async () => {
    if (!truckNumber.trim() && !truckOwnerName.trim()) {
      setNotice('કૃપા કરીને ટ્રક નંબર અથવા ટ્રાન્સપોર્ટર / માલિકનું નામ દાખલ કરો.');
      return;
    }
    try {
      const ownerLabel = truckOwnerName.trim() || truckNumber.trim();
      const created = await addParty({
        partyType: 'transporter',
        name: ownerLabel,
        firmName: truckNumber.trim() || ownerLabel,
        mobile: truckMobile.trim(),
        village: 'વાહન / ટ્રાન્સપોર્ટ',
        city: 'વાહન / ટ્રાન્સપોર્ટ',
        openingBalance: 0,
        balanceType: 'cr'
      });
      if (created?.id) {
        setSelectedTruckId(created.id);
      }
      setNotice(`✅ ટ્રક વિગત "${truckNumber || ownerLabel}" અલગથી ટ્રાન્સપોર્ટર લિસ્ટમાં સેવ થઈ ગઈ.`);
    } catch (err) {
      setNotice('ટ્રક વિગત સેવ કરવામાં ક્ષતિ: ' + (err.message || 'Error'));
    }
  };

  // Export Purchases to Excel (.xlsx)
  const handleExportExcel = () => {
    if (!purchases || purchases.length === 0) {
      alert('એક્સપોર્ટ કરવા માટે કોઈ ખરીદી ડેટા ઉપલબ્ધ નથી.');
      return;
    }
    const rows = purchases.map((p, idx) => {
      const party = parties.find(x => x.id === p.partyId);
      const tag = p.partyType || party?.partyType || (p.purchaseType === 'farmer' ? 'farmer' : 'firm');
      const tagInfo = getPartyTagInfo(tag);
      const varieties = p.items?.map(it => it.varietyName || it.productName).join(', ') || '—';
      const totalBags = p.items?.reduce((s, it) => s + (parseInt(it.bags) || 0), 0) || 0;
      const totalKg = p.items?.reduce((s, it) => s + (parseFloat(it.netWeightKg || it.qtyKg) || 0), 0) || 0;
      const totalMan = p.items?.reduce((s, it) => s + (parseFloat(it.totalMan || it.qtyMan) || 0), 0) || 0;
      const rates = p.items?.map(it => it.ratePerMan || it.rate).join(', ') || '—';

      return {
        'ક્રમ': idx + 1,
        'બિલ નંબર': p.billNo || p.invoiceNo || '—',
        'તારીખ': p.purchaseDate || p.date || '—',
        'ખાતેદાર પ્રકાર': tagInfo.label,
        'માલિક / ખાતેદારનું નામ': p.partyName || '—',
        'પેઢીનું નામ': p.firmName || p.pethiName || party?.firmName || '—',
        'ગામ / શહેર': p.village || party?.village || '—',
        'મોબાઇલ નંબર': p.mobile || p.partyMobile || party?.mobile || '—',
        'ટ્રક / વાહન નંબર': p.truckNo || p.truckNumber || '—',
        'ટ્રાન્સપોર્ટ / ટ્રક માલિક': p.truckOwner || p.truckOwnerName || '—',
        'બિયારણ જાત': varieties,
        'કુલ બોરી': totalBags,
        'કુલ વજન (KG)': totalKg,
        'કુલ મણ (20 KG)': Number(totalMan.toFixed(2)),
        'ભાવ પ્રતિ મણ (₹/મણ)': rates,
        'માલની રકમ (₹)': parseFloat(p.itemsSubTotal || p.goodsTotal || 0),
        'મજૂરી ખર્ચ (₹)': ((p.purchaseType === 'farmer' || tag === 'farmer') && parseFloat(p.majuriAmount || 0) > 0 ? '-' : '') + parseFloat(p.majuriAmount || 0),
        'કુલ ખર્ચ/કમિશન (₹)': parseFloat(p.totalExpenses || 0),
        'નેટ કુલ રકમ (₹)': parseFloat(p.netTotal || p.totalAmount || 0),
        'ચૂકવેલ રકમ (₹)': parseFloat(p.paidAmount || p.paid || 0),
        'બાકી રકમ (₹)': parseFloat(p.dueAmount || p.balance || 0),
        'ચુકવણી રીત': (p.paymentMode || 'credit').toUpperCase(),
        'નોંધ': p.remarks || p.note || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ખરીદી રજિસ્ટર');
    XLSX.writeFile(wb, `Kharidi_Register_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Start Editing an existing Purchase
  const handleStartEdit = (purchase) => {
    setIsEditing(true);
    const pBill = purchase.billNo || purchase.invoiceNo || '';
    setEditingBillNo(pBill);
    setBillNo(pBill);
    setDate(purchase.purchaseDate || purchase.date || new Date().toISOString().slice(0, 10));
    setPartyId(purchase.partyId || '');
    setPartyType(purchase.partyType || (purchase.purchaseType === 'farmer' ? 'farmer' : 'firm'));
    setPartyName(purchase.partyName || '');
    setPartyMobile(purchase.mobile || purchase.partyMobile || '');
    setVillage(purchase.village || '');
    setPethiName(purchase.pethiName || purchase.firmName || '');
    setTruckNumber(purchase.truckNo || purchase.truckNumber || '');
    setTruckOwnerName(purchase.truckOwner || purchase.truckOwnerName || '');
    setMarketCommission((purchase.marketCommission || 0).toString());
    setPethiCommission((purchase.firmCommission || purchase.pethiCommission || 0).toString());
    setBardana((purchase.bardanExpense || purchase.bardana || 0).toString());
    setLabour((purchase.majuriRatePerBag || '10').toString());
    setPaid((purchase.paidAmount || purchase.paid || 0).toString());
    setPaymentMode(purchase.paymentMode || 'bank');
    setPaymentReference(purchase.paymentReference || '');
    setNote(purchase.remarks || purchase.note || '');

    if (purchase.truckNo || purchase.truckOwner) {
      setShowTransportDetails(true);
    }

    if (Array.isArray(purchase.items) && purchase.items.length > 0) {
      setItems(purchase.items.map(it => {
        const b1 = (it.bags1 !== undefined && Number(it.bags1) > 0) ? it.bags1 : (it.bags ? Math.max(1, it.bags - (it.lastBagKg && it.lastBagKg < 35 ? 1 : 0)) : (it.bags || 1));
        const k1 = it.kg1 !== undefined ? it.kg1 : (it.bagWeightKg || 35);
        const b2 = it.bags2 !== undefined ? it.bags2 : (it.lastBagKg && it.lastBagKg < 35 && it.bags > 1 ? 1 : 0);
        const k2 = it.kg2 !== undefined ? it.kg2 : (it.lastBagKg || 0);
        return {
          productId: it.seedId || it.productId || '',
          bags1: b1.toString(),
          kg1: k1.toString(),
          bags2: b2.toString(),
          kg2: k2.toString(),
          rate: (it.ratePerMan || it.rate || 2400).toString()
        };
      }));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setNotice(`✏️ ખરીદી બિલ "${pBill}" સુધારવા માટે લોડ થયું છે.`);
  };

  // Cancel Editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingBillNo('');
    setBillNo(getNextBillNo());
    setDate(new Date().toISOString().slice(0, 10));
    setPartyId('');
    setPartyName('');
    setPartyMobile('');
    setVillage('');
    setPethiName('');
    setTruckNumber('');
    setTruckOwnerName('');
    setTruckMobile('');
    setSelectedTruckId('');
    setMarketCommission('0');
    setPethiCommission('0');
    setBardana('0');
    setLabour('10');
    setPaid('0');
    setPaymentReference('');
    setNote('');
    setItems([{ productId: seeds[0]?.id || '', bags1: '10', kg1: '35', bags2: '0', kg2: '0', rate: '2400' }]);
  };

  // Dynamic Line & Totals calculation: (Bags 1 * KG 1) + (Bags 2 * KG 2), 1 man = 20 KG
  const totals = items.reduce((sum, row) => {
    const b1 = num(row.bags1 !== undefined ? row.bags1 : row.bags);
    const k1 = num(row.kg1 !== undefined ? row.kg1 : (row.bagWeightKg || 35));
    const b2 = num(row.bags2);
    const k2 = num(row.kg2);
    const rowBags = b1 + b2;
    const kg = (b1 * k1) + (b2 * k2);
    const man = kg / MAN_STD_KG;
    const rate = num(row.rate);
    const goods = Number((man * rate).toFixed(2));
    return {
      kg: sum.kg + kg,
      man: sum.man + man,
      goods: sum.goods + goods,
      bags: sum.bags + rowBags
    };
  }, { kg: 0, man: 0, goods: 0, bags: 0 });

  // Charges calculation: labour per bag + optional commissions/bardana
  const isFarmer = partyType === 'farmer';
  const labourTotal = Number((num(labour) * totals.bags).toFixed(2));
  const chargesTotal = Number((labourTotal + num(marketCommission) + num(pethiCommission) + num(bardana)).toFixed(2));
  // In farmer purchase, labour (મજૂરી) is subtracted from goods total payable to farmer
  const netTotal = isFarmer
    ? Math.max(0, Number((totals.goods - labourTotal).toFixed(2)))
    : Number((totals.goods + chargesTotal).toFixed(2));
  const balance = Math.max(0, Number((netTotal - num(paid)).toFixed(2)));

  const updateItem = (i, key, value) => {
    setItems(old => old.map((row, index) => index === i ? { ...row, [key]: value } : row));
  };

  const handleAddItem = () => {
    setItems(old => [...old, { productId: '', bags1: '10', kg1: '35', bags2: '0', kg2: '0', rate: '2400' }]);
  };

  const handleRemoveItem = (i) => {
    if (items.length > 1) {
      setItems(old => old.filter((_, index) => index !== i));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setNotice('');

    if (!partyName.trim()) {
      setNotice('કૃપા કરીને ખાતેદાર / પાર્ટીનું નામ દાખલ કરો.');
      return;
    }
    if (items.length === 0) {
      setNotice('ઓછામાં ઓછી એક બિયારણ જાત ઉમેરો.');
      return;
    }

    // Validate Items
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.productId) {
        setNotice(`આઇટમ ${i + 1}: બિયારણ જાત પસંદ કરો.`);
        return;
      }
      const b1 = num(it.bags1 !== undefined ? it.bags1 : it.bags);
      const k1 = num(it.kg1 !== undefined ? it.kg1 : 35);
      const b2 = num(it.bags2);
      const k2 = num(it.kg2);

      if (b1 <= 0 && b2 <= 0) {
        setNotice(`આઇટમ ${i + 1}: બોરીની સંખ્યા ૧ કે તેથી વધુ હોવી જોઈએ.`);
        return;
      }
      if (b1 > 0 && k1 <= 0) {
        setNotice(`આઇટમ ${i + 1}: બોરી ૧ નું વજન (KG) દાખલ કરો.`);
        return;
      }
      if (b2 > 0 && k2 <= 0) {
        setNotice(`આઇટમ ${i + 1}: ફરી બોરી ૨ નું વજન (KG) દાખલ કરો.`);
        return;
      }
    }

    const normalizedItems = items.map(row => {
      const prod = seeds.find(s => s.id === row.productId);
      const b1 = num(row.bags1 !== undefined ? row.bags1 : row.bags);
      const k1 = num(row.kg1 !== undefined ? row.kg1 : (prod?.bagWeightKg || 35));
      const b2 = num(row.bags2);
      const k2 = num(row.kg2);
      const rowBags = b1 + b2;
      const kg = (b1 * k1) + (b2 * k2);
      const man = kg / MAN_STD_KG;
      const rate = num(row.rate);
      return {
        seedId: prod?.id || '',
        productId: prod?.id || '',
        productName: prod?.varietyName || 'બિયારણ',
        varietyName: prod?.varietyName || 'બિયારણ',
        bags1: b1,
        kg1: k1,
        bags2: b2,
        kg2: k2,
        bags: rowBags,
        lastBagKg: k2,
        bagWeightKg: k1,
        netWeightKg: kg,
        qtyKg: kg,
        totalMan: Number(man.toFixed(2)),
        qtyMan: Number(man.toFixed(2)),
        ratePerMan: rate,
        rate: rate,
        ratePerKg: Number((rate / MAN_STD_KG).toFixed(2)),
        itemTotal: Number((man * rate).toFixed(2)),
        amount: Number((man * rate).toFixed(2))
      };
    });

    // Determine purchaseType for backend backward-compatibility
    const legacyPurchaseType = ['firm', 'supplier', 'trader'].includes(partyType) ? 'market' : 'farmer';

    const cleanTruckNo = (truckNumber || '').trim().toUpperCase();
    const cleanTruckOwner = (truckOwnerName || '').trim();
    const cleanTruckMobile = (truckMobile || '').trim();

    const payload = {
      purchaseType: legacyPurchaseType,
      partyType,
      billNo: isEditing ? editingBillNo : (billNo || `SN-PUR-${Date.now().toString().slice(-6)}`),
      purchaseDate: date,
      partyId,
      partyName: partyName.trim(),
      partyMobile,
      village,
      pethiName: pethiName || '',
      truckNo: cleanTruckNo,
      truckNumber: cleanTruckNo,
      truckOwner: cleanTruckOwner,
      truckOwnerName: cleanTruckOwner,
      truckMobile: cleanTruckMobile,
      items: normalizedItems,
      itemsSubTotal: totals.goods,
      majuriRatePerBag: num(labour),
      majuriAmount: labourTotal,
      marketCommission: num(marketCommission),
      firmCommission: num(pethiCommission),
      bardanExpense: num(bardana),
      totalExpenses: chargesTotal,
      netTotal,
      paidAmount: num(paid),
      dueAmount: balance,
      paymentMode,
      paymentReference,
      remarks: note,
      createdBy: userProfile?.displayName || 'Ravi Chaudhary (Main Admin)'
    };

    try {
      setIsSubmitting(true);
      if (isEditing) {
        await updatePurchase(payload);
        setActiveBillModal(payload);
        if (cleanTruckNo || cleanTruckOwner) {
          setNotice(`✅ ખરીદી બિલ "${payload.billNo}" સફળતાપૂર્વક સુધારી લેવાયું અને ટ્રક ${cleanTruckNo || cleanTruckOwner} માં ${totals.bags} બોરી (${totals.kg} KG) અપડેટ થઈ ગઈ!`);
        } else {
          setNotice(`✅ ખરીદી બિલ "${payload.billNo}" સફળતાપૂર્વક સુધારી લેવાયું.`);
        }
        handleCancelEdit();
      } else {
        const saved = await recordPurchase(payload);
        const billToPrint = saved || payload;

        // Open official printable PurchaseBillModal immediately
        setActiveBillModal(billToPrint);

        if (cleanTruckNo || cleanTruckOwner) {
          setNotice(`✅ ખરીદી બિલ "${billToPrint.billNo}" સફળતાપૂર્વક સેવ થયું અને ગાડી નં. ${cleanTruckNo || cleanTruckOwner} માં ${totals.bags} બોરી (${totals.kg} KG માલ) આપોઆપ ટ્રક રજિસ્ટરમાં એડ થઈ ગયા!`);
        } else {
          setNotice(`✅ ખરીદી બિલ "${billToPrint.billNo}" સફળતાપૂર્વક સેવ થયું.`);
        }

        // Reset Form
        setBillNo(getNextBillNo());
        setPaid('0');
        setPaymentReference('');
        setNote('');
        setTruckNumber('');
        setTruckOwnerName('');
        setTruckMobile('');
        setSelectedTruckId('');
        setItems([{ productId: seeds[0]?.id || '', bags1: '10', kg1: '35', bags2: '0', kg2: '0', rate: '2400' }]);
      }
    } catch (err) {
      console.error('Error saving purchase:', err);
      setNotice('ખરીદી સાચવવામાં ક્ષતિ આવી: ' + (err.message || 'Error'));
    } finally {
      setTimeout(() => setIsSubmitting(false), 500);
    }
  };

  const selectedPartyObj = parties.find(p => p.id === partyId);

  return (
    <div>
      {notice && (
        <div className="notice" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{notice}</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {activeBillModal && (
              <button
                type="button"
                className="secondary"
                style={{ padding: '3px 10px', fontSize: '0.82rem', background: '#166534', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                onClick={() => window.print()}
              >
                🖨️ બિલ પ્રિન્ટ કરો
              </button>
            )}
            <button
              type="button"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'inherit' }}
              onClick={() => setNotice('')}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Official Printable Purchase Bill Modal */}
      {activeBillModal && (
        <PurchaseBillModal
          purchase={activeBillModal}
          onClose={() => setActiveBillModal(null)}
        />
      )}

      {/* Quick Add Party Modal */}
      {showAddPartyModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h2 style={{ margin: 0, color: '#166534', fontSize: '1.25rem' }}>
                🌱 નવો ખાતેદાર ઉમેરો
              </h2>
              <button
                type="button"
                className="secondary"
                style={{ padding: '2px 8px', fontSize: '1.1rem' }}
                onClick={() => setShowAddPartyModal(false)}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newPartyForm.name.trim()) return;
                const created = addParty({
                  partyType: newPartyForm.partyType,
                  name: newPartyForm.name.trim(),
                  firmName: newPartyForm.firmName.trim() || (['firm', 'supplier'].includes(newPartyForm.partyType) ? newPartyForm.name.trim() : ''),
                  mobile: newPartyForm.mobile.trim(),
                  village: newPartyForm.village.trim(),
                  openingBalance: parseFloat(newPartyForm.openingBalance) || 0,
                  balanceType: newPartyForm.balanceType || (newPartyForm.partyType === 'farmer' ? 'dr' : 'cr')
                });
                setPartyId(created.id);
                setPartyName(created.name);
                setPartyType(created.partyType);
                if (created.mobile) setPartyMobile(created.mobile);
                if (created.village) setVillage(created.village);
                if (created.firmName) setPethiName(created.firmName);
                setShowAddPartyModal(false);
                setNotice(`ખાતેદાર "${created.name}" [${getPartyTagInfo(created.partyType).label}] સફળતાપૂર્વક ઉમેરાયા અને પસંદ થયા.`);
                setNewPartyForm({
                  partyType: 'farmer',
                  name: '',
                  firmName: '',
                  mobile: '',
                  village: '',
                  openingBalance: '0',
                  balanceType: 'cr'
                });
              }}
              style={{ padding: '1.25rem' }}
            >
              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#14532d', display: 'block', marginBottom: '6px' }}>
                  પાર્ટી ટેગ (વર્ગીકરણ) પસંદ કરો:*
                </span>
                <div className="tag-selector-row">
                  {[
                    { type: 'farmer', icon: '🌾', label: 'ખેડૂત', sub: 'Farmer' },
                    { type: 'firm', icon: '🏢', label: 'પેઢી', sub: 'Pedhi / Firm' },
                    { type: 'supplier', icon: '🚚', label: 'સપ્લાયર', sub: 'Supplier' },
                    { type: 'trader', icon: '👤', label: 'અન્ય વેપારી / વ્યક્તિ', sub: 'Trader / Person' }
                  ].map(t => (
                    <div
                      key={t.type}
                      className={`tag-select-option ${newPartyForm.partyType === t.type ? 'selected' : ''}`}
                      onClick={() => setNewPartyForm(prev => ({
                        ...prev,
                        partyType: t.type,
                        balanceType: t.type === 'farmer' ? 'dr' : 'cr'
                      }))}
                    >
                      <span style={{ fontSize: '1.2rem' }}>{t.icon}</span>
                      <span>{t.label}</span>
                      <small style={{ fontSize: '0.72rem', color: '#64748b' }}>{t.sub}</small>
                    </div>
                  ))}
                </div>
              </div>

              <div className="formgrid">
                <label>
                  {['firm', 'supplier'].includes(newPartyForm.partyType) ? 'કંપની / પેઢીનું નામ*' : 'પૂરું નામ*'}
                  <input
                    required
                    value={newPartyForm.name}
                    onChange={e => setNewPartyForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={['firm', 'supplier'].includes(newPartyForm.partyType) ? 'દા.ત. શ્રી ગણેશ ટ્રેડિંગ કંપની' : 'દા.ત. રમેશભાઈ પટેલ'}
                  />
                </label>

                {['firm', 'supplier'].includes(newPartyForm.partyType) && (
                  <label>
                    સંપર્ક વ્યક્તિ (Contact Person)
                    <input
                      value={newPartyForm.firmName}
                      onChange={e => setNewPartyForm(prev => ({ ...prev, firmName: e.target.value }))}
                      placeholder="માલિક / વેપારીનું નામ"
                    />
                  </label>
                )}

                <label>
                  મોબાઇલ નંબર
                  <input
                    value={newPartyForm.mobile}
                    onChange={e => setNewPartyForm(prev => ({ ...prev, mobile: e.target.value }))}
                    placeholder="૧૦ આંકડાનો મોબાઇલ"
                  />
                </label>

                <label>
                  ગામ / શહેર / યાર્ડ
                  <input
                    value={newPartyForm.village}
                    onChange={e => setNewPartyForm(prev => ({ ...prev, village: e.target.value }))}
                    placeholder="દા.ત. ગોંડલ, રાજકોટ"
                  />
                </label>

                <label>
                  શરૂઆતની બાકી (Opening Balance ₹)
                  <input
                    type="number"
                    min="0"
                    value={newPartyForm.openingBalance}
                    onChange={e => setNewPartyForm(prev => ({ ...prev, openingBalance: e.target.value }))}
                  />
                </label>

                <label>
                  બેલેન્સ પ્રકાર
                  <select
                    value={newPartyForm.balanceType}
                    onChange={e => setNewPartyForm(prev => ({ ...prev, balanceType: e.target.value }))}
                  >
                    <option value="cr">CR (જમા - આપણે ચૂકવવાના)</option>
                    <option value="dr">DR (ઉધાર - આપણે લેવાના)</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setShowAddPartyModal(false)}
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="primary-action"
                  style={{ width: 'auto', padding: '9px 20px' }}
                >
                  સેવ કરો અને ખરીદીમાં પસંદ કરો
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Mode Banner */}
      {isEditing && (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#92400e' }}>
              ✏️ ખરીદી બિલ &quot;{editingBillNo}&quot; સુધારી રહ્યા છો (Edit Mode)
            </span>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#78350f' }}>
              જરૂરી ફેરફારો કરીને નીચે &ldquo;ખરીદી સુધારો સેવ કરો&rdquo; બટન દબાવો. સ્ટોક અને ખાતાની બાકી આપોઆપ અપડેટ થશે.
            </p>
          </div>
          <button
            type="button"
            className="secondary"
            style={{ borderColor: '#b45309', color: '#92400e', fontWeight: '600' }}
            onClick={handleCancelEdit}
          >
            ❌ સુધારો રદ કરો (Cancel)
          </button>
        </div>
      )}

      {/* Main Purchase Form Panel */}
      <form className="panel purchase-form" onSubmit={handleSubmit}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
          <h2 style={{ margin: 0, color: isEditing ? '#b45309' : undefined }}>
            {isEditing ? `✏️ ખરીદી બિલ સુધારો (${editingBillNo})` : 'નવી બિયારણ ખરીદી એન્ટ્રી'}
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {isEditing && (
              <button
                type="button"
                className="secondary"
                style={{ fontSize: '0.84rem', padding: '7px 12px' }}
                onClick={handleCancelEdit}
              >
                ＋ નવી એન્ટ્રી બનાવો
              </button>
            )}
            <button
              type="button"
              className="primary-action"
              style={{ width: 'auto', padding: '7px 14px', fontSize: '0.84rem' }}
              onClick={() => setShowAddPartyModal(true)}
            >
              ＋ નવો ખાતેદાર ઉમેરો (ખેડૂત / પેઢી / સપ્લાયર)
            </button>
          </div>
        </div>

        {/* 1. Unified Customer Selection with Tag Filters */}
        <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#166534' }}>
              માલિક / ખાતેદાર પ્રકાર ટેગ ફિલ્ટર:
            </span>
            <div className="tag-filter-pills" style={{ margin: 0 }}>
              <button
                type="button"
                className={`tag-pill-btn ${selectedTagFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedTagFilter('all')}
              >
                બધા ખાતેદારો ({parties.length})
              </button>
              <button
                type="button"
                className={`tag-pill-btn ${selectedTagFilter === 'farmer' ? 'active' : ''}`}
                onClick={() => setSelectedTagFilter('farmer')}
              >
                🌾 ખેડૂત ({parties.filter(p => p.partyType === 'farmer').length})
              </button>
              <button
                type="button"
                className={`tag-pill-btn ${selectedTagFilter === 'firm' ? 'active' : ''}`}
                onClick={() => setSelectedTagFilter('firm')}
              >
                🏢 પેઢી ({parties.filter(p => p.partyType === 'firm').length})
              </button>
              <button
                type="button"
                className={`tag-pill-btn ${selectedTagFilter === 'supplier' ? 'active' : ''}`}
                onClick={() => setSelectedTagFilter('supplier')}
              >
                🚚 સપ્લાયર ({parties.filter(p => p.partyType === 'supplier').length})
              </button>
              <button
                type="button"
                className={`tag-pill-btn ${selectedTagFilter === 'trader' ? 'active' : ''}`}
                onClick={() => setSelectedTagFilter('trader')}
              >
                👤 અન્ય વેપારી ({parties.filter(p => ['trader', 'other'].includes(p.partyType)).length})
              </button>
            </div>
          </div>

          <div className="formgrid" style={{ marginBottom: 0 }}>
            <label className="full" style={{ marginBottom: 0 }}>
              માલના માલિક / ખાતેદાર પસંદ કરો (ખેડૂત, પેઢી, સપ્લાયર, અન્ય વેપારી એક જ લિસ્ટમાં)
              <select
                value={partyId}
                onChange={e => handlePartySelect(e.target.value)}
                style={{ fontSize: '0.95rem', fontWeight: '600' }}
              >
                <option value="">-- માસ્ટરમાંથી માલિક / ખાતેદાર પસંદ કરો --</option>
                {activeParties.map(p => {
                  const tagInfo = getPartyTagInfo(p.partyType);
                  const bal = (parseFloat(p.currentBalance) || 0).toLocaleString('en-IN');
                  const balType = (p.balanceType || '').toUpperCase();
                  return (
                    <option key={p.id} value={p.id}>
                      [{tagInfo.badge}] {p.name} {p.firmName && p.firmName !== p.name ? `— ${p.firmName}` : ''} {p.village ? `(${p.village})` : ''} — બાકી: ₹{bal} {balType}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>

          {/* Selected Party Summary Card */}
          {selectedPartyObj && (
            <div style={{ marginTop: '10px', padding: '8px 12px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`party-tag-badge party-tag-${selectedPartyObj.partyType || 'farmer'}`}>
                  {getPartyTagInfo(selectedPartyObj.partyType).badge}
                </span>
                <b>{selectedPartyObj.name}</b>
                {selectedPartyObj.firmName && selectedPartyObj.firmName !== selectedPartyObj.name && (
                  <span style={{ color: '#047857', fontSize: '0.85rem' }}>({selectedPartyObj.firmName})</span>
                )}
                {selectedPartyObj.village && (
                  <span style={{ color: '#4b5563', fontSize: '0.85rem' }}>• {selectedPartyObj.village}</span>
                )}
                {selectedPartyObj.mobile && (
                  <span style={{ color: '#4b5563', fontSize: '0.85rem' }}>• 📞 {selectedPartyObj.mobile}</span>
                )}
              </div>
              <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>
                ચાલુ બાકી: <span style={{ color: (selectedPartyObj.balanceType || '').toLowerCase() === 'cr' ? '#1d4ed8' : '#b91c1c' }}>
                  ₹{(parseFloat(selectedPartyObj.currentBalance) || 0).toLocaleString('en-IN')} {((selectedPartyObj.balanceType || '').toUpperCase())}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Party Details and Header Grid */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontWeight: '700', color: '#166534', fontSize: '0.95rem' }}>
            👤 માલિકની વિગત (Goods Owner Details)
          </span>
          <button
            type="button"
            className="secondary"
            style={{ padding: '4px 10px', fontSize: '0.8rem', background: '#ecfdf5', borderColor: '#059669', color: '#047857', fontWeight: 'bold' }}
            onClick={handleSaveMalikSeparately}
          >
            💾 આ માલિક વિગત અલગ સેવ કરો
          </button>
        </div>
        <div className="formgrid">
          <label>
            પાર્ટી ટેગ (વર્ગીકરણ)*
            <select
              value={partyType}
              onChange={e => {
                setPartyType(e.target.value);
                setLabour(e.target.value === 'farmer' ? '10' : '0');
              }}
            >
              <option value="farmer">🌾 ખેડૂત (Farmer)</option>
              <option value="firm">🏢 પેઢી (Pedhi / Firm)</option>
              <option value="supplier">🚚 સપ્લાયર (Supplier)</option>
              <option value="trader">👤 અન્ય વેપારી / વ્યક્તિ (Trader / Person)</option>
            </select>
          </label>

          <label>
            ખાતેદાર / પાર્ટીનું નામ*
            <input
              required
              value={partyName}
              onChange={e => setPartyName(e.target.value)}
              placeholder="નામ દાખલ કરો"
            />
          </label>

          {(partyType === 'firm' || partyType === 'supplier' || pethiName) && (
            <label>
              પેઢી / કંપનીનું નામ
              <input
                value={pethiName}
                onChange={e => setPethiName(e.target.value)}
                placeholder="દા.ત. શ્રી ગણેશ ટ્રેડિંગ"
              />
            </label>
          )}

          <label>
            મોબાઇલ નંબર
            <input
              value={partyMobile}
              onChange={e => setPartyMobile(e.target.value)}
              placeholder="૧૦ આંકડાનો મોબાઇલ"
            />
          </label>

          <label>
            ગામ / શહેર / યાર્ડ
            <input
              value={village}
              onChange={e => setVillage(e.target.value)}
              placeholder="ગામ / શહેર / માર્કેટ યાર્ડ"
            />
          </label>

          <label>
            તારીખ*
            <input
              required
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </label>

          <label>
            ચુકવણી રીત
            <select
              value={paymentMode}
              onChange={e => setPaymentMode(e.target.value)}
            >
              <option value="bank">બેંક ટ્રાન્સફર / NEFT / RTGS</option>
              <option value="cash">રોકડ (CASH)</option>
              <option value="credit">ઉધાર (CREDIT)</option>
              <option value="partial">આંશિક ચુકવણી (PARTIAL)</option>
            </select>
          </label>
        </div>

        {/* 3. Transport & Truck Details */}
        <div style={{ marginTop: '14px', marginBottom: '16px', background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            <div>
              <span style={{ fontSize: '0.94rem', fontWeight: '700', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🚚 ટ્રક / ગાડી વિગત (Truck & Vehicle Details)
              </span>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#475569' }}>
                {truckNumber.trim() ? (
                  <span style={{ color: '#15803d', fontWeight: '700' }}>
                    ⚡ ગાડી નંબર દાખલ કરેલ છે: <b>{totals.bags} બોરી</b> અને <b>{totals.kg} KG</b> માલ આપોઆપ ટ્રક રજિસ્ટરમાં એડ થશે (અલગથી સેવ કરવાની જરૂર નથી).
                  </span>
                ) : (
                  <span style={{ color: '#64748b' }}>
                    💡 જો વાહન ન હોય તો આ ખાનું ખાલી રાખો — <b>માત્ર ખરીદી જ એડ થશે, કોઈ ગાડી એડ નહીં થાય</b>.
                  </span>
                )}
              </p>
            </div>
            {truckNumber.trim() && (
              <span style={{ padding: '4px 10px', fontSize: '0.78rem', background: '#dcfce7', border: '1px solid #86efac', color: '#14532d', borderRadius: '6px', fontWeight: '800' }}>
                ✅ ઓટો લિંક: {totals.bags} બોરી | {totals.kg} KG માલ
              </span>
            )}
          </div>

          <div className="formgrid" style={{ marginBottom: '8px' }}>
            <label className="full">
              સેવ કરેલ ટ્રક / ટ્રાન્સપોર્ટર પસંદ કરો (ઓટો-ફિલ માટે):
              <select
                value={selectedTruckId}
                onChange={e => handleSelectTruck(e.target.value)}
                style={{ fontSize: '0.9rem' }}
              >
                <option value="">-- લિસ્ટમાંથી સેવ કરેલ ટ્રક / ટ્રાન્સપોર્ટર પસંદ કરો --</option>
                {transporterParties.map(t => (
                  <option key={t.id} value={t.id}>
                    🚛 {t.firmName || t.name} {t.mobile ? `(${t.mobile})` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label>
              ટ્રક / વાહન નંબર
              <input
                value={truckNumber}
                onChange={e => setTruckNumber(e.target.value)}
                placeholder="દા.ત. GJ-11-X-4589"
              />
            </label>

            <label>
              ટ્રાન્સપોર્ટ / ટ્રક માલિકનું નામ
              <input
                value={truckOwnerName}
                onChange={e => setTruckOwnerName(e.target.value)}
                placeholder="દા.ત. જય ખોડિયાર ટ્રાન્સપોર્ટ"
              />
            </label>

            <label>
              ટ્રક માલિક / ડ્રાઈવરનો મોબાઈલ
              <input
                value={truckMobile}
                onChange={e => setTruckMobile(e.target.value)}
                placeholder="૧૦ આંકડાનો મોબાઇલ"
              />
            </label>

            <label>
              માર્કેટ કમિશન (₹)
              <input
                type="number"
                min="0"
                step="any"
                value={marketCommission}
                onChange={e => setMarketCommission(e.target.value)}
              />
            </label>

            <label>
              પેઢીનું કમિશન (₹)
              <input
                type="number"
                min="0"
                step="any"
                value={pethiCommission}
                onChange={e => setPethiCommission(e.target.value)}
              />
            </label>

            <label>
              બારદાન ખર્ચ (₹)
              <input
                type="number"
                min="0"
                step="any"
                value={bardana}
                onChange={e => setBardana(e.target.value)}
              />
            </label>
          </div>
        </div>

        {/* Section: Seed Varieties & Weights */}
        <div className="section-title">
          <h3>બિયારણ વિગત (બોરી × કિલો ગણતરી)</h3>
          <button type="button" className="secondary" onClick={handleAddItem}>
            ＋ બીજી જાત ઉમેરો
          </button>
        </div>
        <p className="muted" style={{ marginBottom: '12px' }}>
          💡 બોરી × કિલો અલગ અને ફરી બોરી × કિલો અલગ દાખલ કરી શકાય છે. ૧ મણ = ૨૦ KG. ભાવ પ્રતિ મણ (₹/મણ).
        </p>

        {items.map((row, i) => {
          const b1 = num(row.bags1 !== undefined ? row.bags1 : row.bags);
          const k1 = num(row.kg1 !== undefined ? row.kg1 : 35);
          const b2 = num(row.bags2);
          const k2 = num(row.kg2);
          const rowBags = b1 + b2;
          const kg = (b1 * k1) + (b2 * k2);
          const man = kg / MAN_STD_KG;
          const rate = num(row.rate);
          const lineGoods = Number((man * rate).toFixed(2));

          return (
            <div className="item-row" key={i} style={{ border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px', marginBottom: '16px', background: '#fcfdfc' }}>
              <div className="item-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: '700', color: '#166534', fontSize: '1rem' }}>
                  આઇટમ #{i + 1}
                </span>
                {items.length > 1 && (
                  <button type="button" className="danger" onClick={() => handleRemoveItem(i)} style={{ padding: '3px 10px', fontSize: '0.8rem' }}>
                    🗑️ કાઢી નાખો
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
                <label style={{ gridColumn: 'span 2' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>માલની જાત*</span>
                  <select
                    required
                    value={row.productId}
                    onChange={e => {
                      const sel = seeds.find(s => s.id === e.target.value);
                      updateItem(i, 'productId', e.target.value);
                      if (sel?.bagWeightKg) updateItem(i, 'kg1', sel.bagWeightKg);
                      if (sel?.defaultPurchaseRatePerMan) {
                        updateItem(i, 'rate', sel.defaultPurchaseRatePerMan);
                      }
                    }}
                    style={{ marginTop: '4px' }}>
                    <option value="">-- જાત પસંદ કરો --</option>
                    {seeds.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.varietyName} {p.cropType ? `(${p.cropType})` : ''}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Group 1: બોરી x કિલો */}
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#166534', marginBottom: '6px' }}>
                    ૧. બોરી (બેગ) × કિલો
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <label>
                      <span style={{ fontSize: '0.8rem', color: '#374151' }}>બોરી (બેગ)*</span>
                      <input
                        required
                        type="number"
                        min="0"
                        step="1"
                        value={row.bags1 !== undefined ? row.bags1 : (row.bags || '')}
                        onChange={e => updateItem(i, 'bags1', e.target.value)}
                        placeholder="દા.ત. 10"
                        style={{ marginTop: '3px' }}
                      />
                    </label>
                    <label>
                      <span style={{ fontSize: '0.8rem', color: '#374151' }}>કિલો પ્રતિ બોરી*</span>
                      <input
                        required
                        type="number"
                        min="0.01"
                        step="any"
                        value={row.kg1 !== undefined ? row.kg1 : '35'}
                        onChange={e => updateItem(i, 'kg1', e.target.value)}
                        placeholder="35"
                        style={{ marginTop: '3px' }}
                      />
                    </label>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '4px', textAlign: 'right', fontWeight: '600' }}>
                    = {(b1 * k1).toLocaleString('en-IN')} KG
                  </div>
                </div>

                {/* Group 2: ફરી બોરી x કિલો */}
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#92400e', marginBottom: '6px' }}>
                    ૨. ફરી બોરી (બેગ) × કિલો (વધારાની)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <label>
                      <span style={{ fontSize: '0.8rem', color: '#374151' }}>ફરી બોરી (બેગ)</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={row.bags2 !== undefined ? row.bags2 : ''}
                        onChange={e => updateItem(i, 'bags2', e.target.value)}
                        placeholder="0"
                        style={{ marginTop: '3px' }}
                      />
                    </label>
                    <label>
                      <span style={{ fontSize: '0.8rem', color: '#374151' }}>કિલો પ્રતિ બોરી</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={row.kg2 !== undefined ? row.kg2 : ''}
                        onChange={e => updateItem(i, 'kg2', e.target.value)}
                        placeholder="દા.ત. 25"
                        style={{ marginTop: '3px' }}
                      />
                    </label>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '4px', textAlign: 'right', fontWeight: '600' }}>
                    = {(b2 * k2).toLocaleString('en-IN')} KG
                  </div>
                </div>

                {/* Rate */}
                <label>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>ભાવ પ્રતિ મણ (₹/મણ)*</span>
                  <input
                    required
                    type="number"
                    min="0"
                    step="any"
                    value={row.rate}
                    onChange={e => updateItem(i, 'rate', e.target.value)}
                    placeholder="દા.ત. 2400.50"
                    style={{ marginTop: '4px' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    ₹{(num(row.rate) / MAN_STD_KG).toFixed(2)} / KG
                  </span>
                </label>
              </div>

              {/* Line summary */}
              <div style={{
                marginTop: '12px',
                padding: '8px 14px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.88rem'
              }}>
                <div>
                  કુલ બોરી: <b style={{ color: '#0f172a' }}>{rowBags}</b>
                  {b2 > 0 && <span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: '4px' }}>({b1} + {b2})</span>}
                </div>
                <div>
                  કુલ વજન: <b style={{ color: '#0f172a' }}>{kg.toLocaleString('en-IN')} KG</b>
                </div>
                <div>
                  કુલ મણ: <b style={{ color: '#047857' }}>{man.toFixed(2)} મણ</b>
                </div>
                <div>
                  માલની રકમ: <b style={{ color: '#166534', fontSize: '1.05rem' }}>{money(lineGoods)}</b>
                </div>
              </div>
            </div>
          );
        })}

        {/* Charges & Expenses */}
        <div className="item-row">
          <h3>{isFarmer ? 'મજૂરી ખર્ચ (ખેડૂતના બિલમાંથી બાદ થશે)' : 'મજૂરી ખર્ચ'}</h3>
          <div className="formgrid">
            <label>
              મજૂરી પ્રતિ બેગ (₹/બેગ)
              <input
                type="number"
                min="0"
                step="any"
                value={labour}
                onChange={e => setLabour(e.target.value)}
              />
            </label>
            <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
              <span style={{ fontSize: '0.9rem', color: isFarmer ? '#b91c1c' : '#4b5563', fontWeight: isFarmer ? '600' : 'normal' }}>
                કુલ મજૂરી ({totals.bags} બેગ × ₹{num(labour)}): <b>{isFarmer ? (labourTotal > 0 ? `- ${money(labourTotal)} (બાદ)` : money(0)) : money(labourTotal)}</b>
              </span>
            </div>
          </div>
        </div>

        {/* Payment & Remarks */}
        <div className="formgrid payment-grid">
          <label>
            ચૂકવેલી રકમ (₹)
            <input
              type="number"
              min="0"
              step="any"
              value={paid}
              onChange={e => setPaid(e.target.value)}
            />
          </label>
          <label>
            બેંક / UPI રેફરન્સ
            <input
              value={paymentReference}
              onChange={e => setPaymentReference(e.target.value)}
              placeholder="Cheque / UTR / Transaction No."
            />
          </label>
          <label className="full">
            નોંધ
            <textarea
              rows="2"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="ખાસ નોંધ..."
            />
          </label>
        </div>

        {/* Live Total Strip */}
        <div className="total-strip">
          <div>
            <span>કુલ વજન</span>
            <b>{totals.kg.toLocaleString('en-IN')} KG</b>
          </div>
          <div>
            <span>કુલ મણ</span>
            <b>{totals.man.toFixed(2)}</b>
          </div>
          <div>
            <span>માલની કુલ રકમ</span>
            <b>{money(totals.goods)}</b>
          </div>
          <div>
            <span>{isFarmer ? 'બાદ: મજૂરી' : 'મજૂરી / કમિશન / ખર્ચ'}</span>
            <b style={{ color: isFarmer && labourTotal > 0 ? '#b91c1c' : undefined }}>
              {isFarmer ? (labourTotal > 0 ? `- ${money(labourTotal)}` : money(0)) : money(chargesTotal)}
            </b>
          </div>
          <div>
            <span>નેટ કુલ રકમ</span>
            <b style={{ color: '#064e3b' }}>{money(netTotal)}</b>
          </div>
          <div>
            <span>બાકી રકમ</span>
            <b style={{ color: balance > 0 ? '#b91c1c' : '#15803d' }}>{money(balance)}</b>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '16px' }}>
          <button 
            type="submit" 
            className="primary-action" 
            disabled={isSubmitting} 
            style={{ 
              opacity: isSubmitting ? 0.7 : 1, 
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              backgroundColor: isEditing ? '#b45309' : undefined
            }}
          >
            {isSubmitting 
              ? (isEditing ? '⏳ ખરીદી સુધારો સેવ થઈ રહ્યો છે...' : '⏳ ખરીદી સેવ થઈ રહી છે...') 
              : (isEditing ? '💾 ખરીદી સુધારો સેવ કરો (Update Purchase)' : 'ખરીદી સેવ કરો અને સ્ટોક અપડેટ કરો')}
          </button>
          {isEditing && (
            <button
              type="button"
              className="secondary"
              style={{ padding: '10px 18px', fontWeight: 'bold' }}
              onClick={handleCancelEdit}
            >
              ❌ સુધારો રદ કરો
            </button>
          )}
        </div>

        <p className="muted" style={{ marginTop: '10px', textAlign: 'center' }}>
          ભાવ પ્રતિ મણ (1 મણ = 20 KG). બોરી × કિલો અલગ અને ફરી બોરી × કિલો અલગ ગણતરી થશે. બિલ સેવ થયા પછી આપમેળે પ્રિન્ટ ઓપ્શન મળશે.
        </p>
      </form>

      {/* Recent Purchases Table */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '24px', marginBottom: '10px' }}>
        <h2 style={{ margin: 0 }}>તાજેતરની ખરીદી (Purchase Register)</h2>
        <button
          type="button"
          className="secondary"
          style={{ backgroundColor: '#107c41', color: 'white', borderColor: '#107c41', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={handleExportExcel}
        >
          <span>📗</span>
          <span>એક્સેલ એક્સપોર્ટ (Export to Excel)</span>
        </button>
      </div>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>બિલ નંબર</th>
              <th>તારીખ</th>
              <th>ટેગ / પ્રકાર</th>
              <th>પાર્ટી</th>
              <th>આઇટમ</th>
              <th>બેગ</th>
              <th>KG</th>
              <th>મણ</th>
              <th>કુલ રકમ</th>
              <th>ચૂકવેલ</th>
              <th>બાકી</th>
              <th style={{ textAlign: 'center' }}>એક્શન</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map(r => {
              const p = parties.find(x => x.id === r.partyId);
              const tag = r.partyType || p?.partyType || (r.purchaseType === 'farmer' ? 'farmer' : 'firm');
              const tagInfo = getPartyTagInfo(tag);
              return (
                <tr key={r.id}>
                  <td><b>{r.billNo || r.invoiceNo || '—'}</b></td>
                  <td>{r.purchaseDate || r.date || '—'}</td>
                  <td>
                    <span className={`party-tag-badge party-tag-${tagInfo.value}`}>
                      {tagInfo.badge}
                    </span>
                  </td>
                  <td><b>{r.partyName || '—'}</b></td>
                  <td>{r.items?.map(x => x.varietyName || x.productName).join(', ') || '—'}</td>
                  <td style={{ textAlign: 'center' }}>{r.items?.reduce((s, it) => s + (it.bags || 0), 0) || 0}</td>
                  <td>{Number(r.items?.reduce((s, it) => s + (it.netWeightKg || it.qtyKg || 0), 0) || r.netTotalKg || 0).toLocaleString('en-IN')} KG</td>
                  <td style={{ color: '#075b43', fontWeight: '700' }}>
                    {Number(r.items?.reduce((s, it) => s + (it.totalMan || it.qtyMan || 0), 0) || 0).toFixed(2)}
                  </td>
                  <td><b>{money(r.netTotal || r.totalAmount)}</b></td>
                  <td style={{ color: '#166534' }}>{money(r.paidAmount || r.paid)}</td>
                  <td style={{ color: (r.dueAmount || r.balance) > 0 ? '#b91c1c' : '#166534', fontWeight: '700' }}>
                    {money(r.dueAmount || r.balance)}
                  </td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      className="secondary"
                      style={{ padding: '3px 8px', fontSize: '0.75rem', color: '#166534', borderColor: '#86efac', marginRight: '6px', fontWeight: 'bold' }}
                      onClick={() => setActiveBillModal(r)}
                      title="બિલ પ્રિન્ટ કરો"
                    >
                      🖨️ પ્રિન્ટ
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      style={{ padding: '3px 8px', fontSize: '0.75rem', color: '#0284c7', borderColor: '#7dd3fc', marginRight: '6px' }}
                      onClick={() => handleStartEdit(r)}
                    >
                      ✏️ એડિટ
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      style={{ padding: '3px 8px', fontSize: '0.75rem', color: '#dc2626', borderColor: '#fca5a5' }}
                      onClick={async () => {
                        const bill = r.billNo || r.invoiceNo;
                        if (window.confirm(`શું તમે ખરીદી બિલ "${bill}" (${r.partyName}) રદ/ડીલીટ કરવા માંગો છો? આનાથી સ્ટોક અને ખાતેદાર બેલેન્સ પણ રિવર્સ થશે.`)) {
                          await deletePurchase(bill);
                        }
                      }}>
                      🗑️ ડીલીટ
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseEntry;
