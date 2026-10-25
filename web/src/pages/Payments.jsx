import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export const Payments = () => {
  const { farmers, suppliers, partyTransactions, recordPayment } = useData();
  const { userProfile } = useAuth();

  const [showAddForm, setShowAddForm] = useState(false);
  const [notice, setNotice] = useState('');
  const [partyType, setPartyType] = useState('farmer'); // farmer | supplier
  const [partyId, setPartyId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash'); // cash | upi | bank
  const [referenceNo, setReferenceNo] = useState('');
  const [remarks, setRemarks] = useState('');

  const currentParty = partyType === 'farmer' 
    ? farmers.find(f => f.id === partyId)
    : suppliers.find(s => s.id === partyId);

  const handleSavePayment = (e) => {
    e.preventDefault();
    if (!partyId || !amount || parseFloat(amount) <= 0) return;

    recordPayment({
      partyType,
      partyId,
      partyName: partyType === 'farmer' ? currentParty?.name : currentParty?.companyName,
      type: partyType === 'farmer' ? 'receipt' : 'payment',
      amount: parseFloat(amount),
      paymentMode,
      referenceNo,
      remarks,
      recordedBy: userProfile?.displayName || 'સ્ટાફ'
    });

    setNotice(`₹${amount} ની વાઉચર એન્ટ્રી સફળતાપૂર્વક સાચવવામાં આવી.`);
    setShowAddForm(false);
    setPartyId('');
    setAmount('');
    setReferenceNo('');
    setRemarks('');
  };

  // Filter receipt / payment transactions
  const voucherTransactions = partyTransactions.filter(tx => 
    tx.voucherType === 'receipt' || tx.voucherType === 'payment'
  );

  return (
    <div>
      {notice && (
        <div className="notice" onClick={() => setNotice('')} style={{ marginBottom: '16px' }}>
          {notice} ×
        </div>
      )}

      {/* Header & Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <button 
          type="button"
          className="primary-action" 
          style={{ width: 'auto', padding: '9px 18px' }}
          onClick={() => setShowAddForm(prev => !prev)}>
          {showAddForm ? '✕ ફોર્મ બંધ કરો' : '＋ નવી રસીદ / ચુકવણી વાઉચર'}
        </button>
      </div>

      {/* Inline Form */}
      {showAddForm && (
        <form className="panel formgrid" onSubmit={handleSavePayment} style={{ marginBottom: '24px' }}>
          <h2 style={{ gridColumn: '1 / -1', margin: 0, color: '#14532d' }}>
            નવી રસીદ / ચુકવણી નોંધો
          </h2>

          <label>
            વ્યવહાર પ્રકાર
            <select value={partyType} onChange={e => { setPartyType(e.target.value); setPartyId(''); }}>
              <option value="farmer">ખેડૂત પાસેથી વસૂલાત (Receipt / જમા)</option>
              <option value="supplier">પેઢી/સપ્લાયરને ચુકવણી (Payment / ઉધાર)</option>
            </select>
          </label>

          <label>
            {partyType === 'farmer' ? 'ખેડૂત પસંદ કરો*' : 'પેઢી/સપ્લાયર પસંદ કરો*'}
            <select required value={partyId} onChange={e => setPartyId(e.target.value)}>
              <option value="">પાર્ટી પસંદ કરો</option>
              {partyType === 'farmer' ? (
                farmers.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.village ? `(${f.village})` : ''} — બાકી: ₹{(f.currentBalance || 0).toLocaleString('en-IN')}
                  </option>
                ))
              ) : (
                suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.companyName} ({s.city}) — બાકી: ₹{(s.currentBalance || 0).toLocaleString('en-IN')}
                  </option>
                ))
              )}
            </select>
          </label>

          <label>
            રકમ (₹)*
            <input 
              required 
              type="number" 
              min="1" 
              step="0.01"
              value={amount} 
              onChange={e => setAmount(e.target.value)}
              placeholder="રકમ ₹"
            />
          </label>

          <label>
            ચુકવણી પદ્ધતિ (Mode)
            <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
              <option value="cash">રોકડ (Cash)</option>
              <option value="upi">UPI / GPay / PhonePe</option>
              <option value="bank">બેંક ટ્રાન્સફર (NEFT / RTGS)</option>
              <option value="cheque">ચેક (Cheque)</option>
            </select>
          </label>

          <label>
            રેફરન્સ / ચેક / UTR નંબર
            <input 
              value={referenceNo} 
              onChange={e => setReferenceNo(e.target.value)}
              placeholder="દા.ત. UTR-942851"
            />
          </label>

          <label className="full">
            નોંધ (Remarks)
            <input 
              value={remarks} 
              onChange={e => setRemarks(e.target.value)}
              placeholder="વિગતવાર નોંધ..."
            />
          </label>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button type="submit" className="primary-action" style={{ width: 'auto', padding: '10px 24px' }}>
              વાઉચર સેવ કરો
            </button>
            <button type="button" className="secondary" onClick={() => setShowAddForm(false)}>
              રદ કરો
            </button>
          </div>
        </form>
      )}

      {/* Voucher Transactions Table */}
      <h2>તાજેતરના જમા-ઉધાર વાઉચર ({voucherTransactions.length})</h2>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>વાઉચર નં</th>
              <th>તારીખ</th>
              <th>પાર્ટીનું નામ</th>
              <th>પ્રકાર</th>
              <th>પદ્ધતિ</th>
              <th>રકમ (₹)</th>
              <th>નોંધ / વિગત</th>
            </tr>
          </thead>
          <tbody>
            {voucherTransactions.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: '#64748b', padding: '16px' }}>
                  હજુ કોઈ અલગ વાઉચર વ્યવહાર નોંધાયેલ નથી.
                </td>
              </tr>
            ) : (
              voucherTransactions.map(tx => (
                <tr key={tx.id}>
                  <td><b>{tx.voucherNo}</b></td>
                  <td>{tx.date}</td>
                  <td><b>{tx.partyName}</b></td>
                  <td>
                    {tx.voucherType === 'receipt' ? (
                      <span style={{ color: '#15803d', fontWeight: '700' }}>જમા (Receipt)</span>
                    ) : (
                      <span style={{ color: '#b91c1c', fontWeight: '700' }}>ચુકવણી (Payment)</span>
                    )}
                  </td>
                  <td>{tx.paymentMode?.toUpperCase()}</td>
                  <td style={{ fontWeight: '700', color: tx.credit > 0 ? '#15803d' : '#b91c1c' }}>
                    ₹{(tx.credit || tx.debit || 0).toLocaleString('en-IN')}
                  </td>
                  <td>{tx.particulars || tx.remarks || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default Payments;
