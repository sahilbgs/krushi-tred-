import React, { useState, useEffect } from 'react';
import { useData, BAG_STD_KG, MAN_STD_KG } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { SimpleBillModal } from '../components/SimpleBillModal';

export const SalesBilling = ({ onBillCreated }) => {
  const { parties, farmers, seeds, stock, sales, recordSale, addFarmer, getPartyTagInfo, deleteSale } = useData();
  const { userProfile } = useAuth();

  const getNextSaleBillNo = () => {
    let maxNum = 100;
    (sales || []).forEach(s => {
      const match = (s.billNo || '').match(/KT-S-\d{4}-(\d+)/);
      if (match) {
        const val = parseInt(match[1], 10);
        if (val > maxNum) maxNum = val;
      }
    });
    return `KT-S-${new Date().getFullYear()}-${(maxNum + 1).toString().padStart(4, '0')}`;
  };

  // Common Header State
  const [billNo, setBillNo] = useState(getNextSaleBillNo);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [farmerId, setFarmerId] = useState('');
  const [farmerName, setFarmerName] = useState('');
  const [farmerMobile, setFarmerMobile] = useState('');
  const [village, setVillage] = useState('');
  const [taluka, setTaluka] = useState('દિયોદર');
  const [district, setDistrict] = useState('વાવ - થરાદ');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paid, setPaid] = useState('0');
  const [note, setNote] = useState('');

  useEffect(() => {
    setBillNo(getNextSaleBillNo());
  }, [sales]);

  // Additional Charges
  const [labour, setLabour] = useState('0');
  const [discount, setDiscount] = useState('0');

  // Multi-item rows (Bag 1 x KG 1 and Bag 2 x KG 2)
  const [items, setItems] = useState([
    { seedId: seeds[0]?.id || '', bags1: '5', kg1: '35', bags2: '0', kg2: '0', rate: '2500' }
  ]);

  // Notice & Preview Modal
  const [notice, setNotice] = useState('');
  const [lastInvoice, setLastInvoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const money = n => '₹' + Math.round(Number(n || 0)).toLocaleString('en-IN');
  const num = v => Math.max(0, Number(v || 0));

  // Totals calculation
  const totals = items.reduce((sum, row) => {
    const b1 = num(row.bags1 !== undefined ? row.bags1 : row.bags);
    const k1 = num(row.kg1 !== undefined ? row.kg1 : 35);
    const b2 = num(row.bags2);
    const k2 = num(row.kg2);
    const rowBags = b1 + b2;
    const kg = (b1 * k1) + (b2 * k2);
    const man = kg / MAN_STD_KG;
    const rate = num(row.rate);
    const goods = man * rate;
    return {
      bags: sum.bags + rowBags,
      kg: sum.kg + kg,
      man: sum.man + man,
      goods: sum.goods + goods
    };
  }, { bags: 0, kg: 0, man: 0, goods: 0 });

  const chargesTotal = num(labour);
  const netTotal = Math.max(0, totals.goods + chargesTotal - num(discount));
  const dueAmount = Math.max(0, netTotal - num(paid));

  const handleFarmerChange = (fId) => {
    setFarmerId(fId);
    const f = (parties || farmers).find(x => x.id === fId);
    if (f) {
      setFarmerName(f.name || f.firmName || '');
      setFarmerMobile(f.mobile || '');
      setVillage(f.village || f.city || '');
      if (f.taluka) setTaluka(f.taluka);
      if (f.district) setDistrict(f.district);
    }
  };

  const updateItem = (index, key, value) => {
    setItems(prev => prev.map((row, i) => i === index ? { ...row, [key]: value } : row));
  };

  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      { seedId: seeds[0]?.id || '', bags1: '1', kg1: '35', bags2: '0', kg2: '0', rate: '2500' }
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setNotice('');

    if (!farmerName.trim()) {
      setIsSubmitting(false);
      setNotice('કૃપા કરીને ખેડૂત / ગ્રાહકનું નામ દાખલ કરો.');
      return;
    }

    if (items.length === 0) {
      setIsSubmitting(false);
      setNotice('ઓછામાં ઓછી એક બિયારણની જાત ઉમેરો.');
      return;
    }

    // Verify stock availability
    for (const row of items) {
      const seed = seeds.find(s => s.id === row.seedId);
      const st = stock.find(s => s.seedId === row.seedId);
      const b1 = num(row.bags1 !== undefined ? row.bags1 : row.bags);
      const k1 = num(row.kg1 !== undefined ? row.kg1 : 35);
      const b2 = num(row.bags2);
      const k2 = num(row.kg2);
      const rowKg = (b1 * k1) + (b2 * k2);
      if (st && st.totalWeightKg < rowKg) {
        setNotice(`ચેતવણી: ${seed?.varietyName || 'બિયારણ'} નો સ્ટોક ઓછો છે (હાજર: ${st.totalWeightKg} KG, માંગ: ${rowKg} KG).`);
      }
    }

    const normalizedItems = items.map(row => {
      const seed = seeds.find(s => s.id === row.seedId);
      const b1 = num(row.bags1 !== undefined ? row.bags1 : row.bags);
      const k1 = num(row.kg1 !== undefined ? row.kg1 : (seed?.bagWeightKg || 35));
      const b2 = num(row.bags2);
      const k2 = num(row.kg2);
      const rowBags = b1 + b2;
      const kg = (b1 * k1) + (b2 * k2);
      const man = kg / MAN_STD_KG;
      const ratePerMan = num(row.rate);
      const amount = Math.round(man * ratePerMan);

      return {
        seedId: seed?.id || row.seedId,
        varietyName: seed?.varietyName || 'બિયારણ',
        cropType: seed?.cropType || 'મગફળી',
        bags1: b1,
        kg1: k1,
        bags2: b2,
        kg2: k2,
        bags: rowBags,
        lastBagKg: k2,
        looseKg: (b2 * k2),
        totalWeightKg: kg,
        totalMan: man,
        rateUnit: 'man',
        rate: ratePerMan,
        ratePerMan: ratePerMan,
        amount: amount,
        itemTotal: amount
      };
    });

    const salePayload = {
      billNo,
      billDate: date,
      farmerId: farmerId || `cust_${Date.now()}`,
      farmerName,
      farmerMobile,
      farmerVillage: village,
      farmerTaluka: taluka,
      farmerDistrict: district,
      items: normalizedItems,
      goodsAmount: totals.goods,
      majuriAmount: chargesTotal,
      extraCharges: 0,
      discount: num(discount),
      netAmount: netTotal,
      paymentType: num(paid) >= netTotal ? 'cash' : num(paid) > 0 ? 'partial' : 'credit',
      paidAmount: num(paid),
      dueAmount: dueAmount,
      paymentMode: paymentMode.toLowerCase(),
      remarks: note || `વેચાણ બિલ - ${paymentMode}`
    };

    try {
      const savedSale = await recordSale(salePayload);
      const invoiceData = {
        invoiceNo: savedSale.billNo || billNo,
        billNo: savedSale.billNo || billNo,
        kind: 'sale',
        farmerName,
        partyName: farmerName,
        farmerMobile,
        partyMobile: farmerMobile,
        farmerVillage: village,
        village,
        farmerTaluka: taluka,
        farmerDistrict: district,
        billDate: date,
        date,
        items: normalizedItems,
        goodsTotal: totals.goods,
        goodsAmount: totals.goods,
        chargesTotal,
        majuriAmount: chargesTotal,
        discount: num(discount),
        netTotal,
        netAmount: netTotal,
        totalAmount: netTotal,
        paid: num(paid),
        paidAmount: num(paid),
        balance: dueAmount,
        dueAmount: dueAmount,
        paymentMode,
        note
      };

      setLastInvoice(invoiceData);
      setNotice(`વેચાણ બિલ "${savedSale.billNo || billNo}" સફળતાપૂર્વક સેવ થયું અને ખાતાવહીમાં એન્ટ્રી નોંધાઈ ગઈ.`);
      if (onBillCreated) onBillCreated(savedSale);

      // Reset form
      setBillNo(getNextSaleBillNo());
      setFarmerId('');
      setFarmerName('');
      setFarmerMobile('');
      setVillage('');
      setPaid('0');
      setNote('');
      setItems([{ seedId: seeds[0]?.id || '', bags1: '1', kg1: '35', bags2: '0', kg2: '0', rate: '2500' }]);
    } catch (err) {
      console.error('Error in sales submit:', err);
      setNotice('વેચાણ એન્ટ્રી સેવ કરવામાં ભૂલ આવી: ' + (err.message || 'Error'));
    } finally {
      setTimeout(() => setIsSubmitting(false), 500);
    }
  };

  return (
    <div>
      {notice && (
        <div className="notice" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{notice}</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {lastInvoice && (
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

      {lastInvoice && (
        <SimpleBillModal sale={lastInvoice} onClose={() => setLastInvoice(null)} />
      )}

      {/* Main Form Panel */}
      <form className="panel purchase-form" onSubmit={handleSubmit}>
        <h2>વેચાણ / સાદું બિલ બનાવો (Sales Billing)</h2>

        <div className="formgrid">
          <label>
            બિલ નંબર*
            <input required value={billNo} onChange={e => setBillNo(e.target.value)} />
          </label>

          <label>
            તારીખ*
            <input required type="date" value={date} onChange={e => setDate(e.target.value)} />
          </label>

          <label>
            ગ્રાહક / ખાતેદાર પસંદ કરો (ખેડૂત, પેઢી, સપ્લાયર, વેપારી)
            <select value={farmerId} onChange={e => handleFarmerChange(e.target.value)}>
              <option value="">માસ્ટરમાંથી પસંદ કરો (વૈકલ્પિક)</option>
              {parties.map(p => {
                const tagInfo = getPartyTagInfo ? getPartyTagInfo(p.partyType) : { badge: 'પાર્ટી' };
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

          <label>
            ગ્રાહક / ખેડૂતનું નામ*
            <input 
              required 
              value={farmerName} 
              onChange={e => setFarmerName(e.target.value)} 
              placeholder="ખેડૂતનું નામ"
            />
          </label>

          <label>
            મોબાઇલ નંબર
            <input 
              value={farmerMobile} 
              onChange={e => setFarmerMobile(e.target.value)} 
              placeholder="10 અંકનો મોબાઇલ"
            />
          </label>

          <label>
            ગામ
            <input 
              value={village} 
              onChange={e => setVillage(e.target.value)} 
              placeholder="ગામ / તાલુકો"
            />
          </label>
        </div>

        {/* Multi-Item Line Rows */}
        <div className="section-title">
          <h3>બિયારણ વિગત (બોરી × કિલો ગણતરી)</h3>
          <button type="button" className="secondary" onClick={addItemRow}>
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
          const lineTotal = man * rate;

          return (
            <div className="item-row" key={i} style={{ border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px', marginBottom: '16px', background: '#fcfdfc' }}>
              <div className="item-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: '700', color: '#166534', fontSize: '1rem' }}>
                  આઇટમ #{i + 1}
                </span>
                {items.length > 1 && (
                  <button type="button" className="danger" onClick={() => removeItemRow(i)} style={{ padding: '3px 10px', fontSize: '0.8rem' }}>
                    🗑️ કાઢી નાખો
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
                <label style={{ gridColumn: 'span 2' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>બિયારણ જાત*</span>
                  <select 
                    required 
                    value={row.seedId} 
                    onChange={e => {
                      const sel = seeds.find(s => s.id === e.target.value);
                      updateItem(i, 'seedId', e.target.value);
                      if (sel?.bagWeightKg) updateItem(i, 'kg1', sel.bagWeightKg);
                      if (sel?.defaultSaleRatePerMan) updateItem(i, 'rate', sel.defaultSaleRatePerMan);
                    }}
                    style={{ marginTop: '4px' }}>
                    <option value="">-- જાત પસંદ કરો --</option>
                    {seeds.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.varietyName}
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
                        placeholder="દા.ત. 5"
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
                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>ભાવ પ્રતિ ૨૦ KG (₹/મણ)*</span>
                  <input 
                    required 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    value={row.rate} 
                    onChange={e => updateItem(i, 'rate', e.target.value)}
                    placeholder="દા.ત. 2500"
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
                  માલની રકમ: <b style={{ color: '#166534', fontSize: '1.05rem' }}>{money(lineTotal)}</b>
                </div>
              </div>
            </div>
          );
        })}

        {/* Charges & Discount */}
        <div className="item-row">
          <h3>મજૂરી અને ડિસ્કાઉન્ટ</h3>
          <div className="formgrid">
            <label>
              મજૂરી / હમાલી (₹)
              <input 
                type="number" 
                min="0" 
                step="0.01" 
                value={labour} 
                onChange={e => setLabour(e.target.value)}
              />
            </label>
            <label>
              ડિસ્કાઉન્ટ / છૂટછાટ (₹)
              <input 
                type="number" 
                min="0" 
                step="0.01" 
                value={discount} 
                onChange={e => setDiscount(e.target.value)}
              />
            </label>
          </div>
        </div>

        {/* Payment & Remarks Grid */}
        <div className="formgrid payment-grid">
          <label>
            ચુકવણી પદ્ધતિ
            <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
              <option value="cash">રોકડ (Cash)</option>
              <option value="bank">બેંક / UPI</option>
              <option value="credit">ઉધાર (Credit)</option>
              <option value="credit">આંશિક ચુકવણી (Partial)</option>
            </select>
          </label>

          <label>
            ચૂકવેલી રકમ (₹)
            <input 
              type="number" 
              min="0" 
              step="0.01" 
              value={paid} 
              onChange={e => setPaid(e.target.value)}
            />
          </label>

          <label>
            બેંક / UPI રેફરન્સ નં.
            <input 
              value={paymentReference} 
              onChange={e => setPaymentReference(e.target.value)} 
              placeholder="દા.ત. UPI-492819"
            />
          </label>

          <label className="full">
            નોંધ (Remarks)
            <textarea 
              rows="2" 
              value={note} 
              onChange={e => setNote(e.target.value)} 
              placeholder="બિલ અંગે નોંધ..."
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
            <b>{totals.man.toLocaleString('en-IN', { maximumFractionDigits: 3 })}</b>
          </div>
          <div>
            <span>માલની કુલ રકમ</span>
            <b>{money(totals.goods)}</b>
          </div>
          <div>
            <span>મજૂરી - છૂટ</span>
            <b>{money(chargesTotal - num(discount))}</b>
          </div>
          <div>
            <span>નેટ ટોટલ</span>
            <b>{money(netTotal)}</b>
          </div>
          <div>
            <span>બાકી રકમ</span>
            <b style={{ color: dueAmount > 0 ? '#fca5a5' : '#86efac' }}>{money(dueAmount)}</b>
          </div>
        </div>

        <button type="submit" className="primary-action" disabled={isSubmitting} style={{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
          {isSubmitting ? '⏳ વેચાણ સેવ થઈ રહ્યું છે...' : 'વેચાણ સેવ કરો અને બિલ બનાવો'}
        </button>
        <p className="muted">
          ભાવ પ્રતિ મણ (20 KG). બોરી × કિલો અલગ અને ફરી બોરી × કિલો અલગ ગણતરી થશે. સેવ કર્યા બાદ તરત પ્રિન્ટ ઓપ્શન મળશે.
        </p>
      </form>

      {/* Recent Sales History */}
      <h2 style={{ marginTop: '28px' }}>વેચાણ યાદી (Recent Sales)</h2>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>બિલ નંબર</th>
              <th>તારીખ</th>
              <th>ગ્રાહકનું નામ</th>
              <th>આઇટમ્સ</th>
              <th>કુલ KG</th>
              <th>કુલ રકમ</th>
              <th>ચૂકવેલ</th>
              <th>બાકી</th>
              <th style={{ textAlign: 'center' }}>એક્શન</th>
            </tr>
          </thead>
          <tbody>
            {sales.map(s => {
              const totalKg = s.items?.reduce((a, x) => a + (x.totalWeightKg || (x.bags * 35)), 0) || 0;
              return (
                <tr key={s.id}>
                  <td><b>{s.billNo}</b></td>
                  <td>{s.billDate}</td>
                  <td>
                    {s.farmerName} {s.farmerVillage ? `(${s.farmerVillage})` : ''}
                  </td>
                  <td>{s.items?.map(x => x.varietyName).join(', ') || '—'}</td>
                  <td>{totalKg.toLocaleString('en-IN')} KG</td>
                  <td><b>{money(s.netAmount)}</b></td>
                  <td style={{ color: '#15803d' }}>{money(s.paidAmount)}</td>
                  <td style={{ color: s.dueAmount > 0 ? '#b91c1c' : '#64748b', fontWeight: s.dueAmount > 0 ? '700' : 'normal' }}>
                    {money(s.dueAmount)}
                  </td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      className="secondary"
                      style={{ padding: '3px 8px', fontSize: '0.75rem', color: '#166534', borderColor: '#86efac', fontWeight: 'bold' }}
                      onClick={() => {
                        if (onBillCreated) onBillCreated(s);
                        else setLastInvoice(s);
                      }}
                      title="બિલ પ્રિન્ટ કરો"
                    >
                      🖨️ પ્રિન્ટ
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.75rem',
                        color: '#dc2626',
                        borderColor: '#fca5a5',
                        fontWeight: 'bold',
                        marginLeft: '6px'
                      }}
                      onClick={() => setSaleToDelete(s)}
                      title="વેચાણ બિલ ડીલીટ કરો"
                    >
                      🗑️ ડીલીટ
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {saleToDelete && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px', padding: '1.25rem' }}>
            <h3 style={{ color: '#dc2626', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ⚠️ વેચાણ બિલ રદ / ડીલીટ કરો
            </h3>
            <p style={{ fontSize: '0.92rem', color: '#334155', marginBottom: '0.5rem' }}>
              શું તમે ખરેખર વેચાણ બિલ નં. <b>{saleToDelete.billNo}</b> (ગ્રાહક: {saleToDelete.farmerName}) ડીલીટ કરવા માંગો છો?
            </p>
            <p style={{ fontSize: '0.8rem', color: '#b91c1c', backgroundColor: '#fee2e2', padding: '8px 10px', borderRadius: '6px', marginBottom: '1rem' }}>
              નોંધ: આ બિલ સાથે જોડાયેલ માલ (સ્ટોક) આપમેળે પાછો જમા થશે અને રોજમેળ / ખાતાવહીમાંથી આ એન્ટ્રી નીકળી જશે.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={isDeleting}
                onClick={() => setSaleToDelete(null)}
              >
                રદ કરો (Cancel)
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await deleteSale(saleToDelete.billNo);
                    setSaleToDelete(null);
                  } catch (err) {
                    alert('ડીલીટ કરવામાં ભૂલ: ' + (err.message || 'અજ્ઞાત ભૂલ'));
                  } finally {
                    setIsDeleting(false);
                  }
                }}
              >
                {isDeleting ? 'ડીલીટ થઈ રહ્યું છે...' : 'હા, ડીલીટ કરો'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SalesBilling;
