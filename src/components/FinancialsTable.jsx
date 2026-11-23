import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Percent, BarChart3, HelpCircle } from 'lucide-react';

export default function FinancialsTable({ financials }) {
  const [viewMode, setViewMode] = useState('detailed'); // 'detailed' | 'growth_only'

  if (!financials || !financials.metrics) return null;

  const { years, metrics, summary } = financials;
  const rev = metrics.revenue;
  const net = metrics.net_profit;
  const npm = metrics.net_profit_margin;

  // Helper for formatting ₹ Cr with commas
  const formatCr = (num) => {
    if (typeof num !== 'number' || isNaN(num)) return 'N/A';
    return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr`;
  };

  // Helper for formatting percentage badge
  const renderBadge = (val, isPts = false, suffix = '%') => {
    if (val === null || val === undefined) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
    const isPos = val >= 0;
    const sign = isPos ? '+' : '';
    const color = isPos ? 'var(--accent-green)' : 'var(--accent-red)';
    const bg = isPos ? 'var(--accent-green-bg)' : 'var(--accent-red-bg)';
    const border = isPos ? '#a7e8d4' : '#f5c0bb';

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '2px',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 600,
          color,
          background: bg,
          border: `1px solid ${border}`,
          fontFamily: 'var(--font-mono)',
        }}
      >
        {isPos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
        {sign}{val.toFixed(2)}{suffix} {isPts ? 'pts' : ''}
      </span>
    );
  };

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '20px', marginTop: '16px' }}>
      
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Profit & Loss (3-Year Screener Analysis)
            </h3>
            <span className="badge badge-nse" style={{ fontSize: '10px' }}>
              Consolidated • ₹ Crores
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Historical 3-year performance, sales growth, and net profit margin progression
          </p>
        </div>

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', background: 'var(--bg-primary)', padding: '3px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setViewMode('detailed')}
            style={{
              border: 'none',
              background: viewMode === 'detailed' ? 'var(--bg-white)' : 'transparent',
              color: viewMode === 'detailed' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: viewMode === 'detailed' ? 'var(--shadow-sm)' : 'none',
              borderRadius: '4px',
              padding: '5px 10px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Values & % Change
          </button>
          <button
            onClick={() => setViewMode('growth_only')}
            style={{
              border: 'none',
              background: viewMode === 'growth_only' ? 'var(--bg-white)' : 'transparent',
              color: viewMode === 'growth_only' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: viewMode === 'growth_only' ? 'var(--shadow-sm)' : 'none',
              borderRadius: '4px',
              padding: '5px 10px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Growth % Only
          </button>
        </div>
      </div>

      {/* ── Screener Signature Compounded Growth Cards ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}
      >
        {/* Card 1: Sales / Revenue */}
        <div
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '12px 14px',
            position: 'relative'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Compounded Sales Growth
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: summary.sales_3y_change_pct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {summary.sales_3y_change_pct >= 0 ? '+' : ''}{summary.sales_3y_change_pct.toFixed(1)}%
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              (3-Yr Change)
            </span>
          </div>
          <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '10px' }}>
            {summary.sales_3y_cagr !== null && (
              <span>CAGR: <strong style={{ color: 'var(--text-secondary)' }}>{summary.sales_3y_cagr.toFixed(1)}% / yr</strong></span>
            )}
            <span>Latest YoY: <strong style={{ color: 'var(--text-secondary)' }}>{rev.yoy_changes[rev.yoy_changes.length - 1] >= 0 ? '+' : ''}{rev.yoy_changes[rev.yoy_changes.length - 1]}%</strong></span>
          </div>
        </div>

        {/* Card 2: Net Profit Growth */}
        <div
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '12px 14px',
            position: 'relative'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Compounded Profit Growth
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: summary.profit_3y_change_pct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {summary.profit_3y_change_pct >= 0 ? '+' : ''}{summary.profit_3y_change_pct.toFixed(1)}%
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              (3-Yr Change)
            </span>
          </div>
          <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '10px' }}>
            {summary.profit_3y_cagr !== null && (
              <span>CAGR: <strong style={{ color: 'var(--text-secondary)' }}>{summary.profit_3y_cagr.toFixed(1)}% / yr</strong></span>
            )}
            <span>Latest YoY: <strong style={{ color: 'var(--text-secondary)' }}>{net.yoy_changes[net.yoy_changes.length - 1] >= 0 ? '+' : ''}{net.yoy_changes[net.yoy_changes.length - 1]}%</strong></span>
          </div>
        </div>

        {/* Card 3: Net Profit Margin (NPM) Change */}
        <div
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '12px 14px',
            position: 'relative'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Net Profit Margin (NPM) Change
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: summary.npm_3y_change_pct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {summary.npm_3y_change_pct >= 0 ? '+' : ''}{summary.npm_3y_change_pct.toFixed(2)}%
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              ({summary.npm_3y_change_pts >= 0 ? '+' : ''}{summary.npm_3y_change_pts.toFixed(2)}% pts)
            </span>
          </div>
          <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '10px' }}>
            <span>Latest NPM: <strong style={{ color: 'var(--text-secondary)' }}>{summary.npm_latest.toFixed(2)}%</strong></span>
            <span>3-Yr Base: <strong style={{ color: 'var(--text-secondary)' }}>{npm.values[0].toFixed(2)}%</strong></span>
          </div>
        </div>
      </div>

      {/* ── Screener Financials Table ── */}
      <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '680px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', width: '25%' }}>
                Financial Metric
              </th>
              {years.map((year, i) => (
                <th key={i} style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>
                  {year}
                </th>
              ))}
              <th
                style={{
                  padding: '10px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--accent-blue)',
                  textAlign: 'right',
                  background: 'var(--accent-blue-bg)',
                  borderLeft: '1px solid var(--border-color)'
                }}
              >
                3-Year Total Change
              </th>
              <th
                style={{
                  padding: '10px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  textAlign: 'right',
                  background: 'rgba(0, 0, 0, 0.02)'
                }}
              >
                3-Yr CAGR
              </th>
            </tr>
          </thead>
          <tbody>

            {/* ── ROW 1: Sales / Revenue ── */}
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '12px 14px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BarChart3 size={14} color="#1a6fc4" />
                  <span>Sales / Revenue</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '20px' }}>
                  Total operating revenue (₹ Cr)
                </div>
              </td>

              {years.map((year, i) => (
                <td key={i} style={{ padding: '12px 12px', textAlign: 'right', verticalAlign: 'middle' }}>
                  {viewMode === 'detailed' ? (
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        {formatCr(rev.values[i])}
                      </div>
                      <div style={{ marginTop: '3px' }}>
                        {i === 0 ? (
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Base Year</span>
                        ) : (
                          renderBadge(rev.yoy_changes[i])
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      {i === 0 ? (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Base</span>
                      ) : (
                        renderBadge(rev.yoy_changes[i])
                      )}
                    </div>
                  )}
                </td>
              ))}

              {/* 3-Year Change in Sales / Revenue */}
              <td
                style={{
                  padding: '12px 14px',
                  textAlign: 'right',
                  verticalAlign: 'middle',
                  background: 'var(--accent-blue-bg)',
                  borderLeft: '1px solid var(--border-color)'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: rev.three_year_change_pct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {rev.three_year_change_pct >= 0 ? '+' : ''}{rev.three_year_change_pct.toFixed(2)}%
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                  3-Yr Total Growth
                </div>
              </td>

              {/* 3-Year CAGR */}
              <td style={{ padding: '12px 14px', textAlign: 'right', verticalAlign: 'middle', background: 'rgba(0, 0, 0, 0.02)' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {rev.three_year_cagr !== null ? `${rev.three_year_cagr.toFixed(2)}%` : 'N/A'}
                </span>
              </td>
            </tr>

            {/* ── ROW 2: Net Profit ── */}
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-white)' }}>
              <td style={{ padding: '12px 14px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={14} color="#0d9e6e" />
                  <span>Net Profit (PAT)</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '20px' }}>
                  Profit after taxes (₹ Cr)
                </div>
              </td>

              {years.map((year, i) => (
                <td key={i} style={{ padding: '12px 12px', textAlign: 'right', verticalAlign: 'middle' }}>
                  {viewMode === 'detailed' ? (
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: net.values[i] >= 0 ? 'var(--text-primary)' : 'var(--accent-red)' }}>
                        {formatCr(net.values[i])}
                      </div>
                      <div style={{ marginTop: '3px' }}>
                        {i === 0 ? (
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Base Year</span>
                        ) : (
                          renderBadge(net.yoy_changes[i])
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      {i === 0 ? (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Base</span>
                      ) : (
                        renderBadge(net.yoy_changes[i])
                      )}
                    </div>
                  )}
                </td>
              ))}

              {/* 3-Year Change in Net Profit */}
              <td
                style={{
                  padding: '12px 14px',
                  textAlign: 'right',
                  verticalAlign: 'middle',
                  background: 'var(--accent-blue-bg)',
                  borderLeft: '1px solid var(--border-color)'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: net.three_year_change_pct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {net.three_year_change_pct >= 0 ? '+' : ''}{net.three_year_change_pct.toFixed(2)}%
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                  3-Yr Total Profit
                </div>
              </td>

              {/* 3-Year Profit CAGR */}
              <td style={{ padding: '12px 14px', textAlign: 'right', verticalAlign: 'middle', background: 'rgba(0, 0, 0, 0.02)' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {net.three_year_cagr !== null ? `${net.three_year_cagr.toFixed(2)}%` : 'N/A'}
                </span>
              </td>
            </tr>

            {/* ── ROW 3: Net Profit Margin (%) ── */}
            <tr style={{ background: 'var(--bg-white)' }}>
              <td style={{ padding: '12px 14px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Percent size={14} color="#e65100" />
                  <span>Net Profit Margin (NPM %)</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '20px' }}>
                  Net Profit ÷ Revenue × 100
                </div>
              </td>

              {years.map((year, i) => (
                <td key={i} style={{ padding: '12px 12px', textAlign: 'right', verticalAlign: 'middle' }}>
                  {viewMode === 'detailed' ? (
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: npm.values[i] >= 0 ? 'var(--text-primary)' : 'var(--accent-red)' }}>
                        {npm.values[i].toFixed(2)}%
                      </div>
                      <div style={{ marginTop: '3px' }}>
                        {i === 0 ? (
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Base Year</span>
                        ) : (
                          renderBadge(npm.yoy_change_pts[i], true)
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      {i === 0 ? (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Base</span>
                      ) : (
                        renderBadge(npm.yoy_change_pts[i], true)
                      )}
                    </div>
                  )}
                </td>
              ))}

              {/* Previous 3-Year Change in Net Profit Margin */}
              <td
                style={{
                  padding: '12px 14px',
                  textAlign: 'right',
                  verticalAlign: 'middle',
                  background: 'var(--accent-blue-bg)',
                  borderLeft: '1px solid var(--border-color)'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: npm.three_year_change_pct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {npm.three_year_change_pct >= 0 ? '+' : ''}{npm.three_year_change_pct.toFixed(2)}%
                </div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: npm.three_year_change_pts >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  ({npm.three_year_change_pts >= 0 ? '+' : ''}{npm.three_year_change_pts.toFixed(2)}% pts)
                </div>
              </td>

              {/* Margin Trend */}
              <td style={{ padding: '12px 14px', textAlign: 'right', verticalAlign: 'middle', background: 'rgba(0, 0, 0, 0.02)' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {summary.npm_latest >= npm.values[0] ? 'Expanding' : 'Compressing'}
                </span>
              </td>
            </tr>

          </tbody>
        </table>
      </div>

      {/* ── Screener Formula Footnote ── */}
      <div
        style={{
          marginTop: '12px',
          padding: '8px 12px',
          background: 'var(--bg-primary)',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          color: 'var(--text-muted)'
        }}
      >
        <HelpCircle size={13} style={{ flexShrink: 0, color: 'var(--text-secondary)' }} />
        <span>
          <strong>Screener Formula Reference:</strong> 3-Year Sales & Revenue % Change = ((Latest Sales - Base Sales) / Base Sales) × 100.
          NPM Change % reflects relative growth, with percentage point difference in parentheses.
        </span>
      </div>

    </div>
  );
}
