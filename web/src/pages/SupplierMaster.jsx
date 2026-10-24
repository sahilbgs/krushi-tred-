import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Truck, Plus, Phone, MapPin, Building2 } from 'lucide-react';

export const SupplierMaster = () => {
  const { suppliers, addSupplier } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSup, setNewSup] = useState({
    companyName: '',
    contactPerson: '',
    mobile: '',
    city: '',
    openingBalance: 0
  });

  const handleSave = (e) => {
    e.preventDefault();
    if (!newSup.companyName) return;
    addSupplier(newSup);
    setShowAddModal(false);
    setNewSup({
      companyName: '',
      contactPerson: '',
      mobile: '',
      city: '',
      openingBalance: 0
    });
  };

  return (
    <div className="page-body">
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: '700', color: '#064e3b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Truck size={24} />
            સપ્લાયર્સ માસ્ટર (Supplier Master)
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            બિયારણ ઉત્પાદક કંપનીઓ અને ડિલરોની માહિતી અને ચૂકવવાપાત્ર બાકી રકમ
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          નવો સપ્લાયર ઉમેરો
        </button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>કોડ</th>
                <th>કંપનીનું નામ</th>
                <th>સંપર્ક વ્યક્તિ</th>
                <th>મોબાઇલ</th>
                <th>શહેર</th>
                <th>ચૂકવવાપાત્ર બાકી (Pending ₹)</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(sup => (
                <tr key={sup.id}>
                  <td><span className="badge badge-primary">{sup.code}</span></td>
                  <td style={{ fontWeight: '600', color: '#0f172a' }}>{sup.companyName}</td>
                  <td>{sup.contactPerson || '—'}</td>
                  <td>{sup.mobile || '—'}</td>
                  <td>{sup.city || '—'}</td>
                  <td style={{ fontWeight: '700', color: sup.currentBalance > 0 ? '#dc2626' : '#16a34a' }}>
                    ₹{sup.currentBalance?.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', color: '#064e3b' }}>નવો સપ્લાયર ઉમેરો</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">કંપની / પેઢીનું નામ *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control" 
                    placeholder="દા.ત. ગુજરાત સ્ટેટ સીડ્સ કોર્પોરેશન"
                    value={newSup.companyName}
                    onChange={(e) => setNewSup(prev => ({ ...prev, companyName: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">સંપર્ક વ્યક્તિ (Contact Person)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={newSup.contactPerson}
                    onChange={(e) => setNewSup(prev => ({ ...prev, contactPerson: e.target.value }))}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">મોબાઇલ નંબર</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={newSup.mobile}
                      onChange={(e) => setNewSup(prev => ({ ...prev, mobile: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">શહેર</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={newSup.city}
                      onChange={(e) => setNewSup(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">જૂનું ચૂકવવાપાત્ર બાકી (Opening Balance ₹)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={newSup.openingBalance}
                    onChange={(e) => setNewSup(prev => ({ ...prev, openingBalance: e.target.value }))}
                  />
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

    </div>
  );
};
