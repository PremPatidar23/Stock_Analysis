const API_BASE_URL = '/api';

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authAPI = {
  register: async ({ name, email, password }) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data; // { user: {...} }
  },

  login: async ({ email, password }) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data; // { user: {...}, watchlist: [...] }
  },
};

// ── Watchlist ─────────────────────────────────────────────────────────────────

export const watchlistAPI = {
  add: async (userId, ticker) => {
    const res = await fetch(`${API_BASE_URL}/watchlist/${userId}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Add failed');
    return data;
  },

  remove: async (userId, ticker) => {
    const res = await fetch(`${API_BASE_URL}/watchlist/${userId}/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Remove failed');
    return data;
  },
};

// ── Stocks ────────────────────────────────────────────────────────────────────

export const stockAPI = {
  searchStocks: async (query) => {
    if (!query || query.trim() === '') return [];
    try {
      const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      return data.results || [];
    } catch (err) {
      console.error('Search API error:', err);
      return [];
    }
  },

  getStockDetail: async (ticker) => {
    const res = await fetch(`${API_BASE_URL}/stocks/${encodeURIComponent(ticker)}`);
    if (!res.ok) throw new Error(`Failed to load ${ticker}`);
    return res.json();
  },

  getWatchlistSummary: async (tickers) => {
    if (!tickers || tickers.length === 0) return [];
    try {
      const res = await fetch(`${API_BASE_URL}/watchlist/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers }),
      });
      if (!res.ok) throw new Error('Watchlist fetch failed');
      const data = await res.json();
      return data.stocks || [];
    } catch (err) {
      console.error('Watchlist summary fetch error:', err);
      return [];
    }
  },
};
