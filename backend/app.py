from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os

from stock_engine import INDIAN_STOCKS_DB, search_stocks, get_stock_details, get_batch_stock_summary
from ai_service import process_chat_query

app = Flask(__name__)
CORS(app)

# ─── SQLAlchemy / SQLite setup ───────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(BASE_DIR, 'stock_app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


# ─── Models ──────────────────────────────────────────────────────────────────

class User(db.Model):
    __tablename__ = 'users'
    id            = db.Column(db.Integer, primary_key=True)
    name          = db.Column(db.String(120), nullable=False)
    email         = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    watchlists    = db.relationship('WatchlistItem', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, pw):
        self.password_hash = generate_password_hash(pw)

    def check_password(self, pw):
        return check_password_hash(self.password_hash, pw)

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'email': self.email}


class WatchlistItem(db.Model):
    __tablename__ = 'watchlist_items'
    id       = db.Column(db.Integer, primary_key=True)
    user_id  = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    ticker   = db.Column(db.String(20), nullable=False)
    __table_args__ = (db.UniqueConstraint('user_id', 'ticker', name='uq_user_ticker'),)


# Create tables on first run
with app.app_context():
    db.create_all()


# ─── Auth endpoints ───────────────────────────────────────────────────────────

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    name     = (data.get('name') or '').strip()
    email    = (data.get('email') or '').strip().lower()
    password = data.get('password', '')

    if not name or not email or not password:
        return jsonify({'error': 'Name, email and password are required.'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters.'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'An account with this email already exists.'}), 409

    user = User(name=name, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({'user': user.to_dict()}), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    email    = (data.get('email') or '').strip().lower()
    password = data.get('password', '')

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password.'}), 401

    # Return user info + their saved watchlist tickers
    tickers = [w.ticker for w in WatchlistItem.query.filter_by(user_id=user.id).all()]
    return jsonify({'user': user.to_dict(), 'watchlist': tickers})


# ─── Watchlist endpoints ──────────────────────────────────────────────────────

@app.route('/api/watchlist/<int:user_id>', methods=['GET'])
def get_watchlist(user_id):
    tickers = [w.ticker for w in WatchlistItem.query.filter_by(user_id=user_id).all()]
    return jsonify({'watchlist': tickers})


@app.route('/api/watchlist/<int:user_id>/add', methods=['POST'])
def add_to_watchlist(user_id):
    data   = request.get_json(silent=True) or {}
    ticker = (data.get('ticker') or '').strip().upper()
    if not ticker:
        return jsonify({'error': 'Ticker is required.'}), 400
    if not INDIAN_STOCKS_DB.get(ticker):
        return jsonify({'error': f"Unknown ticker: {ticker}"}), 404

    existing = WatchlistItem.query.filter_by(user_id=user_id, ticker=ticker).first()
    if not existing:
        db.session.add(WatchlistItem(user_id=user_id, ticker=ticker))
        db.session.commit()
    return jsonify({'status': 'added', 'ticker': ticker})


@app.route('/api/watchlist/<int:user_id>/remove', methods=['POST'])
def remove_from_watchlist(user_id):
    data   = request.get_json(silent=True) or {}
    ticker = (data.get('ticker') or '').strip().upper()
    item = WatchlistItem.query.filter_by(user_id=user_id, ticker=ticker).first()
    if item:
        db.session.delete(item)
        db.session.commit()
    return jsonify({'status': 'removed', 'ticker': ticker})


# ─── Stock endpoints ──────────────────────────────────────────────────────────

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "service": "Indian Stock Market Analytics API",
        "exchange": "NSE / BSE India"
    })


@app.route('/api/search', methods=['GET'])
def search():
    query = request.args.get('q', '')
    results = search_stocks(query)
    return jsonify({"query": query, "count": len(results), "results": results})


@app.route('/api/watchlist/summary', methods=['GET', 'POST'])
def watchlist_summary():
    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        tickers = data.get('tickers', [])
    else:
        raw_tickers = request.args.get('tickers', '')
        tickers = [t.strip() for t in raw_tickers.split(',') if t.strip()]
    results = get_batch_stock_summary(tickers)
    return jsonify({"stocks": results})


@app.route('/api/stocks/<ticker>', methods=['GET'])
def get_stock(ticker):
    data = get_stock_details(ticker)
    if not data:
        return jsonify({"error": f"Stock ticker '{ticker}' not found in Indian market DB"}), 404
    return jsonify(data)


@app.route('/api/stocks', methods=['GET'])
def get_all_stocks():
    stocks = list(INDIAN_STOCKS_DB.values())
    return jsonify({"stocks": stocks})


# ─── AI Chatbot endpoint ───────────────────────────────────────────────────────

@app.route('/api/ai/chat', methods=['POST'])
def ai_chat():
    data = request.get_json(silent=True) or {}
    query = (data.get('query') or '').strip()
    if not query:
        return jsonify({'error': 'Query is required.'}), 400

    ticker = (data.get('ticker') or '').strip().upper()
    user_api_key = (data.get('apiKey') or '').strip()
    history = data.get('history') or []

    # Get stock details and financials for context if ticker is provided
    stock_data = None
    if ticker:
        stock_data = get_stock_details(ticker)

    stock_info = stock_data.get('stock') if stock_data else None
    financials = stock_data.get('financials') if stock_data else None

    result = process_chat_query(
        query=query,
        stock_info=stock_info,
        financials=financials,
        user_api_key=user_api_key,
        history=history
    )
    return jsonify(result)


if __name__ == '__main__':
    print("[SERVER] Indian Stock Market Flask API running on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
