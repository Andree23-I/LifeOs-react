import React, { useState, useEffect, useContext } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Diet from './components/Diet';
import Music from './components/Music';
import Login from './components/Login';
import { SettingsContext } from './contexts/SettingsContext';

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
    setCurrentUser(null);
    setCurrentView('dashboard');
    sessionStorage.removeItem('lifeplanner_active_user');
  };

  const renderView = () => {
    switch(currentView) {
      case 'dashboard': return <Dashboard user={currentUser} />;
      case 'diet': return <Diet user={currentUser} />;
      case 'music': return <Music user={currentUser} />;
      default: return <Dashboard user={currentUser} />;
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        user={currentUser}
        onLogout={handleLogout}
      />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px' }}>
          <button onClick={toggleLanguage} className="btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>
            {language === 'en' ? '🇮🇹 IT' : '🇬🇧 EN'}
          </button>
          <button onClick={toggleTheme} className="btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
        {renderView()}
      </main>
    </div>
  );
}

export default App;
