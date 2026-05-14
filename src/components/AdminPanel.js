import React, { useState, useEffect, useCallback } from 'react';
import './AdminPanel.css';

const API_URL = (process.env.REACT_APP_API_URL || 'https://web-production-357c.up.railway.app').replace(/\/$/, '');

function AdminPanel({ adminSessionId, onLogout }) {
  const [activeSessions, setActiveSessions] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ activeUsers: 0, totalSessionsToday: 0, uniqueIPs: 0 });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('sessions');
  const [error, setError] = useState('');
  
  // IP Management States
  const [manualIP, setManualIP] = useState('');
  const [ipMsg, setIpMsg] = useState('');
  const [ipWhitelist, setIpWhitelist] = useState([]);
  const [ipBlacklist, setIpBlacklist] = useState([]);

  // --- FETCH FUNCTIONS ---

  const fetchWhitelist = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/whitelist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminSessionId })
      });
      if (!res.ok) throw new Error('Errore nel recupero whitelist');
      const data = await res.json();
      setIpWhitelist(data.whitelist || []);
    } catch (err) {
      console.error(err);
    }
  }, [adminSessionId]);

  const fetchBlacklist = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/blacklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminSessionId })
      });
      if (!res.ok) throw new Error('Errore nel recupero blacklist');
      const data = await res.json();
      setIpBlacklist(data.blacklist || []);
    } catch (err) {
      console.error(err);
    }
  }, [adminSessionId]);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminSessionId })
      });
      if (!res.ok) throw new Error('Errore nel caricamento sessioni');
      const data = await res.json();
      setActiveSessions(data.activeSessions || []);
    } catch (err) {
      setError(err.message);
    }
  }, [adminSessionId]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminSessionId })
      });
      if (!res.ok) throw new Error('Errore nel caricamento cronologia');
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      setError(err.message);
    }
  }, [adminSessionId]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminSessionId })
      });
      if (!res.ok) throw new Error('Errore nel caricamento statistiche');
      const data = await res.json();
      setStats(data.stats);
    } catch (err) {
      console.error(err);
    }
  }, [adminSessionId]);

  // --- HANDLERS ---

  const handleAddIP = async (e) => {
    e.preventDefault();
    setIpMsg('');
    if (!manualIP) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/allow-ip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminSessionId, ip: manualIP })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore');
      setIpMsg('✅ IP autorizzato!');
      setManualIP('');
      setIpWhitelist(data.whitelist || []);
    } catch (err) {
      setIpMsg(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveIP = async (ip) => {
    if (!window.confirm(`Rimuovere ${ip} dalla whitelist?`)) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/remove-ip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminSessionId, ip })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore');
      setIpWhitelist(data.whitelist || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockIP = async () => {
    setIpMsg('');
    if (!manualIP) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/block-ip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminSessionId, ip: manualIP })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore');
      setIpMsg('🚫 IP bloccato!');
      setManualIP('');
      setIpBlacklist(data.blacklist || []);
    } catch (err) {
      setIpMsg(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockIP = async (ip) => {
    if (!window.confirm(`Sbloccare ${ip}?`)) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/unblock-ip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminSessionId, ip })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore');
      setIpBlacklist(data.blacklist || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (sessionId) => {
    if (!window.confirm('Disconnettere l\'utente?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminSessionId, sessionIdToDisconnect: sessionId })
      });
      if (res.ok) fetchSessions();
    } catch (err) {
      console.error(err);
    }
  };

  // --- EFFECTS ---

  useEffect(() => {
    const initFetch = async () => {
      setLoading(true);
      await Promise.all([fetchSessions(), fetchStats(), fetchWhitelist(), fetchBlacklist()]);
      setLoading(false);
    };
    initFetch();

    const interval = setInterval(() => {
      fetchSessions();
      fetchStats();
      fetchWhitelist();
      fetchBlacklist();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchSessions, fetchStats, fetchWhitelist, fetchBlacklist]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'history') fetchHistory();
  };

  return (
    <div className="admin-panel fade-in">
      <header className="admin-header">
        <div className="admin-title">
          <h1>🔐 Pannello Amministrativo {loading && <small style={{fontSize: '0.8rem', opacity: 0.5}}>...</small>}</h1>
          <p>Monitoraggio e sicurezza in tempo reale</p>
        </div>
        <button className="btn-logout" onClick={onLogout}>Esci</button>
      </header>

      {error && <div className="error-message">⚠️ {error}</div>}

      {/* IP MANAGEMENT TOOL */}
      <div className="glass-panel ip-tool-panel">
        <div className="ip-form-container">
          <form onSubmit={handleAddIP} className="admin-form">
            <div className="input-group">
              <label>Gestione Indirizzi IP:</label>
              <input
                type="text"
                value={manualIP}
                onChange={e => setManualIP(e.target.value)}
                placeholder="Inserisci IP..."
                disabled={loading}
              />
            </div>
            <div className="btn-group">
              <button type="submit" className="btn-primary-small" disabled={loading}>Autorizza (White)</button>
              <button type="button" className="btn-danger-small" onClick={handleBlockIP} disabled={loading}>Blocca (Black)</button>
            </div>
          </form>
          {ipMsg && <div className="ip-message">{ipMsg}</div>}
        </div>

        <div className="ip-lists-grid">
          <div className="ip-list-column">
            <h3>✅ Whitelist (Admin)</h3>
            <ul>
              {ipWhitelist.map(ip => (
                <li key={ip}>
                  <code>{ip}</code>
                  <button onClick={() => handleRemoveIP(ip)} disabled={loading}>×</button>
                </li>
              ))}
              {ipWhitelist.length === 0 && <li className="empty">Nessuno</li>}
            </ul>
          </div>
          <div className="ip-list-column">
            <h3>🚫 Blacklist (Bloccati)</h3>
            <ul>
              {ipBlacklist.map(ip => (
                <li key={ip}>
                  <code>{ip}</code>
                  <button onClick={() => handleUnblockIP(ip)} disabled={loading}>×</button>
                </li>
              ))}
              {ipBlacklist.length === 0 && <li className="empty">Nessuno</li>}
            </ul>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-label">Utenti Attivi</div>
          <div className="stat-number">{stats.activeUsers}</div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-label">Sessioni Oggi</div>
          <div className="stat-number">{stats.totalSessionsToday}</div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-label">IP Unici</div>
          <div className="stat-number">{stats.uniqueIPs}</div>
        </div>
      </div>

      {/* TABS */}
      <div className="admin-tabs">
        <button className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`} onClick={() => handleTabChange('sessions')}>
          👥 Sessioni Attive
        </button>
        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => handleTabChange('history')}>
          📋 Cronologia
        </button>
      </div>

      <div className="tab-content glass-panel">
        {activeTab === 'sessions' ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Utente</th>
                  <th>IP</th>
                  <th>Accesso</th>
                  <th>Tipo</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {activeSessions.map(s => (
                  <tr key={s.sessionId}>
                    <td><strong>{s.userName}</strong></td>
                    <td><code>{s.ip}</code></td>
                    <td>{new Date(s.loginTime).toLocaleTimeString()}</td>
                    <td>{s.isAdmin ? <span className="badge-admin">Admin</span> : <span className="badge-user">User</span>}</td>
                    <td>{!s.isAdmin && <button className="btn-danger-small" onClick={() => handleDisconnect(s.sessionId)}>Disconnect</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Utente</th>
                  <th>IP</th>
                  <th>Inizio</th>
                  <th>Fine</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i}>
                    <td><strong>{h.userName}</strong></td>
                    <td><code>{h.ip}</code></td>
                    <td>{new Date(h.loginTime).toLocaleTimeString()}</td>
                    <td>{h.logoutTime ? new Date(h.logoutTime).toLocaleTimeString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
