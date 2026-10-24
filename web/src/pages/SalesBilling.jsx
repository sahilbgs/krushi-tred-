import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { 
  Receipt, 
  Plus, 
  Trash2, 
  UserPlus, 
  AlertCircle, 
  CheckCircle2, 
  Calculator 
} from 'lucide-react';

export const SalesBilling = ({ onBillCreated }) => {
  const { farmers, seeds, stock, recordSale, addFarmer } = useData();
  const { userProfile } = useAuth();

  // Selected Farmer
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [showQuickFarmerModal, setShowQuickFarmerModal] = useState(false);
  const [newFarmerForm, setNewFarmerForm] = useState({ name: '', mobile: '', village: '', openingBalance: 0 });

  // Bill Meta
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [saleCategory, setSaleCategory] = useState('retail'); // retail | wholesale

  // Current Item Line Input
  const [currentItem, setCurrentItem] = useState({
    stockId: '',
    seedId: '',
    varietyName: '',
    bagWeightKg: 50,
    bags: 1,
    looseKg: 0,
    rate: 140
  });

  // Items added to the bill
  const [billItems, setBillItems] = useState([]);
  
  // Financial calculations
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash'); // cash | upi | bank | credit
  const [remarks, setRemarks] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Find active farmer
  const currentFarmer = farmers.find(f => f.id === selectedFarmerId);

  // Handle stock selection change
  const handleStockSelection = (e) => {
    const stockId = e.target.value;
    const selectedStock = stock.find(s => s.id === stockId);
    if (selectedStock) {
      const seed = seeds.find(sd => sd.id === selectedStock.seedId);
      const defaultRate = seed ? seed.defaultSaleRatePerKg : 140;
      setCurrentItem({
        stockId: selectedStock.id,
        seedId: selectedStock.seedId,
        varietyName: selectedStock.varietyName,
        bagWeightKg: selectedStock.bagWeightKg,
        bags: 1,
        looseKg: 0,
        rate: defaultRate
      });
    } else {
      setCurrentItem(prev => ({ ...prev, stockId: '' }));
    }
  };

  // Add Item to Bill
  const handleAddItem = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!currentItem.stockId) {
      setErrorMessage("કૃપા કરીને બિયારણ પસંદ કરો.");
      return;
    }

    const available = stock.find(s => s.id === currentItem.stockId);
    if (!available) return;

    const bags = parseInt(currentItem.bags || 0);
    const loose = parseFloat(currentItem.looseKg || 0);
    const totalKg = (bags * currentItem.bagWeightKg) + loose;

    if (totalKg <= 0) {
      setErrorMessage("કૃપા કરીને માન્ય બોરી અથવા કિલો દાખલ કરો.");
      return;
    }

    // Check stock limit
    if (totalKg > available.totalWeightKg) {
      setErrorMessage(`સ્ટોકમાં માત્ર ${available.availableBags} બોરી (${available.totalWeightKg} kg) ઉપલબ્ધ છે!`);
      return;
    }

    // Calculate line total strictly per KG: Total Net Weight (KG) * Rate (₹/kg)
    const itemTotal = totalKg * currentItem.rate;

    const newItem = {
      ...currentItem,
      bags,
      looseKg: loose,
      totalWeightKg: totalKg,
      rateUnit: 'kg',
      itemTotal: Math.round(itemTotal)
    };

    setBillItems(prev => [...prev, newItem]);
    
    // Reset item input
    setCurrentItem({
      stockId: '',
      seedId: '',
      varietyName: '',
      bagWeightKg: 50,
      bags: 1,
      looseKg: 0,
      rateType: 'kg',
      rate: 0
    });
  };

  // Remove Item
  const handleRemoveItem = (index) => {
    setBillItems(prev => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subTotal = billItems.reduce((acc, it) => acc + it.itemTotal, 0);
  const netAmount = Math.max(0, subTotal - (parseFloat(discount) || 0));
  const numericPaid = paidAmount === '' ? netAmount : parseFloat(paidAmount) || 0;
  const dueAmount = Math.max(0, netAmount - numericPaid);

  // Quick Farmer Add
  const handleSaveQuickFarmer = (e) => {
    e.preventDefault();
    if (!newFarmerForm.name) return;
    const created = addFarmer(newFarmerForm);
    setSelectedFarmerId(created.id);
    setShowQuickFarmerModal(false);
    setNewFarmerForm({ name: '', mobile: '', village: '', openingBalance: 0 });
  };

  // Submit Sale & Generate Bill
  const handleSubmitBill = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedFarmerId) {
      setErrorMessage("કૃપા કરીને ખેડૂત / ગ્રાહક પસંદ કરો.");
      return;
    }
    if (billItems.length === 0) {
      setErrorMessage("બિલમાં ઓછામાં ઓછું ૧ બિયારણ ઉમેરવું જરૂરી છે.");
      return;
    }

    const salePayload = {
      billDate,
      farmerId: currentFarmer.id,
      farmerName: currentFarmer.name,
      farmerMobile: currentFarmer.mobile,
      farmerVillage: currentFarmer.village,
      saleCategory,
      items: billItems,
      subTotal,
      discount: parseFloat(discount) || 0,
      netAmount,
      paidAmount: numericPaid,
      dueAmount,
      paymentMode,
      remarks,
      createdBy: userProfile?.displayName || 'સ્ટાફ'
    };

    const savedSale = recordSale(salePayload);
    onBillCreated(savedSale);

    // Reset bill state
    setBillItems([]);
    setDiscount(0);
    setPaidAmount('');
    setRemarks('');
    setSelectedFarmerId('');
  };

  return (
    <div className="page-body">
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: '700', color: '#064e3b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Receipt size={24} />
            નવું સાદું વેચાણ બિલ (New Sales Bill)
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            ખેડૂતને સાદું બિલ આપો • બોરી & છૂટક કિલો સ્ટોક આપોઆપ ઘટશે
          </p>
        </div>
      </div>

      {errorMessage && (
        <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', padding: '0.75rem 1rem', borderRadius: '8px', color: '#991b1b', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmitBill}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          
          {/* Section 1: Customer / Farmer Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">૧. ખેડૂત / ગ્રાહકની વિગત</h3>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                onClick={() => setShowQuickFarmerModal(true)}>
                <UserPlus size={15} />
                નવો ખેડૂત
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">ખેડૂત / પાર્ટી પસંદ કરો *</label>
              <select 
                className="form-control"
                value={selectedFarmerId}
                onChange={(e) => setSelectedFarmerId(e.target.value)}
                required>
                <option value="">-- ખેડૂતનું નામ પસંદ કરો --</option>
                {farmers.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} - {f.village} ({f.mobile}) {f.currentBalance > 0 ? `[બાકી: ₹${f.currentBalance}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            {currentFarmer && (
              <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span>ગામ/તાલુકો:</span>
                  <strong>{currentFarmer.village}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span>મોબાઇલ:</span>
                  <strong>{currentFarmer.mobile}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: currentFarmer.currentBalance > 0 ? '#dc2626' : '#16a34a' }}>
                  <span>અગાઉનું જૂનું બાકી (ઉધાર):</span>
                  <strong>₹{currentFarmer.currentBalance?.toLocaleString('en-IN')}</strong>
                </div>
              </div>
            )}

            <div className="form-row" style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label className="form-label">બિલ તારીખ</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={billDate} 
                  onChange={(e) => setBillDate(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">વેચાણ પ્રકાર</label>
                <select 
                  className="form-control" 
                  value={saleCategory} 
                  onChange={(e) => setSaleCategory(e.target.value)}>
                  <option value="retail">રીટેઈલ (છૂટક ખેડૂત)</option>
                  <option value="wholesale">હોલસેલ (વેપારી / ડીલર)</option>
                </select>
              </div>
            </div>

          </div>

          {/* Section 2: Seed & Quantity Input */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">૨. બિયારણ, બોરી & કિલો વિગત</h3>
            </div>

            <div className="form-group">
              <label className="form-label">બિયારણ જાત પસંદ કરો *</label>
              <select 
                className="form-control"
                value={currentItem.stockId}
                onChange={handleStockSelection}>
                <option value="">-- બિયારણ પસંદ કરો --</option>
                {stock.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.varietyName} (હાજર: {s.availableBags} બોરી + {s.availableLooseKg} kg)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">બોરીની સંખ્યા (Bags)</label>
                <input 
                  type="number" 
                  min="0" 
                  className="form-control" 
                  value={currentItem.bags} 
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, bags: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">છૂટક કિલો (Loose KG)</label>
                <input 
                  type="number" 
                  min="0" 
                  step="0.5" 
                  className="form-control" 
                  value={currentItem.looseKg} 
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, looseKg: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">કુલ નેટ વજન (Net Weight)</label>
                <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#ecfdf5', borderRadius: '6px', border: '1px solid #a7f3d0', fontWeight: '700', color: '#064e3b' }}>
                  {((parseInt(currentItem.bags || 0) * currentItem.bagWeightKg) + (parseFloat(currentItem.looseKg || 0))).toFixed(1)} kg
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">વેચાણ ભાવ પ્રતિ કિલો (₹ / kg) *</label>
                <input 
                  type="number" 
                  min="0" 
                  step="0.5" 
                  className="form-control" 
                  style={{ fontWeight: '700', fontSize: '1.05rem', color: '#064e3b' }}
                  value={currentItem.rate} 
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '0.5rem' }}
              onClick={handleAddItem}>
              <Plus size={18} />
              બિલમાં બિયારણ ઉમેરો (Add to Bill)
            </button>

          </div>

        </div>

        {/* Section 3: Added Items Table */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">
              બિલની વિગતો ({billItems.length} આઈટમ)
            </h3>
          </div>

          {billItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              હજુ કોઈ બિયારણ ઉમેરેલ નથી. ઉપરથી બિયારણ પસંદ કરી 'બિલમાં બિયારણ ઉમેરો' દબાવો.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ક્રમ</th>
                    <th>બિયારણ જાત</th>
                    <th>બોરી</th>
                    <th>છૂટક KG</th>
                    <th>કુલ કિલો</th>
                    <th>ભાવ (₹/kg)</th>
                    <th>રકમ (₹)</th>
                    <th>રદ</th>
                  </tr>
                </thead>
                <tbody>
                  {billItems.map((it, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td style={{ fontWeight: '600' }}>{it.varietyName}</td>
                      <td style={{ fontWeight: '600' }}>{it.bags}</td>
                      <td>{it.looseKg} kg</td>
                      <td style={{ fontWeight: '700', color: '#064e3b' }}>{it.totalWeightKg} kg</td>
                      <td style={{ fontWeight: '600' }}>₹{it.rate} /kg</td>
                      <td style={{ fontWeight: '700' }}>₹{it.itemTotal?.toLocaleString('en-IN')}</td>
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

        {/* Section 4: Final Settlement & Payment */}
        {billItems.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">૩. રકમની ગણતરી & ચુકવણી પદ્ધતિ</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
              
              <div>
                <div className="form-group">
                  <label className="form-label">ડિસ્કાઉન્ટ / છૂટ (₹)</label>
                  <input 
                    type="number" 
                    min="0" 
                    className="form-control" 
                    value={discount} 
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ચુકવણી પ્રકાર (Payment Mode)</label>
                  <select 
                    className="form-control"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}>
                    <option value="cash">રોકડ (Cash)</option>
                    <option value="upi">UPI / Google Pay / PhonePe</option>
                    <option value="bank">બેંક ટ્રાન્સફર (NEFT/RTGS)</option>
                    <option value="credit">પૂરેપૂરો ઉધાર (Credit)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">જમા રોકડ રકમ (Paid Amount ₹)</label>
                  <input 
                    type="number" 
                    min="0" 
                    className="form-control" 
                    placeholder={`પૂરી રકમ: ${netAmount}`}
                    value={paidAmount} 
                    onChange={(e) => setPaidAmount(e.target.value)}
                  />
                </div>
              </div>

              {/* Bill Totals Summary Box */}
              <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '1rem' }}>
                  <span>કુલ રકમ (Sub Total):</span>
                  <strong>₹{subTotal.toLocaleString('en-IN')}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#dc2626' }}>
                  <span>ડિસ્કાઉન્ટ:</span>
                  <strong>- ₹{(parseFloat(discount) || 0).toLocaleString('en-IN')}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '2px solid #e2e8f0', borderBottom: '2px solid #e2e8f0', fontSize: '1.25rem', fontWeight: '800', color: '#064e3b' }}>
                  <span>ચૂકવવાપાત્ર ચોખ્ખી રકમ:</span>
                  <span>₹{netAmount.toLocaleString('en-IN')}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', color: '#16a34a', fontWeight: '600' }}>
                  <span>જમા થયેલ રકમ:</span>
                  <span>₹{numericPaid.toLocaleString('en-IN')}</span>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginTop: '0.5rem', 
                  padding: '0.5rem', 
                  backgroundColor: dueAmount > 0 ? '#fee2e2' : '#f0fdf4',
                  color: dueAmount > 0 ? '#991b1b' : '#166534',
                  borderRadius: '6px',
                  fontWeight: '700'
                }}>
                  <span>{dueAmount > 0 ? 'બાકી ઉધાર (Due Balance):' : 'સંપૂર્ણ હિસાબ પૂર્ણ'}</span>
                  <span>₹{dueAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ padding: '0.85rem 2rem', fontSize: '1.1rem' }}>
                <CheckCircle2 size={20} />
                સાદું બિલ બનાવો & સ્ટોક ઘટાડો (Generate Bill)
              </button>
            </div>

          </div>
        )}

      </form>

      {/* Quick Add Farmer Modal */}
      {showQuickFarmerModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', color: '#064e3b' }}>નવો ખેડૂત ઉમેરો (Quick Add)</h3>
              <button onClick={() => setShowQuickFarmerModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSaveQuickFarmer}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">ખેડૂતનું પૂરું નામ *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control" 
                    value={newFarmerForm.name} 
                    onChange={(e) => setNewFarmerForm(prev => ({ ...prev, name: e.target.value }))} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">મોબાઇલ નંબર</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={newFarmerForm.mobile} 
                    onChange={(e) => setNewFarmerForm(prev => ({ ...prev, mobile: e.target.value }))} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ગામ / તાલુકો</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={newFarmerForm.village} 
                    onChange={(e) => setNewFarmerForm(prev => ({ ...prev, village: e.target.value }))} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">અગાઉનું જૂનું ઉધાર (જો હોય તો ₹)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={newFarmerForm.openingBalance} 
                    onChange={(e) => setNewFarmerForm(prev => ({ ...prev, openingBalance: e.target.value }))} 
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowQuickFarmerModal(false)}>રદ કરો</button>
                <button type="submit" className="btn btn-primary">સેવ કરો</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
