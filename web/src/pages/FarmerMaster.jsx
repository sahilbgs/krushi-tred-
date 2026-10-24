import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Users, UserPlus, Search, MessageSquare, Phone, MapPin } from 'lucide-react';

export const FarmerMaster = ({ onSelectFarmerBills }) => {
  const { farmers, addFarmer, sales } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFarmerHistory, setSelectedFarmerHistory] = useState(null);

  const [newFarmer, setNewFarmer] = useState({
    name: '',
    mobile: '',
    village: '',
    taluka: '',
    address: '',
    farmerType: 'farmer',
    openingBalance: 0,
    creditLimit: 50000
  });

  const filteredFarmers = farmers.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.mobile.includes(searchTerm) ||
    (f.village && f.village.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSave = (e) => {
    e.preventDefault();
    if (!newFarmer.name) return;
    addFarmer(newFarmer);
    setShowAddModal(false);
    setNewFarmer({
      name: '',
      mobile: '',
      village: '',
      taluka: '',
      address: '',
      farmerType: 'farmer',
      openingBalance: 0,
      creditLimit: 50000
    });
  };

  const handleWhatsAppReminder = (farmer) => {
    if (!farmer.mobile) {
      alert("મોબાઇલ નંબર નથી મળ્યો.");
      return;
    }
    const cleanMobile = farmer.mobile.replace(/\D/g, '');
    const fullMobile = cleanMobile.length === 10 ? '91' + cleanMobile : cleanMobile;
    const msg = `નમસ્તે શ્રી ${farmer.name}, કૃષિ ટ્રેડ તરફથી આપના ખાતાની બાકી રકમ ₹${farmer.currentBalance} છે. કૃપા કરીને અનુકૂળતા મુજબ જમા કરાવવા વિનંતી. આભાર!`;
    window.open(`https://wa.me/${fullMobile}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="page-body">
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: '700', color: '#064e3b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={24} />
            ખેડૂત / ગ્રાહક માસ્ટર (Farmer Master)
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            ખેડૂત અને વેપારીઓની માહિતી, જૂનું લેણું અને ઉધાર મર્યાદા
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.4rem 0.8rem', width: '260px' }}>
            <Search size={18} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="નામ, મોબાઇલ કે ગામ શોધો..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem', fontFamily: 'inherit' }}
            />
          </div>

          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <UserPlus size={18} />
            નવો ખેડૂત ઉમેરો
          </button>
        </div>
      </div>

      {/* Farmers Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>કોડ</th>
                <th>ખેડૂતનું નામ</th>
                <th>મોબાઇલ</th>
                <th>ગામ / તાલુકો</th>
                <th>પ્રકાર</th>
                <th>બાકી રકમ (ઉધાર)</th>
                <th>ઉધાર મર્યાદા</th>
                <th>એક્શન</th>
              </tr>
            </thead>
            <tbody>
              {filteredFarmers.map(farmer => (
                <tr key={farmer.id}>
                  <td><span className="badge badge-primary">{farmer.code}</span></td>
                  <td style={{ fontWeight: '600' }}>{farmer.name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Phone size={14} color="#64748b" />
                      {farmer.mobile || '—'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MapPin size={14} color="#64748b" />
                      {farmer.village} {farmer.taluka ? `(${farmer.taluka})` : ''}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>
                      {farmer.farmerType === 'farmer' ? 'ખેડૂત' : farmer.farmerType === 'dealer' ? 'ડીલર' : 'રીટેઈલર'}
                    </span>
                  </td>
                  <td style={{ fontWeight: '700', fontSize: '1rem', color: farmer.currentBalance > 0 ? '#dc2626' : '#16a34a' }}>
                    ₹{farmer.currentBalance?.toLocaleString('en-IN')}
                  </td>
                  <td style={{ color: '#475569' }}>₹{farmer.creditLimit?.toLocaleString('en-IN')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {farmer.currentBalance > 0 && (
                        <button 
                          className="btn"
                          title="બાકી ઉધાર માટે WhatsApp મેસેજ મોકલો"
                          style={{ backgroundColor: '#25D366', color: 'white', padding: '0.25rem 0.5rem', fontSize: '0.78rem' }}
                          onClick={() => handleWhatsAppReminder(farmer)}>
                          <MessageSquare size={14} />
                          ઉઘરાણી
                        </button>
                      )}
                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem' }}
                        onClick={() => setSelectedFarmerHistory(farmer)}>
                        હિસાબ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Farmer Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', color: '#064e3b' }}>નવો ખેડૂત / ગ્રાહક ઉમેરો</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">પૂરું નામ *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control" 
                    placeholder="દા.ત. રમેશભાઈ પટેલ"
                    value={newFarmer.name}
                    onChange={(e) => setNewFarmer(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">મોબાઇલ નંબર</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="૧૦ આંકડાનો મોબાઇલ"
                      value={newFarmer.mobile}
                      onChange={(e) => setNewFarmer(prev => ({ ...prev, mobile: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ગ્રાહક પ્રકાર</label>
                    <select 
                      className="form-control"
                      value={newFarmer.farmerType}
                      onChange={(e) => setNewFarmer(prev => ({ ...prev, farmerType: e.target.value }))}>
                      <option value="farmer">ખેડૂત (Farmer)</option>
                      <option value="dealer">ડીલર (Dealer)</option>
                      <option value="retailer">રીટેઈલર (Retailer)</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">ગામ</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="ગામનું નામ"
                      value={newFarmer.village}
                      onChange={(e) => setNewFarmer(prev => ({ ...prev, village: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">તાલુકો / જિલ્લો</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="તાલુકો"
                      value={newFarmer.taluka}
                      onChange={(e) => setNewFarmer(prev => ({ ...prev, taluka: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">જૂનું લેણું / Opening Balance (₹)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={newFarmer.openingBalance}
                      onChange={(e) => setNewFarmer(prev => ({ ...prev, openingBalance: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ઉધાર મર્યાદા / Credit Limit (₹)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={newFarmer.creditLimit}
                      onChange={(e) => setNewFarmer(prev => ({ ...prev, creditLimit: e.target.value }))}
                    />
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>રદ કરો</button>
                <button type="submit" className="btn btn-primary">સેવ કરો</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Farmer History Modal */}
      {selectedFarmerHistory && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', color: '#064e3b' }}>
                {selectedFarmerHistory.name} - ખાતાવહી ઇતિહાસ
              </h3>
              <button onClick={() => setSelectedFarmerHistory(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
                <div>ગામ: <strong>{selectedFarmerHistory.village}</strong></div>
                <div>મોબાઇલ: <strong>{selectedFarmerHistory.mobile}</strong></div>
                <div>હાલનું બાકી લેણું: <strong style={{ color: '#dc2626' }}>₹{selectedFarmerHistory.currentBalance?.toLocaleString('en-IN')}</strong></div>
                <div>ઉધાર મર્યાદા: <strong>₹{selectedFarmerHistory.creditLimit?.toLocaleString('en-IN')}</strong></div>
              </div>

              <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#0f172a' }}>વેચાણ બિલ ઇતિહાસ:</h4>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>બિલ નં</th>
                      <th>તારીખ</th>
                      <th>કુલ રકમ</th>
                      <th>જમા રોકડ</th>
                      <th>બાકી રકમ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.filter(s => s.farmerId === selectedFarmerHistory.id).map(s => (
                      <tr key={s.id}>
                        <td>{s.billNo}</td>
                        <td>{s.billDate}</td>
                        <td>₹{s.netAmount}</td>
                        <td style={{ color: '#16a34a' }}>₹{s.paidAmount}</td>
                        <td style={{ color: s.dueAmount > 0 ? '#dc2626' : '#16a34a', fontWeight: '600' }}>
                          ₹{s.dueAmount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedFarmerHistory(null)}>બંધ કરો</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
