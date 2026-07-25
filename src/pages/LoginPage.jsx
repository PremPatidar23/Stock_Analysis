import React, { useState } from 'react';
import { TrendingUp, Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { authAPI } from '../services/api';

export default function LoginPage({ onLogin, onGoToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) return setError('Please enter your email address.');
    if (!password)     return setError('Please enter your password.');

    setLoading(true);
    try {
      const data = await authAPI.login({ email: email.trim(), password });
      // data = { user: { id, name, email }, watchlist: ['TCS', ...] }
      onLogin(data.user, data.watchlist || []);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px'
    }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
        <div style={{ background: '#0d9e6e', borderRadius: '6px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TrendingUp size={17} color="#fff" strokeWidth={2.5} />
        </div>
        <span style={{ fontWeight: 700, fontSize: '18px', color: '#1a2332' }}>Stock Screener</span>
      </div>

      {/* Card */}
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>

        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Sign in to your account
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
          Track Indian stocks on NSE &amp; BSE
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Error message */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'var(--accent-red-bg)', border: '1px solid #f5c0bb',
              borderRadius: 'var(--radius-sm)', padding: '10px 12px',
              fontSize: '12px', color: 'var(--accent-red)'
            }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
              Email address
            </label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
              padding: '9px 12px', background: '#fff'
            }}>
              <Mail size={14} color="var(--text-muted)" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  border: 'none', outline: 'none', background: 'transparent',
                  fontSize: '13px', color: 'var(--text-primary)', width: '100%',
                  fontFamily: 'var(--font-main)'
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
              Password
            </label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
              padding: '9px 12px', background: '#fff'
            }}>
              <Lock size={14} color="var(--text-muted)" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  border: 'none', outline: 'none', background: 'transparent',
                  fontSize: '13px', color: 'var(--text-primary)', width: '100%',
                  fontFamily: 'var(--font-main)'
                }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '4px',
              background: loading ? '#6bb89e' : '#0d9e6e',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '11px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'background 0.15s',
              fontFamily: 'var(--font-main)'
            }}
          >
            {loading ? 'Signing in...' : <><span>Sign in</span><ArrowRight size={15} /></>}
          </button>

        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Don't have an account?</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        <button
          onClick={onGoToSignup}
          style={{
            width: '100%',
            background: '#fff',
            color: 'var(--accent-blue)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '10px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--font-main)',
            transition: 'border-color 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#1a6fc4'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
          Create a free account
        </button>

      </div>

      <p style={{ marginTop: '20px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
        Data for educational purposes only · Not financial advice
      </p>

    </div>
  );
}
