import yfinance as yf
import pandas as pd
import time

# ─────────────────────────────────────────────────────────────
#  Static metadata — name, sector, description for each stock
#  Live price, P/E, ROE, 52W etc. are fetched from yfinance
# ─────────────────────────────────────────────────────────────
STOCKS_METADATA = {
    "TCS": {
        "ticker": "TCS",
        "yf_ticker": "TCS.NS",
        "name": "Tata Consultancy Services Ltd.",
        "exchange": "NSE",
        "sector": "Information Technology",
        "description": "Tata Consultancy Services is an Indian multinational IT services and consulting company headquartered in Mumbai. It is a subsidiary of the Tata Group and operates in 150+ locations across 46 countries."
    },
    "TATAMOTORS": {
        "ticker": "TATAMOTORS",
        "yf_ticker": "TATAMOTORS.NS",
        "name": "Tata Motors Limited",
        "exchange": "NSE",
        "sector": "Automotive / EV",
        "description": "Tata Motors is a leading global automobile manufacturer of cars, utility vehicles, buses, trucks, and defence vehicles. It also owns Jaguar Land Rover."
    },
    "RELIANCE": {
        "ticker": "RELIANCE",
        "yf_ticker": "RELIANCE.NS",
        "name": "Reliance Industries Limited",
        "exchange": "NSE",
        "sector": "Energy & Retail & Telecom",
        "description": "Reliance Industries is India's largest company by market cap with businesses across energy, petrochemicals, retail (Reliance Retail), and telecommunications (Jio)."
    },
    "INFY": {
        "ticker": "INFY",
        "yf_ticker": "INFY.NS",
        "name": "Infosys Limited",
        "exchange": "NSE",
        "sector": "Information Technology",
        "description": "Infosys is a global leader in next-generation digital services and consulting, enabling clients across 56 countries to navigate their digital transformation."
    },
    "HDFCBANK": {
        "ticker": "HDFCBANK",
        "yf_ticker": "HDFCBANK.NS",
        "name": "HDFC Bank Limited",
        "exchange": "NSE",
        "sector": "Banking & Financials",
        "description": "HDFC Bank is India's largest private sector bank by assets and market cap. It offers a wide range of banking and financial services to individuals and businesses."
    },
    "ICICIBANK": {
        "ticker": "ICICIBANK",
        "yf_ticker": "ICICIBANK.NS",
        "name": "ICICI Bank Limited",
        "exchange": "NSE",
        "sector": "Banking & Financials",
        "description": "ICICI Bank is a leading private sector bank in India offering a wide range of banking products and financial services to corporate and retail customers."
    },
    "WIPRO": {
        "ticker": "WIPRO",
        "yf_ticker": "WIPRO.NS",
        "name": "Wipro Limited",
        "exchange": "NSE",
        "sector": "Information Technology",
        "description": "Wipro is a leading global IT, consulting, and business process services company. It provides technology solutions across industries in over 65 countries."
    },
    "SBIN": {
        "ticker": "SBIN",
        "yf_ticker": "SBIN.NS",
        "name": "State Bank of India",
        "exchange": "NSE",
        "sector": "Public Sector Banking",
        "description": "State Bank of India (SBI) is India's largest public sector bank and a Fortune 500 company. It has a network of over 22,000 branches and 60,000+ ATMs."
    },
    "BHARTIARTL": {
        "ticker": "BHARTIARTL",
        "yf_ticker": "BHARTIARTL.NS",
        "name": "Bharti Airtel Limited",
        "exchange": "NSE",
        "sector": "Telecommunications",
        "description": "Bharti Airtel is a leading global telecom company with operations in 18 countries across Asia and Africa. It is India's second-largest mobile network operator."
    },
    "ITC": {
        "ticker": "ITC",
        "yf_ticker": "ITC.NS",
        "name": "ITC Limited",
        "exchange": "NSE",
        "sector": "FMCG & Hotels & Paper",
        "description": "ITC is an Indian multi-business enterprise with a presence in FMCG (cigarettes, foods, personal care), Hotels, Paperboards, Agri Business and IT."
    },
    "HINDUNILVR": {
        "ticker": "HINDUNILVR",
        "yf_ticker": "HINDUNILVR.NS",
        "name": "Hindustan Unilever Limited",
        "exchange": "NSE",
        "sector": "FMCG",
        "description": "Hindustan Unilever is India's largest FMCG company with iconic brands like Surf Excel, Dove, Lux, Knorr, Lipton and Brooke Bond."
    },
    "AXISBANK": {
        "ticker": "AXISBANK",
        "yf_ticker": "AXISBANK.NS",
        "name": "Axis Bank Limited",
        "exchange": "NSE",
        "sector": "Banking & Financials",
        "description": "Axis Bank is the third largest private sector bank in India, offering retail, corporate, and investment banking services across 4,900+ branches."
    },
    "MARUTI": {
        "ticker": "MARUTI",
        "yf_ticker": "MARUTI.NS",
        "name": "Maruti Suzuki India Limited",
        "exchange": "NSE",
        "sector": "Automotive",
        "description": "Maruti Suzuki is India's largest car manufacturer with a market share of over 40%. It is a subsidiary of Suzuki Motor Corporation of Japan."
    },
    "LT": {
        "ticker": "LT",
        "yf_ticker": "LT.NS",
        "name": "Larsen & Toubro Limited",
        "exchange": "NSE",
        "sector": "Infrastructure & Engineering",
        "description": "Larsen & Toubro is a major Indian multinational engaged in technology, engineering, construction, manufacturing and financial services."
    },
    "SUNPHARMA": {
        "ticker": "SUNPHARMA",
        "yf_ticker": "SUNPHARMA.NS",
        "name": "Sun Pharmaceutical Industries Ltd.",
        "exchange": "NSE",
        "sector": "Pharmaceuticals",
        "description": "Sun Pharma is the largest pharmaceutical company in India and the fourth largest specialty generic pharma company in the world."
    },
}

