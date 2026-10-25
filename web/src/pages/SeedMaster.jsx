import React, { useState } from 'react';
import { useData } from '../context/DataContext';

export const SeedMaster = () => {
  const { seeds, addSeedProduct } = useData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [notice, setNotice] = useState('');

  const [newSeed, setNewSeed] = useState({
    varietyName: '',
    cropType: 'મગફળી',
    company: 'SHREE NANDINI SEEDS',
    bagWeightKg: '35',
    defaultPurchaseRatePerMan: '2400',
    defaultSaleRatePerMan: '2800'
  });

  const handleSave = (e) => {
    e.preventDefault();
    if (!newSeed.varietyName.trim()) return;

    addSeedProduct({
      ...newSeed,
      bagWeightKg: parseFloat(newSeed.bagWeightKg) || 35,
      defaultPurchaseRatePerMan: parseFloat(newSeed.defaultPurchaseRatePerMan) || 2400,
      defaultSaleRatePerMan: parseFloat(newSeed.defaultSaleRatePerMan) || 2800,
      defaultSaleRatePerBag: Math.round((parseFloat(newSeed.defaultSaleRatePerMan) || 2800) * (35 / 20)),
      defaultSaleRatePerKg: Math.round((parseFloat(newSeed.defaultSaleRatePerMan) || 2800) / 20)
    });

    setNotice(`બિયારણ જાત "${newSeed.varietyName}" સફળતાપૂર્વક ઉમેરાઈ.`);
    setNewSeed({
      varietyName: '',
      cropType: 'મગફળી',
      company: 'SHREE NANDINI SEEDS',
      bagWeightKg: '35',
      defaultPurchaseRatePerMan: '2400',
      defaultSaleRatePerMan: '2800'
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
          {showAddForm ? '✕ ફોર્મ બંધ કરો' : '＋ નવી બીજ જાત ઉમેરો'}
        </button>
      </div>

      {/* Inline Form */}
      {showAddForm && (
        <form className="panel formgrid" onSubmit={handleSave} style={{ marginBottom: '24px' }}>
          <h2 style={{ gridColumn: '1 / -1', margin: 0, color: '#14532d' }}>
            બીજની નવી જાત ઉમેરો (Seed Variety)
          </h2>

          <label>
            બીજનું નામ / Variety*
            <input 
              required 
              value={newSeed.varietyName} 
              onChange={e => setNewSeed({ ...newSeed, varietyName: e.target.value })}
              placeholder="દા.ત. GJG-22 અથવા GG-20"
            />
          </label>

          <label>
            પાક પ્રકાર (Crop)
            <input 
              value={newSeed.cropType} 
              onChange={e => setNewSeed({ ...newSeed, cropType: e.target.value })}
              placeholder="મગફળી, સોયાબીન, ચણા..."
            />
          </label>

          <label>
            કંપની
            <input 
              value={newSeed.company} 
              onChange={e => setNewSeed({ ...newSeed, company: e.target.value })}
              placeholder="SHREE NANDINI SEEDS"
            />
          </label>

          <label>
            એક બોરીનું વજન (Standard KG)*
            <input 
              type="number" 
              required
              min="1"
              value={newSeed.bagWeightKg} 
              onChange={e => setNewSeed({ ...newSeed, bagWeightKg: e.target.value })}
            />
          </label>

          <label>
            ખરીદી ડિફોલ્ટ ભાવ (₹/મણ)
            <input 
              type="number" 
              min="0"
              value={newSeed.defaultPurchaseRatePerMan} 
              onChange={e => setNewSeed({ ...newSeed, defaultPurchaseRatePerMan: e.target.value })}
            />
          </label>

          <label>
            વેચાણ ડિફોલ્ટ ભાવ (₹/મણ)
            <input 
              type="number" 
              min="0"
              value={newSeed.defaultSaleRatePerMan} 
              onChange={e => setNewSeed({ ...newSeed, defaultSaleRatePerMan: e.target.value })}
            />
          </label>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button type="submit" className="primary-action" style={{ width: 'auto', padding: '10px 24px' }}>
              બીજ સાચવો
            </button>
            <button type="button" className="secondary" onClick={() => setShowAddForm(false)}>
              રદ કરો
            </button>
          </div>
        </form>
      )}

      {/* Seeds Table */}
      <h2>બીજ જાતો યાદી ({seeds.length})</h2>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>બીજ જાત</th>
              <th>પાક પ્રકાર</th>
              <th>કંપની</th>
              <th>૧ બોરીનું વજન (KG)</th>
              <th>ડિફોલ્ટ ખરીદી ભાવ (₹/મણ)</th>
              <th>ડિફોલ્ટ વેચાણ ભાવ (₹/મણ)</th>
            </tr>
          </thead>
          <tbody>
            {seeds.map(s => (
              <tr key={s.id}>
                <td><b>{s.varietyName}</b></td>
                <td>{s.cropType}</td>
                <td>{s.company || '—'}</td>
                <td><b>{s.bagWeightKg} KG</b></td>
                <td>₹{s.defaultPurchaseRatePerMan || 2400}</td>
                <td>₹{s.defaultSaleRatePerMan || 2800}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default SeedMaster;
