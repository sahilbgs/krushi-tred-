import React, { useState } from 'react';
import { useData, BAG_STD_KG, MAN_STD_KG } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export const PurchaseEntry = ({ onPurchaseCompleted }) => {
  const { 
    seeds, 
    parties, 
    purchases, 
    recordPurchase,
    addParty
  } = useData();
  const { userProfile } = useAuth();

  // Mode: 'farmer' (સીધા ખેડૂત પાસેથી) or 'market' (માર્કેટમાંથી વેપારી પાસેથી)
  const [sourceType, setSourceType] = useState('farmer');

  // Common Header State
  const [billNo, setBillNo] = useState(`SN-PUR-${new Date().getFullYear()}-${(purchases.length + 1).toString().padStart(4, '0')}`);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [partyId, setPartyId] = useState('');
  const [partyName, setPartyName] = useState('');
  const [partyMobile, setPartyMobile] = useState('');
  const [village, setVillage] = useState('');
  const [paymentMode, setPaymentMode] = useState('BANK');
  const [paymentReference, setPaymentReference] = useState('');
  const [paid, setPaid] = useState('0');
  const [note, setNote] = useState('');

  // Mode: Market / Trader Specific Fields
  const [pethiName, setPethiName] = useState('');
  const [truckNumber, setTruckNumber] = useState('');
  const [truckOwnerName, setTruckOwnerName] = useState('');
  const [marketCommission, setMarketCommission] = useState('0');
  const [pethiCommission, setPethiCommission] = useState('0');
  const [bardana, setBardana] = useState('0');
  const [labour, setLabour] = useState(sourceType === 'farmer' ? '10' : '0'); // per bag if farmer, total if market

  // Multi-item rows
  const [items, setItems] = useState([
    { productId: seeds[0]?.id || '', bags: '10', lastBagKg: '35', rate: '2400' }
  ]);

  // Notice & Preview Modal
  const [notice, setNotice] = useState('');
  const [lastInvoice, setLastInvoice] = useState(null);

  // Filtered Parties based on Source Type
  const activeParties = parties.filter(p => {
    if (sourceType === 'farmer') return p.partyType === 'farmer';
    if (sourceType === 'market') return p.partyType === 'firm' || p.partyType === 'trader';
    return true;
  });

  const money = n => '₹' + Math.round(Number(n || 0)).toLocaleString('en-IN');
  const num = v => Math.max(0, Number(v || 0));

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

  // Charges calculation
  const chargesTotal = sourceType === 'farmer'
    ? num(labour) * totals.bags
    : num(marketCommission) + num(pethiCommission) + num(bardana) + num(labour);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setNotice('');

    if (!partyName) {
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

    const payload = {
      purchaseType: sourceType,
      billNo: billNo || `SN-PUR-${Date.now().toString().slice(-6)}`,
      purchaseDate: date,
      partyId,
      partyName,
      partyMobile,
      village,
      pethiName: sourceType === 'market' ? pethiName : '',
      truckNumber: sourceType === 'market' ? truckNumber : '',
      truckOwnerName: sourceType === 'market' ? truckOwnerName : '',
      items: normalizedItems,
      itemsSubTotal: totals.goods,
      majuriRatePerBag: sourceType === 'farmer' ? num(labour) : 0,
      majuriAmount: sourceType === 'farmer' ? num(labour) * totals.bags : num(labour),
      marketCommission: sourceType === 'market' ? num(marketCommission) : 0,
      firmCommission: sourceType === 'market' ? num(pethiCommission) : 0,
      bardanExpense: sourceType === 'market' ? num(bardana) : 0,
      totalExpenses: chargesTotal,
      netTotal,
      paidAmount: num(paid),
      dueAmount: balance,
      paymentMode,
      paymentReference,
      remarks: note,
      createdBy: userProfile?.displayName || 'Ravi Chaudhary (Main Admin)'
    };

    const saved = recordPurchase(payload);

    setLastInvoice({
      invoiceNo: saved.billNo,
      date,
      partyName,
      partyMobile,
      village,
      purchaseSource: sourceType,
      pethiName,
      truckNumber,
      truckOwnerName,
      items: normalizedItems,
      goodsTotal: totals.goods,
      totalAmount: netTotal,
      charges: {
        labour: num(labour),
        marketCommission: num(marketCommission),
        pethiCommission: num(pethiCommission),
        bardana: num(bardana)
      },
      paid: num(paid),
      balance,
      note
    });

    setNotice('ખરીદી, સ્ટોક અને ખાતાવહીમાં સફળતાપૂર્વક એન્ટ્રી થઈ ગઈ છે.');

    // Reset Form
    setBillNo(`SN-PUR-${new Date().getFullYear()}-${(purchases.length + 2).toString().padStart(4, '0')}`);
    setPaid('0');
    setPaymentReference('');
    setNote('');
    setItems([{ productId: seeds[0]?.id || '', bags: '10', lastBagKg: '35', rate: '2400' }]);

    if (onPurchaseCompleted) {
      onPurchaseCompleted();
    }
  };

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
                <p>બિયારણ ખરીદી વાઉચર / પાવતી ({lastInvoice.purchaseSource === 'farmer' ? 'સીધા ખેડૂત પાસેથી' : 'માર્કેટ પેઢી પાસેથી'})</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <b style={{ fontSize: '18px', color: '#176343' }}>{lastInvoice.invoiceNo}</b>
                <p>{lastInvoice.date}</p>
              </div>
            </div>

            <p>
              <b>પાર્ટી:</b> {lastInvoice.partyName || '—'} 
              {lastInvoice.village ? ` | ગામ: ${lastInvoice.village}` : ''} 
              {lastInvoice.partyMobile ? ` | મોબાઇલ: ${lastInvoice.partyMobile}` : ''}
            </p>

            {lastInvoice.purchaseSource === 'market' && (
              <p>
                <b>પેઢી:</b> {lastInvoice.pethiName || '—'} | 
                <b>ટ્રક નં:</b> {lastInvoice.truckNumber || '—'} | 
                <b>ટ્રક માલિક:</b> {lastInvoice.truckOwnerName || '—'}
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
                  labour: lastInvoice.purchaseSource === 'farmer' ? 'મજૂરી ખર્ચ' : 'મજૂરી',
                  marketCommission: 'માર્કેટ કમિશન',
                  pethiCommission: 'પેઢીનું કમિશન',
                  bardana: 'બારદાન ખર્ચ'
                };
                const totalCharge = lastInvoice.purchaseSource === 'farmer' && k === 'labour'
                  ? v * lastInvoice.items.reduce((a, x) => a + x.bags, 0)
                  : v;
                return (
                  <p key={k}>
                    {labelMap[k] || k}: <b>{money(totalCharge)}</b>
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

      {/* Main Purchase Form Panel (v2) */}
      <form className="panel purchase-form" onSubmit={handleSubmit}>
        <h2>નવી બિયારણ ખરીદી એન્ટ્રી</h2>

        <div className="formgrid">
          <label>
            ખરીદીનો પ્રકાર
            <select
              value={sourceType}
              onChange={e => {
                setSourceType(e.target.value);
                setPartyId('');
                setPartyName('');
                setPartyMobile('');
                setVillage('');
                setPethiName('');
                setLabour(e.target.value === 'farmer' ? '10' : '0');
              }}>
              <option value="farmer">1. સીધા ખેડૂત પાસેથી ખરીદી</option>
              <option value="market">2. માર્કેટમાંથી વેપારી પાસેથી ખરીદી</option>
            </select>
          </label>

          {sourceType === 'market' && (
            <label>
              પેઢીનું નામ*
              <input
                required
                value={pethiName}
                onChange={e => setPethiName(e.target.value)}
                placeholder="પેઢીનું નામ (દા.ત. શ્રી ગણેશ ટ્રેડિંગ)"
              />
            </label>
          )}

          <label>
            {sourceType === 'farmer' ? 'ખેડૂતનું નામ' : 'વેપારીનું નામ'}
            <select
              value={partyId}
              onChange={e => {
                setPartyId(e.target.value);
                const p = activeParties.find(x => x.id === e.target.value);
                if (p) {
                  setPartyName(p.name || '');
                  if (p.mobile) setPartyMobile(p.mobile);
                  if (p.village) setVillage(p.village);
                  if (sourceType === 'market' && p.firmName) setPethiName(p.firmName);
                }
              }}>
              <option value="">માસ્ટરમાંથી પસંદ કરો (વૈકલ્પિક)</option>
              {activeParties.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.firmName ? ` — ${p.firmName}` : ''} {p.village ? `(${p.village})` : ''}
                </option>
              ))}
            </select>
          </label>

          <label>
            {sourceType === 'farmer' ? 'ખેડૂતનું નામ*' : 'પાર્ટીનું નામ*'}
            <input
              required
              value={partyName}
              onChange={e => setPartyName(e.target.value)}
              placeholder="નામ દાખલ કરો"
            />
          </label>

          {sourceType === 'farmer' && (
            <label>
              મોબાઇલ નંબર
              <input
                value={partyMobile}
                onChange={e => setPartyMobile(e.target.value)}
                placeholder="૧૦ આંકડાનો મોબાઇલ"
              />
            </label>
          )}

          <label>
            ગામ / યાર્ડ
            <input
              value={village}
              onChange={e => setVillage(e.target.value)}
              placeholder="ગામ / માર્કેટ યાર્ડ"
            />
          </label>

          {sourceType === 'market' && (
            <>
              <label>
                ટ્રક નંબર
                <input
                  value={truckNumber}
                  onChange={e => setTruckNumber(e.target.value)}
                  placeholder="દા.ત. GJ-11-X-4589"
                />
              </label>
              <label>
                ટ્રક માલિકનું નામ
                <input
                  value={truckOwnerName}
                  onChange={e => setTruckOwnerName(e.target.value)}
                  placeholder="દા.ત. જય ખોડિયાર ટ્રાન્સપોર્ટ"
                />
              </label>
            </>
          )}

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
              onChange={e => setPaymentMode(e.target.value)}>
              <option value="BANK">બેંક ટ્રાન્સફર / NEFT / RTGS</option>
              <option value="CASH">રોકડ (CASH)</option>
              <option value="CREDIT">ઉધાર (CREDIT)</option>
              <option value="PARTIAL">આંશિક ચુકવણી</option>
            </select>
          </label>
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
          <h3>{sourceType === 'farmer' ? 'ખેડૂત ખરીદી — મજૂરી' : 'માર્કેટ ખરીદી — કમિશન અને ખર્ચ'}</h3>
          <div className="formgrid">
            {sourceType === 'farmer' ? (
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
            ) : (
              <>
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
                  બારદાન (₹)
                  <input
                    type="number"
                    min="0"
                    value={bardana}
                    onChange={e => setBardana(e.target.value)}
                  />
                </label>
                <label>
                  મજૂરી (₹)
                  <input
                    type="number"
                    min="0"
                    value={labour}
                    onChange={e => setLabour(e.target.value)}
                  />
                </label>
              </>
            )}
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

        <button type="submit" className="primary-action">
          ખરીદી સેવ કરો અને સ્ટોક અપડેટ કરો
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
              <th>પ્રકાર</th>
              <th>પાર્ટી</th>
              <th>આઇટમ</th>
              <th>બેગ</th>
              <th>KG</th>
              <th>મણ</th>
              <th>કુલ રકમ</th>
              <th>ચૂકવેલ</th>
              <th>બાકી</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map(r => (
              <tr key={r.id}>
                <td><b>{r.billNo || r.invoiceNo || '—'}</b></td>
                <td>{r.purchaseDate || r.date || '—'}</td>
                <td>
                  <span className={`badge ${r.purchaseType === 'farmer' ? 'badge-primary' : 'badge-warning'}`}>
                    {r.purchaseType === 'farmer' ? 'ખેડૂત' : 'માર્કેટ'}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