INDIAN_STOCKS_DB = STOCKS_METADATA

# ─────────────────────────────────────────────────────────────
#  Simple in-memory cache with 5-minute TTL
# ─────────────────────────────────────────────────────────────
_cache = {}
_CACHE_TTL = 300  # seconds


def _get_cached(key):
    if key in _cache:
        data, ts = _cache[key]
        if time.time() - ts < _CACHE_TTL:
            return data
    return None


def _set_cache(key, data):
    _cache[key] = (data, time.time())


def _format_market_cap(value):
    if not value:
        return "N/A"
    cr = value / 1e7
    if cr >= 1_00_000:
        return f"Rs. {cr / 1_00_000:.2f} Lakh Cr"
    elif cr >= 1_000:
        return f"Rs. {cr:,.0f} Cr"
    else:
        return f"Rs. {cr:.2f} Cr"




def search_stocks(query):
    if not query or len(query.strip()) == 0:
        return []

    q = query.strip().lower()
    matched_keys = [
        key for key, info in STOCKS_METADATA.items()
        if q in key.lower() or q in info["name"].lower() or q in info["sector"].lower()
    ]

    if not matched_keys:
        return []

    results = []
    for key in matched_keys:
        meta = STOCKS_METADATA[key]
        cache_key = f"price_{key}"
        cached = _get_cached(cache_key)
        if cached:
            results.append(cached)
            continue

        try:
            stock = yf.Ticker(meta["yf_ticker"])
            fi = stock.fast_info
            price = round(float(fi.last_price or 0), 2)
            prev_close = round(float(fi.previous_close or price), 2)
            change = round(price - prev_close, 2)
            change_pct = round((change / prev_close * 100) if prev_close else 0, 2)

            result = {
                "ticker": meta["ticker"],
                "name": meta["name"],
                "exchange": meta["exchange"],
                "sector": meta["sector"],
                "price": price,
                "change": change,
                "change_percent": change_pct
            }
            _set_cache(cache_key, result)
            results.append(result)

        except Exception as e:
            print(f"[WARN] yfinance search failed for {key}: {e}")
            fallback = _get_fallback_details(meta)
            results.append({
                "ticker": meta["ticker"],
                "name": meta["name"],
                "exchange": meta["exchange"],
                "sector": meta["sector"],
                "price": fallback["stock"]["price"],
                "change": fallback["stock"]["change"],
                "change_percent": fallback["stock"]["change_percent"]
            })

