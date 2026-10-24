import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sprout, ShieldCheck, User, LogIn, AlertCircle } from 'lucide-react';

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
      setError('લૉગિન નિષ્ફળ: ઈમેલ અથવા પાસવર્ડ ચકાસો.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f1f5f9',
      padding: '1.5rem'
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      }}>
        
        {/* Header */}
        <div style={{
          backgroundColor: '#064e3b',
          color: 'white',
          padding: '2rem 1.5rem',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            marginBottom: '0.75rem'
          }}>
            <Sprout size={34} color="#6ee7b7" />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', letterSpacing: '0.02em' }}>
            કૃષિ ટ્રેડ (Krushi Trade)
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#a7f3d0', marginTop: '0.25rem' }}>
            બિયારણ ખરીદ, વેચાણ, બિલિંગ & સ્ટોક મેનેજમેન્ટ
          </p>
        </div>

        {/* Body Form */}
        <div style={{ padding: '2rem 1.75rem' }}>
          
          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.88rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">ઈમેલ આઈડી (Email ID)</label>
              <input 
                type="email" 
                required 
                className="form-control" 
                placeholder="દા.ત. admin@krushitrade.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">પાસવર્ડ (Password)</label>
              <input 
                type="password" 
                required 
                className="form-control" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}>
              <LogIn size={18} />
              {loading ? 'લૉગિન થઈ રહ્યું છે...' : 'લૉગિન કરો'}
            </button>
          </form>

          {/* Quick Demo Test Buttons */}
          <div style={{ marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
            <p style={{ fontSize: '0.82rem', textAlign: 'center', color: '#64748b', marginBottom: '0.85rem' }}>
              ઝડપી ડેમો પરીક્ષણ માટે નીચે ક્લિક કરો:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', padding: '0.75rem 0.5rem', gap: '0.2rem' }}
                onClick={() => loginAsDemo('admin')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#059669', fontWeight: '700' }}>
                  <ShieldCheck size={16} />
                  Main Admin
                </div>
                <small style={{ fontSize: '0.72rem', color: '#64748b' }}>સંપૂર્ણ કંટ્રોલ</small>
              </button>

              <button 
                type="button" 
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', padding: '0.75rem 0.5rem', gap: '0.2rem' }}
                onClick={() => loginAsDemo('sub_user')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#d97706', fontWeight: '700' }}>
                  <User size={16} />
                  Sub User
                </div>
                <small style={{ fontSize: '0.72rem', color: '#64748b' }}>સ્ટાફ પરવાનગી</small>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
