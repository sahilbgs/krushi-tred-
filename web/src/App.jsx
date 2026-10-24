import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
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
import { UserManagement } from './pages/UserManagement';
import { Reports } from './pages/Reports';
import { Login } from './pages/Login';

export function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentBillModal, setCurrentBillModal] = useState(null);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#064e3b' }}>
        લોડિંગ થઈ રહ્યું છે...
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
      case 'sales':
        return <SalesBilling onBillCreated={(newSale) => setCurrentBillModal(newSale)} />;
      case 'purchases':
        return <PurchaseEntry onPurchaseCompleted={() => setActiveTab('stock')} />;
      case 'stock':
        return <StockLedger />;
      case 'farmers':
        return <FarmerMaster onSelectFarmerBills={() => setActiveTab('reports')} />;
      case 'suppliers':
        return <SupplierMaster />;
      case 'seeds':
        return <SeedMaster />;
      case 'payments':
        return <Payments />;
      case 'users':
        return <UserManagement />;
      case 'reports':
        return <Reports onOpenBill={(sale) => setCurrentBillModal(sale)} />;
      default:
        return <Dashboard setActiveTab={setActiveTab} onOpenBill={(sale) => setCurrentBillModal(sale)} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="main-content">
        <Navbar />
        {renderActiveTab()}
      </div>

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
