import React, { useState, useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, LogOut, ChevronDown, User } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header style={{
      background: '#fff',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
    }}>
      <div style={{
        maxWidth: '1200px', margin: '0 auto', padding: '0 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px'
      }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ background: '#0d9e6e', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '16px', color: '#1a2332', letterSpacing: '-0.02em' }}>Stock Screener</span>
          <span style={{ fontSize: '10px', fontWeight: 600, background: '#fff3e0', color: '#e65100', border: '1px solid #ffcc80', borderRadius: '3px', padding: '1px 6px', marginLeft: '2px' }}>
            NSE / BSE
          </span>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

          {/* Market indices */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>NIFTY 50</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>24,835.40</span>
              <span style={{ color: 'var(--accent-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                <TrendingUp size={12} /> +0.65%
              </span>
            </div>

            <div style={{ width: '1px', height: '18px', background: 'var(--border-color)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>SENSEX</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>81,332.90</span>
              <span style={{ color: 'var(--accent-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                <TrendingUp size={12} /> +0.58%
              </span>
            </div>
          </div>

          {/* User avatar + dropdown */}
          {user && (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'none', border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)', padding: '4px 10px 4px 6px',
                  cursor: 'pointer', transition: 'border-color 0.15s',
                  fontFamily: 'var(--font-main)'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#1a6fc4'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                {/* Avatar circle */}
                <div style={{
                  width: '26px', height: '26px', borderRadius: '50%',
                  background: '#e8f1fb', color: '#1a6fc4',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: 700
                }}>
                  {initials}
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name}
                </span>
                <ChevronDown size={13} color="var(--text-muted)" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
              </button>

              {/* Dropdown menu */}
              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                  background: '#fff', border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  minWidth: '180px', zIndex: 200, overflow: 'hidden'
                }}>
                  {/* User info header */}
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{user.email}</div>
                  </div>

                  {/* Logout */}
                  <button
                    onClick={() => { setDropdownOpen(false); onLogout(); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 14px', background: 'none', border: 'none',
                      cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                      color: 'var(--accent-red)', fontFamily: 'var(--font-main)',
                      transition: 'background 0.1s', textAlign: 'left'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-red-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <LogOut size={13} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
