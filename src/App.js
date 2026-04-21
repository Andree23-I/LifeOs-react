import React, { useState, useEffect, useContext } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Diet from './components/Diet';
import Groceries from './components/Groceries';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import { SettingsContext } from './contexts/SettingsContext';

const API_URL = process.env.REACT_APP_API_URL || 'https://web-production-357c.up.railway.app';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const { theme, toggleTheme, language, toggleLanguage } = useContext(SettingsContext);

  useEffect(() => {
    const savedSession = sessionStorage.getItem('lifeplanner_active_user');
    if (savedSession) {
      setCurrentUser(JSON.parse(savedSession));
    }
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    sessionStorage.setItem('lifeplanner_active_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    // Logout dal server
    if (currentUser?.adminSessionId) {
      fetch(`${API_URL}/api/sessions/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentUser.adminSessionId })
      }).catch(err => console.log('Server logout failed:', err));
    } else if (currentUser?.id) {
      fetch(`${API_URL}/api/sessions/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentUser.id })
      }).catch(err => console.log('Server logout failed:', err));
    }
    
    setCurrentUser(null);
    setCurrentView('dashboard');
    sessionStorage.removeItem('lifeplanner_active_user');
  };

  const renderView = () => {
    if (currentUser?.isAdmin) {
      return <AdminPanel adminSessionId={currentUser.adminSessionId} onLogout={handleLogout} />;
    }
    
    switch(currentView) {
      case 'dashboard': return <Dashboard user={currentUser} />;
      case 'diet': return <Diet user={currentUser} />;
      case 'groceries': return <Groceries user={currentUser} />;
      default: return <Dashboard user={currentUser} />;
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      {!currentUser?.isAdmin && (
        <Sidebar 
          currentView={currentView} 
          setCurrentView={setCurrentView} 
          user={currentUser}
          onLogout={handleLogout}
        />
      )}
      <main className="main-content" style={currentUser?.isAdmin ? { width: '100%' } : {}}>
        {!currentUser?.isAdmin && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px' }}>
            <button onClick={toggleLanguage} className="btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>
              {language === 'en' ? '🇮🇹 IT' : '🇬🇧 EN'}
            </button>
            <button onClick={toggleTheme} className="btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        )}
        {renderView()}
      </main>
    </div>
  );
}

export default App;
