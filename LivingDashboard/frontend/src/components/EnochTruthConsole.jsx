import { useEffect, useRef, useState } from 'react';
import './EnochTruthConsole.css';

// Safety-first Enoch Console: client enforces a simple keyword blocklist and
// requires backend moderation before proxying to any external data source.
// This avoids directly enabling queries that request medical, election, or
// other sensitive claims without Council review.

const BLOCKED_KEYWORDS = [
  'vaccine', 'vaccines', 'chemotherapy', 'election', 'fraud', '5g', 'climate',
  'surveillance', 'federal reserve', 'big pharma', 'conspiracy', 'covid'
];

const EnochTruthConsole = () => {
  const [query, setQuery] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [defenseMode, setDefenseMode] = useState(false);
  const conversationEndRef = useRef(null);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Fetch Enoch status (includes defenseMode) so UI can display DEFENSE mode banner
  useEffect(() => {
    let mounted = true;
    fetch('/api/enoch/status').then(r => r.json()).then(j => {
      if (!mounted) return;
      if (j && j.defenseMode) setDefenseMode(true);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const suggestedTopics = [
    'Historical research on public health policy',
    'Overview of decentralized finance concepts',
    'Comparative analysis of media literacy techniques',
    'Survey of alternative energy arguments',
    'Research methods for verifying primary sources'
  ];

  const containsBlocked = (text) => {
    const lower = text.toLowerCase();
    return BLOCKED_KEYWORDS.some(k => lower.includes(k));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!query.trim()) return;

    if (containsBlocked(query)) {
      setError('This topic is restricted for safety and Council review. Please consult the Council or rephrase to a neutral research question.');
      const errorMessage = { role: 'system', content: '⚠️ Topic blocked by client-side policy. Council review required.', timestamp: new Date() };
      setConversation(prev => [...prev, { role: 'user', content: query, timestamp: new Date() }, errorMessage]);
      setQuery('');
      return;
    }

    const userMessage = { role: 'user', content: query, timestamp: new Date() };
    setConversation(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch('/api/enoch/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      const enochMessage = {
        role: 'enoch',
        content: data.answer || data.response || 'No response received',
        sources: data.sources || [],
        timestamp: new Date()
      };
      setConversation(prev => [...prev, enochMessage]);
      setQuery('');
    } catch (err) {
      console.error('Enoch query failed:', err);
      setError('Failed to reach Enoch backend or moderation blocked the request.');
      const errorMessage = { role: 'system', content: `⚠️ Error: ${err.message}`, timestamp: new Date() };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggested = (t) => setQuery(t);
  const clearConversation = () => { setConversation([]); setError(null); };

  const exportConversation = () => {
    const text = conversation.map(msg => {
      const time = new Date(msg.timestamp).toLocaleString();
      const role = msg.role === 'user' ? 'COUNCIL' : msg.role === 'enoch' ? 'ENOCH AI' : 'SYSTEM';
      return `[${time}] ${role}: ${msg.content}`;
    }).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `enoch-session-${Date.now()}.txt`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="enoch-truth-console">
      <div className={`console-header ${defenseMode ? 'defense-mode' : ''}`}>
        <h2>{defenseMode ? '🛡️ Enoch AI Console — DEFENSE MODE' : '🔒 Enoch AI Console (Council-reviewed)'}</h2>
        <p className="subtitle">{defenseMode ? 'DEFENSE MODE active — all queries logged with threat level and high-risk escalations.' : 'This console requires Council-approved, moderated queries. Restricted topics are blocked for safety.'}</p>
        <div className="header-actions">
          <button onClick={clearConversation} className="btn-secondary" disabled={conversation.length === 0}>Clear</button>
          <button onClick={exportConversation} className="btn-secondary" disabled={conversation.length === 0}>Export</button>
        </div>
      </div>

      {error && <div className="error-banner"><strong>⚠️</strong> {error}</div>}

      <div className="suggested-topics">
        <h3>Suggested Research Topics</h3>
        <div className="topics-grid">
          {suggestedTopics.map((t, i) => (
            <button key={i} className="topic-button" onClick={() => handleSuggested(t)} disabled={loading}>{t}</button>
          ))}
        </div>
      </div>

      <div className="conversation-container">
        {conversation.length === 0 ? (
          <div className="empty-state"><p>Use this console for Council-reviewed research questions. Restricted topics will be blocked.</p></div>
        ) : (
          conversation.map((msg, i) => (
            <div key={i} className={`message message-${msg.role} ${msg.threatLevel ? `threat-${msg.threatLevel}` : ''}`}>
              <div className="message-header">
                <span className="message-role">{msg.role === 'user' ? '👤 Council' : msg.role === 'enoch' ? '🌟 Enoch AI' : '⚙️ System'}</span>
                <span className="message-time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="message-content">{msg.content}</div>
              {msg.threatLevel && <div className={`message-threat badge badge-${msg.threatLevel}`}>Threat: {msg.threatLevel.toUpperCase()}{msg.threatReason ? ` — ${msg.threatReason}` : ''}</div>}
              {msg.sources && msg.sources.length > 0 && (
                <div className="message-sources"><strong>Sources:</strong><ul>{msg.sources.map((s, idx) => <li key={idx}><a href={s.url} target="_blank" rel="noreferrer">{s.title||s.url}</a></li>)}</ul></div>
              )}
            </div>
          ))
        )}
        <div ref={conversationEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="query-form">
        <textarea value={query} onChange={e=>setQuery(e.target.value)} placeholder="Enter a Council-reviewed research question..." rows={3} disabled={loading} />
        <button type="submit" className="btn-primary" disabled={loading || !query.trim()}>{loading ? '⏳ Querying…' : '🔍 Ask Enoch (Council-reviewed)'}</button>
      </form>

      <div className="console-footer">
        <p><strong>Note:</strong> This console enforces client-side safety blocks and expects a moderated backend proxy at <code>/api/enoch/query</code>. Do not use this console to solicit medical, legal, or other high-risk advice without Council approval.</p>
      </div>
    </div>
  );
};

export default EnochTruthConsole;
