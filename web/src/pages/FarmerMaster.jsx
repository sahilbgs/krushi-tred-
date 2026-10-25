import React, { useState } from 'react';
import { useData } from '../context/DataContext';

export const FarmerMaster = () => {
  const { farmers, addFarmer } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [notice, setNotice] = useState('');

  const [newFarmer, setNewFarmer] = useState({
    name: '',
    mobile: '',
    village: '',
    taluka: '',
    address: '',
    openingBalance: '0'
  });

  const filteredFarmers = farmers.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.mobile && f.mobile.includes(searchTerm)) ||
    (f.village && f.village.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSave = (e) => {
    e.preventDefault();
    if (!newFarmer.name.trim()) return;

    addFarmer({
      ...newFarmer,
      openingBalance: parseFloat(newFarmer.openingBalance) || 0,
      currentBalance: parseFloat(newFarmer.openingBalance) || 0,
      balanceType: 'dr'
    });

    setNotice(`ખેડૂત "${newFarmer.name}" સફળતાપૂર્વક ઉમેરાયા.`);
    setNewFarmer({
      name: '',
      mobile: '',
      village: '',
      taluka: '',
      address: '',
      openingBalance: '0'
    });
    setShowAddForm(false);
  };

  const handleWhatsApp = (f) => {
    if (!f.mobile) return;
    const clean = f.mobile.replace(/\D/g, '');
    const num = clean.length === 10 ? '91' + clean : clean;
    const msg = `નમસ્તે શ્રી ${f.name}, SHREE NANDINI SEEDS તરફથી આપના ખાતાની બાકી રકમ ₹${f.currentBalance || 0} છે. આભાર!`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div>
      {notice && (
        <div className="notice" onClick={() => setNotice('')} style={{ marginBottom: '16px' }}>
          {notice} ×
        </div>
      )}

      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <button 
          type="button"
          className="primary-action" 
          style={{ width: 'auto', padding: '9px 18px' }}
          onClick={() => setShowAddForm(prev => !prev)}>
          {showAddForm ? '✕ ફોર્મ બંધ કરો' : '＋ નવો ખેડૂત / ગ્રાહક ઉમેરો'}
        </button>

        <input 
          type="text" 
          placeholder="🔍 ખેડૂતનું નામ, ગામ કે નંબર શોધો..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
      </div>

      {/* Inline Form */}
      {showAddForm && (
        <form className="panel formgrid" onSubmit={handleSave} style={{ marginBottom: '24px' }}>
          <h2 style={{ gridColumn: '1 / -1', margin: 0, color: '#14532d' }}>
            નવો ખેડૂત / ગ્રાહક ઉમેરો
          </h2>

          <label>
            ખેડૂતનું પૂરું નામ*
            <input 
              required 
              value={newFarmer.name} 
              onChange={e => setNewFarmer({ ...newFarmer, name: e.target.value })}
              placeholder="દા.ત. રમેશભાઈ પટેલ"
            />
          </label>

          <label>
            મોબાઇલ નંબર
            <input 
              value={newFarmer.mobile} 
              onChange={e => setNewFarmer({ ...newFarmer, mobile: e.target.value })}
              placeholder="10 અંકનો નંબર"
            />
          </label>

          <label>
            ગામ
            <input 
              value={newFarmer.village} 
              onChange={e => setNewFarmer({ ...newFarmer, village: e.target.value })}
              placeholder="દા.ત. ગોંડલ"
            />
          </label>

          <label>
            તાલુકો
            <input 
              value={newFarmer.taluka} 
              onChange={e => setNewFarmer({ ...newFarmer, taluka: e.target.value })}
              placeholder="તાલુકો"
            />
          </label>

          <label>
            સરનામું
            <input 
              value={newFarmer.address} 
              onChange={e => setNewFarmer({ ...newFarmer, address: e.target.value })}
              placeholder="સરનામું"
            />
          </label>

          <label>
            શરૂઆતનું જૂનું લેણું (Opening Balance ₹)
            <input 
              type="number" 
              min="0"
              value={newFarmer.openingBalance} 
              onChange={e => setNewFarmer({ ...newFarmer, openingBalance: e.target.value })}
            />
          </label>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button type="submit" className="primary-action" style={{ width: 'auto', padding: '10px 24px' }}>
              ખેડૂત સાચવો
            </button>
            <button type="button" className="secondary" onClick={() => setShowAddForm(false)}>
              રદ કરો
            </button>
          </div>
        </form>
      )}

      {/* Farmers List Table */}
      <h2>ખેડૂત / ગ્રાહક યાદી ({filteredFarmers.length})</h2>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>કોડ</th>
              <th>ખેડૂતનું નામ</th>
              <th>મોબાઇલ</th>
              <th>ગામ / તાલુકો</th>
              <th>બાકી રકમ (Balance)</th>
              <th>WhatsApp</th>
            </tr>
          </thead>
          <tbody>
            {filteredFarmers.map(f => (
              <tr key={f.id}>
                <td><b>{f.code || 'KH'}</b></td>
                <td><b>{f.name}</b></td>
                <td>{f.mobile || '—'}</td>
                <td>{f.village || '—'}{f.taluka ? `, ${f.taluka}` : ''}</td>
                <td style={{ fontWeight: '700', color: (f.currentBalance || 0) > 0 ? '#b91c1c' : '#15803d' }}>
                  ₹{(f.currentBalance || 0).toLocaleString('en-IN')}
                </td>
                <td>
                  {f.mobile ? (
                    <button 
                      type="button"
                      className="secondary" 
                      style={{ padding: '3px 8px', fontSize: '0.8rem', color: '#15803d' }}
                      onClick={() => handleWhatsApp(f)}>
                      WhatsApp
                    </button>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default FarmerMaster;
