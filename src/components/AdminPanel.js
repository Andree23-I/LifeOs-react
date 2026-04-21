import React, { useState, useEffect, useCallback } from 'react';
import './AdminPanel.css';



function AdminPanel({ adminSessionId, onLogout }) {
  const API_URL = process.env.REACT_APP_API_URL || 'https://web-production-357c.up.railway.app';
  const [activeSessions, setActiveSessions] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ activeUsers: 0, totalSessionsToday: 0, uniqueIPs: 0 });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('sessions');
  const [error, setError] = useState('');




  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminSessionId })
      });
      
      if (!res.ok) throw new Error('Errore nel caricamento sessioni');
      const data = await res.json();
      setActiveSessions(data.activeSessions);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [adminSessionId]);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminSessionId })
      });
      
      if (!res.ok) throw new Error('Errore nel caricamento cronologia');
      const data = await res.json();
      setHistory(data.history);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      setError(err.message);
    }
  }, [adminSessionId]);

  const handleDisconnect = async (sessionId) => {
    if (!window.confirm('Sei sicuro di voler disconnettere questo utente?')) return;
    
    try {
      const res = await fetch(`${API_URL}/api/admin/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminSessionId, sessionIdToDisconnect: sessionId })
      });
      
      if (res.ok) {
        fetchSessions();
      }
    } catch (err) {
      setError('Errore nella disconnessione');
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchStats();
    const interval = setInterval(() => {
      fetchSessions();
      fetchStats();
    }, 5000); // Aggiorna ogni 5 secondi
    return () => clearInterval(interval);
  }, [fetchSessions, fetchStats]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'history') {
      fetchHistory();
    }
  };

  return (
    <div className="admin-panel fade-in">
      <header className="admin-header">
        <div className="admin-title">
          <h1>🔐 Pannello Amministrativo {loading && <small style={{fontSize: '0.8rem', opacity: 0.7}}>(Aggiornamento...)</small>}</h1>
          <p>Gestisci il sito e monitora gli utenti attivi</p>
        </div>
        <button className="btn-logout" onClick={onLogout}>Esci da Admin</button>
      </header>

      {error && <div className="error-message">⚠️ {error}</div>}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-label">Utenti Attivi</div>
          <div className="stat-number">{stats.activeUsers}</div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-label">Sessioni Totali Oggi</div>
          <div className="stat-number">{stats.totalSessionsToday}</div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-label">IP Unici</div>
          <div className="stat-number">{stats.uniqueIPs}</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => handleTabChange('sessions')}
        >
          👥 Sessioni Attive ({activeSessions.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => handleTabChange('history')}
        >
          📋 Cronologia
        </button>
      </div>

      {/* Sessioni Attive Tab */}
      {activeTab === 'sessions' && (
        <div className="tab-content glass-panel">
          <div className="table-container">
            {activeSessions.length === 0 ? (
              <div className="empty-state">Nessuna sessione attiva</div>
            ) : (
              <table className="users-table">
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
                  {activeSessions.map((session) => (
                    <tr key={session.sessionId}>
                      <td>
                        <strong>{session.userName}</strong>
                        <br/>
                        <small style={{color: 'var(--text-secondary)'}}>{session.userId}</small>
                      </td>
                      <td><code>{session.ip}</code></td>
                      <td>{new Date(session.loginTime).toLocaleTimeString('it-IT')}</td>
                      <td>
                        {session.isAdmin ? (
                          <span className="badge-admin">Admin</span>
                        ) : (
                          <span className="badge-user">Utente</span>
                        )}
                      </td>
                      <td>
                        {!session.isAdmin && (
                          <button 
                            className="btn-danger-small"
                            onClick={() => handleDisconnect(session.sessionId)}
                          >
                            Disconnetti
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="tab-content glass-panel">
          <div className="table-container">
            {history.length === 0 ? (
              <div className="empty-state">Nessuna cronologia disponibile</div>
            ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Utente</th>
                    <th>IP</th>
                    <th>Accesso</th>
                    <th>Disconnessione</th>
                    <th>Durata</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((session, idx) => {
                    const duration = session.logoutTime 
                      ? Math.round((new Date(session.logoutTime) - new Date(session.loginTime)) / 1000 / 60)
                      : '-';
                    return (
                      <tr key={idx}>
                        <td><strong>{session.userName}</strong></td>
                        <td><code>{session.ip}</code></td>
                        <td>{new Date(session.loginTime).toLocaleTimeString('it-IT')}</td>
                        <td>{session.logoutTime ? new Date(session.logoutTime).toLocaleTimeString('it-IT') : '-'}</td>
                        <td>{typeof duration === 'number' ? `${duration} min` : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* IP Stats */}
      {stats.sessionsByIP && (
        <div className="glass-panel ip-stats">
          <h3>📊 Accessi per IP</h3>
          <div className="ip-list">
            {Object.entries(stats.sessionsByIP).map(([ip, count]) => (
              <div key={ip} className="ip-item">
                <span>{ip}</span>
                <span className="ip-count">{count} accessi</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
