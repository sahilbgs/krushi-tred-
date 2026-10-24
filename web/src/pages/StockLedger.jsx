import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Boxes, Search, SlidersHorizontal, Plus, Minus, CheckCircle, AlertTriangle } from 'lucide-react';

export const StockLedger = () => {
  const { stock, adjustStock } = useData();
  const { userProfile } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStockForAdjust, setSelectedStockForAdjust] = useState(null);
  const [adjustBags, setAdjustBags] = useState(0);
  const [adjustKg, setAdjustKg] = useState(0);
  const [adjustReason, setAdjustReason] = useState('ગોડાઉન ઓડિટ ગણતરી');

  const filteredStock = stock.filter(item => 
    item.varietyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBags = stock.reduce((sum, s) => sum + (parseInt(s.availableBags) || 0), 0);
  const totalLooseKg = stock.reduce((sum, s) => sum + (parseFloat(s.availableLooseKg) || 0), 0);
  const totalWeightKg = stock.reduce((sum, s) => sum + (parseFloat(s.totalWeightKg) || 0), 0);

  const handleSaveAdjustment = (e) => {
    e.preventDefault();
    if (!selectedStockForAdjust) return;
    adjustStock(
      selectedStockForAdjust.id, 
      parseInt(adjustBags) || 0, 
      parseFloat(adjustKg) || 0, 
      adjustReason
    );
    setSelectedStockForAdjust(null);
    setAdjustBags(0);
    setAdjustKg(0);
  };

  return (
    <div className="page-body">
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: '700', color: '#064e3b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Boxes size={24} />
            સ્ટોક લેજર – બોરી & કિલો મેનેજમેન્ટ (Stock Ledger)
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            દરેક બિયારણ જાત વાઇઝ હાજર બોરી અને છૂટક કિલો સ્ટોક
          </p>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.4rem 0.8rem', width: '280px' }}>
          <Search size={18} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="બિયારણ શોધો..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem', fontFamily: 'inherit' }}
          />
        </div>
      </div>

      {/* Stock Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #059669' }}>
          <div className="stat-icon" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
            <Boxes size={26} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{totalBags.toLocaleString('en-IN')}</div>
            <div className="stat-label">કુલ હાજર આખી બોરી (Full Bags)</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #d97706' }}>
          <div className="stat-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
            <Boxes size={26} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{totalLooseKg} kg</div>
            <div className="stat-label">કુલ છૂટક કિલો (Loose KG)</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
            <Boxes size={26} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{totalWeightKg.toLocaleString('en-IN')} kg</div>
            <div className="stat-label">કુલ ગોડાઉન નેટ વજન (Net Weight)</div>
          </div>
        </div>
      </div>

      {/* Stock Items Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>બિયારણ જાત</th>
                <th>૧ બોરીનું વજન</th>
                <th>હાજર આખી બોરી</th>
                <th>છૂટક કિલો (Loose)</th>
                <th>કુલ વજન (Net KG)</th>
                <th>છેલ્લો ખરીદી ભાવ</th>
                <th>સ્થિતિ</th>
                {userProfile?.role === 'admin' && <th>એડજસ્ટ</th>}
              </tr>
            </thead>
            <tbody>
              {filteredStock.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: '600', color: '#0f172a' }}>
                    {item.varietyName}
                  </td>
                  <td>{item.bagWeightKg} kg</td>
                  <td style={{ fontWeight: '700', fontSize: '1.05rem', color: item.availableBags <= 15 ? '#dc2626' : '#059669' }}>
                    {item.availableBags} બોરી
                  </td>
                  <td>{item.availableLooseKg} kg</td>
                  <td style={{ fontWeight: '700', color: '#064e3b' }}>
                    {item.totalWeightKg} kg
                  </td>
                  <td>
                    {userProfile?.role === 'admin' || userProfile?.permissions?.viewRates ? (
                      `₹${item.lastPurchaseRate}`
                    ) : (
                      <span style={{ color: '#94a3b8' }}>છુપાયેલ</span>
                    )}
                  </td>
                  <td>
                    {item.availableBags <= 15 ? (
                      <span className="badge badge-danger">ઓછો સ્ટોક</span>
                    ) : (
                      <span className="badge badge-success">પર્યાપ્ત સ્ટોક</span>
                    )}
                  </td>
                  {userProfile?.role === 'admin' && (
                    <td>
                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                        onClick={() => setSelectedStockForAdjust(item)}>
                        સુધારો
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {selectedStockForAdjust && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', color: '#064e3b' }}>
                સ્ટોક એડજસ્ટમેન્ટ: {selectedStockForAdjust.varietyName}
              </h3>
              <button 
                onClick={() => setSelectedStockForAdjust(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveAdjustment}>
              <div className="modal-body">
                <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.88rem' }}>
                  <div>હાલનો સ્ટોક: <strong>{selectedStockForAdjust.availableBags} બોરી + {selectedStockForAdjust.availableLooseKg} kg ({selectedStockForAdjust.totalWeightKg} kg)</strong></div>
                </div>

                <div className="form-group">
                  <label className="form-label">બોરી વધારો (+) અથવા ઘટાડો (-) કરો</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="દા.ત. +2 અથવા -1"
                    value={adjustBags} 
                    onChange={(e) => setAdjustBags(e.target.value)} 
                  />
                  <small style={{ color: '#64748b' }}>ઘટાડવા માટે માઇનસ (-) ચિહ્ન વાપરો</small>
                </div>

                <div className="form-group">
                  <label className="form-label">છૂટક કિલો વધારો (+) અથવા ઘટાડો (-)</label>
                  <input 
                    type="number" 
                    step="0.5" 
                    className="form-control" 
                    placeholder="દા.ત. +5 અથવા -2.5"
                    value={adjustKg} 
                    onChange={(e) => setAdjustKg(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">કારણ (Reason for Adjustment)</label>
                  <select 
                    className="form-control"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}>
                    <option value="ગોડાઉન ઓડિટ ગણતરી">ગોડાઉન ઓડિટ ગણતરી (Physical Audit)</option>
                    <option value="ડેમેજ અથવા ફાટેલી બોરી">ડેમેજ અથવા ફાટેલી બોરી (Damage)</option>
                    <option value="સેમ્પલ / ડેમો આપેલ">સેમ્પલ / ડેમો આપેલ (Sample)</option>
                    <option value="અન્ય સુધારો">અન્ય સુધારો</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedStockForAdjust(null)}>
                  રદ કરો
                </button>
                <button type="submit" className="btn btn-primary">
                  સુધારો સેવ કરો
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
