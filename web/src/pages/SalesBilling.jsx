import React, { useState } from 'react';
import { useData, BAG_STD_KG, MAN_STD_KG } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export const SalesBilling = ({ onBillCreated }) => {
  const { farmers, seeds, stock, sales, recordSale, addFarmer } = useData();
  const { userProfile } = useAuth();

  // Common Header State
  const autoBillNo = `KT-S-${new Date().getFullYear()}-${(sales.length + 101).toString().padStart(4, '0')}`;
  const [billNo, setBillNo] = useState(autoBillNo);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [farmerId, setFarmerId] = useState('');
  const [farmerName, setFarmerName] = useState('');
  const [farmerMobile, setFarmerMobile] = useState('');
  const [village, setVillage] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [paid, setPaid] = useState('0');
  const [note, setNote] = useState('');

  // Additional Charges
  const [labour, setLabour] = useState('0');
  const [discount, setDiscount] = useState('0');

  // Multi-item rows (Default 35 KG/bag, 20 KG = 1 man, rate in ₹/મણ)
  const [items, setItems] = useState([
    { seedId: seeds[0]?.id || '', bags: '5', lastBagKg: '35', rate: '2500' }
  ]);

  // Notice & Preview Modal
  const [notice, setNotice] = useState('');
  const [lastInvoice, setLastInvoice] = useState(null);

  const money = n => '₹' + Math.round(Number(n || 0)).toLocaleString('en-IN');
  const num = v => Math.max(0, Number(v || 0));

  // Totals calculation
  const totals = items.reduce((sum, row) => {
    const b = num(row.bags);
    const lastKg = num(row.lastBagKg);
    const kg = b > 0 ? (Math.max(0, b - 1) * BAG_STD_KG + Math.min(BAG_STD_KG, lastKg)) : 0;
    const man = kg / MAN_STD_KG;
    const rate = num(row.rate);
    const goods = man * rate;
    return {
      bags: sum.bags + b,
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
    const f = farmers.find(x => x.id === fId);
    if (f) {
      setFarmerName(f.name);
      setFarmerMobile(f.mobile || '');
      setVillage(f.village || '');
    }
  };

  const updateItem = (index, key, value) => {
    setItems(prev => prev.map((row, i) => i === index ? { ...row, [key]: value } : row));
  };

  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      { seedId: seeds[0]?.id || '', bags: '1', lastBagKg: '35', rate: '2500' }
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setNotice('');

    if (!farmerName.trim()) {
      setNotice('કૃપા કરીને ખેડૂત / ગ્રાહકનું નામ દાખલ કરો.');
      return;
    }

    if (items.length === 0) {
      setNotice('ઓછામાં ઓછી એક બિયારણની જાત ઉમેરો.');
      return;
    }

    // Verify stock availability
    for (const row of items) {
      const seed = seeds.find(s => s.id === row.seedId);
      const st = stock.find(s => s.seedId === row.seedId);
      const rowKg = Math.max(0, num(row.bags) - 1) * BAG_STD_KG + num(row.lastBagKg);
      if (st && st.totalWeightKg < rowKg) {
        setNotice(`ચેતવણી: ${seed?.varietyName || 'બિયારણ'} નો સ્ટોક ઓછો છે (હાજર: ${st.totalWeightKg} KG, માંગ: ${rowKg} KG).`);
        // We still allow if admin permits, but alert user
      }
    }

    const normalizedItems = items.map(row => {
      const seed = seeds.find(s => s.id === row.seedId);
      const b = num(row.bags);
      const lastKg = num(row.lastBagKg);
      const kg = b > 0 ? (Math.max(0, b - 1) * BAG_STD_KG + Math.min(BAG_STD_KG, lastKg)) : 0;
      const man = kg / MAN_STD_KG;
      const ratePerMan = num(row.rate);
      const amount = Math.round(man * ratePerMan);

      return {
        seedId: seed?.id || row.seedId,
        varietyName: seed?.varietyName || 'બિયારણ',
        bags: b,
        lastBagKg: lastKg,
        looseKg: lastKg,
        totalWeightKg: kg,
        totalMan: man,
        rateUnit: 'MAN20KG',
        rate: ratePerMan,
        ratePerMan: ratePerMan,
        amount: amount
      };
    });

    const salePayload = {
      billNo,
      billDate: date,
      farmerId: farmerId || `cust_${Date.now()}`,
      farmerName,
      farmerMobile,
      farmerVillage: village,
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
      const savedSale = recordSale(salePayload);
      const invoiceData = {
        invoiceNo: billNo,
        kind: 'sale',
        partyName: farmerName,
        partyMobile,
        village,
        date,
        items: normalizedItems,
        goodsTotal: totals.goods,
        chargesTotal,
        discount: num(discount),
        netTotal,
        totalAmount: netTotal,
        paid: num(paid),
        balance: dueAmount,
        paymentMode,
        note
      };

      setLastInvoice(invoiceData);
      setNotice('વેચાણ બિલ, સ્ટોક અને ખાતાવહી સફળતાપૂર્વક સેવ થયા.');
      if (onBillCreated) onBillCreated(savedSale);

      // Reset form
      setBillNo(`KT-S-${new Date().getFullYear()}-${(sales.length + 102).toString().padStart(4, '0')}`);
      setFarmerId('');
      setFarmerName('');
      setFarmerMobile('');
      setVillage('');
      setPaid('0');
      setNote('');
      setItems([{ seedId: seeds[0]?.id || '', bags: '1', lastBagKg: '35', rate: '2500' }]);
    } catch (err) {
      setNotice('વેચાણ એન્ટ્રી સેવ કરવામાં ભૂલ આવી: ' + (err.message || 'Error'));
    }
  };

  return (
    <div>
      {notice && (
        <div className="notice" onClick={() => setNotice('')} style={{ marginBottom: '16px' }}>
          {notice} ×
        </div>
      )}

      {lastInvoice && (
        <div className="modal-backdrop">
          <section className="invoice-sheet">
            <div className="no-print invoice-actions">
              <button type="button" className="secondary" onClick={() => window.print()}>
                🖨️ પ્રિન્ટ / PDF સેવ કરો
              </button>
              <button type="button" className="secondary" onClick={() => setLastInvoice(null)}>
                ✕ બંધ કરો
              </button>
            </div>

            <div className="invoice-head">
              <div>
                <h1>🌱 SHREE NANDINI SEEDS</h1>
                <p>બિયારણ વેચાણ બિલ (Sales Bill)</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <b>{lastInvoice.invoiceNo}</b>
                <p>તારીખ: {lastInvoice.date}</p>
              </div>
            </div>

            <p style={{ margin: '8px 0', borderBottom: '1px solid #d1d5db', paddingBottom: '8px' }}>
              <b>ગ્રાહક/ખેડૂત:</b> {lastInvoice.partyName || '—'} 
              {lastInvoice.village ? ` | ગામ: ${lastInvoice.village}` : ''}
              {lastInvoice.partyMobile ? ` | મોબાઇલ: ${lastInvoice.partyMobile}` : ''}
            </p>

            <table style={{ margin: '12px 0' }}>
              <thead>
                <tr>
                  <th>બિયારણ જાત</th>
                  <th>બોરી</th>
                  <th>વજન KG</th>
                  <th>મણ (20 KG)</th>
                  <th>ભાવ પ્રતિ મણ (₹)</th>
                  <th>રકમ (₹)</th>
                </tr>
              </thead>
              <tbody>
                {lastInvoice.items.map((x, i) => (
                  <tr key={i}>
                    <td><b>{x.varietyName}</b></td>
                    <td>{x.bags}</td>
                    <td>{x.totalWeightKg} KG</td>
                    <td>{(x.totalMan || 0).toLocaleString('en-IN', { maximumFractionDigits: 3 })}</td>
                    <td>{money(x.ratePerMan)}</td>
                    <td><b>{money(x.amount)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="invoice-summary">
              <p>માલની કુલ રકમ: <b>{money(lastInvoice.goodsTotal)}</b></p>
              {lastInvoice.chargesTotal > 0 && (
                <p>મજૂરી / પેકિંગ ખર્ચ: <b>{money(lastInvoice.chargesTotal)}</b></p>
              )}
              {lastInvoice.discount > 0 && (
                <p>ડિસ્કાઉન્ટ: <b>- {money(lastInvoice.discount)}</b></p>
              )}
              <p style={{ fontSize: '1.05rem', borderTop: '1px solid #94a3b8', paddingTop: '4px' }}>
                નેટ ટોટલ: <b>{money(lastInvoice.netTotal)}</b>
              </p>
              <p>ચૂકવેલ રકમ: <b style={{ color: '#15803d' }}>{money(lastInvoice.paid)}</b></p>
              <p>બાકી રકમ: <b style={{ color: lastInvoice.balance > 0 ? '#b91c1c' : '#15803d' }}>{money(lastInvoice.balance)}</b></p>
            </div>

            {lastInvoice.note && <p style={{ fontSize: '0.85rem', color: '#64748b' }}>નોંધ: {lastInvoice.note}</p>}
            <p className="invoice-foot">આ કમ્પ્યુટર જનરેટેડ સેલ્સ બિલ છે. • Shree Nandini Seeds</p>
          </section>
        </div>
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
            ખેડૂત / ગ્રાહક પસંદ કરો
            <select value={farmerId} onChange={e => handleFarmerChange(e.target.value)}>
              <option value="">માસ્ટરમાંથી પસંદ કરો (વૈકલ્પિક)</option>
              {farmers.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} {f.village ? `(${f.village})` : ''} — બાકી: ₹{(f.currentBalance || 0).toLocaleString('en-IN')}
                </option>
              ))}
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
          <h3>માલની જાત અને વજન</h3>
          <button type="button" className="secondary" onClick={addItemRow}>
            ＋ બીજી જાત ઉમેરો
          </button>
        </div>
        <p className="muted">
          દરેક બોરી 35 KG ગણાશે. 1 મણ = 20 KG. ભાવ પ્રતિ મણ (₹/મણ). કુલ વજન = (કુલ બેગ − 1) × 35 + છેલ્લી બોરીનું વજન.
        </p>

        {items.map((row, i) => {
          const b = num(row.bags);
          const lastKg = num(row.lastBagKg);
          const kg = b > 0 ? (Math.max(0, b - 1) * BAG_STD_KG + Math.min(BAG_STD_KG, lastKg)) : 0;
          const man = kg / MAN_STD_KG;
          const rate = num(row.rate);
          const lineTotal = man * rate;

          return (
            <div className="item-row" key={i}>
              <div className="item-head">
                <b>આઇટમ {i + 1}</b>
                {items.length > 1 && (
                  <button type="button" className="danger" onClick={() => removeItemRow(i)}>
                    દૂર કરો
                  </button>
                )}
              </div>

              <div className="formgrid">
                <label>
                  બિયારણ જાત*
                  <select 
                    required 
                    value={row.seedId} 
                    onChange={e => updateItem(i, 'seedId', e.target.value)}>
                    <option value="">જાત પસંદ કરો</option>
                    {seeds.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.varietyName} {s.cropType ? `(${s.cropType})` : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  કુલ બેગ (35 KG/બોરી)
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
                  છેલ્લી બેગનું વજન (KG)
                  <input 
                    required 
                    type="number" 
                    min="0.01" 
                    max="35" 
                    step="0.01" 
                    value={row.lastBagKg} 
                    onChange={e => updateItem(i, 'lastBagKg', e.target.value)}
                  />
                </label>

                <label>
                  ભાવ પ્રતિ મણ (₹/મણ)*
                  <input 
                    required 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    value={row.rate} 
                    onChange={e => updateItem(i, 'rate', e.target.value)}
                  />
                </label>

                <div className="line-total">
                  <span>કુલ વજન</span>
                  <b>{kg.toLocaleString('en-IN')} KG</b>
                  <span>કુલ મણ (1 મણ = 20 KG)</span>
                  <b>{man.toLocaleString('en-IN', { maximumFractionDigits: 3 })} મણ</b>
                  <span>માલની રકમ</span>
                  <b>{money(lineTotal)}</b>
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
              <option value="CASH">રોકડ (Cash)</option>
              <option value="BANK">બેંક / UPI</option>
              <option value="CREDIT">ઉધાર (Credit)</option>
              <option value="PARTIAL">આંશિક ચુકવણી (Partial)</option>
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

        <button type="submit" className="primary-action">
          વેચાણ સેવ કરો અને બિલ બનાવો
        </button>
        <p className="muted">
          ભાવ પ્રતિ મણ (20 KG). 1 બોરી = 35 KG. સેવ કરવાથી સ્ટોકમાંથી માલ બાદ થશે અને ગ્રાહકના ખાતામાં એન્ટ્રી જમા-ઉધાર થશે.
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default SalesBilling;