def get_batch_stock_summary(tickers):
    if not tickers:
        return []
    results = []
    for ticker in tickers:
        key = ticker.upper()
        meta = STOCKS_METADATA.get(key)
        if not meta:
            continue
        cache_key = f"price_{key}"
        cached = _get_cached(cache_key)
        if cached:
            results.append(cached)
            continue
        try:
            stock = yf.Ticker(meta["yf_ticker"])
            fi = stock.fast_info
            price = round(float(fi.last_price or 0), 2)
            prev_close = round(float(fi.previous_close or price), 2)
            change = round(price - prev_close, 2)
            change_pct = round((change / prev_close * 100) if prev_close else 0, 2)
            result = {
                "ticker": meta["ticker"],
                "name": meta["name"],
                "exchange": meta["exchange"],
                "sector": meta["sector"],
                "price": price,
                "change": change,
                "change_percent": change_pct
            }
            _set_cache(cache_key, result)
            results.append(result)
        except Exception as e:
            fallback = _get_fallback_details(meta)
            results.append({
                "ticker": meta["ticker"],
                "name": meta["name"],
                "exchange": meta["exchange"],
                "sector": meta["sector"],
                "price": fallback["stock"]["price"],
                "change": fallback["stock"]["change"],
                "change_percent": fallback["stock"]["change_percent"]
            })
    return results


def _generate_fallback_candles(base_price=3000.0, num_days=30):
    import datetime
    import random

    candles = []
    current_date = datetime.date.today() - datetime.timedelta(days=num_days)
    price = base_price

    random.seed(42 + int(base_price))  # Deterministic mock per price

    for i in range(num_days):
        # Skip weekends
        if current_date.weekday() >= 5:
            current_date += datetime.timedelta(days=1)

        daily_change = (random.random() - 0.48) * (price * 0.025)
        open_p = price
        close_p = price + daily_change
        high_p = max(open_p, close_p) + (random.random() * price * 0.01)
        low_p = min(open_p, close_p) - (random.random() * price * 0.01)

        candles.append({
            "date": current_date.strftime("%d %b"),
            "open": round(open_p, 2),
            "high": round(high_p, 2),
            "low": round(low_p, 2),
            "close": round(close_p, 2),
        })

        price = close_p
        current_date += datetime.timedelta(days=1)

    return candles[:num_days]


# ─────────────────────────────────────────────────────────────
#  Fallback financial figures (in ₹ Crores) for all 15 stocks
# ─────────────────────────────────────────────────────────────
FALLBACK_FINANCIALS_DATA = {
    "TCS": {
        "years": ["Mar 2023", "Mar 2024", "Mar 2025", "Mar 2026"],
        "revenue": [225458.0, 240893.0, 255324.0, 267021.0],
        "net_profit": [42147.0, 45908.0, 48553.0, 49210.0]
    },
    "TATAMOTORS": {
        "years": ["Mar 2022", "Mar 2023", "Mar 2024", "Mar 2025"],
        "revenue": [278454.0, 345967.0, 437928.0, 445000.0],
        "net_profit": [-11309.0, 2690.0, 31807.0, 35000.0]
    },
    "RELIANCE": {
        "years": ["Mar 2023", "Mar 2024", "Mar 2025", "Mar 2026"],
        "revenue": [879468.0, 914472.0, 980000.0, 1025000.0],
        "net_profit": [66702.0, 69621.0, 74500.0, 78200.0]
    },
    "INFY": {
        "years": ["Mar 2023", "Mar 2024", "Mar 2025", "Mar 2026"],
        "revenue": [146767.0, 153670.0, 161200.0, 170500.0],
        "net_profit": [24095.0, 26233.0, 27800.0, 29400.0]
    },
    "HDFCBANK": {
        "years": ["Mar 2023", "Mar 2024", "Mar 2025", "Mar 2026"],
        "revenue": [192800.0, 315600.0, 385000.0, 420000.0],
        "net_profit": [44108.0, 60812.0, 68500.0, 75200.0]
    },
    "ICICIBANK": {
        "years": ["Mar 2023", "Mar 2024", "Mar 2025", "Mar 2026"],
        "revenue": [121067.0, 159045.0, 185000.0, 205000.0],
        "net_profit": [31896.0, 40888.0, 47200.0, 52400.0]
    },
    "WIPRO": {
        "years": ["Mar 2023", "Mar 2024", "Mar 2025", "Mar 2026"],
        "revenue": [90487.0, 89760.0, 91200.0, 93500.0],
        "net_profit": [11350.0, 11045.0, 11500.0, 12100.0]
    },
    "SBIN": {
        "years": ["Mar 2023", "Mar 2024", "Mar 2025", "Mar 2026"],
        "revenue": [368710.0, 473378.0, 525000.0, 560000.0],
        "net_profit": [50232.0, 61077.0, 67500.0, 73000.0]
    },
    "BHARTIARTL": {
        "years": ["Mar 2023", "Mar 2024", "Mar 2025", "Mar 2026"],
        "revenue": [139145.0, 149982.0, 162500.0, 175000.0],
        "net_profit": [8346.0, 7467.0, 11200.0, 14500.0]
    },
    "ITC": {
        "years": ["Mar 2023", "Mar 2024", "Mar 2025", "Mar 2026"],
        "revenue": [69480.0, 70251.0, 74500.0, 79200.0],
        "net_profit": [18753.0, 20422.0, 21800.0, 23200.0]
    },
    "HINDUNILVR": {
        "years": ["Mar 2023", "Mar 2024", "Mar 2025", "Mar 2026"],
        "revenue": [58154.0, 59579.0, 62400.0, 65800.0],
        "net_profit": [9962.0, 10114.0, 10800.0, 11500.0]
    },
    "AXISBANK": {
        "years": ["Mar 2023", "Mar 2024", "Mar 2025", "Mar 2026"],
        "revenue": [101665.0, 129750.0, 145000.0, 158000.0],
        "net_profit": [9580.0, 24861.0, 28200.0, 31500.0]
    },
    "MARUTI": {
        "years": ["Mar 2023", "Mar 2024", "Mar 2025", "Mar 2026"],
        "revenue": [112501.0, 134938.0, 148000.0, 160000.0],
        "net_profit": [8049.0, 13209.0, 14800.0, 16200.0]
    },
    "LT": {
        "years": ["Mar 2023", "Mar 2024", "Mar 2025", "Mar 2026"],
        "revenue": [183341.0, 221113.0, 248000.0, 275000.0],
        "net_profit": [10471.0, 13059.0, 15200.0, 17500.0]
    },
    "SUNPHARMA": {
        "years": ["Mar 2023", "Mar 2024", "Mar 2025", "Mar 2026"],
        "revenue": [43278.0, 47758.0, 52000.0, 56500.0],
        "net_profit": [8474.0, 9576.0, 10800.0, 12000.0]
    }
}


