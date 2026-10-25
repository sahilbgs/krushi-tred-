import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

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
  const totalMan = totalWeightKg / 20;

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
    <div>
      {/* 3 Stock Summary Cards */}
      <div className="cards">
        <div className="metric">
          <span>કુલ હાજર બોરી (35 KG સ્ટાન્ડર્ડ)</span>
          <b>{totalBags.toLocaleString('en-IN')} બોરી</b>
        </div>
        <div className="metric">
          <span>કુલ છૂટક કિલો (Loose KG)</span>
          <b>{totalLooseKg.toFixed(2)} KG</b>
        </div>
        <div className="metric">
          <span>કુલ ગોડાઉન નેટ વજન (Net KG)</span>
          <b>{totalWeightKg.toLocaleString('en-IN')} KG</b>
          <div style={{ fontSize: '0.82rem', color: '#16a34a', marginTop: '4px' }}>
            ({totalMan.toFixed(2)} મણ • 1 મણ = 20 KG)
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ margin: 0 }}>વર્તમાન સ્ટોક લેજર (Godown Inventory)</h2>
        <input 
          type="text" 
          placeholder="🔍 બિયારણ જાત શોધો..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: '280px' }}
        />
      </div>

      {/* Stock Table */}
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>બિયારણ જાત</th>
              <th>૧ બોરી વજન</th>
              <th>હાજર આખી બોરી</th>
              <th>છૂટક કિલો</th>
              <th>કુલ વજન (Net KG)</th>
              <th>કુલ મણ (KG ÷ 20)</th>
              <th>છેલ્લો ખરીદી ભાવ (₹/મણ)</th>
              <th>સ્થિતિ</th>
              {userProfile?.role === 'admin' && <th>એડજસ્ટ</th>}
            </tr>
          </thead>
          <tbody>
            {filteredStock.map(item => {
              const totalManVal = item.totalMan || (item.totalWeightKg / 20);
              return (
                <tr key={item.id}>
                  <td><b>{item.varietyName}</b></td>
                  <td>{item.bagWeightKg || 35} KG</td>
                  <td style={{ fontWeight: '700', color: (item.availableBags || 0) <= 15 ? '#b91c1c' : '#15803d' }}>
                    {item.availableBags} બોરી
                  </td>
                  <td>{item.availableLooseKg || 0} KG</td>
                  <td style={{ fontWeight: '700' }}>
                    {item.totalWeightKg} KG
                  </td>
                  <td style={{ fontWeight: '700', color: '#15803d' }}>
                    {Number(totalManVal).toFixed(2)} મણ
                  </td>
                  <td>
                    {userProfile?.role === 'admin' || userProfile?.permissions?.viewRates ? (
                      `₹${item.lastPurchaseRate || 0}`
                    ) : (
                      <span style={{ color: '#94a3b8' }}>—</span>
                    )}
                  </td>
                  <td>
                    {(item.availableBags || 0) <= 15 ? (
                      <span style={{ color: '#b91c1c', fontWeight: '700', fontSize: '0.85rem' }}>ઓછો સ્ટોક</span>
                    ) : (
                      <span style={{ color: '#15803d', fontSize: '0.85rem' }}>પર્યાપ્ત</span>
                    )}
                  </td>
                  {userProfile?.role === 'admin' && (
                    <td>
                      <button 
                        type="button"
                        className="secondary"
                        style={{ padding: '3px 8px', fontSize: '0.8rem' }}
                        onClick={() => setSelectedStockForAdjust(item)}>
                        સુધારો
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Stock Adjustment Modal */}
      {selectedStockForAdjust && (
        <div className="modal-backdrop">
          <div className="panel" style={{ maxWidth: '480px', width: '100%', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, color: '#14532d' }}>
                સ્ટોક સુધારો: {selectedStockForAdjust.varietyName}
              </h3>
              <button 
                type="button"
                className="secondary"
                onClick={() => setSelectedStockForAdjust(null)} 
                style={{ padding: '4px 8px', fontSize: '0.85rem' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment}>
              <p className="muted" style={{ margin: '0 0 12px 0' }}>
                હાલનો સ્ટોક: <b>{selectedStockForAdjust.availableBags} બોરી + {selectedStockForAdjust.availableLooseKg} KG ({selectedStockForAdjust.totalWeightKg} KG)</b>
              </p>

              <div className="formgrid">
                <label>
                  બોરી વધારો (+) અથવા ઘટાડો (-)
                  <input 
                    type="number" 
                    placeholder="દા.ત. +2 અથવા -1"
                    value={adjustBags} 
                    onChange={(e) => setAdjustBags(e.target.value)} 
                  />
                </label>

                <label>
                  છૂટક કિલો વધારો (+) અથવા ઘટાડો (-)
                  <input 
                    type="number" 
                    step="0.5" 
                    placeholder="દા.ત. +5 અથવા -2.5"
                    value={adjustKg} 
                    onChange={(e) => setAdjustKg(e.target.value)} 
                  />
                </label>

                <label className="full">
                  કારણ (Reason)
                  <select 
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}>
                    <option value="ગોડાઉન ઓડિટ ગણતરી">ગોડાઉન ઓડિટ ગણતરી (Physical Audit)</option>
                    <option value="ડેમેજ અથવા ફાટેલી બોરી">ડેમેજ અથવા ફાટેલી બોરી (Damage)</option>
                    <option value="સેમ્પલ / ડેમો આપેલ">સેમ્પલ / ડેમો આપેલ (Sample)</option>
                    <option value="અન્ય સુધારો">અન્ય સુધારો</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="secondary" onClick={() => setSelectedStockForAdjust(null)}>
                  રદ કરો
                </button>
                <button type="submit" className="primary-action" style={{ width: 'auto', padding: '8px 18px' }}>
                  સુધારો સાચવો
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default StockLedger;
