import React from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, 
  ShoppingCart, 
  Boxes, 
  Scale, 
  AlertTriangle, 
  Receipt, 
  Users, 
  ArrowUpRight,
  PlusCircle
} from 'lucide-react';

export const Dashboard = ({ setActiveTab, onOpenBill }) => {
  const { sales, purchases, stock, farmers } = useData();
  const { hasPermission } = useAuth();

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate today's stats
  const todaySales = sales.filter(s => s.billDate === todayStr);
  const todaySalesAmount = todaySales.reduce((acc, curr) => acc + (curr.netAmount || 0), 0);
  const todaySalesBags = todaySales.reduce((acc, curr) => {
    return acc + curr.items.reduce((sum, it) => sum + (parseInt(it.bags) || 0), 0);
  }, 0);

  const todayPurchases = purchases.filter(p => p.purchaseDate === todayStr);
  const todayPurchasesAmount = todayPurchases.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  // Total Stock in Godown
  const totalBagsInStock = stock.reduce((acc, curr) => acc + (parseInt(curr.availableBags) || 0), 0);
  const totalKgInStock = stock.reduce((acc, curr) => acc + (parseFloat(curr.totalWeightKg) || 0), 0);

  // Total Outstanding Udhar from Farmers
  const totalFarmerDue = farmers.reduce((acc, curr) => acc + (parseFloat(curr.currentBalance) || 0), 0);

  // Low Stock Items (< minAlertBags)
  const lowStockItems = stock.filter(item => item.availableBags <= 15);

  return (
    <div className="page-body">
      
      {/* Welcome Banner & Quick Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#064e3b' }}>
            મુખ્ય ડેશબોર્ડ (Krushi Dashboard)
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            તારીખ: {new Date().toLocaleDateString('gu-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {hasPermission('salesBilling') && (
            <button 
              className="btn btn-primary" 
              onClick={() => setActiveTab('sales')}>
              <PlusCircle size={18} />
              નવું બિલ બનાવો
            </button>
          )}

          {hasPermission('purchaseEntry') && (
            <button 
              className="btn btn-secondary" 
              onClick={() => setActiveTab('purchases')}>
              <ShoppingCart size={18} />
              નવી ખરીદી એન્ટ્રી
            </button>
          )}
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="stats-grid">
        
        {/* Today's Sales */}
        <div className="stat-card" style={{ borderLeft: '4px solid #059669' }}>
          <div className="stat-icon" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
            <TrendingUp size={26} />
          </div>
          <div className="stat-info">
            <div className="stat-value">₹{todaySalesAmount.toLocaleString('en-IN')}</div>
            <div className="stat-label">આજનું કુલ વેચાણ ({todaySales.length} બિલ / {todaySalesBags} બોરી)</div>
          </div>
        </div>

        {/* Available Stock: Bags */}
        <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
            <Boxes size={26} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{totalBagsInStock.toLocaleString('en-IN')} બોરી</div>
            <div className="stat-label">ગોડાઉનમાં હાજર આખી બોરી સ્ટોક</div>
          </div>
        </div>

        {/* Available Stock: Total KG */}
        <div className="stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div className="stat-icon" style={{ backgroundColor: '#f5f3ff', color: '#8b5cf6' }}>
            <Scale size={26} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{totalKgInStock.toLocaleString('en-IN')} kg</div>
            <div className="stat-label">કુલ નેટ વજન (બોરી + છૂટક કિલો)</div>
          </div>
        </div>

        {/* Farmer Due Balance (બાકી ઉધાર) */}
        <div className="stat-card" style={{ borderLeft: '4px solid #dc2626' }}>
          <div className="stat-icon" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
            <Users size={26} />
          </div>
          <div className="stat-info">
            <div className="stat-value">₹{totalFarmerDue.toLocaleString('en-IN')}</div>
            <div className="stat-label">ખેડૂતો પાસે કુલ બાકી ઉધાર (Due)</div>
          </div>
        </div>

      </div>

      {/* Low Stock Alert if any */}
      {lowStockItems.length > 0 && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '10px',
          padding: '1rem 1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <AlertTriangle size={24} color="#d97706" />
          <div style={{ flex: 1 }}>
            <strong style={{ color: '#92400e', fontSize: '0.95rem' }}>સ્ટોક ચેતવણી (Low Stock Alert):</strong>
            <span style={{ color: '#b45309', fontSize: '0.9rem', marginLeft: '0.5rem' }}>
              {lowStockItems.map(it => `${it.varietyName} (${it.availableBags} બોરી બાકી)`).join(', ')}
            </span>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}
            onClick={() => setActiveTab('stock')}>
            સ્ટોક જુઓ
          </button>
        </div>
      )}

      {/* Recent Bills and Godown Stock Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
        
        {/* Recent Bills Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Receipt size={20} />
              તાજેતરના વેચાણ બિલો (Recent Bills)
            </h3>
            <button 
              className="btn btn-secondary" 
              style={{ fontSize: '0.82rem', padding: '0.3rem 0.6rem' }}
              onClick={() => setActiveTab('reports')}>
              બધા જુઓ
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>બિલ નં</th>
                  <th>ખેડૂતનું નામ</th>
                  <th>બોરી / કિલો</th>
                  <th>કુલ રકમ</th>
                  <th>સ્થિતિ</th>
                  <th>એક્શન</th>
                </tr>
              </thead>
              <tbody>
                {sales.slice(0, 5).map(sale => {
                  const bagsCount = sale.items.reduce((s, it) => s + (parseInt(it.bags) || 0), 0);
                  const totalKg = sale.items.reduce((s, it) => s + (parseFloat(it.totalWeightKg) || 0), 0);

                  return (
                    <tr key={sale.id}>
                      <td style={{ fontWeight: '600' }}>{sale.billNo}</td>
                      <td>
                        <div>{sale.farmerName}</div>
                        <small style={{ color: '#64748b' }}>{sale.farmerVillage || '—'}</small>
                      </td>
                      <td>{bagsCount} બોરી ({totalKg} kg)</td>
                      <td style={{ fontWeight: '600', color: '#064e3b' }}>
                        ₹{sale.netAmount?.toLocaleString('en-IN')}
                      </td>
                      <td>
                        {sale.dueAmount > 0 ? (
                          <span className="badge badge-danger">બાકી ₹{sale.dueAmount}</span>
                        ) : (
                          <span className="badge badge-success">પૂરેપૂરા જમા</span>
                        )}
                      </td>
                      <td>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                          onClick={() => onOpenBill(sale)}>
                          બિલ પ્રિન્ટ
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Seeds Godown Snapshot */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Boxes size={20} />
              ગોડાઉન સ્ટોક સ્થિતિ (Godown Stock)
            </h3>
            <button 
              className="btn btn-secondary" 
              style={{ fontSize: '0.82rem', padding: '0.3rem 0.6rem' }}
              onClick={() => setActiveTab('stock')}>
              લેજર વિગત
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>બિયારણ જાત</th>
                  <th>હાજર બોરી</th>
                  <th>છૂટક KG</th>
                  <th>કુલ કિલો</th>
                </tr>
              </thead>
              <tbody>
                {stock.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: '600' }}>{item.varietyName}</td>
                    <td style={{ fontWeight: '700', color: item.availableBags <= 15 ? '#dc2626' : '#059669' }}>
                      {item.availableBags} બોરી
                    </td>
                    <td>{item.availableLooseKg} kg</td>
                    <td style={{ fontWeight: '600' }}>{item.totalWeightKg} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
