import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export const PurchaseEntry = ({ onPurchaseCompleted }) => {
  const { suppliers, seeds, recordPurchase } = useData();
  const { userProfile } = useAuth();

  const [supplierId, setSupplierId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  // Current item row
  const [currentItem, setCurrentItem] = useState({
    seedId: '',
    varietyName: '',
    batchNo: '',
    bagWeightKg: 50,
    bags: 10,
    netWeightKg: 500,
    rateType: 'bag',
    purchaseRate: 6000
  });

  const [items, setItems] = useState([]);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('bank');
  const [remarks, setRemarks] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const handleSeedSelect = (e) => {
    const sId = e.target.value;
    const seed = seeds.find(s => s.id === sId);
    if (seed) {
      const defaultBags = 10;
      setCurrentItem({
        seedId: seed.id,
        varietyName: seed.varietyName,
        batchNo: `LOT-${new Date().getFullYear()}/${Math.floor(10 + Math.random() * 90)}`,
        bagWeightKg: seed.bagWeightKg,
        bags: defaultBags,
        netWeightKg: defaultBags * seed.bagWeightKg,
        rateType: 'kg',
        purchaseRate: seed.defaultSaleRatePerKg ? Math.round(seed.defaultSaleRatePerKg * 0.85) : 120
      });
    } else {
      setCurrentItem(prev => ({ ...prev, seedId: '' }));
    }
  };

  const handleBagsChange = (bagsVal) => {
    const b = parseInt(bagsVal) || 0;
    setCurrentItem(prev => ({
      ...prev,
      bags: b,
      netWeightKg: b * prev.bagWeightKg
    }));
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    setErrMsg('');
    if (!currentItem.seedId) {
      setErrMsg("કૃપા કરીને બિયારણ જાત પસંદ કરો.");
      return;
    }
    if (!currentItem.batchNo) {
      setErrMsg("કૃપા કરીને બેચ / લોટ નંબર દાખલ કરો.");
      return;
    }
    if (currentItem.bags <= 0) {
      setErrMsg("બોરીની સંખ્યા ૧ કે તેથી વધુ હોવી જોઈએ.");
      return;
    }

    // Calculate line total strictly per KG: Net Weight (KG) * Purchase Rate (₹/kg)
    const lineTotal = currentItem.netWeightKg * currentItem.purchaseRate;

    setItems(prev => [...prev, { ...currentItem, rateType: 'kg', itemTotal: Math.round(lineTotal) }]);
    
    // Reset seed row
    setCurrentItem({
      seedId: '',
      varietyName: '',
      batchNo: '',
      bagWeightKg: 50,
      bags: 10,
      netWeightKg: 500,
      rateType: 'kg',
      purchaseRate: 0
    });
  };

  const handleRemoveItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const totalPurchaseAmount = items.reduce((sum, it) => sum + it.itemTotal, 0);
  const numericPaid = paidAmount === '' ? totalPurchaseAmount : parseFloat(paidAmount) || 0;
  const dueAmount = Math.max(0, totalPurchaseAmount - numericPaid);

  const handleSubmitPurchase = (e) => {
    e.preventDefault();
    setErrMsg('');
    setSuccessMsg('');

    if (!supplierId) {
      setErrMsg("કૃપા કરીને સપ્લાયર પસંદ કરો.");
      return;
    }
    if (!invoiceNo) {
      setErrMsg("ખરીદી બિલ / ચલણ નંબર દાખલ કરો.");
      return;
    }
    if (items.length === 0) {
      setErrMsg("ઓછામાં ઓછી ૧ બિયારણની ખરીદી વિગત ઉમેરો.");
      return;
    }

    const supplier = suppliers.find(s => s.id === supplierId);

    const purchasePayload = {
      invoiceNo,
      purchaseDate,
      supplierId: supplier.id,
      supplierName: supplier.companyName,
      items,
      totalAmount: totalPurchaseAmount,
      paidAmount: numericPaid,
      dueAmount,
      paymentMode,
      remarks,
      createdBy: userProfile?.displayName || 'Admin'
    };

    recordPurchase(purchasePayload);
    setSuccessMsg("ખરીદી સફળતાપૂર્વક નોંધાઈ ગઈ છે અને ગોડાઉન સ્ટોક વધારી દેવાયો છે!");
    
    // Clear
    setItems([]);
    setInvoiceNo('');
    setPaidAmount('');
    setSupplierId('');
  };

  return (
    <div className="page-body">
      
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.45rem', fontWeight: '700', color: '#064e3b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShoppingCart size={24} />
          નવી બિયારણ ખરીદી એન્ટ્રી (Purchase Entry)
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
          સપ્લાયર પાસેથી આવેલ માલ નોંધો • બોરી & કિલો સ્ટોક આપોઆપ વધશે
        </p>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac', padding: '0.85rem 1rem', borderRadius: '8px', color: '#166534', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {errMsg && (
        <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', padding: '0.85rem 1rem', borderRadius: '8px', color: '#991b1b', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} />
          <span>{errMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmitPurchase}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          
          {/* Supplier & Invoice metadata */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">૧. સપ્લાયર & બિલ માહિતી</h3>
            </div>

            <div className="form-group">
              <label className="form-label">સપ્લાયર કંપની પસંદ કરો *</label>
              <select 
                className="form-control"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                required>
                <option value="">-- સપ્લાયર કંપની પસંદ કરો --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.companyName} ({s.city}) - {s.contactPerson}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">સપ્લાયર ઇન્વોઇસ / ચલણ નં *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="દા.ત. INV-589"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">ખરીદી તારીખ</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">નોંધ / ટ્રાન્સપોર્ટ બિલ્ટી નં</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="ટ્રક નંબર અથવા અન્ય વિગત"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>

          {/* Seeds Inward Row */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">૨. બિયારણ, બેચ & સ્ટોક ઇન્વર્ડ</h3>
            </div>

            <div className="form-group">
              <label className="form-label">બિયારણ જાત પસંદ કરો *</label>
              <select 
                className="form-control"
                value={currentItem.seedId}
                onChange={handleSeedSelect}>
                <option value="">-- બિયારણ જાત પસંદ કરો --</option>
                {seeds.map(sd => (
                  <option key={sd.id} value={sd.id}>
                    {sd.varietyName} ({sd.bagWeightKg} kg બોરી)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">બેચ / લોટ નંબર *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={currentItem.batchNo}
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, batchNo: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">બોરીની સંખ્યા (Bags)</label>
                <input 
                  type="number" 
                  min="1"
                  className="form-control" 
                  value={currentItem.bags}
                  onChange={(e) => handleBagsChange(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">કુલ નેટ વજન (KG)</label>
                <input 
                  type="number" 
                  readOnly 
                  style={{ backgroundColor: '#f8fafc', fontWeight: '700' }}
                  className="form-control" 
                  value={currentItem.netWeightKg}
                />
              </div>

              <div className="form-group">
                <label className="form-label">ખરીદી ભાવ પ્રતિ કિલો (₹ / kg) *</label>
                <input 
                  type="number" 
                  step="0.5"
                  className="form-control" 
                  style={{ fontWeight: '700', fontSize: '1.05rem', color: '#064e3b' }}
                  value={currentItem.purchaseRate} 
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, purchaseRate: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '0.5rem' }}
              onClick={handleAddItem}>
              <Plus size={18} />
              યાદીમાં ઉમેરો (Add Item)
            </button>
          </div>

        </div>

        {/* Added Purchases Table */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">ખરીદી આઈટમ યાદી ({items.length})</h3>
          </div>

          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
              હજુ કોઈ ખરીદી આઈટમ ઉમેરેલ નથી.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ક્રમ</th>
                    <th>બિયારણ જાત</th>
                    <th>બેચ નં</th>
                    <th>બોરી (Bags)</th>
                    <th>કુલ વજન (KG)</th>
                    <th>ખરીદી ભાવ (₹/kg)</th>
                    <th>કુલ રકમ</th>
                    <th>રદ</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td style={{ fontWeight: '600' }}>{it.varietyName}</td>
                      <td><span className="badge badge-primary">{it.batchNo}</span></td>
                      <td style={{ fontWeight: '700' }}>{it.bags} બોરી</td>
                      <td style={{ fontWeight: '700' }}>{it.netWeightKg} kg</td>
                      <td>₹{it.purchaseRate} /kg</td>
                      <td style={{ fontWeight: '700', color: '#064e3b' }}>₹{it.itemTotal?.toLocaleString('en-IN')}</td>
                      <td>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveItem(idx)}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Settlement and Save */}
        {items.length > 0 && (
          <div className="card">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
              <div>
                <div className="form-group">
                  <label className="form-label">ચૂકવણી મોડ</label>
                  <select 
                    className="form-control" 
                    value={paymentMode} 
                    onChange={(e) => setPaymentMode(e.target.value)}>
                    <option value="bank">બેંક ટ્રાન્સફર (NEFT/RTGS/Cheque)</option>
                    <option value="cash">રોકડ (Cash)</option>
                    <option value="upi">UPI</option>
                    <option value="credit">પૂરેપૂરું ઉધાર (Credit)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">સપ્લાયરને હાલ ચૂકવેલ રકમ (₹)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder={`પૂરી રકમ: ${totalPurchaseAmount}`}
                    value={paidAmount} 
                    onChange={(e) => setPaidAmount(e.target.value)} 
                  />
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span>કુલ ખરીદી રકમ:</span>
                  <strong>₹{totalPurchaseAmount.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#16a34a' }}>
                  <span>હાલ ચૂકવેલ રકમ:</span>
                  <strong>₹{numericPaid.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #cbd5e1', color: dueAmount > 0 ? '#dc2626' : '#16a34a', fontWeight: '700' }}>
                  <span>સપ્લાયરને બાકી રકમ:</span>
                  <span>₹{dueAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem 2rem' }}>
                <CheckCircle2 size={18} />
                ખરીદી સેવ કરો & સ્ટોક ઇન્વર્ડ કરો
              </button>
            </div>
          </div>
        )}

      </form>

    </div>
  );
};