def _get_generic_fallback_financials(ticker):
    return {
        "years": ["Mar 2023", "Mar 2024", "Mar 2025", "Mar 2026"],
        "revenue": [50000.0, 56000.0, 62000.0, 69000.0],
        "net_profit": [6000.0, 7200.0, 8300.0, 9500.0]
    }


def _format_year_col(col):
    s = str(col)[:10]
    try:
        parts = s.split('-')
        year = parts[0]
        month = parts[1]
        month_names = {
            '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
            '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
            '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
        }
        m_name = month_names.get(month, 'Mar')
        return f"{m_name} {year}"
    except Exception:
        return s


def _build_financials_payload(years, rev_vals, net_vals):
    npm_vals = [round((n / r * 100), 2) if r and r != 0 else 0.0 for n, r in zip(net_vals, rev_vals)]
    
    rev_yoy = [None]
    net_yoy = [None]
    npm_yoy_pts = [None]
    npm_yoy_pct = [None]
    
    for i in range(1, len(years)):
        prev_r, curr_r = rev_vals[i-1], rev_vals[i]
        prev_n, curr_n = net_vals[i-1], net_vals[i]
        prev_m, curr_m = npm_vals[i-1], npm_vals[i]
        
        r_change = round(((curr_r - prev_r) / prev_r) * 100, 2) if prev_r != 0 else 0.0
        n_change = round(((curr_n - prev_n) / abs(prev_n)) * 100, 2) if prev_n != 0 else 0.0
        m_pts = round(curr_m - prev_m, 2)
        m_pct = round(((curr_m - prev_m) / abs(prev_m)) * 100, 2) if prev_m != 0 else 0.0
        
        rev_yoy.append(r_change)
        net_yoy.append(n_change)
        npm_yoy_pts.append(m_pts)
        npm_yoy_pct.append(m_pct)

    num_years = len(years) - 1
    if num_years >= 1 and rev_vals[0] != 0:
        rev_3y_pct = round(((rev_vals[-1] - rev_vals[0]) / rev_vals[0]) * 100, 2)
        rev_3y_cagr = round(((rev_vals[-1] / rev_vals[0]) ** (1.0 / num_years) - 1.0) * 100, 2) if (rev_vals[-1] > 0 and rev_vals[0] > 0) else None
    else:
        rev_3y_pct, rev_3y_cagr = 0.0, None

    if num_years >= 1 and net_vals[0] != 0:
        net_3y_pct = round(((net_vals[-1] - net_vals[0]) / abs(net_vals[0])) * 100, 2)
        net_3y_cagr = round(((net_vals[-1] / net_vals[0]) ** (1.0 / num_years) - 1.0) * 100, 2) if (net_vals[-1] > 0 and net_vals[0] > 0) else None
    else:
        net_3y_pct, net_3y_cagr = 0.0, None

    if num_years >= 1:
        npm_3y_pts = round(npm_vals[-1] - npm_vals[0], 2)
        npm_3y_pct = round(((npm_vals[-1] - npm_vals[0]) / abs(npm_vals[0])) * 100, 2) if npm_vals[0] != 0 else 0.0
    else:
        npm_3y_pts, npm_3y_pct = 0.0, 0.0

    return {
        "years": years,
        "span_years": num_years,
        "metrics": {
            "revenue": {
                "label": "Sales / Revenue",
                "unit": "₹ Cr",
                "values": rev_vals,
                "yoy_changes": rev_yoy,
                "three_year_change_pct": rev_3y_pct,
                "three_year_cagr": rev_3y_cagr
            },
            "net_profit": {
                "label": "Net Profit",
                "unit": "₹ Cr",
                "values": net_vals,
                "yoy_changes": net_yoy,
                "three_year_change_pct": net_3y_pct,
                "three_year_cagr": net_3y_cagr
            },
            "net_profit_margin": {
                "label": "Net Profit Margin (NPM)",
                "unit": "%",
                "values": npm_vals,
                "yoy_change_pts": npm_yoy_pts,
                "yoy_change_pct": npm_yoy_pct,
                "three_year_change_pts": npm_3y_pts,
                "three_year_change_pct": npm_3y_pct
            }
        },
        "summary": {
            "sales_3y_change_pct": rev_3y_pct,
            "sales_3y_cagr": rev_3y_cagr,
            "profit_3y_change_pct": net_3y_pct,
            "profit_3y_cagr": net_3y_cagr,
            "npm_3y_change_pct": npm_3y_pct,
            "npm_3y_change_pts": npm_3y_pts,
            "npm_latest": npm_vals[-1] if npm_vals else 0.0
        }
    }


