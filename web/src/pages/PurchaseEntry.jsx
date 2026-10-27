import React, { useState, useEffect } from 'react';
import { useData, BAG_STD_KG, MAN_STD_KG, PARTY_TAGS, getPartyTagInfo } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export const PurchaseEntry = ({ onPurchaseCompleted }) => {
  const { 
    seeds, 
    parties, 
    purchases, 
    recordPurchase,
    addParty,
    deletePurchase
  } = useData();
  const { userProfile } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setBillNo(getNextBillNo());
  }, [purchases]);

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
  const [truckNumber, setTruckNumber] = useState('');
  const [truckOwnerName, setTruckOwnerName] = useState('');
  const [marketCommission, setMarketCommission] = useState('0');
  const [pethiCommission, setPethiCommission] = useState('0');
  const [bardana, setBardana] = useState('0');
  const [labour, setLabour] = useState('10'); // per bag labour (default 10)

  // Multi-item rows
  const [items, setItems] = useState([
    { productId: seeds[0]?.id || '', bags: '10', lastBagKg: '35', rate: '2400' }
  ]);

  // Notice & Preview Modal
  const [notice, setNotice] = useState('');
  const [lastInvoice, setLastInvoice] = useState(null);

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

  const money = n => '₹' + Math.round(Number(n || 0)).toLocaleString('en-IN');
  const num = v => Math.max(0, Number(v || 0));

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

  // Dynamic Line & Totals calculation: 1 bag = 35 KG, 1 man = 20 KG
  const totals = items.reduce((sum, row) => {
    const b = num(row.bags);
    const lastKg = row.lastBagKg !== '' ? num(row.lastBagKg) : 35;
    const kg = b > 0 ? (Math.max(0, b - 1) * BAG_STD_KG + Math.min(BAG_STD_KG, lastKg)) : 0;
    const man = kg / MAN_STD_KG;
    const rate = num(row.rate);
    const goods = man * rate;
    return {
      kg: sum.kg + kg,
      man: sum.man + man,
      goods: sum.goods + goods,
      bags: sum.bags + b
    };
  }, { kg: 0, man: 0, goods: 0, bags: 0 });

  // Charges calculation: labour per bag + optional commissions/bardana
  const labourTotal = num(labour) * totals.bags;
  const chargesTotal = labourTotal + num(marketCommission) + num(pethiCommission) + num(bardana);
  const netTotal = totals.goods + chargesTotal;
  const balance = Math.max(0, netTotal - num(paid));

  const updateItem = (i, key, value) => {
    setItems(old => old.map((row, index) => index === i ? { ...row, [key]: value } : row));
  };

  const handleAddItem = () => {
    setItems(old => [...old, { productId: '', bags: '10', lastBagKg: '35', rate: '2400' }]);
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
      if (num(it.bags) <= 0) {
        setNotice(`આઇટમ ${i + 1}: બોરીની સંખ્યા ૧ કે તેથી વધુ હોવી જોઈએ.`);
        return;
      }
      const lKg = num(it.lastBagKg);
      if (lKg < 0 || lKg > BAG_STD_KG) {
        setNotice(`આઇટમ ${i + 1}: છેલ્લી બોરીનું વજન ૦ થી ૩૫ KG સુધીનું હોવું જોઈએ.`);
        return;
      }
    }

    const normalizedItems = items.map(row => {
      const prod = seeds.find(s => s.id === row.productId);
      const b = num(row.bags);
      const lastKg = num(row.lastBagKg);
      const kg = b > 0 ? ((b - 1) * BAG_STD_KG + lastKg) : 0;
      const man = kg / MAN_STD_KG;
      const rate = num(row.rate);
      return {
        seedId: prod?.id || '',
        productId: prod?.id || '',
        productName: prod?.varietyName || 'બિયારણ',
        varietyName: prod?.varietyName || 'બિયારણ',
        bags: b,
        lastBagKg: lastKg,
        netWeightKg: kg,
        qtyKg: kg,
        totalMan: Number(man.toFixed(2)),
        qtyMan: Number(man.toFixed(2)),
        ratePerMan: rate,
        rate: rate,
        itemTotal: Math.round(man * rate),
        amount: Math.round(man * rate)
      };
    });

    // Determine purchaseType for backend backward-compatibility
    const legacyPurchaseType = ['firm', 'supplier', 'trader'].includes(partyType) ? 'market' : 'farmer';

    const payload = {
      purchaseType: legacyPurchaseType,
      partyType,
      billNo: billNo || `SN-PUR-${Date.now().toString().slice(-6)}`,
      purchaseDate: date,
      partyId,
      partyName: partyName.trim(),
      partyMobile,
      village,
      pethiName: pethiName || '',
      truckNumber: truckNumber || '',
      truckOwnerName: truckOwnerName || '',
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
      const saved = await recordPurchase(payload);

      setLastInvoice({
        invoiceNo: saved.billNo,
        date,
        partyName: partyName.trim(),
        partyMobile,
        village,
        partyTag: partyType,
        purchaseSource: legacyPurchaseType,
        pethiName,
        truckNumber,
        truckOwnerName,
        items: normalizedItems,
        goodsTotal: totals.goods,
        totalAmount: netTotal,
        charges: {
          labour: labourTotal,
          marketCommission: num(marketCommission),
          pethiCommission: num(pethiCommission),
          bardana: num(bardana)
        },
        paid: num(paid),
        balance,
        note
      });

      setNotice(`ખરીદી બિલ "${saved.billNo}" સફળતાપૂર્વક સેવ થઈ ગયું છે અને સ્ટોક અપડેટ થયો.`);

      // Reset Form
      setBillNo(getNextBillNo());
      setPaid('0');
      setPaymentReference('');
      setNote('');
      setItems([{ productId: seeds[0]?.id || '', bags: '10', lastBagKg: '35', rate: '2400' }]);
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
        <div className="notice" onClick={() => setNotice('')}>
          <span>{notice}</span>
          <span>×</span>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {lastInvoice && (
        <div className="modal-backdrop">
          <section className="invoice-sheet">
            <div className="no-print invoice-actions">
              <button className="secondary" onClick={() => window.print()}>
                પ્રિન્ટ / PDF સેવ કરો
              </button>
              <button className="secondary" onClick={() => setLastInvoice(null)}>
                બંધ કરો
              </button>
            </div>

            <div className="invoice-head">
              <div>
                <h1>🌱 Shree Nandini Seeds</h1>
                <p>
                  બિયારણ ખરીદી વાઉચર / પાવતી 
                  {lastInvoice.partyTag && (
                    <span style={{ marginLeft: '8px' }} className={`party-tag-badge party-tag-${lastInvoice.partyTag}`}>
                      {getPartyTagInfo(lastInvoice.partyTag).badge}
                    </span>
                  )}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <b style={{ fontSize: '18px', color: '#176343' }}>{lastInvoice.invoiceNo}</b>
                <p>{lastInvoice.date}</p>
              </div>
            </div>

            <p>
              <b>પાર્ટી:</b> {lastInvoice.partyName || '—'} 
              {lastInvoice.partyTag && (
                <span style={{ marginLeft: '6px' }} className={`party-tag-badge party-tag-${lastInvoice.partyTag}`}>
                  {getPartyTagInfo(lastInvoice.partyTag).label}
                </span>
              )}
              {lastInvoice.village ? ` | ગામ/શહેર: ${lastInvoice.village}` : ''} 
              {lastInvoice.partyMobile ? ` | મોબાઇલ: ${lastInvoice.partyMobile}` : ''}
            </p>

            {lastInvoice.pethiName && (
              <p>
                <b>પેઢી/સપ્લાયર:</b> {lastInvoice.pethiName}
                {lastInvoice.truckNumber ? ` | ટ્રક નં: ${lastInvoice.truckNumber}` : ''}
                {lastInvoice.truckOwnerName ? ` | ટ્રાન્સપોર્ટ: ${lastInvoice.truckOwnerName}` : ''}
              </p>
            )}

            <table>
              <thead>
                <tr>
                  <th>બિયારણ</th>
                  <th style={{ textAlign: 'center' }}>બોરી</th>
                  <th style={{ textAlign: 'right' }}>વજન KG</th>
                  <th style={{ textAlign: 'right' }}>મણ</th>
                  <th style={{ textAlign: 'right' }}>ભાવ / મણ</th>
                  <th style={{ textAlign: 'right' }}>રકમ</th>
                </tr>
              </thead>
              <tbody>
                {lastInvoice.items.map((x, i) => (
                  <tr key={i}>
                    <td><b>{x.productName}</b></td>
                    <td style={{ textAlign: 'center' }}>{x.bags}</td>
                    <td style={{ textAlign: 'right' }}>{x.qtyKg} KG</td>
                    <td style={{ textAlign: 'right' }}>{Number(x.qtyMan).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{money(x.ratePerMan)}</td>
                    <td style={{ textAlign: 'right', fontWeight: '700' }}>{money(x.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="invoice-summary">
              <p>માલની કુલ રકમ: <b>{money(lastInvoice.goodsTotal)}</b></p>
              {lastInvoice.charges && Object.entries(lastInvoice.charges).map(([k, v]) => {
                if (Number(v) <= 0) return null;
                const labelMap = {
                  labour: 'મજૂરી ખર્ચ',
                  marketCommission: 'માર્કેટ કમિશન',
                  pethiCommission: 'પેઢીનું કમિશન',
                  bardana: 'બારદાન ખર્ચ'
                };
                return (
                  <p key={k}>
                    {labelMap[k] || k}: <b>{money(v)}</b>
                  </p>
                );
              })}
              <p style={{ borderTop: '2px solid #176343', paddingTop: '8px', fontSize: '16px', color: '#075b43' }}>
                નેટ ટોટલ: <b>{money(lastInvoice.totalAmount)}</b>
              </p>
              <p style={{ color: '#166534' }}>
                ચૂકવેલ: <b>{money(lastInvoice.paid)}</b>
              </p>
              <p style={{ color: lastInvoice.balance > 0 ? '#b91c1c' : '#166534' }}>
                બાકી રકમ: <b>{money(lastInvoice.balance)}</b>
              </p>
            </div>

            {lastInvoice.note && <p><b>નોંધ:</b> {lastInvoice.note}</p>}
            <p className="invoice-foot">આ કમ્પ્યુટર જનરેટેડ વાઉચર છે • SHREE NANDINI SEEDS</p>
          </section>
        </div>
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

      {/* Main Purchase Form Panel */}
      <form className="panel purchase-form" onSubmit={handleSubmit}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
          <h2 style={{ margin: 0 }}>નવી બિયારણ ખરીદી એન્ટ્રી</h2>
          <button
            type="button"
            className="primary-action"
            style={{ width: 'auto', padding: '7px 14px', fontSize: '0.84rem' }}
            onClick={() => setShowAddPartyModal(true)}
          >
            ＋ નવો ખાતેદાર ઉમેરો (ખેડૂત / પેઢી / સપ્લાયર)
          </button>
        </div>

        {/* 1. Unified Customer Selection with Tag Filters */}
        <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#166534' }}>
              ખાતેદાર પ્રકાર / ટેગ ફિલ્ટર:
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
              ખાતેદાર / ગ્રાહક પસંદ કરો (ખેડૂત, પેઢી, સપ્લાયર, અન્ય વેપારી એક જ લિસ્ટમાં)
              <select
                value={partyId}
                onChange={e => handlePartySelect(e.target.value)}
                style={{ fontSize: '0.95rem', fontWeight: '600' }}
              >
                <option value="">-- માસ્ટરમાંથી ખાતેદાર / પાર્ટી પસંદ કરો --</option>
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

        {/* 3. Collapsible Transport & Market Details */}
        <div style={{ marginTop: '10px', marginBottom: '16px' }}>
          <button
            type="button"
            className="secondary"
            style={{ fontSize: '0.84rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setShowTransportDetails(prev => !prev)}
          >
            <span>{showTransportDetails ? '▼' : '▶'}</span>
            <span>ટ્રાન્સપોર્ટ & માર્કેટ કમિશન વિગતો (ટ્રક નં, ટ્રાન્સપોર્ટ, કમિશન, બારદાન)</span>
          </button>

          {(showTransportDetails || partyType === 'firm' || partyType === 'supplier' || truckNumber || num(marketCommission) > 0) && (
            <div className="panel formgrid" style={{ marginTop: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <label>
                ટ્રક / વાહન નંબર
                <input
                  value={truckNumber}
                  onChange={e => setTruckNumber(e.target.value)}
                  placeholder="દા.ત. GJ-11-X-4589"
                />
              </label>
              <label>
                ટ્રાન્સપોર્ટ / ટ્રક માલિક
                <input
                  value={truckOwnerName}
                  onChange={e => setTruckOwnerName(e.target.value)}
                  placeholder="દા.ત. જય ખોડિયાર ટ્રાન્સપોર્ટ"
                />
              </label>
              <label>
                માર્કેટ કમિશન (₹)
                <input
                  type="number"
                  min="0"
                  value={marketCommission}
                  onChange={e => setMarketCommission(e.target.value)}
                />
              </label>
              <label>
                પેઢીનું કમિશન (₹)
                <input
                  type="number"
                  min="0"
                  value={pethiCommission}
                  onChange={e => setPethiCommission(e.target.value)}
                />
              </label>
              <label>
                બારદાન ખર્ચ (₹)
                <input
                  type="number"
                  min="0"
                  value={bardana}
                  onChange={e => setBardana(e.target.value)}
                />
              </label>
            </div>
          )}
        </div>

        {/* Section: Seed Varieties & Weights */}
        <div className="section-title">
          <h3>માલની જાત અને વજન</h3>
          <button type="button" className="secondary" onClick={handleAddItem}>
            ＋ બીજી જાત ઉમેરો
          </button>
        </div>
        <p className="muted">
          દરેક બોરી 35 KG ગણાશે. “છેલ્લી બોરીનું વજન”માં છેલ્લી બોરીમાં રહેલું વાસ્તવિક વજન નાખો (૦ થી ૩૫ KG). કુલ વજન = (કુલ બેગ − 1) × 35 + છેલ્લી બોરીનું વજન.
        </p>

        {items.map((row, i) => {
          const b = num(row.bags);
          const lastKg = row.lastBagKg !== '' ? num(row.lastBagKg) : 35;
          const kg = b > 0 ? (Math.max(0, b - 1) * BAG_STD_KG + Math.min(BAG_STD_KG, lastKg)) : 0;
          const man = kg / MAN_STD_KG;
          const rate = num(row.rate);
          const lineGoods = man * rate;

          return (
            <div className="item-row" key={i}>
              <div className="item-head">
                <b>આઇટમ {i + 1}</b>
                {items.length > 1 && (
                  <button type="button" className="danger" onClick={() => handleRemoveItem(i)}>
                    દૂર કરો
                  </button>
                )}
              </div>

              <div className="formgrid">
                <label>
                  માલની જાત*
                  <select
                    required
                    value={row.productId}
                    onChange={e => {
                      const sel = seeds.find(s => s.id === e.target.value);
                      updateItem(i, 'productId', e.target.value);
                      if (sel?.defaultPurchaseRatePerMan) {
                        updateItem(i, 'rate', sel.defaultPurchaseRatePerMan);
                      }
                    }}>
                    <option value="">જાત પસંદ કરો</option>
                    {seeds.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.varietyName}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  કુલ બેગ*
                  <input
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={row.bags}
                    onChange={e => updateItem(i, 'bags', e.target.value)}
                  />
                </label>

                <label>
                  છેલ્લી બેગનું વજન (KG)*
                  <input
                    required
                    type="number"
                    min="0"
                    max="35"
                    step="0.1"
                    value={row.lastBagKg}
                    onChange={e => updateItem(i, 'lastBagKg', e.target.value)}
                    placeholder="0 થી 35 KG"
                  />
                </label>

                <label>
                  ભાવ પ્રતિ મણ (₹/મણ)*
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={row.rate}
                    onChange={e => updateItem(i, 'rate', e.target.value)}
                    placeholder="દા.ત. 2400"
                  />
                </label>

                <div className="line-total" style={{ gridColumn: '1 / -1' }}>
                  <span>કુલ વજન:</span>
                  <b>{kg.toLocaleString('en-IN')} KG</b>
                  <span>કુલ મણ (1 મણ = 20 KG):</span>
                  <b style={{ color: '#075b43' }}>{man.toFixed(2)} મણ</b>
                  <span>માલની રકમ:</span>
                  <b style={{ fontSize: '16px', color: '#064e3b' }}>{money(lineGoods)}</b>
                </div>
              </div>
            </div>
          );
        })}

        {/* Charges & Expenses */}
        <div className="item-row">
          <h3>મજૂરી ખર્ચ</h3>
          <div className="formgrid">
            <label>
              મજૂરી પ્રતિ બેગ (₹/બેગ)
              <input
                type="number"
                min="0"
                step="1"
                value={labour}
                onChange={e => setLabour(e.target.value)}
              />
            </label>
            <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
              <span style={{ fontSize: '0.9rem', color: '#4b5563' }}>
                કુલ મજૂરી ({totals.bags} બેગ × ₹{num(labour)}): <b>{money(labourTotal)}</b>
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
            <span>મજૂરી / કમિશન / ખર્ચ</span>
            <b>{money(chargesTotal)}</b>
          </div>
          <div>
            <span>નેટ ટોટલ</span>
            <b style={{ color: '#064e3b' }}>{money(netTotal)}</b>
          </div>
          <div>
            <span>બાકી રકમ</span>
            <b style={{ color: balance > 0 ? '#b91c1c' : '#15803d' }}>{money(balance)}</b>
          </div>
        </div>

        <button type="submit" className="primary-action" disabled={isSubmitting} style={{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
          {isSubmitting ? '⏳ ખરીદી સેવ થઈ રહી છે...' : 'ખરીદી સેવ કરો અને સ્ટોક અપડેટ કરો'}
        </button>

        <p className="muted" style={{ marginTop: '10px', textAlign: 'center' }}>
          ભાવ પ્રતિ મણ (1 મણ = 20 KG). 1 બેગ = 35 KG; છેલ્લી બેગનું વજન અલગ દાખલ કરો. નેટ ટોટલમાં લાગુ પડતી મજૂરી/કમિશન/બારદાન ઉમેરાશે.
        </p>
      </form>

      {/* Recent Purchases Table */}
      <h2>તાજેતરની ખરીદી (Purchase Register)</h2>
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
                  <td style={{ textAlign: 'center' }}>
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
