import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sprout, User, ShieldCheck, LogOut, ArrowRightLeft } from 'lucide-react';

export const Navbar = () => {
  const { userProfile, logout, loginAsDemo } = useAuth();

  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      padding: '0.85rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div style={{
          backgroundColor: '#ecfdf5',
          color: '#059669',
          padding: '0.6rem',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Sprout size={26} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#064e3b', lineHeight: 1.1, letterSpacing: '0.02em' }}>
            SHREE NANDINI SEEDS
          </h1>
          <p style={{ fontSize: '0.78rem', color: '#059669', fontWeight: '600' }}>
            શ્રી નંદિની સીડ્સ • ખરીદી, ખાતાવહી & રોજમેળ
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
        {/* Role Switcher for easy testing / demo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#f8fafc', padding: '0.3rem 0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>રોલ ટેસ્ટ:</span>
          <button 
            onClick={() => loginAsDemo('admin')}
            style={{
              fontSize: '0.75rem',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: userProfile?.role === 'admin' ? '600' : '400',
              backgroundColor: userProfile?.role === 'admin' ? '#059669' : '#e2e8f0',
              color: userProfile?.role === 'admin' ? '#ffffff' : '#334155'
            }}>
            Ravi (Main Admin)
          </button>
          <button 
            onClick={() => loginAsDemo('sub_user')}
            style={{
              fontSize: '0.75rem',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: userProfile?.role === 'sub_user' ? '600' : '400',
              backgroundColor: userProfile?.role === 'sub_user' ? '#d97706' : '#e2e8f0',
              color: userProfile?.role === 'sub_user' ? '#ffffff' : '#334155'
            }}>
            Bhargav (Sub User)
          </button>
        </div>

        {/* User Profile Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: userProfile?.role === 'admin' ? '#ecfdf5' : '#fef3c7',
            color: userProfile?.role === 'admin' ? '#059669' : '#b45309',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600'
          }}>
            {userProfile?.role === 'admin' ? <ShieldCheck size={20} /> : <User size={20} />}
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: '600', color: '#1e293b' }}>
              {userProfile?.displayName || 'વપરાશકર્તા'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span className={`badge ${userProfile?.role === 'admin' ? 'badge-primary' : 'badge-warning'}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                {userProfile?.role === 'admin' ? 'મુખ્ય સંચાલક' : 'સ્ટાફ યુઝર'}
              </span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button 
          onClick={logout}
          title="લૉગ આઉટ કરો"
          style={{
            background: 'none',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '0.5rem',
            cursor: 'pointer',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.15s'
          }}>
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};
