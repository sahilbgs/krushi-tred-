import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { SimpleBillModal } from './components/SimpleBillModal';

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
  farmers: 'ખેડૂત / ગ્રાહક માસ્ટર (Farmers)',
  suppliers: 'પેઢી / સપ્લાયર્સ માસ્ટર (Suppliers)',
  seeds: 'બીજની જાતો માસ્ટર (Seed Varieties)',
  payments: 'જમા-ઉધાર વાઉચર એન્ટ્રી (Payments)',
  reports: 'હિસાબી રિપોર્ટ્સ (Reports & Ledger)',
  users: 'યુઝર પરવાનગી અને અધિકારો'
};

export function App() {
  const { user, userProfile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentBillModal, setCurrentBillModal] = useState(null);
  const [notice, setNotice] = useState('');

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
        return <PurchaseEntry onPurchaseCompleted={() => setActiveTab('stock')} />;
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
      case 'users':
        return <UserManagement />;
      default:
        return <Dashboard setActiveTab={setActiveTab} onOpenBill={(sale) => setCurrentBillModal(sale)} />;
    }
  };

  return (
    <div className="app">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="content">
        <header>
          <div>
            <h1>{tabTitles[activeTab] || 'SHREE NANDINI SEEDS'}</h1>
            <p className="muted">બીજ ખરીદી (35 KG/બોરી • ₹/મણ) • વેચાણ • બિલિંગ • સ્ટોક • ખાતાવહી</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="role">
              {userProfile?.role === 'admin' ? 'Main Admin (Ravi Chaudhary)' : 'Sub User (Bhargav Chaudhary)'}
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

