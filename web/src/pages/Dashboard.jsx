import React from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export const Dashboard = ({ setActiveTab, onOpenBill }) => {
  const { sales, purchases, stock, farmers, seeds } = useData();
  const { hasPermission } = useAuth();

  const todayStr = new Date().toISOString().split('T')[0];

  const todaySales = sales.filter(s => s.billDate === todayStr);
  const todaySalesAmount = todaySales.reduce((acc, curr) => acc + (curr.netAmount || 0), 0);

  const totalBagsInStock = stock.reduce((acc, curr) => acc + (parseInt(curr.availableBags) || 0), 0);
  const totalKgInStock = stock.reduce((acc, curr) => acc + (parseFloat(curr.totalWeightKg) || 0), 0);

  const lowStockItems = stock.filter(item => (item.availableBags || 0) <= 15);

  return (
    <div>
      {/* 4 Primary Metric Cards */}
      <div className="cards">
        <div className="metric">
          <span>ખેડૂત / ગ્રાહક (Parties)</span>
          <b>{farmers.length}</b>
        </div>
        <div className="metric">
          <span>બીજની જાતો (Seed Varieties)</span>
          <b>{seeds.length}</b>
        </div>
        <div className="metric">
          <span>ઉપલબ્ધ Stock (KG)</span>
          <b>{totalKgInStock.toLocaleString('en-IN')} KG</b>
          <div style={{ fontSize: '0.8rem', color: '#16a34a', marginTop: '4px' }}>
            ({totalBagsInStock} બોરી હાજર)
          </div>
        </div>
        <div className="metric">
          <span>આજનું વેચાણ</span>
          <b>₹{todaySalesAmount.toLocaleString('en-IN')}</b>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
            {todaySales.length} બિલો
          </div>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {hasPermission('purchaseEntry') && (
          <button 
            type="button"
            className="primary-action" 
            style={{ width: 'auto', padding: '10px 18px' }}
            onClick={() => setActiveTab('purchases')}>
            ＋ નવી ખરીદી એન્ટ્રી (35 KG • ₹/મણ)
          </button>
        )}
        {hasPermission('salesBilling') && (
          <button 
            type="button"
            className="secondary" 
            style={{ padding: '10px 18px', fontWeight: '600' }}
            onClick={() => setActiveTab('sales')}>
            ＋ નવું વેચાણ બિલ
          </button>
        )}
        <button 
          type="button"
          className="secondary" 
          style={{ padding: '10px 18px' }}
          onClick={() => setActiveTab('khatabook')}>
          📖 ખાતાવહી & રોજમેળ
        </button>
      </div>

      {/* Low Stock Warning if any */}
      {lowStockItems.length > 0 && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div>
            <strong style={{ color: '#92400e' }}>⚠️ સ્ટોક ચેતવણી: </strong>
            <span style={{ color: '#b45309' }}>
              {lowStockItems.map(it => `${it.varietyName} (${it.availableBags} બોરી)`).join(', ')}
            </span>
          </div>
          <button 
            type="button"
            className="secondary" 
            style={{ padding: '4px 10px', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('stock')}>
            સ્ટોક જુઓ
          </button>
        </div>
      )}

      {/* Recent Sales Table */}
      <h2>તાજેતરનું વેચાણ</h2>
      <div className="tablewrap" style={{ marginBottom: '24px' }}>
        <table>
          <thead>
            <tr>
              <th>બિલ નં</th>
              <th>તારીખ</th>
              <th>ખેડૂત / ગ્રાહક</th>
              <th>બીજની જાત</th>
              <th>બોરી</th>
              <th>કુલ રકમ</th>
              <th>ચૂકવેલ</th>
              <th>બાકી</th>
              <th>પ્રિન્ટ</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', color: '#64748b', padding: '16px' }}>
                  હજુ સુધી કોઈ વેચાણ નોંધાયેલ નથી.
                </td>
              </tr>
            ) : (
              sales.slice(0, 10).map(sale => {
                const bagsCount = sale.items?.reduce((s, it) => s + (parseInt(it.bags) || 0), 0) || 0;
                return (
                  <tr key={sale.id}>
                    <td><b>{sale.billNo}</b></td>
                    <td>{sale.billDate}</td>
                    <td>
                      <div>{sale.farmerName}</div>
                      {sale.farmerVillage && <small style={{ color: '#64748b' }}>({sale.farmerVillage})</small>}
                    </td>
                    <td>{sale.items?.map(it => it.varietyName).join(', ') || '—'}</td>
                    <td>{bagsCount}</td>
                    <td><b>₹{sale.netAmount?.toLocaleString('en-IN')}</b></td>
                    <td style={{ color: '#16a34a' }}>₹{(sale.paidAmount || 0).toLocaleString('en-IN')}</td>
                    <td style={{ color: (sale.dueAmount || 0) > 0 ? '#dc2626' : '#64748b', fontWeight: (sale.dueAmount || 0) > 0 ? '700' : 'normal' }}>
                      ₹{(sale.dueAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <button 
                        type="button"
                        className="secondary" 
                        style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                        onClick={() => onOpenBill(sale)}>
                        બિલ
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Godown Stock Snapshot */}
      <h2>વર્તમાન સ્ટોક સ્થિતિ</h2>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>બિયારણ જાત</th>
              <th>હાજર બોરી (35 KG સ્ટાન્ડર્ડ)</th>
              <th>છૂટક KG</th>
              <th>કુલ નેટ વજન (KG)</th>
              <th>સ્થિતિ</th>
            </tr>
          </thead>
          <tbody>
            {stock.map(item => (
              <tr key={item.id}>
                <td><b>{item.varietyName}</b></td>
                <td style={{ fontWeight: '700', color: (item.availableBags || 0) <= 15 ? '#dc2626' : '#15803d' }}>
                  {item.availableBags} બોરી
                </td>
                <td>{item.availableLooseKg} kg</td>
                <td><b>{item.totalWeightKg} kg</b></td>
                <td>
                  {(item.availableBags || 0) <= 15 ? (
                    <span style={{ color: '#dc2626', fontWeight: '600', fontSize: '0.85rem' }}>ઓછો સ્ટોક</span>
                  ) : (
                    <span style={{ color: '#15803d', fontSize: '0.85rem' }}>પર્યાપ્ત</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default Dashboard;

