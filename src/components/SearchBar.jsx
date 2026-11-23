import React, { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, TrendingDown } from 'lucide-react';
import { stockAPI } from '../services/api';

export default function SearchBar({ onSelectTicker, currentTicker }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await stockAPI.searchStocks(query);
        setSuggestions(results);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (ticker) => {
    onSelectTicker(ticker);
    setQuery('');
    setSuggestions([]);
    setIsFocused(false);
  };

  const quickTickers = ['TCS', 'RELIANCE', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'TATAMOTORS', 'ITC', 'WIPRO', 'BHARTIARTL'];

  return (
    <div className="glass-card" style={{ padding: '14px 20px' }}>

      {/* Search input */}
      <div ref={searchContainerRef} style={{ position: 'relative' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: isFocused ? '1px solid #1a6fc4' : '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '7px 12px',
          background: isFocused ? '#fff' : 'var(--bg-primary)',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          boxShadow: isFocused ? '0 0 0 3px rgba(26,111,196,0.1)' : 'none'
        }}>
          <Search size={15} color={isFocused ? '#1a6fc4' : 'var(--text-muted)'} />
          <input
            type="text"
            placeholder="Search company (e.g. Reliance, TCS, HDFC)..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIsFocused(true); }}
            onFocus={() => setIsFocused(true)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '13px',
              width: '100%',
              fontFamily: 'var(--font-main)',
            }}
          />
          {query && (
            <button onClick={() => { setQuery(''); setSuggestions([]); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {isFocused && query.trim().length > 0 && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            zIndex: 300,
            overflow: 'hidden',
            maxHeight: '320px',
            overflowY: 'auto'
          }}>
            {loading ? (
              <div style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>Searching...</div>
            ) : suggestions.length === 0 ? (
              <div style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                No results found for "{query}"
              </div>
            ) : (
              suggestions.map((item, i) => {
                const isPos = item.change >= 0;
                return (
                  <div
                    key={item.ticker}
                    onClick={() => handleSelect(item.ticker)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 16px',
                      cursor: 'pointer',
                      borderBottom: i < suggestions.length - 1 ? '1px solid var(--border-color)' : 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-primary)'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--accent-blue)' }}>{item.ticker}</span>
                        <span style={{ fontSize: '10px', background: '#fff3e0', color: '#e65100', border: '1px solid #ffcc80', borderRadius: '3px', padding: '0 4px' }}>{item.exchange}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{item.name}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        ₹{item.price.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: isPos ? 'var(--accent-green)' : 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                        {isPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {isPos ? '+' : ''}{item.change_percent}%
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Quick ticker pills — screener.in style */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Quick access:</span>
        {quickTickers.map(ticker => (
          <button
            key={ticker}
            onClick={() => onSelectTicker(ticker)}
            style={{
              background: currentTicker === ticker ? '#e8f1fb' : 'var(--bg-tag)',
              color: currentTicker === ticker ? 'var(--accent-blue)' : 'var(--text-secondary)',
              border: currentTicker === ticker ? '1px solid #bdd5f0' : '1px solid var(--border-color)',
              padding: '2px 9px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {ticker}
          </button>
        ))}
      </div>

    </div>
  );
}
