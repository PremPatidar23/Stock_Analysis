import React from 'react';
import { Star, TrendingUp, TrendingDown, Trash2, Bookmark, RefreshCw } from 'lucide-react';

export default function Watchlist({
  watchlistItems = [],
  currentTicker,
  onSelectTicker,
  onRemoveFromWatchlist,
  onRefresh,
  loading = false
}) {
  return (
    <div className="glass-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Star size={16} fill="#f59e0b" color="#f59e0b" />
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Watchlist
          </h3>
          <span style={{
            fontSize: '11px', fontWeight: 600,
            background: 'var(--bg-tag)', color: 'var(--text-secondary)',
            padding: '1px 7px', borderRadius: '12px'
          }}>
            {watchlistItems.length}
          </span>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh Watchlist Prices"
            style={{
              background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
              padding: '4px', borderRadius: 'var(--radius-sm)', transition: 'color 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-blue)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <RefreshCw size={13} className={loading ? 'spin-anim' : ''} />
          </button>
        )}
      </div>

      {/* Item list */}
      {watchlistItems.length === 0 ? (
        <div style={{
          padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)',
          fontSize: '12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-color)'
        }}>
          <Bookmark size={24} color="var(--border-strong)" style={{ marginBottom: '8px', opacity: 0.7 }} />
          <div>Your watchlist is empty</div>
          <div style={{ fontSize: '11px', marginTop: '4px', color: 'var(--text-label)' }}>
            Click the <Star size={11} fill="#f59e0b" color="#f59e0b" style={{ display: 'inline', verticalAlign: 'middle' }} /> icon on any stock header to save it here
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '420px', overflowY: 'auto' }}>
          {watchlistItems.map((item) => {
            const isSelected = currentTicker?.toUpperCase() === item.ticker.toUpperCase();
            const isUp = item.change >= 0;

            return (
              <div
                key={item.ticker}
                onClick={() => onSelectTicker(item.ticker)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--accent-blue-bg)' : '#fff',
                  border: isSelected ? '1px solid #bdd5f0' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)';
                }}
                onMouseLeave={e => {
                  if (!isSelected) e.currentTarget.style.background = '#fff';
                }}
              >
                {/* Left: Ticker & Name */}
                <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontWeight: 700, fontSize: '13px',
                      color: isSelected ? 'var(--accent-blue)' : 'var(--text-primary)'
                    }}>
                      {item.ticker}
                    </span>
                    <span className="badge badge-nse" style={{ fontSize: '9px', padding: '0 4px' }}>
                      {item.exchange || 'NSE'}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '11px', color: 'var(--text-muted)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    marginTop: '2px'
                  }}>
                    {item.name}
                  </div>
                </div>

                {/* Right: Price & Change */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '13px', fontWeight: 700,
                      fontFamily: 'var(--font-mono)', color: 'var(--text-primary)'
                    }}>
                      ₹{item.price > 0 ? item.price.toFixed(2) : '--'}
                    </div>
                    <div style={{
                      fontSize: '11px', fontWeight: 600,
                      color: isUp ? 'var(--accent-green)' : 'var(--accent-red)',
                      display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px'
                    }}>
                      {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {isUp ? '+' : ''}{item.change_percent ? item.change_percent.toFixed(2) : '0.00'}%
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFromWatchlist(item.ticker);
                    }}
                    title={`Remove ${item.ticker} from Watchlist`}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', padding: '4px',
                      borderRadius: 'var(--radius-sm)', display: 'flex',
                      transition: 'color 0.15s, background 0.15s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = 'var(--accent-red)';
                      e.currentTarget.style.background = 'var(--accent-red-bg)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = 'var(--text-muted)';
                      e.currentTarget.style.background = 'none';
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
