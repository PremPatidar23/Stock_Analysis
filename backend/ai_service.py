import os
import json
import re
import requests

def _call_gemini_api(prompt, api_key, history=None):
    """
    Calls Google Gemini REST API (gemini-1.5-flash or gemini-2.0-flash) using free tier.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    contents = []
    if history:
        for msg in history[-6:]: # keep last 6 turns for context
            role = "user" if msg.get("role") == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": msg.get("content", "")}]
            })
    
    contents.append({
        "role": "user",
        "parts": [{"text": prompt}]
    })

    payload = {
        "contents": contents,
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 1000
        }
    }

    headers = {"Content-Type": "application/json"}
    response = requests.post(url, json=payload, headers=headers, timeout=15)
    
    if response.status_code != 200:
        error_msg = response.text
        try:
            err_json = response.json()
            error_msg = err_json.get("error", {}).get("message", error_msg)
        except Exception:
            pass
        raise RuntimeError(f"Gemini API error ({response.status_code}): {error_msg}")

    res_json = response.json()
    candidates = res_json.get("candidates", [])
    if not candidates:
        raise RuntimeError("No response returned by Gemini API.")
    
    parts = candidates[0].get("content", {}).get("parts", [])
    if parts:
        return parts[0].get("text", "")
    return "I couldn't generate a response. Please try rephrasing your question."


def _generate_local_financial_response(query, stock_info, financials):
    """
    Intelligent built-in financial reasoning assistant when no external API key is configured.
    Provides immediate, accurate, data-grounded insights using live fundamentals and 3-year Screener metrics.
    """
    q = query.lower().strip()
    name = stock_info.get("name", "The company") if stock_info else "The company"
    ticker = stock_info.get("ticker", "") if stock_info else ""
    sector = stock_info.get("sector", "N/A") if stock_info else "N/A"
    price = stock_info.get("price", "N/A") if stock_info else "N/A"
    pe = stock_info.get("pe_ratio") if stock_info else None
    roe = stock_info.get("roe") if stock_info else None
    market_cap = stock_info.get("market_cap", "N/A") if stock_info else "N/A"
    high_52 = stock_info.get("high_52w", "N/A") if stock_info else "N/A"
    low_52 = stock_info.get("low_52w", "N/A") if stock_info else "N/A"
    desc = stock_info.get("description", "") if stock_info else ""

    # Extract 3-year metrics if available
    summary = financials.get("summary", {}) if financials else {}
    rev_data = financials.get("metrics", {}).get("revenue", {}) if financials else {}
    net_data = financials.get("metrics", {}).get("net_profit", {}) if financials else {}
    npm_data = financials.get("metrics", {}).get("net_profit_margin", {}) if financials else {}
    years = financials.get("years", []) if financials else []

    sales_3y = summary.get("sales_3y_change_pct")
    sales_cagr = summary.get("sales_3y_cagr")
    profit_3y = summary.get("profit_3y_change_pct")
    profit_cagr = summary.get("profit_3y_cagr")
    npm_3y_pct = summary.get("npm_3y_change_pct")
    npm_3y_pts = summary.get("npm_3y_change_pts")
    npm_latest = summary.get("npm_latest")

    # 1. Valuation / P/E ratio query
    if any(k in q for k in ["pe", "p/e", "valuation", "expensive", "cheap", "overvalued", "undervalued"]):
        if pe is not None:
            val_status = "undervalued/attractive" if pe < 18 else "moderately valued" if pe <= 32 else "trading at a high valuation premium"
            return (
                f"### Valuation Analysis for **{name} ({ticker})**\n\n"
                f"- **Current P/E Ratio:** `{pe:.1f}x`\n"
                f"- **Valuation Assessment:** The stock is currently {val_status} in the {sector} space.\n"
                f"- **Market Price:** ₹{price} vs 52-Week Range of `₹{low_52} - ₹{high_52}`.\n"
                f"- **ROE:** `{roe:.1f}%` ({'Strong capital efficiency' if roe and roe >= 15 else 'Moderate return on equity'}).\n\n"
                f"💡 *Insight:* A P/E of {pe:.1f} indicates investors are paying ₹{pe:.1f} for every ₹1 of annual earnings. "
                f"Compare this with its 3-year profit CAGR of `{profit_cagr or 'N/A'}%` to assess PEG attractiveness."
            )
        return f"P/E ratio data is currently unavailable for {name}."

    # 2. Net profit margin query
    if any(k in q for k in ["margin", "npm", "net profit margin", "profitability"]):
        if npm_latest is not None:
            trend = "expanding" if (npm_3y_pts and npm_3y_pts > 0) else "compressing" if (npm_3y_pts and npm_3y_pts < 0) else "stable"
            pts_str = f"{npm_3y_pts:+.2f}% pts" if npm_3y_pts is not None else "N/A"
            pct_str = f"{npm_3y_pct:+.2f}%" if npm_3y_pct is not None else "N/A"
            
            history_rows = ""
            if npm_data.get("values"):
                for yr, val in zip(years, npm_data["values"]):
                    history_rows += f"- **{yr}:** `{val:.2f}%`\n"

            return (
                f"### Net Profit Margin (NPM) Analysis for **{name}**\n\n"
                f"- **Latest Net Profit Margin:** `{npm_latest:.2f}%`\n"
                f"- **3-Year Margin Trend:** {trend.capitalize()} ({pts_str} or {pct_str} relative change over 3 years).\n\n"
                f"**Historical Margins (Screener breakdown):**\n"
                f"{history_rows}\n"
                f"📊 *Interpretation:* {'Operating leverage and pricing power are holding margins firm.' if trend == 'expanding' else 'Keep an eye on input costs or operating expenses impacting margins.'}"
            )

    # 3. Sales / Revenue growth query
    if any(k in q for k in ["sales", "revenue", "growth", "topline", "top line"]):
        rev_history = ""
        if rev_data.get("values"):
            for yr, val, yoy in zip(years, rev_data["values"], rev_data.get("yoy_changes", [])):
                yoy_str = f"({yoy:+.1f}% YoY)" if yoy is not None else "(Base Year)"
                rev_history += f"- **{yr}:** `₹{val:,.0f} Cr` {yoy_str}\n"

        return (
            f"### Sales & Revenue Performance for **{name}**\n\n"
            f"- **3-Year Compounded Sales Growth:** `{sales_3y:+.2f}%`\n"
            f"- **3-Year Sales CAGR:** `{sales_cagr:.2f}% / year`\n"
            f"- **Sector:** {sector}\n\n"
            f"**Yearly Breakdown (₹ Crores):**\n"
            f"{rev_history}\n"
            f"📈 *Key Takeaway:* The company generated `{sales_3y:+.1f}%` top-line expansion over the last 3-year cycle, indicating {'healthy sustained market share growth.' if sales_3y and sales_3y > 15 else 'steady single-digit revenue progression.'}"
        )

    # 4. Net profit / PAT query
    if any(k in q for k in ["profit", "pat", "bottom line", "earnings"]):
        net_history = ""
        if net_data.get("values"):
            for yr, val, yoy in zip(years, net_data["values"], net_data.get("yoy_changes", [])):
                yoy_str = f"({yoy:+.1f}% YoY)" if yoy is not None else "(Base Year)"
                net_history += f"- **{yr}:** `₹{val:,.0f} Cr` {yoy_str}\n"

        return (
            f"### Net Profit (PAT) Progression for **{name}**\n\n"
            f"- **3-Year Profit Growth:** `{profit_3y:+.2f}%`\n"
            f"- **3-Year Profit CAGR:** `{profit_cagr:.2f}% / year` if profit_cagr else 'Positive turnaround'\n"
            f"- **Return on Equity (ROE):** `{roe or 'N/A'}%`\n\n"
            f"**Net Profit History (₹ Crores):**\n"
            f"{net_history}\n"
            f"💰 *Summary:* Net profit has grown by `{profit_3y:+.1f}%` over the 3-year period."
        )

    # 5. What does the company do / About query
    if any(k in q for k in ["what does", "about", "overview", "business", "who is", "company do"]):
        return (
            f"### About **{name} ({ticker})**\n\n"
            f"{desc}\n\n"
            f"- **Sector:** {sector}\n"
            f"- **Market Capitalization:** {market_cap}\n"
            f"- **Exchange:** NSE / BSE India\n"
            f"- **Current Stock Price:** ₹{price}\n"
            f"- **52-Week Range:** ₹{low_52} - ₹{high_52}"
        )

    # 6. Should I buy / invest / advice query
    if any(k in q for k in ["buy", "invest", "sell", "hold", "target", "recommendation"]):
        return (
            f"### Fundamental Summary & Investment Checklist for **{name}**\n\n"
            f"Here is a data-driven snapshot based on Screener fundamentals:\n\n"
            f"1. **Valuation:** P/E of `{pe or 'N/A'}` vs current price `₹{price}`.\n"
            f"2. **Growth Track Record:** 3-Year Sales Growth is `{sales_3y:+.1f}%` (CAGR: `{sales_cagr or 'N/A'}%`), Profit Growth is `{profit_3y:+.1f}%`.\n"
            f"3. **Profitability:** Net profit margin sits at `{npm_latest:.2f}%` ({npm_3y_pts:+.2f}% pts over 3 years).\n"
            f"4. **Quality & Efficiency:** ROE of `{roe or 'N/A'}%`.\n"
            f"5. **Price Proximity:** Trading at ₹{price} ({((price - low_52)/(high_52 - low_52)*100):.0f}% of 52-week range) if high_52 != low_52 else 'N/A'.\n\n"
            f"⚠️ *Disclaimer:* This analysis is purely informational for educational purposes. Consult a SEBI-registered financial advisor before making investment decisions."
        )

    # 7. Default general summary response
    return (
        f"### Quick 3-Year Analysis for **{name} ({ticker})**\n\n"
        f"- **Price & Sector:** ₹{price} • {sector} ({market_cap})\n"
        f"- **Valuation:** P/E of `{pe or 'N/A'}` | ROE of `{roe or 'N/A'}%`\n"
        f"- **3-Year Sales Growth:** `{sales_3y:+.1f}%` (CAGR: `{sales_cagr or 'N/A'}%`)\n"
        f"- **3-Year Profit Growth:** `{profit_3y:+.1f}%`\n"
        f"- **Net Profit Margin (NPM):** `{npm_latest:.2f}%` (3-Year change: `{npm_3y_pct:+.1f}%` / `{npm_3y_pts:+.2f}% pts`)\n"
        f"- **52W High / Low:** ₹{high_52} / ₹{low_52}\n\n"
        f"You can ask me specific questions like:\n"
        f"- *\"What is the 3-year net profit margin trend?\"*\n"
        f"- *\"Is the P/E ratio reasonable?\"*\n"
        f"- *\"Summarize 3-year revenue growth\"*\n"
        f"- *\"Tell me about this company's business model\"*"
    )


def process_chat_query(query, stock_info=None, financials=None, user_api_key=None, history=None):
    """
    Main entry point for AI Chat:
    - Uses Google Gemini API (free tier) if user_api_key or GEMINI_API_KEY env is set.
    - Gracefully falls back to high-accuracy local financial intelligence engine.
    """
    api_key = (user_api_key or os.environ.get("GEMINI_API_KEY", "")).strip()

    # If Gemini API key is available, call Gemini Flash
    if api_key:
        try:
            # Build detailed financial prompt
            name = stock_info.get("name", "Unknown") if stock_info else "Unknown"
            ticker = stock_info.get("ticker", "") if stock_info else ""
            sector = stock_info.get("sector", "") if stock_info else ""
            price = stock_info.get("price", "") if stock_info else ""
            pe = stock_info.get("pe_ratio", "N/A") if stock_info else "N/A"
            roe = stock_info.get("roe", "N/A") if stock_info else "N/A"
            market_cap = stock_info.get("market_cap", "N/A") if stock_info else "N/A"
            high_52 = stock_info.get("high_52w", "N/A") if stock_info else "N/A"
            low_52 = stock_info.get("low_52w", "N/A") if stock_info else "N/A"
            desc = stock_info.get("description", "") if stock_info else ""

            fin_summary = ""
            if financials and financials.get("summary"):
                s = financials["summary"]
                fin_summary = (
                    f"\n3-Year Screener Financials Data:\n"
                    f"- 3-Year Sales Growth: {s.get('sales_3y_change_pct')}%, Sales 3Y CAGR: {s.get('sales_cagr') or s.get('sales_3y_cagr')}%\n"
                    f"- 3-Year Net Profit Growth: {s.get('profit_3y_change_pct')}%, Profit 3Y CAGR: {s.get('profit_cagr') or s.get('profit_3y_cagr')}%\n"
                    f"- Net Profit Margin (NPM): Latest {s.get('npm_latest')}%, 3-Year Change: {s.get('npm_3y_change_pct')}% ({s.get('npm_3y_change_pts')} percentage points)\n"
                    f"- Historical Fiscal Years: {', '.join(financials.get('years', []))}\n"
                )

            system_context = (
                f"You are Artha AI, a friendly and experienced Indian stock market research assistant.\n"
                f"Context for Current Company:\n"
                f"Company: {name} ({ticker}) on NSE/BSE\n"
                f"Sector: {sector} | Current Price: ₹{price} | Market Cap: {market_cap}\n"
                f"P/E: {pe} | ROE: {roe}% | 52W High: ₹{high_52} | 52W Low: ₹{low_52}\n"
                f"{fin_summary}\n"
                f"Description: {desc}\n\n"
                f"User Question: {query}\n\n"
                f"Instructions:\n"
                f"- Answer concisely, professionally, and clearly.\n"
                f"- Use markdown formatting (bullet points, bold text for numbers and key terms).\n"
                f"- Ground your answers in the provided financial data (P/E, ROE, 3-year sales, net profit margin, etc.).\n"
                f"- Include a brief educational note or disclaimer when discussing valuations or investments."
            )

            gemini_reply = _call_gemini_api(system_context, api_key, history=history)
            return {
                "reply": gemini_reply,
                "provider": "Google Gemini 1.5 Flash (Free API)",
                "mode": "gemini"
            }
        except Exception as e:
            print(f"[WARN] Gemini API call failed: {e}. Falling back to built-in financial engine.")
            local_reply = _generate_local_financial_response(query, stock_info, financials)
            return {
                "reply": f"{local_reply}\n\n> ⚠️ *Note: Gemini API key error ({e}). Switched to Built-in Financial Intelligence.*",
                "provider": "Built-in Financial Intelligence",
                "mode": "fallback"
            }

    # If no API key is provided, use built-in engine
    local_reply = _generate_local_financial_response(query, stock_info, financials)
    return {
        "reply": local_reply,
        "provider": "Built-in Financial Intelligence (Free)",
        "mode": "local",
        "tip": "Tip: You can add your free Google Gemini API Key in Settings to enable open-ended conversational AI!"
    }
