import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useData } from './context/DataContext';
import { Sidebar } from './components/Sidebar';
import { SimpleBillModal } from './components/SimpleBillModal';
import { SiteLock, checkSiteUnlocked, lockSite } from './components/SiteLock';

import { Dashboard } from './pages/Dashboard';
import { SalesBilling } from './pages/SalesBilling';
import { PurchaseEntry } from './pages/PurchaseEntry';
import { StockLedger } from './pages/StockLedger';
import { FarmerMaster } from './pages/FarmerMaster';
import { SupplierMaster } from './pages/SupplierMaster';
import { SeedMaster } from './pages/SeedMaster';
import { Payments } from './pages/Payments';
import { KhataBook } from './pages/KhataBook';
import { UserManagement } from './pages/UserManagement';
import { Reports } from './pages/Reports';
import { Login } from './pages/Login';

const tabTitles = {
  dashboard: 'ડેશબોર્ડ',
  purchases: 'બિયારણ ખરીદી (Purchase Entry)',
  sales: 'વેચાણ / સાદું બિલ (Sales Billing)',
  stock: 'વર્તમાન સ્ટોક લેજર (Stock Ledger)',
  khatabook: 'પાર્ટી ખાતાવહી & દૈનિક રોજમેળ',
  farmers: 'ગ્રાહક / પાર્ટી માસ્ટર (ખેડૂત, પેઢી, સપ્લાયર, વેપારી)',
  suppliers: 'પેઢી / સપ્લાયર્સ માસ્ટર (Suppliers)',
  seeds: 'બીજની જાતો માસ્ટર (Seed Varieties)',
  payments: 'જમા-ઉધાર વાઉચર એન્ટ્રી (Payments)',
  reports: 'હિસાબી રિપોર્ટ્સ (Reports & Ledger)',
  trucks: 'ટ્રક & ગાડી ફેરા રજિસ્ટર (Truck Register)',
  users: 'યુઝર પરવાનગી અને અધિકારો'
};

export function App() {
  const [siteUnlocked, setSiteUnlocked] = useState(checkSiteUnlocked);
  const { user, userProfile, loading } = useAuth();
  const { dbStatus, refreshData } = useData();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentBillModal, setCurrentBillModal] = useState(null);
  const [notice, setNotice] = useState('');

  const handleLockSite = () => {
    lockSite();
    setSiteUnlocked(false);
  };

  // If site is not unlocked with password 44113290, immediately show SiteLock
  if (!siteUnlocked) {
    return <SiteLock onUnlock={() => setSiteUnlocked(true)} />;
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#14532d', background: '#f5f7f5' }}>
        🌱 શ્રી નંદિની સીડ્સ સિસ્ટમ લોડિંગ થઈ રહી છે...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} onOpenBill={(sale) => setCurrentBillModal(sale)} />;
      case 'purchases':
        return <PurchaseEntry />;
      case 'sales':
        return <SalesBilling onBillCreated={(newSale) => setCurrentBillModal(newSale)} />;
      case 'stock':
        return <StockLedger />;
      case 'khatabook':
        return <KhataBook />;
      case 'farmers':
        return <FarmerMaster onSelectFarmerBills={() => setActiveTab('reports')} />;
      case 'suppliers':
        return <SupplierMaster />;
      case 'seeds':
        return <SeedMaster />;
      case 'payments':
        return <Payments />;
      case 'reports':
        return <Reports onOpenBill={(sale) => setCurrentBillModal(sale)} />;
      case 'trucks':
        return <Reports initialTab="trucks" onOpenBill={(sale) => setCurrentBillModal(sale)} />;
      case 'users':
        return <UserManagement />;
      default:
        return <Dashboard setActiveTab={setActiveTab} onOpenBill={(sale) => setCurrentBillModal(sale)} />;
    }
  };

  return (
    <div className="app-layout">
      {/* Mobile Top Navigation Bar */}
      <div className="mobile-topbar">
        <button 
          type="button" 
          className="hamburger-btn" 
          onClick={() => setMobileMenuOpen(prev => !prev)}
          aria-label="મેનુ ખોલો"
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        <div className="mobile-brand">
          <span style={{ fontSize: '1.15rem' }}>🌱</span>
          <span style={{ fontWeight: '800', letterSpacing: '0.3px' }}>શ્રી નંદિની સીડ્સ</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button 
            type="button" 
            onClick={refreshData}
            title="PostgreSQL Dynamic Sync"
            style={{
              fontSize: '0.72rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: dbStatus === 'connected' ? '#ecfdf5' : '#fef3c7',
              color: dbStatus === 'connected' ? '#047857' : '#b45309',
              border: '1px solid ' + (dbStatus === 'connected' ? '#a7f3d0' : '#fde68a'),
              padding: '3px 8px',
              borderRadius: '999px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dbStatus === 'connected' ? '#10b981' : '#f59e0b' }}></span>
            {dbStatus === 'connected' ? 'Live DB' : 'Sync'}
          </button>
          <button 
            type="button" 
            onClick={handleLockSite}
            title="સાઇટ લોક કરો (Lock)"
            style={{
              fontSize: '0.72rem',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              background: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              padding: '3px 8px',
              borderRadius: '999px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <span>🔒</span>
            <span>લોક</span>
          </button>
          <div className="mobile-role-pill">
            {userProfile?.displayName ? userProfile.displayName.split(' ')[0] : 'Admin'}
          </div>
        </div>
      </div>

      {/* Drawer Backdrop Overlay for Mobile */}
      {mobileMenuOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onLockSite={handleLockSite}
      />
      
      {/* Main Content Area */}
      <main className="content">
        <header className="page-header">
          <div className="page-title-box">
            <h1>{tabTitles[activeTab] || 'SHREE NANDINI SEEDS'}</h1>
            <p className="muted header-subtitle">બીજ ખરીદી (35 KG/બોરી • ₹/મણ) • વેચાણ • બિલિંગ • સ્ટોક • ખાતાવહી</p>
          </div>
          <div className="header-actions">
            <button 
              type="button" 
              onClick={refreshData}
              title="PostgreSQL Live Centralized DB Sync"
              style={{
                background: dbStatus === 'connected' ? '#ecfdf5' : '#fef3c7',
                color: dbStatus === 'connected' ? '#047857' : '#b45309',
                border: '1px solid ' + (dbStatus === 'connected' ? '#a7f3d0' : '#fde68a'),
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.82rem',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dbStatus === 'connected' ? '#10b981' : '#f59e0b' }}></span>
              {dbStatus === 'connected' ? 'PostgreSQL Live' : 'સિન્ક થાય છે...'}
            </button>
            <button
              type="button"
              onClick={handleLockSite}
              title="સાઇટ લોક કરો (Lock Website)"
              style={{
                background: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #fca5a5',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '0.82rem',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <span>🔒</span>
              <span>લોક (Lock)</span>
            </button>
            <span className={`role ${userProfile?.role === 'sub_user' ? 'sub' : ''}`}>
              {userProfile?.role === 'admin' ? 'Main Admin (Ravi)' : 'Sub User (Bhargav)'}
            </span>
          </div>
        </header>

        {notice && (
          <div className="notice" onClick={() => setNotice('')}>
            {notice} ×
          </div>
        )}

        {renderActiveTab()}
      </main>

      {currentBillModal && (
        <SimpleBillModal 
          sale={currentBillModal} 
          onClose={() => setCurrentBillModal(null)} 
        />
      )}
    </div>
  );
}
export default App;

