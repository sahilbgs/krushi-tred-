import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  BookOpen, 
  Search, 
  PlusCircle, 
  MessageSquare, 
  Printer, 
  Phone, 
  MapPin, 
  ArrowDownLeft, 
  ArrowUpRight,
  Calendar,
  Wallet,
  Receipt,
  CheckCircle,
  X
} from 'lucide-react';

export const KhataBook = () => {
  const { farmers, sales, payments, recordPayment, addFarmer } = useData();

  const [selectedFarmerId, setSelectedFarmerId] = useState(farmers[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddFarmerModal, setShowAddFarmerModal] = useState(false);

  // Quick Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMode: 'cash',
    remarks: 'રોકડ જમા કરી'
  });

  // Quick New Farmer Form
  const [newFarmerForm, setNewFarmerForm] = useState({
    name: '',
    mobile: '',
    village: '',
    openingBalance: 0
  });

  // Filter Farmers List
  const filteredFarmers = farmers.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.mobile.includes(searchTerm) ||
    (f.village && f.village.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedFarmer = farmers.find(f => f.id === selectedFarmerId) || farmers[0];

  // Get all ledger transactions for selected farmer
  const farmerSales = sales.filter(s => s.farmerId === selectedFarmer?.id);
  const farmerPayments = payments.filter(p => p.partyId === selectedFarmer?.id && p.partyType === 'farmer');

  // Build combined chronological ledger
  const transactions = [];

  // Opening balance if exists
  if (selectedFarmer?.openingBalance && selectedFarmer.openingBalance > 0) {
    transactions.push({
      id: 'op_bal',
      date: '2026-01-01',
      type: 'opening',
      typeLabel: 'શરૂઆતનું જૂનું લેણું',
      refNo: 'OPN-001',
      details: 'ગત વર્ષનું બાકી ઉધાર ખાતું',
      debit: selectedFarmer.openingBalance, // ઉધાર
      credit: 0,
      mode: '—'
    });
  }

  // Sales Bills
  farmerSales.forEach(s => {
    transactions.push({
      id: s.id,
      date: s.billDate,
      type: 'sale',
      typeLabel: s.paymentMode === 'credit' ? 'ઉધાર બિલ' : 'વેચાણ બિલ',
      refNo: s.billNo,
      details: s.items.map(it => `${it.varietyName} (${it.bags} બોરી ${it.looseKg > 0 ? `+ ${it.looseKg} kg` : ''})`).join(', '),
      majuri: s.majuriAmount || 0,
      extra: s.extraCharges || 0,
      debit: s.netAmount, // કુલ બિલ રકમ
      credit: s.paidAmount, // તે વખતે જમા કરેલ રકમ
      due: s.dueAmount,
      mode: s.paymentMode
    });
  });

  // Dedicated Payment Receipts
  farmerPayments.forEach(p => {
    transactions.push({
      id: p.id,
      date: p.date,
      type: 'payment',
      typeLabel: 'જમા પાવતી / વસૂલાત',
      refNo: p.receiptNo,
      details: p.remarks || 'રોકડ / બેંક જમા',
      debit: 0,
      credit: p.amount,
      due: 0,
      mode: p.paymentMode
    });
  });

  // Sort by date descending
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Totals
  const totalBilled = farmerSales.reduce((sum, s) => sum + s.netAmount, 0) + (selectedFarmer?.openingBalance || 0);
  const totalPaid = farmerSales.reduce((sum, s) => sum + s.paidAmount, 0) + farmerPayments.reduce((sum, p) => sum + p.amount, 0);
  const currentDue = selectedFarmer ? selectedFarmer.currentBalance : 0;

  // Handle Recording New Payment
  const handleSavePayment = (e) => {
    e.preventDefault();
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) return;

    recordPayment({
      partyType: 'farmer',
      partyId: selectedFarmer.id,
      partyName: selectedFarmer.name,
      amount: parseFloat(paymentForm.amount),
      paymentMode: paymentForm.paymentMode,
      remarks: paymentForm.remarks
    });

    setShowPaymentModal(false);
    setPaymentForm({ amount: '', paymentMode: 'cash', remarks: 'રોકડ જમા કરી' });
  };

  // Quick Farmer Save
  const handleSaveQuickFarmer = (e) => {
    e.preventDefault();
    if (!newFarmerForm.name) return;
    const created = addFarmer(newFarmerForm);
    setSelectedFarmerId(created.id);
    setShowAddFarmerModal(false);
    setNewFarmerForm({ name: '', mobile: '', village: '', openingBalance: 0 });
  };

  // WhatsApp Reminder / Statement
  const handleWhatsAppStatement = () => {
    if (!selectedFarmer?.mobile) {
      alert("ખેડૂતનો મોબાઇલ નંબર ઉપલબ્ધ નથી.");
      return;
    }
    const cleanMobile = selectedFarmer.mobile.replace(/\D/g, '');
    const fullMobile = cleanMobile.length === 10 ? '91' + cleanMobile : cleanMobile;

    const msg = `*🌱 કૃષિ ટ્રેડ - ખાતાવહી હિસાબ સ્ટેટમેન્ટ*%0A` +
      `તારીખ: ${new Date().toLocaleDateString('gu-IN')}%0A` +
      `ખેડૂતનું નામ: ${selectedFarmer.name}%0A` +
      `ગામ: ${selectedFarmer.village || '—'}%0A` +
      `--------------------------------%0A` +
      `કુલ બિલ ખરીદી: ₹${totalBilled?.toLocaleString('en-IN')}%0A` +
      `કુલ જમા કરેલ: ₹${totalPaid?.toLocaleString('en-IN')}%0A` +
      `*👉 ચોખ્ખી બાકી રકમ (ઉધાર): ₹${currentDue?.toLocaleString('en-IN')}*%0A` +
      `--------------------------------%0A` +
      `કૃપા કરીને અનુકૂળતા મુજબ બાકી રકમ જમા કરાવવા વિનંતી. આભાર! 🙏`;

    window.open(`https://wa.me/${fullMobile}?text=${msg}`, '_blank');
  };

  return (
    <div className="page-body">
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: '700', color: '#064e3b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={24} color="#059669" />
            ખેડૂત ખાતાવહી (Farmer Khata Book)
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            દરેક ખેડૂતનું વ્યક્તિગત ખાતું, રોકડ/ઉધાર હિસાબ અને જમા પાવતી મેનેજમેન્ટ
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowAddFarmerModal(true)}>
            + નવો ખેડૂત ઉમેરો
          </button>
          {selectedFarmer && (
            <button 
              className="btn btn-primary" 
              onClick={() => setShowPaymentModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Wallet size={18} />
              + જમા રકમ લો (Payment)
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Left Farmer Selector, Right Khata Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Farmer Search & List */}
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.5rem 0.75rem', marginBottom: '1rem' }}>
            <Search size={18} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="ખેડૂત શોધો (નામ / ગામ)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ maxHeight: '620px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredFarmers.map(f => {
              const isSelected = f.id === selectedFarmer?.id;
              return (
                <div 
                  key={f.id}
                  onClick={() => setSelectedFarmerId(f.id)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#ecfdf5' : '#ffffff',
                    border: isSelected ? '2px solid #059669' : '1px solid #e2e8f0',
                    transition: 'all 0.15s ease'
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: isSelected ? '#064e3b' : '#1e293b' }}>
                      {f.name}
                    </div>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      backgroundColor: f.currentBalance > 0 ? '#fee2e2' : '#f1f5f9',
                      color: f.currentBalance > 0 ? '#dc2626' : '#64748b'
                    }}>
                      {f.code}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                    {f.village ? `ગામ: ${f.village}` : ''} {f.mobile ? `• ${f.mobile}` : ''}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.4rem', borderTop: '1px dashed #e2e8f0', fontSize: '0.82rem' }}>
                    <span style={{ color: '#64748b' }}>બાકી ઉધાર:</span>
                    <span style={{ fontWeight: '700', color: f.currentBalance > 0 ? '#dc2626' : '#16a34a' }}>
                      ₹{f.currentBalance?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Farmer Ledger */}
        {selectedFarmer ? (
          <div>
            {/* Farmer Profile Card & Top Stats */}
            <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#064e3b' }}>
                      {selectedFarmer.name}
                    </h3>
                    <span className="badge badge-primary">{selectedFarmer.code}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.88rem', color: '#64748b', marginTop: '0.3rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Phone size={15} />
                      {selectedFarmer.mobile || 'મોબાઇલ નથી'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MapPin size={15} />
                      {selectedFarmer.village || 'ગામ નોંધેલ નથી'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={handleWhatsAppStatement}
                    className="btn"
                    style={{ backgroundColor: '#25D366', color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MessageSquare size={16} />
                    WhatsApp હિસાબ મોકલો
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Printer size={16} />
                    પ્રિન્ટ
                  </button>
                </div>
              </div>

              {/* Quick Stat Blocks */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>કુલ ખરીદી બિલ (Total Billed)</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginTop: '0.2rem' }}>
                    ₹{totalBilled?.toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ backgroundColor: '#f0fdf4', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '0.8rem', color: '#166534' }}>કુલ જમા કરેલ રકમ (Paid)</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#16a34a', marginTop: '0.2rem' }}>
                    ₹{totalPaid?.toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ backgroundColor: currentDue > 0 ? '#fee2e2' : '#ecfdf5', padding: '0.85rem 1rem', borderRadius: '8px', border: `1px solid ${currentDue > 0 ? '#fca5a5' : '#a7f3d0'}` }}>
                  <div style={{ fontSize: '0.8rem', color: currentDue > 0 ? '#991b1b' : '#065f46', fontWeight: '600' }}>
                    ચોખ્ખી બાકી રકમ (ઉધાર ખાતું)
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: currentDue > 0 ? '#dc2626' : '#059669', marginTop: '0.2rem' }}>
                    ₹{currentDue?.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions History Ledger Table */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title">ખાતાવહી હિસાબ વિગત (Ledger Entries)</h3>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>કુલ એન્ટ્રીઓ: {transactions.length}</span>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>તારીખ</th>
                      <th>પ્રકાર / બિલ નં</th>
                      <th>બિયારણ / વિગત</th>
                      <th style={{ textAlign: 'right' }}>ઉધાર (₹)</th>
                      <th style={{ textAlign: 'right' }}>જમા (₹)</th>
                      <th style={{ textAlign: 'center' }}>ચુકવણી રીત</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                          આ ખેડૂત માટે હજી સુધી કોઈ ખરીદી કે જમા એન્ટ્રી નથી.
                        </td>
                      </tr>
                    ) : (
                      transactions.map(t => (
                        <tr key={t.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                              <Calendar size={14} color="#64748b" />
                              {t.date}
                            </div>
                          </td>
                          <td>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              display: 'inline-block',
                              backgroundColor: t.type === 'payment' ? '#f0fdf4' : t.mode === 'credit' ? '#fee2e2' : '#eff6ff',
                              color: t.type === 'payment' ? '#166534' : t.mode === 'credit' ? '#991b1b' : '#1e40af'
                            }}>
                              {t.typeLabel}
                            </span>
                            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginTop: '0.15rem' }}>
                              {t.refNo}
                            </div>
                          </td>
                          <td style={{ maxWidth: '280px', fontSize: '0.85rem', color: '#1e293b' }}>
                            {t.details}
                            {(t.majuri > 0 || t.extra > 0) && (
                              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                                {t.majuri > 0 && `+ મજૂરી ₹${t.majuri} `}
                                {t.extra > 0 && `+ અન્ય ચાર્જ ₹${t.extra}`}
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '700', color: t.debit > 0 ? '#dc2626' : '#64748b' }}>
                            {t.debit > 0 ? `₹${t.debit.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '700', color: t.credit > 0 ? '#16a34a' : '#64748b' }}>
                            {t.credit > 0 ? `₹${t.credit.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="badge badge-secondary" style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>
                              {t.mode === 'cash' ? 'રોકડ' : t.mode === 'upi' ? 'UPI' : t.mode === 'credit' ? 'ઉધાર' : t.mode}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            ડાબી બાજુથી કોઈ ખેડૂત પસંદ કરો
          </div>
        )}

      </div>

      {/* Modal 1: Record Cash / UPI Payment */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', color: '#064e3b' }}>
                જમા રકમ લો (Receive Payment)
              </h3>
              <button onClick={() => setShowPaymentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSavePayment}>
              <div className="modal-body">
                <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>ખેડૂત: <strong>{selectedFarmer?.name}</strong></div>
                  <div style={{ fontSize: '0.85rem', color: '#dc2626', fontWeight: '700', marginTop: '0.2rem' }}>
                    હાલ બાકી ઉધાર: ₹{selectedFarmer?.currentBalance?.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">જમા રકમ (₹) *</label>
                  <input 
                    type="number"
                    step="any"
                    required
                    className="form-control"
                    placeholder="દા.ત. 5000"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ચુકવણી માધ્યમ</label>
                  <select 
                    className="form-control"
                    value={paymentForm.paymentMode}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMode: e.target.value }))}>
                    <option value="cash">રોકડ (Cash)</option>
                    <option value="upi">UPI / PhonePe / GPay</option>
                    <option value="bank">બેંક ટ્રાન્સફર / ચેક</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">નોંધ (વિગત)</label>
                  <input 
                    type="text"
                    className="form-control"
                    placeholder="દા.ત. રોકડ રૂબરૂ જમા કરાવી"
                    value={paymentForm.remarks}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, remarks: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>રદ કરો</button>
                <button type="submit" className="btn btn-primary">જમા રસીદ સેવ કરો</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Quick Add New Farmer */}
      {showAddFarmerModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', color: '#064e3b' }}>
                નવો ખેડૂત / ગ્રાહક ઉમેરો
              </h3>
              <button onClick={() => setShowAddFarmerModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveQuickFarmer}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">ખેડૂતનું પૂરું નામ *</label>
                  <input 
                    type="text"
                    required
                    className="form-control"
                    placeholder="દા.ત. મગનભાઈ પટેલ"
                    value={newFarmerForm.name}
                    onChange={(e) => setNewFarmerForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">મોબાઇલ નંબર</label>
                    <input 
                      type="text"
                      className="form-control"
                      placeholder="૧૦ આંકડાનો મોબાઇલ"
                      value={newFarmerForm.mobile}
                      onChange={(e) => setNewFarmerForm(prev => ({ ...prev, mobile: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ગામ</label>
                    <input 
                      type="text"
                      className="form-control"
                      placeholder="ગામનું નામ"
                      value={newFarmerForm.village}
                      onChange={(e) => setNewFarmerForm(prev => ({ ...prev, village: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">જૂનું બાકી લેણું (શરૂઆતનું ઉધાર ₹)</label>
                  <input 
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder="0"
                    value={newFarmerForm.openingBalance}
                    onChange={(e) => setNewFarmerForm(prev => ({ ...prev, openingBalance: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddFarmerModal(false)}>રદ કરો</button>
                <button type="submit" className="btn btn-primary">ખેડૂત સેવ કરો</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
