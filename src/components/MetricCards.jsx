import React from 'react';

export default function MetricCards({ stockInfo }) {
  if (!stockInfo) return null;

  const peRatio = stockInfo.pe_ratio;
  const roe = stockInfo.roe;

  const getPELabel = (pe) => {
    if (typeof pe !== 'number') return null;
    if (pe < 15) return { text: 'Undervalued', color: 'var(--accent-green)' };
    if (pe <= 35) return { text: 'Fair Value', color: '#1a6fc4' };
    return { text: 'High Premium', color: '#e65100' };
  };

  const getROELabel = (r) => {
    if (typeof r !== 'number') return null;
    if (r >= 20) return { text: 'Excellent', color: 'var(--accent-green)' };
    if (r >= 15) return { text: 'Good', color: '#1a6fc4' };
    return { text: 'Moderate', color: '#e65100' };
  };

  const peLabel = getPELabel(peRatio);
  const roeLabel = getROELabel(roe);

  const rows = [
    { label: 'Market Cap', value: stockInfo.market_cap },
    { label: 'P/E Ratio', value: typeof peRatio === 'number' ? peRatio.toFixed(1) : 'N/A', tag: peLabel },
    { label: 'ROE', value: typeof roe === 'number' ? `${roe.toFixed(1)}%` : 'N/A', tag: roeLabel },
    { label: '52W High', value: `₹${stockInfo.high_52w}` },
    { label: '52W Low', value: `₹${stockInfo.low_52w}` },
    { label: 'Exchange', value: stockInfo.exchange },
  ];

  return (
    <div className="glass-card" style={{ padding: '16px 20px' }}>

      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', borderBottom: '2px solid #0d9e6e', paddingBottom: '8px', display: 'inline-block' }}>
        Key Metrics
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
              <td style={{ padding: '9px 0', fontSize: '12px', color: 'var(--text-secondary)', width: '50%' }}>
                {row.label}
              </td>
              <td style={{ padding: '9px 0', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                <span>{row.value}</span>
                {row.tag && (
                  <span style={{ marginLeft: '6px', fontSize: '10px', fontWeight: 600, color: row.tag.color, fontFamily: 'var(--font-main)' }}>
                    {row.tag.text}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Explanation notes */}
      <div style={{ marginTop: '14px', padding: '10px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
        <strong style={{ color: 'var(--text-secondary)' }}>P/E Ratio:</strong> Price relative to earnings. Lower = cheaper valuation.<br />
        <strong style={{ color: 'var(--text-secondary)' }}>ROE:</strong> How efficiently management uses equity. Higher = better.
      </div>

    </div>
  );
}
