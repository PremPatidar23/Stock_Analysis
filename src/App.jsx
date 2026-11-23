import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';
import StockHeader from './components/StockHeader';
import PriceChart from './components/PriceChart';
import MetricCards from './components/MetricCards';
import Watchlist from './components/Watchlist';
import FinancialsTable from './components/FinancialsTable';
import AIChatModal from './components/AIChatModal';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { stockAPI, watchlistAPI } from './services/api';

const DEFAULT_WATCHLIST = ['TCS', 'RELIANCE', 'TATAMOTORS', 'INFY'];

export default function App() {
  const [page, setPage] = useState('login'); // 'login' | 'signup' | 'app'
  const [user, setUser] = useState(null);

  const [currentTicker, setCurrentTicker] = useState('TCS');
  const [stockData, setStockData]         = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');

  // Watchlist
  const [watchlistTickers, setWatchlistTickers] = useState(DEFAULT_WATCHLIST);
  const [watchlistData, setWatchlistData]       = useState([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  // Restore session on load
  useEffect(() => {
    const session = localStorage.getItem('bp_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        // parsed = { user: {...}, watchlist: [...] }
        setUser(parsed.user);
        setWatchlistTickers(parsed.watchlist?.length ? parsed.watchlist : DEFAULT_WATCHLIST);
        setPage('app');
      } catch {
        localStorage.removeItem('bp_session');
      }
    }
  }, []);

  // Load stock data whenever ticker changes
  useEffect(() => {
    if (page !== 'app') return;
    loadStock(currentTicker);
  }, [currentTicker, page]);

  // Load watchlist summaries when watchlist tickers change or app opens
  useEffect(() => {
    if (page !== 'app') return;
    loadWatchlistSummary();
  }, [watchlistTickers, page]);

  const loadStock = async (ticker) => {
    setLoading(true);
    setError('');
    try {
      const data = await stockAPI.getStockDetail(ticker);
      setStockData(data);
    } catch (err) {
      setError(`Could not load ${ticker}. Please select another stock.`);
    } finally {
      setLoading(false);
    }
  };

  const loadWatchlistSummary = async () => {
    if (watchlistTickers.length === 0) { setWatchlistData([]); return; }
    setWatchlistLoading(true);
    try {
      const summaries = await stockAPI.getWatchlistSummary(watchlistTickers);
      setWatchlistData(summaries);
    } catch (err) {
      console.error('Watchlist summary load error:', err);
    } finally {
      setWatchlistLoading(false);
    }
  };

  // Add or remove from watchlist — syncs to DB and updates local state
  const handleToggleWatchlist = async (ticker) => {
    const t = ticker.toUpperCase();
    const isIn = watchlistTickers.includes(t);
    const updated = isIn
      ? watchlistTickers.filter(x => x !== t)
      : [...watchlistTickers, t];

    setWatchlistTickers(updated);
    saveSession(user, updated);

    if (user?.id) {
      try {
        if (isIn) await watchlistAPI.remove(user.id, t);
        else       await watchlistAPI.add(user.id, t);
      } catch (err) {
        console.error('Watchlist sync error:', err);
      }
    }
  };

  const handleRemoveFromWatchlist = async (ticker) => {
    const t = ticker.toUpperCase();
    const updated = watchlistTickers.filter(x => x !== t);
    setWatchlistTickers(updated);
    saveSession(user, updated);

    if (user?.id) {
      try { await watchlistAPI.remove(user.id, t); }
      catch (err) { console.error('Watchlist remove error:', err); }
    }
  };

  const saveSession = (u, wl) => {
    try { localStorage.setItem('bp_session', JSON.stringify({ user: u, watchlist: wl })); }
    catch (e) { console.error('Session save error:', e); }
  };

  // onLogin receives user object + watchlist array from backend
  const handleLogin = (userData, watchlist) => {
    const wl = watchlist?.length ? watchlist : DEFAULT_WATCHLIST;
    setUser(userData);
    setWatchlistTickers(wl);
    saveSession(userData, wl);
    setPage('app');
  };

  const handleLogout = () => {
    localStorage.removeItem('bp_session');
    setUser(null);
    setWatchlistTickers(DEFAULT_WATCHLIST);
    setPage('login');
    setStockData(null);
  };

  if (page === 'login') {
    return <LoginPage onLogin={handleLogin} onGoToSignup={() => setPage('signup')} />;
  }

  if (page === 'signup') {
    return <SignupPage onSignup={handleLogin} onGoToLogin={() => setPage('login')} />;
  }

  const isCurrentWatchlisted = stockData?.stock
    ? watchlistTickers.includes(stockData.stock.ticker.toUpperCase())
    : false;

  return (
    <div className="app-container">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="main-content">

        <SearchBar
          onSelectTicker={setCurrentTicker}
          currentTicker={currentTicker}
        />

        {loading ? (
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            Loading {currentTicker} data...
          </div>
        ) : error ? (
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--accent-red)', fontSize: '13px' }}>
            {error}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
            <StockHeader
              stockInfo={stockData?.stock}
              isWatchlisted={isCurrentWatchlisted}
              onToggleWatchlist={handleToggleWatchlist}
            />

            <div className="dashboard-grid">
              <PriceChart stockData={stockData} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <MetricCards stockInfo={stockData?.stock} />
                <Watchlist
                  watchlistItems={watchlistData}
                  currentTicker={currentTicker}
                  onSelectTicker={setCurrentTicker}
                  onRemoveFromWatchlist={handleRemoveFromWatchlist}
                  onRefresh={loadWatchlistSummary}
                  loading={watchlistLoading}
                />
              </div>
            </div>

            {/* Screener Site 3-Year Financials & Growth Analysis Table */}
            <FinancialsTable financials={stockData?.financials} />
          </div>
        )}

      </main>

      {/* Floating AI Stock Research Copilot */}
      <AIChatModal
        currentTicker={currentTicker}
        stockInfo={stockData?.stock}
        financials={stockData?.financials}
      />
    </div>
  );
}
