import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Plus, CheckCircle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export const Payments = () => {
  const { farmers, suppliers, payments, recordPayment } = useData();
  const { userProfile } = useAuth();

  const [showAddModal, setShowAddModal] = useState(false);
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
      partyName: partyType === 'farmer' ? currentParty.name : currentParty.companyName,
      type: partyType === 'farmer' ? 'receipt' : 'payment',
      amount: parseFloat(amount),
      paymentMode,
      referenceNo,
      remarks,
      recordedBy: userProfile?.displayName || 'સ્ટાફ'
    });

    setShowAddModal(false);
    setPartyId('');
    setAmount('');
    setReferenceNo('');
    setRemarks('');
  };

  return (
    <div className="page-body">
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: '700', color: '#064e3b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={24} />
            જમા-ઉધાર વસૂલાત & ચુકવણી (Payments Ledger)
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            ખેડૂતો પાસેથી બાકી ઉઘરાણી જમા લેવી અથવા સપ્લાયર્સને ચુકવણી નોંધવી
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          નવી રસીદ / ચુકવણી નોંધો
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">ચુકવણી & વસૂલાત ઇતિહાસ</h3>
        </div>

        {payments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            હજુ કોઈ અલગ પેમેન્ટ વ્યવહાર નોંધાયેલ નથી.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>રસીદ નં</th>
                  <th>તારીખ</th>
                  <th>પાર્ટી વિગત</th>
                  <th>પ્રકાર</th>
                  <th>મોડ</th>
                  <th>રકમ (₹)</th>
                  <th>નોંધ / રેફરન્સ</th>
                  <th>નોંધનાર</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(pay => (
                  <tr key={pay.id}>
                    <td><span className="badge badge-primary">{pay.receiptNo}</span></td>
                    <td>{pay.date}</td>
                    <td style={{ fontWeight: '600' }}>
                      {pay.partyName}
                      <small style={{ display: 'block', color: '#64748b' }}>
                        {pay.partyType === 'farmer' ? 'ખેડૂત' : 'સપ્લાયર'}
                      </small>
                    </td>
                    <td>
                      {pay.type === 'receipt' ? (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          <ArrowDownLeft size={14} /> આવક (જમા)
                        </span>
                      ) : (
                        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          <ArrowUpRight size={14} /> જાવક (ચુકવણી)
                        </span>
                      )}
                    </td>
                    <td style={{ textTransform: 'uppercase' }}>{pay.paymentMode}</td>
                    <td style={{ fontWeight: '700', fontSize: '1.05rem', color: pay.type === 'receipt' ? '#16a34a' : '#dc2626' }}>
                      ₹{pay.amount?.toLocaleString('en-IN')}
                    </td>
                    <td>{pay.referenceNo ? `Ref: ${pay.referenceNo} ` : ''}{pay.remarks || '—'}</td>
                    <td>{pay.recordedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', color: '#064e3b' }}>નવી જમા / ઉધાર એન્ટ્રી</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSavePayment}>
              <div className="modal-body">
                
                <div className="form-group">
                  <label className="form-label">વ્યવહાર પ્રકાર</label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="ptype" 
                        checked={partyType === 'farmer'} 
                        onChange={() => { setPartyType('farmer'); setPartyId(''); }} 
                      />
                      ખેડૂત પાસેથી ઉધાર વસૂલાત (જમા)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="ptype" 
                        checked={partyType === 'supplier'} 
                        onChange={() => { setPartyType('supplier'); setPartyId(''); }} 
                      />
                      સપ્લાયરને ચુકવણી (જાવક)
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {partyType === 'farmer' ? 'ખેડૂત પસંદ કરો *' : 'સપ્લાયર કંપની પસંદ કરો *'}
                  </label>
                  <select 
                    className="form-control"
                    value={partyId}
                    onChange={(e) => setPartyId(e.target.value)}
                    required>
                    <option value="">-- પસંદ કરો --</option>
                    {partyType === 'farmer' ? (
                      farmers.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name} - {f.village} (બાકી ઉધાર: ₹{f.currentBalance})
                        </option>
                      ))
                    ) : (
                      suppliers.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.companyName} (ચૂકવવાના બાકી: ₹{s.currentBalance})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {currentParty && (
                  <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e2e8f0', color: currentParty.currentBalance > 0 ? '#dc2626' : '#16a34a' }}>
                    હાલની બાકી રકમ: <strong>₹{currentParty.currentBalance?.toLocaleString('en-IN')}</strong>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">રકમ (₹) *</label>
                    <input 
                      type="number" 
                      required 
                      min="1"
                      className="form-control" 
                      placeholder="દા.ત. 5000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">ચુકવણી મોડ</label>
                    <select 
                      className="form-control"
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}>
                      <option value="cash">રોકડ (Cash)</option>
                      <option value="upi">UPI (GPay/PhonePe)</option>
                      <option value="bank">બેંક ટ્રાન્સફર (NEFT/RTGS)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">ટ્રાન્ઝેક્શન / રેફરન્સ / Cheque નં</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="UPI Ref અથવા Cheque નં."
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">નોંધ (Remarks)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="દા.ત. જૂના બિલ પેટે જમા"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>રદ કરો</button>
                <button type="submit" className="btn btn-primary">રસીદ સેવ કરો</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
