import React, { useState, useEffect, useRef } from 'react';

export const SITE_PASSWORD = '44113290';
export const SITE_ACCESS_KEY = 'krushi_site_access_key';

export function checkSiteUnlocked() {
  try {
    const local = localStorage.getItem(SITE_ACCESS_KEY);
    const session = sessionStorage.getItem(SITE_ACCESS_KEY);
    return local === SITE_PASSWORD || session === SITE_PASSWORD;
  } catch (e) {
    return false;
  }
}

export function lockSite() {
  try {
    localStorage.removeItem(SITE_ACCESS_KEY);
    sessionStorage.removeItem(SITE_ACCESS_KEY);
  } catch (e) {
    console.error('Error clearing site access key', e);
  }
}

export function unlockSite(remember = true) {
  try {
    if (remember) {
      localStorage.setItem(SITE_ACCESS_KEY, SITE_PASSWORD);
      sessionStorage.removeItem(SITE_ACCESS_KEY);
    } else {
      sessionStorage.setItem(SITE_ACCESS_KEY, SITE_PASSWORD);
      localStorage.removeItem(SITE_ACCESS_KEY);
    }
  } catch (e) {
    console.error('Error setting site access key', e);
  }
}

export const SiteLock = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(true);
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleVerify = (e) => {
    if (e) e.preventDefault();
    const trimmed = (password || '').trim();

    if (trimmed === SITE_PASSWORD) {
      setError('');
      unlockSite(remember);
      if (onUnlock) {
        onUnlock(remember);
      }
    } else {
      setError('❌ અમાન્ય પાસવર્ડ! કૃપા કરીને સાચો પાસવર્ડ દાખલ કરો.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
      setPassword('');
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleNumberClick = (digit) => {
    setError('');
    setPassword(prev => prev + digit);
  };

  const handleBackspace = () => {
    setPassword(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPassword('');
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
      padding: '16px',
      boxSizing: 'border-box',
      fontFamily: 'Inter, "Noto Sans Gujarati", -apple-system, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
        padding: '30px 24px',
        boxSizing: 'border-box',
        textAlign: 'center',
        animation: isShaking ? 'shake 0.5s ease-in-out' : 'none'
      }}>
        {/* Style tag for shaking animation */}
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-8px); }
            40%, 80% { transform: translateX(8px); }
          }
        `}</style>

        {/* Lock Icon Badge */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#ecfdf5',
          border: '2px solid #a7f3d0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          margin: '0 auto 16px auto',
          boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)'
        }}>
          🔒
        </div>

        {/* Brand Title */}
        <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#065f46', letterSpacing: '0.3px', marginBottom: '4px' }}>
          🌱 શ્રી નંદિની સીડ્સ
        </div>
        <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#047857', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          SHREE NANDINI SEEDS
        </div>

        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '10px 14px',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#1e293b', fontWeight: '700' }}>
            સિક્યોરિટી ઍક્સેસ પાસવર્ડ
          </h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
            આ વેબસાઇટ ઍક્સેસ કરવા માટે પાસવર્ડ દાખલ કરો.
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '0.85rem',
            fontWeight: '600',
            marginBottom: '16px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleVerify}>
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              placeholder="પાસવર્ડ દાખલ કરો..."
              value={password}
              onChange={(e) => {
                setError('');
                setPassword(e.target.value);
              }}
              style={{
                width: '100%',
                padding: '14px 45px 14px 16px',
                fontSize: '1.15rem',
                letterSpacing: showPassword ? '2px' : '4px',
                borderRadius: '10px',
                border: error ? '2px solid #ef4444' : '2px solid #cbd5e1',
                outline: 'none',
                boxSizing: 'border-box',
                textAlign: 'center',
                fontWeight: '700',
                backgroundColor: '#fdfdfd',
                transition: 'all 0.2s ease'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '4px',
                color: '#64748b'
              }}
              title={showPassword ? 'પાસવર્ડ છુપાવો' : 'પાસવર્ડ જુઓ'}
            >
              {showPassword ? '👁️' : '🔒'}
            </button>
          </div>

          {/* Quick Touch Keypad for Mobile & Touchscreens */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginBottom: '16px'
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumberClick(num.toString())}
                style={{
                  padding: '10px 0',
                  fontSize: '1.15rem',
                  fontWeight: '700',
                  color: '#1e293b',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.1s'
                }}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              style={{
                padding: '10px 0',
                fontSize: '0.85rem',
                fontWeight: '700',
                color: '#dc2626',
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              સાફ (C)
            </button>
            <button
              type="button"
              onClick={() => handleNumberClick('0')}
              style={{
                padding: '10px 0',
                fontSize: '1.15rem',
                fontWeight: '700',
                color: '#1e293b',
                backgroundColor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              style={{
                padding: '10px 0',
                fontSize: '1.15rem',
                fontWeight: '700',
                color: '#475569',
                backgroundColor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              ⌫
            </button>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '18px',
            fontSize: '0.85rem',
            color: '#475569'
          }}>
            <input
              type="checkbox"
              id="remember_device"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#059669', cursor: 'pointer' }}
            />
            <label htmlFor="remember_device" style={{ cursor: 'pointer', userSelect: 'none' }}>
              આ ડિવાઇસ પર યાદ રાખો (Remember on this device)
            </label>
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              backgroundColor: '#059669',
              color: '#ffffff',
              padding: '14px',
              fontSize: '1.05rem',
              fontWeight: '700',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)',
              transition: 'background-color 0.2s'
            }}
          >
            <span>🔓</span>
            <span>પ્રવેશ કરો (Unlock Website)</span>
          </button>
        </form>

        <div style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '14px', fontSize: '0.78rem', color: '#94a3b8' }}>
          🔒 ફક્ત અધિકૃત સંચાલક / સ્ટાફ માટે સુરક્ષિત પોર્ટલ.
        </div>
      </div>
    </div>
  );
};

export default SiteLock;
