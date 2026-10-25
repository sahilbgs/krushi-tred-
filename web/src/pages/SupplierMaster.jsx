import React, { useState } from 'react';
import { useData } from '../context/DataContext';

export const SupplierMaster = () => {
  const { suppliers, addSupplier } = useData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [notice, setNotice] = useState('');

  const [newSup, setNewSup] = useState({
    companyName: '',
    contactPerson: '',
    mobile: '',
    city: '',
    openingBalance: '0'
  });

  const handleSave = (e) => {
    e.preventDefault();
    if (!newSup.companyName.trim()) return;

    addSupplier({
      ...newSup,
      openingBalance: parseFloat(newSup.openingBalance) || 0,
      currentBalance: parseFloat(newSup.openingBalance) || 0
    });

    setNotice(`પેઢી / સપ્લાયર "${newSup.companyName}" સફળતાપૂર્વક ઉમેરાયા.`);
    setNewSup({
      companyName: '',
      contactPerson: '',
      mobile: '',
      city: '',
      openingBalance: '0'
    });
    setShowAddForm(false);
  };

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
          {showAddForm ? '✕ ફોર્મ બંધ કરો' : '＋ નવી પેઢી / સપ્લાયર ઉમેરો'}
        </button>
      </div>

      {/* Inline Form */}
      {showAddForm && (
        <form className="panel formgrid" onSubmit={handleSave} style={{ marginBottom: '24px' }}>
          <h2 style={{ gridColumn: '1 / -1', margin: 0, color: '#14532d' }}>
            નવી પેઢી / સપ્લાયર ઉમેરો
          </h2>

          <label>
            કંપની / પેઢીનું નામ*
            <input 
              required 
              value={newSup.companyName} 
              onChange={e => setNewSup({ ...newSup, companyName: e.target.value })}
              placeholder="દા.ત. શ્રી ગણેશ ટ્રેડિંગ કંપની"
            />
          </label>

          <label>
            સંપર્ક વ્યક્તિ (Contact Person)
            <input 
              value={newSup.contactPerson} 
              onChange={e => setNewSup({ ...newSup, contactPerson: e.target.value })}
              placeholder="વેપારી / માલિકનું નામ"
            />
          </label>

          <label>
            મોબાઇલ નંબર
            <input 
              value={newSup.mobile} 
              onChange={e => setNewSup({ ...newSup, mobile: e.target.value })}
              placeholder="10 અંકનો મોબાઇલ"
            />
          </label>

          <label>
            શહેર / માર્કેટ યાર્ડ
            <input 
              value={newSup.city} 
              onChange={e => setNewSup({ ...newSup, city: e.target.value })}
              placeholder="રાજકોટ, ગોંડલ..."
            />
          </label>

          <label>
            શરૂઆતનું જૂનું લેણું/દેવું (Opening Balance ₹)
            <input 
              type="number" 
              min="0"
              value={newSup.openingBalance} 
              onChange={e => setNewSup({ ...newSup, openingBalance: e.target.value })}
            />
          </label>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button type="submit" className="primary-action" style={{ width: 'auto', padding: '10px 24px' }}>
              પેઢી સાચવો
            </button>
            <button type="button" className="secondary" onClick={() => setShowAddForm(false)}>
              રદ કરો
            </button>
          </div>
        </form>
      )}

      {/* Supplier List Table */}
      <h2>પેઢી / સપ્લાયર્સ યાદી ({suppliers.length})</h2>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>કોડ</th>
              <th>કંપની / પેઢીનું નામ</th>
              <th>સંપર્ક વ્યક્તિ</th>
              <th>મોબાઇલ</th>
              <th>શહેર / યાર્ડ</th>
              <th>ચૂકવવાપાત્ર બાકી (₹)</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map(sup => (
              <tr key={sup.id}>
                <td><b>{sup.code || 'SUP'}</b></td>
                <td><b>{sup.companyName}</b></td>
                <td>{sup.contactPerson || '—'}</td>
                <td>{sup.mobile || '—'}</td>
                <td>{sup.city || '—'}</td>
                <td style={{ fontWeight: '700', color: (sup.currentBalance || 0) > 0 ? '#b91c1c' : '#15803d' }}>
                  ₹{(sup.currentBalance || 0).toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default SupplierMaster;
