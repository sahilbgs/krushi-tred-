import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Receipt, 
  ShoppingCart, 
  Boxes, 
  Users, 
  Truck, 
  Sprout, 
  CreditCard, 
  UserCheck, 
  FileBarChart2, 
  Lock 
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { hasPermission, userProfile } = useAuth();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'ડેશબોર્ડ',
      icon: LayoutDashboard,
      allowed: true
    },
    {
      id: 'sales',
      label: 'નવું સાદું બિલ',
      icon: Receipt,
      allowed: hasPermission('salesBilling'),
      permKey: 'salesBilling'
    },
    {
      id: 'purchases',
      label: 'નવી ખરીદી',
      icon: ShoppingCart,
      allowed: hasPermission('purchaseEntry'),
      permKey: 'purchaseEntry'
    },
    {
      id: 'stock',
      label: 'સ્ટોક લેજર (બોરી + KG)',
      icon: Boxes,
      allowed: hasPermission('stockManagement'),
      permKey: 'stockManagement'
    },
    {
      id: 'farmers',
      label: 'ખેડૂત / ગ્રાહક માસ્ટર',
      icon: Users,
      allowed: hasPermission('farmerMaster'),
      permKey: 'farmerMaster'
    },
    {
      id: 'suppliers',
      label: 'સપ્લાયર્સ માસ્ટર',
      icon: Truck,
      allowed: hasPermission('supplierMaster'),
      permKey: 'supplierMaster'
    },
    {
      id: 'seeds',
      label: 'બિયારણ જાતો (Seeds)',
      icon: Sprout,
      allowed: hasPermission('seedMaster'),
      permKey: 'seedMaster'
    },
    {
      id: 'payments',
      label: 'જમા-ઉધાર વસૂલાત',
      icon: CreditCard,
      allowed: hasPermission('payments'),
      permKey: 'payments'
    },
    {
      id: 'users',
      label: 'સ્ટાફ & પરવાનગીઓ',
      icon: UserCheck,
      allowed: userProfile?.role === 'admin',
      permKey: 'userManagement'
    },
    {
      id: 'reports',
      label: 'હિસાબી રિપોર્ટ્સ',
      icon: FileBarChart2,
      allowed: hasPermission('reports'),
      permKey: 'reports'
    }
  ];

  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.25rem 0.75rem',
      userSelect: 'none'
    }}>
      <div style={{ marginBottom: '1rem', padding: '0 0.75rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>
          મુખ્ય મેનુ
        </span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isAllowed = item.allowed;

          return (
            <button
              key={item.id}
              disabled={!isAllowed}
              onClick={() => isAllowed && setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? '#ecfdf5' : 'transparent',
                color: !isAllowed ? '#94a3b8' : isActive ? '#059669' : '#334155',
                cursor: !isAllowed ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                fontSize: '0.92rem',
                fontWeight: isActive ? '600' : '500',
                transition: 'all 0.15s ease'
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={19} color={!isAllowed ? '#cbd5e1' : isActive ? '#059669' : '#64748b'} />
                <span>{item.label}</span>
              </div>
              {!isAllowed && (
                <Lock size={14} color="#94a3b8" />
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', padding: '1rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#064e3b' }}>
          🌱 Krushi Trade v1.0
        </div>
        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
          સાદું બિલ • બોરી & કિલો સ્ટોક
        </div>
      </div>
    </aside>
  );
};
