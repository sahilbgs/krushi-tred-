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
      setError('લૉગિન નિષ્ફળ: Email/Password અને Firebase Authentication તપાસો.');
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
          Email
          <input 
            required 
            type="email" 
            placeholder="admin@nandiniseeds.com"
            value={email} 
            onChange={e => setEmail(e.target.value)}
          />
        </label>

        <label>
          Password
          <input 
            required 
            type="password" 
            placeholder="••••••••"
            value={password} 
            onChange={e => setPassword(e.target.value)}
          />
        </label>

        <button type="submit" disabled={loading} style={{ marginTop: '8px' }}>
          {loading ? 'લૉગિન થઈ રહ્યું છે...' : 'લૉગિન કરો'}
        </button>
      </form>

      <div style={{ marginTop: '20px', borderTop: '1px solid #d1d5db', paddingTop: '16px' }}>
        <p className="muted" style={{ textAlign: 'center', fontSize: '0.8rem', marginBottom: '10px' }}>
          ઝડપી ડેમો પરીક્ષણ:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button 
            type="button" 
            className="secondary"
            style={{ fontSize: '0.82rem', padding: '8px 6px', textAlign: 'center' }}
            onClick={() => loginAsDemo('admin')}>
            <b>Ravi Chaudhary</b>
            <div style={{ fontSize: '0.72rem', color: '#15803d' }}>Main Admin</div>
          </button>

          <button 
            type="button" 
            className="secondary"
            style={{ fontSize: '0.82rem', padding: '8px 6px', textAlign: 'center' }}
            onClick={() => loginAsDemo('sub_user')}>
            <b>Bhargav Chaudhary</b>
            <div style={{ fontSize: '0.72rem', color: '#b45309' }}>Sub User</div>
          </button>
        </div>
      </div>
    </main>
  );
};
export default Login;

