import React from 'react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, userProfile, hasPermission, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'ડેશબોર્ડ', allowed: true },
    { id: 'purchases', label: 'ખરીદી (Purchase)', allowed: hasPermission('purchaseEntry') },
    { id: 'sales', label: 'વેચાણ / બિલિંગ', allowed: hasPermission('salesBilling') },
    { id: 'stock', label: 'સ્ટોક (Stock)', allowed: hasPermission('stockManagement') },
    { id: 'khatabook', label: 'ખાતાવહી & રોજમેળ', allowed: true },
    { id: 'farmers', label: 'ખેડૂત / ગ્રાહક', allowed: hasPermission('farmerMaster') },
    { id: 'suppliers', label: 'પેઢી / સપ્લાયર્સ', allowed: hasPermission('supplierMaster') },
    { id: 'seeds', label: 'બીજની જાતો', allowed: hasPermission('seedMaster') },
    { id: 'payments', label: 'જમા-ઉધાર વાઉચર', allowed: hasPermission('payments') },
    { id: 'reports', label: 'હિસાબી રિપોર્ટ્સ', allowed: hasPermission('reports') },
    { id: 'users', label: 'યુઝર પરવાનગી', allowed: userProfile?.role === 'admin' }
  ];

  return (
    <aside>
      <div className="brand">🌱 SHREE NANDINI SEEDS</div>
      <p className="muted" style={{ color: '#86efac', fontSize: '0.85rem', margin: '0 0 10px 0' }}>
        {userProfile?.displayName || user?.email || 'User'}
      </p>

      {menuItems.map(item => {
        if (!item.allowed) return null;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            className={`nav ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            {item.label}
          </button>
        );
      })}

      <button className="nav logout" onClick={logout}>
        લૉગઆઉટ
      </button>
    </aside>
  );
};
export default Sidebar;

