import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export const Payments = () => {
  const { parties, farmers, suppliers, partyTransactions, recordVoucher, deleteVoucher } = useData();
  const { userProfile } = useAuth();

  const [showAddForm, setShowAddForm] = useState(false);
  const [notice, setNotice] = useState('');
  const [voucherType, setVoucherType] = useState('receipt'); // 'receipt' (જમા) | 'payment' (ઉધાર)
  const [partyId, setPartyId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash'); // cash | upi | bank
  const [referenceNo, setReferenceNo] = useState('');
  const [remarks, setRemarks] = useState('');

  const currentParty = parties.find(p => p.id === partyId);

  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (!partyId || !amount || parseFloat(amount) <= 0) return;

    try {
      const partyName = currentParty?.name || currentParty?.firmName || currentParty?.companyName || 'ખાતેદાર';

      await recordVoucher({
        partyType: currentParty?.partyType || 'farmer',
        partyId,
        partyName,
        type: voucherType,
        amount: parseFloat(amount),
        paymentMode,
        referenceNo,
        remarks: remarks || (voucherType === 'receipt' ? 'રોકડ/બેંક રકમ જમા થઈ' : 'રકમ ચૂકવણી કરવામાં આવી'),
        recordedBy: userProfile?.displayName || 'સ્ટાફ'
      });

      setNotice(`₹${Number(amount).toLocaleString('en-IN')} ની ${voucherType === 'receipt' ? 'જમા' : 'ઉધાર'} એન્ટ્રી સફળતાપૂર્વક સાચવવામાં આવી.`);
      setShowAddForm(false);
      setPartyId('');
      setAmount('');
      setReferenceNo('');
      setRemarks('');
    } catch (err) {
      console.error('Error saving payment voucher:', err);
      setNotice('વાઉચર સાચવવામાં ભૂલ આવી: ' + (err.message || 'Error'));
    }
  };

  const handleDeleteVoucher = (tx) => {
    if (window.confirm(`શું તમે વાઉચર "${tx.voucherNo}" (${tx.partyName} - ₹${(tx.credit || tx.debit || 0).toLocaleString('en-IN')}) કાયમ માટે ડિલીટ કરવા માંગો છો?`)) {
      deleteVoucher(tx.voucherNo, tx.id);
      setNotice(`વાઉચર "${tx.voucherNo}" સફળતાપૂર્વક ડિલીટ કરવામાં આવ્યું.`);
    }
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
          {showAddForm ? '✕ ફોર્મ બંધ કરો' : '＋ નવી જમા / ઉધાર એન્ટ્રી'}
        </button>
      </div>

      {/* Inline Form */}
      {showAddForm && (
        <form className="panel formgrid" onSubmit={handleSavePayment} style={{ marginBottom: '24px' }}>
          <h2 style={{ gridColumn: '1 / -1', margin: 0, color: '#14532d' }}>
            નવી જમા / ઉધાર એન્ટ્રી (Receipt / Payment)
          </h2>

          <label>
            વ્યવહાર પ્રકાર*
            <select value={voucherType} onChange={e => setVoucherType(e.target.value)}>
              <option value="receipt">જમા (આવક / Receipt)</option>
              <option value="payment">ઉધાર (ચુકવણી / Payment)</option>
            </select>
          </label>

          <label>
            ખાતેદાર (ખેડૂત / પાર્ટી) પસંદ કરો*
            <select required value={partyId} onChange={e => setPartyId(e.target.value)}>
              <option value="">ખેડૂત અથવા પાર્ટી પસંદ કરો</option>
              {farmers.length > 0 && (
                <optgroup label="🌱 ખેડૂત મિત્રો (Farmers)">
                  {farmers.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} {f.village ? `(${f.village})` : ''} — બાકી: ₹{(f.currentBalance || 0).toLocaleString('en-IN')}
                    </option>
                  ))}
                </optgroup>
              )}
              {parties.filter(p => p.partyType !== 'farmer').length > 0 && (
                <optgroup label="🏢 પેઢી / વેપારી / પાર્ટીઓ (Firms / Traders)">
                  {parties.filter(p => p.partyType !== 'farmer').map(s => (
                    <option key={s.id} value={s.id}>
                      {s.firmName || s.name || s.companyName} {s.village || s.taluka || s.city ? `(${s.village || s.taluka || s.city})` : ''} — બાકી: ₹{(s.currentBalance || 0).toLocaleString('en-IN')}
                    </option>
                  ))}
                </optgroup>
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
      <h2>તાજેતરના જમા-ઉધાર વ્યવહારો ({voucherTransactions.length})</h2>
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
              <th style={{ textAlign: 'center' }}>ક્રિયા</th>
            </tr>
          </thead>
          <tbody>
            {voucherTransactions.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: '#64748b', padding: '16px' }}>
                  હજુ કોઈ જમા કે ઉધાર વ્યવહાર નોંધાયેલ નથી.
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
                      <span style={{ color: '#15803d', fontWeight: '700' }}>જમા</span>
                    ) : (
                      <span style={{ color: '#b91c1c', fontWeight: '700' }}>ઉધાર</span>
                    )}
                  </td>
                  <td>{tx.paymentMode?.toUpperCase()}</td>
                  <td style={{ fontWeight: '700', color: tx.credit > 0 ? '#15803d' : '#b91c1c' }}>
                    ₹{(tx.credit || tx.debit || 0).toLocaleString('en-IN')}
                  </td>
                  <td>{tx.particulars || tx.remarks || '—'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleDeleteVoucher(tx)}
                      style={{
                        background: '#fee2e2',
                        color: '#b91c1c',
                        border: '1px solid #fca5a5',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}
                      title="વાઉચર ડિલીટ કરો"
                    >
                      🗑️ ડિલીટ
                    </button>
                  </td>
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
