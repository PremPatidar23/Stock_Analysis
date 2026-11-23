import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  User,
  X,
  Send,
  Key,
  ChevronDown,
  RefreshCw,
  HelpCircle,
  TrendingUp,
  Check
} from 'lucide-react';
import { aiAPI } from '../services/api';

export default function AIChatModal({ currentTicker, stockInfo, financials }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  // Free API Key config
  const [apiKey, setApiKey] = useState('');
  const [showKeySettings, setShowKeySettings] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keySaved, setKeySaved] = useState(false);

  const messagesEndRef = useRef(null);

  // Load saved Gemini API key from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('gemini_api_key') || '';
    setApiKey(saved);
    setKeyInput(saved);
  }, []);

  // When currentTicker changes or modal opens for the first time, set greeting
  useEffect(() => {
    if (!currentTicker) return;
    const stockName = stockInfo?.name || currentTicker;
    const initialGreeting = {
      role: 'assistant',
      content: `Hello! I'm your AI Research Assistant. I have live fundamentals and Screener 3-year data loaded for **${stockName} (${currentTicker})**.\n\nAsk me anything about its valuation (P/E), 3-year revenue growth, net profit margins, or business operations!`,
      provider: apiKey ? 'Google Gemini (Free API)' : 'Built-in Financial Intelligence (Free)'
    };
    setMessages([initialGreeting]);
  }, [currentTicker, apiKey]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  const handleSaveKey = () => {
    const trimmed = keyInput.trim();
    setApiKey(trimmed);
    if (trimmed) {
      localStorage.setItem('gemini_api_key', trimmed);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
    setKeySaved(true);
    setTimeout(() => {
      setKeySaved(false);
      setShowKeySettings(false);
    }, 1200);
  };

  const handleSend = async (queryToSend) => {
    const text = (queryToSend || inputText).trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setLoading(true);

    try {
      const history = updatedMessages.map(m => ({ role: m.role, content: m.content }));
      const res = await aiAPI.chat({
        query: text,
        ticker: currentTicker,
        apiKey: apiKey || undefined,
        history
      });

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply || 'No response generated.',
          provider: res.provider || (apiKey ? 'Google Gemini' : 'Built-in Financial AI'),
          mode: res.mode,
          tip: res.tip
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Sorry, I encountered an issue: ${err.message}. Please try again.`,
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = [
    `How is the 3-year net profit margin?`,
    `Is the P/E ratio overvalued or cheap?`,
    `Summarize 3-year sales & revenue growth`,
    `What does this company do?`,
  ];

  // Simple Markdown-like renderer for bullet points, bold text, and headers
  const renderFormattedContent = (content) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} style={{ fontSize: '13px', fontWeight: 700, margin: '8px 0 4px', color: 'var(--text-primary)' }}>
            {line.replace('### ', '')}
          </h4>
        );
      }
      // Bullet point
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const bulletText = line.substring(2);
        return (
          <div key={idx} style={{ display: 'flex', gap: '6px', margin: '3px 0', fontSize: '12.5px', lineHeight: 1.5 }}>
            <span style={{ color: '#0d9e6e', fontWeight: 'bold' }}>•</span>
            <div>{formatInlineText(bulletText)}</div>
          </div>
        );
      }
      // Blockquote / Tip
      if (line.startsWith('> ')) {
        return (
          <div key={idx} style={{ margin: '6px 0', padding: '6px 10px', background: 'var(--bg-primary)', borderLeft: '3px solid #1a6fc4', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            {formatInlineText(line.replace('> ', ''))}
          </div>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} style={{ height: '6px' }} />;
      }
      // Standard paragraph line
      return (
        <div key={idx} style={{ margin: '2px 0', fontSize: '12.5px', lineHeight: 1.5 }}>
          {formatInlineText(line)}
        </div>
      );
    });
  };

  const formatInlineText = (text) => {
    // Basic regex replacer for **bold** and `code`
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            style={{
              background: 'var(--bg-tag)',
              padding: '1px 5px',
              borderRadius: '3px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11.5px',
              color: '#0d9e6e',
              fontWeight: 600
            }}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* ── Floating AI Trigger Button ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #0d9e6e 0%, #1a6fc4 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '9999px',
            padding: '10px 18px',
            boxShadow: '0 4px 16px rgba(13, 158, 110, 0.35)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <Sparkles size={16} />
          <span>Ask AI about {currentTicker}</span>
          <span
            style={{
              background: 'rgba(255, 255, 255, 0.25)',
              padding: '1px 6px',
              borderRadius: '10px',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}
          >
            Free
          </span>
        </button>
      )}

      {/* ── Chat Modal Window ── */}
      {isOpen && (
        <div
          className="glass-card animate-fade-in"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '400px',
            maxWidth: 'calc(100vw - 32px)',
            height: '560px',
            maxHeight: 'calc(100vh - 40px)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.18)',
            border: '1px solid var(--border-strong)',
            borderRadius: '12px',
            overflow: 'hidden',
            background: 'var(--bg-white)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #0d9e6e 0%, #155b9a 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={18} color="#fff" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h4 style={{ fontSize: '13.5px', fontWeight: 700, margin: 0, color: '#fff' }}>
                    Artha AI • Stock Copilot
                  </h4>
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      fontSize: '9.5px',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      fontWeight: 600,
                    }}
                  >
                    {currentTicker}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.85)', margin: 0 }}>
                  Live 3-Year Screener & Valuation Insights
                </div>
              </div>
            </div>

            {/* Actions: Settings & Close */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setShowKeySettings(!showKeySettings)}
                title="Configure Free Gemini API Key"
                style={{
                  background: showKeySettings ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Key size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Optional API Key Configuration Panel */}
          {showKeySettings && (
            <div
              style={{
                background: 'var(--bg-primary)',
                borderBottom: '1px solid var(--border-color)',
                padding: '12px 14px',
                fontSize: '11.5px',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Key size={13} color="#1a6fc4" />
                <span>Google Gemini Free API Key (Optional)</span>
              </div>
              <p style={{ color: 'var(--text-muted)', margin: '0 0 8px 0', fontSize: '11px', lineHeight: 1.4 }}>
                Works out-of-the-box via Built-in Financial Intelligence. To enable open-ended generative chat, paste a 100% free key from{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#1a6fc4', textDecoration: 'underline' }}
                >
                  Google AI Studio (free)
                </a>.
              </p>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="password"
                  placeholder="Paste AI Studio key (AIzaSy...)"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-strong)',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
                <button
                  onClick={handleSaveKey}
                  style={{
                    padding: '6px 12px',
                    background: keySaved ? '#0d9e6e' : '#1a6fc4',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {keySaved ? <Check size={12} /> : null}
                  {keySaved ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
          )}

          {/* Chat Messages Body */}
          <div
            style={{
              flex: 1,
              padding: '14px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: '#fafbfc'
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '88%',
                    padding: '10px 12px',
                    borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: msg.role === 'user' ? '#1a6fc4' : '#ffffff',
                    color: msg.role === 'user' ? '#ffffff' : 'var(--text-primary)',
                    boxShadow: msg.role === 'user' ? 'none' : 'var(--shadow-sm)',
                    border: msg.role === 'user' ? 'none' : '1px solid var(--border-color)',
                  }}
                >
                  {msg.role === 'assistant' ? (
                    renderFormattedContent(msg.content)
                  ) : (
                    <div style={{ fontSize: '13px', lineHeight: 1.4 }}>{msg.content}</div>
                  )}
                </div>

                {/* Provider tag for assistant */}
                {msg.role === 'assistant' && msg.provider && (
                  <div
                    style={{
                      fontSize: '9.5px',
                      color: 'var(--text-muted)',
                      marginTop: '3px',
                      marginLeft: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>⚡ {msg.provider}</span>
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', padding: '6px' }}>
                <Bot size={15} className="spin-anim" />
                <span>Artha AI is analyzing financial disclosures...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Chips */}
          <div
            style={{
              padding: '6px 12px',
              background: 'var(--bg-white)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                disabled={loading}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#eef3f9')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-primary)')}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div
            style={{
              padding: '10px 12px',
              background: 'var(--bg-white)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <input
              type="text"
              placeholder={`Ask about ${currentTicker} (e.g. margin, valuation, revenue)...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-strong)',
                fontSize: '12.5px',
                outline: 'none',
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() || loading}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                background: inputText.trim() && !loading ? '#0d9e6e' : 'var(--border-strong)',
                color: '#fff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputText.trim() && !loading ? 'pointer' : 'default',
                transition: 'background 0.15s ease'
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
