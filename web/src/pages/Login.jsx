import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const { login, loginAsDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err?.message || 'લૉગિન નિષ્ફળ: પાસવર્ડ (44113290) તપાસો.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login">
      <div className="brand">🌱 SHREE NANDINI SEEDS</div>
      <h1 style={{ margin: '4px 0 2px 0', fontSize: '1.4rem' }}>લૉગિન</h1>
      <p className="muted" style={{ margin: 0, fontSize: '0.88rem' }}>
        Seeds Purchase (35 KG • ₹/મણ) • Sales • Stock
      </p>

      {error && <p className="error" style={{ margin: '12px 0 0 0' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <label>
          Email / વપરાશકર્તા
          <input 
            required 
            type="text" 
            placeholder="admin@nandiniseeds.com"
            value={email} 
            onChange={e => setEmail(e.target.value)}
          />
        </label>

        <label>
          સિક્યોરિટી પાસવર્ડ (Security Password)
          <input 
            required 
            type="password" 
            placeholder="પાસવર્ડ દાખલ કરો (44113290)..."
            value={password} 
            onChange={e => setPassword(e.target.value)}
          />
        </label>

        <button type="submit" disabled={loading} style={{ marginTop: '8px' }}>
          {loading ? 'ચકાસણી થઈ રહી છે...' : '🔓 લૉગિન કરો'}
        </button>
      </form>

      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem('krushi_site_access_key');
            sessionStorage.removeItem('krushi_site_access_key');
            window.location.reload();
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#059669',
            fontSize: '0.82rem',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          🔒 સાઇટ સિક્યોરિટી સ્ક્રીન પર જાઓ (Lock)
        </button>
      </div>

      <div style={{ marginTop: '16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#166534', marginBottom: '4px' }}>
          📱 સ્ટાફ / સબ યુઝર એન્ડ્રોઇડ એપ
        </div>
        <p style={{ fontSize: '0.75rem', color: '#15803d', margin: '0 0 8px 0' }}>
          મોબાઇલમાંથી બિલ બનાવવા અને સ્ટોક જોવા APK ઇન્સ્ટોલ કરો.
        </p>
        <a 
          href="/api/download/subuser-apk"
          download="krushi-trade-subuser.apk"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#059669',
            color: '#ffffff',
            padding: '7px 14px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '0.8rem',
            fontWeight: '600'
          }}
        >
          ⬇️ સબ યુઝર એપ ડાઉનલોડ કરો (.apk)
        </a>
      </div>
    </main>
  );
};
export default Login;