def _get_fallback_financials(ticker):
    data = FALLBACK_FINANCIALS_DATA.get(ticker.upper())
    if not data:
        data = _get_generic_fallback_financials(ticker)
    return _build_financials_payload(data["years"], data["revenue"], data["net_profit"])


def extract_financials_growth(yft, ticker):
    try:
        inc = yft.income_stmt
        if inc is None or inc.empty or len(inc.columns) < 2:
            return _get_fallback_financials(ticker)

        sorted_cols = sorted(inc.columns)
        if len(sorted_cols) > 4:
            sorted_cols = sorted_cols[-4:]

        rev_key = None
        for k in ['Total Revenue', 'Operating Revenue', 'Gross Profit', 'Revenue']:
            if k in inc.index:
                rev_key = k
                break

        net_key = None
        for k in ['Net Income', 'Net Income Common Stockholders', 'Net Income Continuous Operations', 'Net Income From Continuing Operation Net Minority Interest']:
            if k in inc.index:
                net_key = k
                break

        if not rev_key or not net_key:
            return _get_fallback_financials(ticker)

        years = [_format_year_col(c) for c in sorted_cols]
        rev_vals = []
        net_vals = []
        for c in sorted_cols:
            r = inc.loc[rev_key, c]
            n = inc.loc[net_key, c]
            r_val = float(r) if pd.notna(r) else 0.0
            n_val = float(n) if pd.notna(n) else 0.0
            rev_vals.append(round(r_val / 1e7, 2))
            net_vals.append(round(n_val / 1e7, 2))

        if sum(rev_vals) == 0:
            return _get_fallback_financials(ticker)

        return _build_financials_payload(years, rev_vals, net_vals)
    except Exception as e:
        print(f"[WARN] Failed extracting financials for {ticker}: {e}")
        return _get_fallback_financials(ticker)


