import React from 'react';
import { TrendingUp, TrendingDown, Star } from 'lucide-react';

export default function StockHeader({ stockInfo, isWatchlisted = false, onToggleWatchlist }) {
  if (!stockInfo) return null;

  const isPositive = stockInfo.change >= 0;

  return (
    <div className="glass-card" style={{ padding: '16px 20px' }}>

      {/* Top row: company name + price */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>

        {/* Left: Company info */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              {stockInfo.name}
            </h1>
            <span className="badge badge-nse">{stockInfo.exchange}</span>

            {/* Watchlist Star Toggle */}
            {onToggleWatchlist && (
              <button
                onClick={() => onToggleWatchlist(stockInfo.ticker)}
                title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  background: isWatchlisted ? '#fffbeb' : '#fff',
                  border: isWatchlisted ? '1px solid #fcd34d' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)', padding: '3px 9px',
                  fontSize: '11px', fontWeight: 600,
                  color: isWatchlisted ? '#d97706' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                  fontFamily: 'var(--font-main)'
                }}
                onMouseEnter={e => {
                  if (!isWatchlisted) {
                    e.currentTarget.style.borderColor = '#fcd34d';
                    e.currentTarget.style.color = '#d97706';
                  }
                }}
                onMouseLeave={e => {
                  if (!isWatchlisted) {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }
                }}
              >
                <Star size={13} fill={isWatchlisted ? '#f59e0b' : 'none'} color={isWatchlisted ? '#f59e0b' : 'currentColor'} />
                {isWatchlisted ? 'Saved' : 'Watchlist'}
              </button>
            )}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{stockInfo.ticker}</span>
            <span>·</span>
            <span>{stockInfo.sector}</span>
          </div>
        </div>

        {/* Right: Price */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
            ₹{stockInfo.price.toFixed(2)}
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '4px',
            fontSize: '13px',
            fontWeight: 600,
            color: isPositive ? 'var(--accent-green)' : 'var(--accent-red)',
          }}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {isPositive ? '+' : ''}₹{stockInfo.change.toFixed(2)}&nbsp;
            ({isPositive ? '+' : ''}{stockInfo.change_percent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--border-color)', margin: '12px 0' }} />

      {/* Description */}
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        {stockInfo.description}
      </p>

    </div>
  );
}
