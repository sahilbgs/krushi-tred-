import React from 'react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ activeTab, setActiveTab, isOpen, onClose, onLockSite }) => {
  const { user, userProfile, hasPermission, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'ડેશબોર્ડ', allowed: true },
    { id: 'purchases', label: 'ખરીદી (Purchase)', allowed: hasPermission('purchaseEntry') },
    { id: 'sales', label: 'વેચાણ / બિલિંગ', allowed: hasPermission('salesBilling') },
    { id: 'stock', label: 'સ્ટોક (Stock)', allowed: hasPermission('stockManagement') },
    { id: 'khatabook', label: 'ખાતાવહી & રોજમેળ', allowed: true },
    { id: 'farmers', label: 'ગ્રાહક & પાર્ટી માસ્ટર', allowed: hasPermission('farmerMaster') },
    { id: 'suppliers', label: 'પેઢી / સપ્લાયર્સ', allowed: hasPermission('supplierMaster') },
    { id: 'seeds', label: 'બીજની જાતો', allowed: hasPermission('seedMaster') },
    { id: 'payments', label: 'જમા-ઉધાર વાઉચર', allowed: hasPermission('payments') },
    { id: 'reports', label: 'હિસાબી રિપોર્ટ્સ', allowed: hasPermission('reports') },
    { id: 'users', label: 'યુઝર પરવાનગી', allowed: userProfile?.role === 'admin' }
  ];

  return (
    <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div>
          <div className="brand">🌱 SHREE NANDINI SEEDS</div>
          <p className="muted" style={{ color: '#86efac', fontSize: '0.82rem', margin: '2px 0 0 0' }}>
            {userProfile?.displayName || user?.email || 'User'}
          </p>
        </div>
        {onClose && (
          <button 
            type="button" 
            className="sidebar-close-btn" 
            onClick={onClose}
            aria-label="મેનુ બંધ કરો"
          >
            ✕
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => {
          if (!item.allowed) return null;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav ${isActive ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                if (onClose) onClose();
              }}
            >
              <span>{item.label}</span>
              {isActive && <span className="nav-active-dot">●</span>}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #e2e8f0' }}>
        <a 
          href="/api/download/subuser-apk"
          download="krushi-trade-subuser.apk"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            backgroundColor: '#059669',
            color: '#ffffff',
            padding: '0.55rem 0.8rem',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '0.8rem',
            fontWeight: '600',
            textAlign: 'center'
          }}
        >
          <span>📱 સબ યુઝર એપ (APK)</span>
        </a>
      </div>

      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {onLockSite && (
          <button 
            type="button"
            className="nav" 
            style={{ 
              backgroundColor: '#064e3b', 
              color: '#a7f3d0', 
              border: '1px solid #059669',
              borderRadius: '8px',
              padding: '10px 14px',
              cursor: 'pointer',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onClick={() => {
              if (onClose) onClose();
              onLockSite();
            }}
          >
            <span>🔒 સાઇટ લોક કરો (Lock)</span>
          </button>
        )}
        <button 
          className="nav logout" 
          onClick={() => {
            if (onClose) onClose();
            logout();
          }}
        >
          <span>🚪 લૉગઆઉટ</span>
        </button>
      </div>
    </aside>
  );
};
export default Sidebar;

