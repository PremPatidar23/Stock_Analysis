import React, { useState } from 'react';

export default function PriceChart({ stockData }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!stockData || !stockData.candles || stockData.candles.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
        Loading chart data...
      </div>
    );
  }

  const candles      = stockData.candles;
  const closePrices  = candles.map(c => c.close);

  const minPrice = Math.min(...closePrices) * 0.99;
  const maxPrice = Math.max(...closePrices) * 1.01;

  const svgWidth   = 760;
  const svgHeight  = 280;
  const padLeft    = 60;
  const padRight   = 16;
  const padTop     = 16;
  const padBottom  = 32;
  const chartW     = svgWidth - padLeft - padRight;
  const chartH     = svgHeight - padTop - padBottom;

  const getX = (index) => {
    if (candles.length <= 1) return padLeft;
    return padLeft + (index / (candles.length - 1)) * chartW;
  };

  const getY = (price) =>
    padTop + (1 - (price - minPrice) / (maxPrice - minPrice)) * chartH;

  const isUp       = closePrices[closePrices.length - 1] >= closePrices[0];
  const lineColor  = isUp ? '#0d9e6e' : '#d93025';

  const pricePoints = closePrices.map((p, i) => `${getX(i)},${getY(p)}`).join(' ');
  const areaPath    = `${getX(0)},${svgHeight - padBottom} ${pricePoints} ${getX(closePrices.length - 1)},${svgHeight - padBottom}`;

  const yLabels = [0, 0.25, 0.5, 0.75, 1].map(r => ({
    y:     padTop + r * chartH,
    value: maxPrice - r * (maxPrice - minPrice)
  }));

  return (
    <div className="glass-card" style={{ padding: '16px 20px' }}>

      {/* Header */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '2px solid #0d9e6e', paddingBottom: '6px', display: 'inline-block' }}>
          Price Chart (30 Days)
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Daily closing price in ₹ · Hover to inspect
        </div>
      </div>

      {/* Hover data bar */}
      <div style={{ height: '28px', display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', marginBottom: '8px', padding: '0 4px' }}>
        {hoveredPoint ? (
          <>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{hoveredPoint.candle.date}</span>
            <span>
              <span style={{ color: 'var(--text-muted)' }}>Close: </span>
              <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                ₹{hoveredPoint.candle.close.toFixed(2)}
              </span>
            </span>
            <span style={{
              fontSize: '11px', fontWeight: 600, padding: '1px 7px', borderRadius: '3px',
              background: hoveredPoint.candle.close >= hoveredPoint.candle.open ? '#e8f8f3' : '#fdecea',
              color:      hoveredPoint.candle.close >= hoveredPoint.candle.open ? '#0d9e6e' : '#d93025'
            }}>
              {hoveredPoint.candle.close >= hoveredPoint.candle.open ? '▲' : '▼'}&nbsp;
              {Math.abs(((hoveredPoint.candle.close - hoveredPoint.candle.open) / hoveredPoint.candle.open) * 100).toFixed(2)}%
            </span>
          </>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Hover over chart to see price</span>
        )}
      </div>

      {/* SVG Chart */}
      <div style={{ width: '100%', position: 'relative' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: 'auto', overflow: 'visible' }}
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={lineColor} stopOpacity="0.18" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid + Y-axis labels */}
          {yLabels.map((tick, i) => (
            <g key={i}>
              <line x1={padLeft} y1={tick.y} x2={svgWidth - padRight} y2={tick.y} stroke="#e0e6ed" strokeWidth="1" />
              <text x={padLeft - 6} y={tick.y + 4} fill="#9aabb8" fontSize="10" textAnchor="end" fontFamily="Courier New, monospace">
                {tick.value >= 1000 ? `${(tick.value / 1000).toFixed(1)}k` : tick.value.toFixed(0)}
              </text>
            </g>
          ))}

          {/* X-axis dates */}
          {candles.map((c, i) => {
            if (i % 7 === 0 || i === candles.length - 1) {
              return (
                <text key={i} x={getX(i)} y={svgHeight - 6} fill="#9aabb8" fontSize="10" textAnchor="middle">
                  {c.date}
                </text>
              );
            }
            return null;
          })}

          {/* Area fill */}
          <polygon points={areaPath} fill="url(#areaGrad)" />

          {/* Price line */}
          <polyline fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pricePoints} />

          {/* Hover crosshair + dot */}
          {hoveredPoint && (
            <>
              <line
                x1={hoveredPoint.x} y1={padTop}
                x2={hoveredPoint.x} y2={svgHeight - padBottom}
                stroke="#c9d3df" strokeWidth="1" strokeDasharray="3 3"
              />
              <circle
                cx={hoveredPoint.x} cy={getY(hoveredPoint.candle.close)}
                r="4" fill={lineColor} stroke="#fff" strokeWidth="2"
              />
            </>
          )}

          {/* Invisible hover zones */}
          {candles.map((c, i) => (
            <rect
              key={`h-${i}`}
              x={getX(i) - (chartW / candles.length) / 2}
              y={0}
              width={chartW / candles.length}
              height={svgHeight}
              fill="transparent"
              style={{ cursor: 'crosshair' }}
              onMouseEnter={() => setHoveredPoint({ candle: c, index: i, x: getX(i), y: getY(c.close) })}
            />
          ))}
        </svg>
      </div>

    </div>
  );
}