def _get_fallback_details(meta):
    default_prices = {
        "TCS": 4120.50,
        "TATAMOTORS": 980.25,
        "RELIANCE": 2980.00,
        "INFY": 1780.40,
        "HDFCBANK": 1640.80,
        "ICICIBANK": 1150.30,
        "WIPRO": 520.10,
        "SBIN": 840.60,
        "BHARTIARTL": 1420.00,
        "ITC": 490.50,
        "HINDUNILVR": 2680.00,
        "AXISBANK": 1220.00,
        "MARUTI": 12450.00,
        "LT": 3650.00,
        "SUNPHARMA": 1710.00
    }
    base_price = default_prices.get(meta["ticker"], 2500.0)
    candles = _generate_fallback_candles(base_price=base_price, num_days=30)

    latest_close = candles[-1]["close"]
    prev_close = candles[-2]["close"] if len(candles) > 1 else latest_close
    change = round(latest_close - prev_close, 2)
    change_pct = round((change / prev_close * 100), 2)

    stock_info = {
        "ticker": meta["ticker"],
        "name": meta["name"],
        "exchange": meta["exchange"],
        "sector": meta["sector"],
        "description": meta["description"],
        "price": latest_close,
        "change": change,
        "change_percent": change_pct,
        "pe_ratio": 28.5,
        "roe": 18.2,
        "market_cap": "Rs. 10.5 Lakh Cr",
        "high_52w": round(base_price * 1.15, 2),
        "low_52w": round(base_price * 0.85, 2),
        "volume": 2450800,
        "avg_volume": 3100500,
        "dividend_yield": 1.45,
        "book_value": round(base_price * 0.35, 2),
        "eps": round(base_price / 28.5, 2),
    }

    return {
        "stock": stock_info,
        "candles": candles,
        "financials": _get_fallback_financials(meta["ticker"])
    }


# ─────────────────────────────────────────────────────────────
#  Full stock detail — live OHLC + fundamentals from yfinance
# ─────────────────────────────────────────────────────────────
def get_stock_details(ticker):
    ticker_key = ticker.upper()
    meta = STOCKS_METADATA.get(ticker_key)

    if not meta:
        return None

    cache_key = f"detail_{ticker_key}"
    cached = _get_cached(cache_key)
    if cached:
        print(f"[CACHE] {ticker_key} -- returning cached data")
        return cached

    try:
        print(f"[LIVE] Fetching {ticker_key} from yfinance ({meta['yf_ticker']})...")
        yft = yf.Ticker(meta["yf_ticker"])
        info = yft.info or {}
        hist = yft.history(period="30d", interval="1d")

        if hist.empty:
            print(f"[WARN] No historical data returned for {ticker_key}, using fallback")
            fallback = _get_fallback_details(meta)
            _set_cache(cache_key, fallback)
            return fallback

        # ── Live price & change ──
        price = round(float(info.get("currentPrice") or info.get("regularMarketPrice") or hist["Close"].iloc[-1] or 0), 2)
        prev_close = round(float(info.get("previousClose") or price), 2)
        change = round(price - prev_close, 2)
        change_pct = round((change / prev_close * 100) if prev_close else 0, 2)

        # ── Fundamentals ──
        pe_ratio = info.get("trailingPE") or info.get("forwardPE")
        roe_raw = info.get("returnOnEquity")
        roe = round(roe_raw * 100, 2) if roe_raw else None
        pe_ratio = round(pe_ratio, 2) if pe_ratio else None

        stock_info = {
            "ticker": meta["ticker"],
            "name": meta["name"],
            "exchange": meta["exchange"],
            "sector": meta["sector"],
            "description": meta["description"],
            "price": price,
            "change": change,
            "change_percent": change_pct,
            "pe_ratio": pe_ratio,
            "roe": roe,
            "market_cap": _format_market_cap(info.get("marketCap")),
            "high_52w": round(float(info.get("fiftyTwoWeekHigh") or 0), 2),
            "low_52w": round(float(info.get("fiftyTwoWeekLow") or 0), 2),
            "volume": info.get("volume") or info.get("regularMarketVolume"),
            "avg_volume": info.get("averageVolume"),
            "dividend_yield": round(float(info.get("dividendYield") or 0) * 100, 2),
            "book_value": round(float(info.get("bookValue") or 0), 2),
            "eps": round(float(info.get("trailingEps") or 0), 2),
        }

        # ── 30-day OHLC candles ──
        candles = []
        for date, row in hist.iterrows():
            candles.append({
                "date": date.strftime("%d %b"),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
            })

        financials = extract_financials_growth(yft, ticker_key)

        result = {
            "stock": stock_info,
            "candles": candles,
            "financials": financials
        }

        _set_cache(cache_key, result)
        print(f"[LIVE] {ticker_key} fetched successfully -- price Rs.{price}, PE {pe_ratio}, ROE {roe}%")
        return result

    except Exception as e:
        print(f"[ERROR] yfinance failed for {ticker_key}: {e}. Returning fallback data.")
        fallback = _get_fallback_details(meta)
        _set_cache(cache_key, fallback)
        return fallback

