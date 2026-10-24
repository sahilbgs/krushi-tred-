import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Sprout, Plus, Scale } from 'lucide-react';

export const SeedMaster = () => {
  const { seeds, addSeedProduct } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSeed, setNewSeed] = useState({
    varietyName: '',
    cropType: 'મગફળી',
    company: '',
    bagWeightKg: 50,
    defaultSaleRatePerKg: 140,
    defaultSaleRatePerBag: 7000,
    minStockAlertBags: 10
  });

  const handleSave = (e) => {
    e.preventDefault();
    if (!newSeed.varietyName) return;
    addSeedProduct(newSeed);
    setShowAddModal(false);
    setNewSeed({
      varietyName: '',
      cropType: 'મગફળી',
      company: '',
      bagWeightKg: 50,
      defaultSaleRatePerKg: 140,
      defaultSaleRatePerBag: 7000,
      minStockAlertBags: 10
    });
  };

  return (
    <div className="page-body">
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: '700', color: '#064e3b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sprout size={24} />
            બિયારણ જાતો માસ્ટર (Seed Varieties Master)
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            નવી બિયારણ વેરાયટી, બોરીનું પ્રમાણિત વજન (KG) અને વેચાણ ભાવ દર
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          નવી બિયારણ જાત ઉમેરો
        </button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>બિયારણ જાતનું નામ</th>
                <th>પાક પ્રકાર</th>
                <th>કંપની / સંશોધન કેન્દ્ર</th>
                <th>૧ બોરીનું વજન (Standard KG)</th>
                <th>પ્રતિ KG ડિફોલ્ટ ભાવ</th>
                <th>પ્રતિ બોરી ડિફોલ્ટ ભાવ</th>
                <th>લઘુત્તમ સ્ટોક ચેતવણી</th>
              </tr>
            </thead>
            <tbody>
              {seeds.map(sd => (
                <tr key={sd.id}>
                  <td style={{ fontWeight: '600', color: '#064e3b' }}>{sd.varietyName}</td>
                  <td><span className="badge badge-primary">{sd.cropType}</span></td>
                  <td>{sd.company || '—'}</td>
                  <td style={{ fontWeight: '600' }}>{sd.bagWeightKg} kg</td>
                  <td>₹{sd.defaultSaleRatePerKg} /kg</td>
                  <td>₹{sd.defaultSaleRatePerBag} /બોરી</td>
                  <td><span className="badge badge-warning">{sd.minStockAlertBags} બોરી</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', color: '#064e3b' }}>નવી બિયારણ વેરાયટી ઉમેરો</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">બિયારણ જાતનું પૂરું નામ *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control" 
                    placeholder="દા.ત. GJG-22 (ગુજરાત જૂનાગઢ મગફળી)"
                    value={newSeed.varietyName}
                    onChange={(e) => setNewSeed(prev => ({ ...prev, varietyName: e.target.value }))}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">પાક પ્રકાર (Crop Type)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="દા.ત. મગફળી, કપાસ, જીરૂ, ઘઉં"
                      value={newSeed.cropType}
                      onChange={(e) => setNewSeed(prev => ({ ...prev, cropType: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">કંપની / બ્રાન્ડ</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="દા.ત. જૂનાગઢ કૃષિ યુનિવર્સિટી"
                      value={newSeed.company}
                      onChange={(e) => setNewSeed(prev => ({ ...prev, company: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">૧ બોરીનું પ્રમાણિત વજન (KG) *</label>
                    <input 
                      type="number" 
                      required 
                      className="form-control" 
                      placeholder="50"
                      value={newSeed.bagWeightKg}
                      onChange={(e) => {
                        const w = parseFloat(e.target.value) || 50;
                        setNewSeed(prev => ({
                          ...prev,
                          bagWeightKg: w,
                          defaultSaleRatePerBag: w * prev.defaultSaleRatePerKg
                        }));
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">લઘુત્તમ સ્ટોક ચેતવણી (Bags)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={newSeed.minStockAlertBags}
                      onChange={(e) => setNewSeed(prev => ({ ...prev, minStockAlertBags: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">વેચાણ ભાવ પ્રતિ કિલો (₹)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={newSeed.defaultSaleRatePerKg}
                      onChange={(e) => {
                        const r = parseFloat(e.target.value) || 0;
                        setNewSeed(prev => ({
                          ...prev,
                          defaultSaleRatePerKg: r,
                          defaultSaleRatePerBag: r * prev.bagWeightKg
                        }));
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">વેચાણ ભાવ પ્રતિ બોરી (₹)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={newSeed.defaultSaleRatePerBag}
                      onChange={(e) => setNewSeed(prev => ({ ...prev, defaultSaleRatePerBag: parseFloat(e.target.value) || 0 }))}
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

    </div>
  );
};
