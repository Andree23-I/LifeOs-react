import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Tasks from './components/Tasks';
import Habits from './components/Habits';
import Goals from './components/Goals';
import Diet from './components/Diet';
import Login from './components/Login';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');

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
      case 'tasks': return <Tasks user={currentUser} />;
      case 'habits': return <Habits user={currentUser} />;
      case 'goals': return <Goals user={currentUser} />;
      case 'diet': return <Diet user={currentUser} />;
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
        {renderView()}
      </main>
    </div>
  );
}

export default App;
