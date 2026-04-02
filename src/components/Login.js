import React, { useState, useEffect, useContext } from 'react';
import './Login.css';
import { SettingsContext } from '../contexts/SettingsContext';
import { translations } from '../translations';

function Login({ onLogin }) {
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  const { language } = useContext(SettingsContext);
  const t = translations[language];

  useEffect(() => {
    const savedUsers = JSON.parse(localStorage.getItem('lifeplanner_users')) || [];
    setUsers(savedUsers);
  }, []);

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    const newUser = { id: Date.now().toString(), name: newUsername.trim() };
    const updatedUsers = [...users, newUser];
    localStorage.setItem('lifeplanner_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    setNewUsername('');
    onLogin(newUser);
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassword === '1234') {
      onLogin({ id: 'admin', name: 'Admin', isAdmin: true });
    } else {
      alert('Password errata!');
      setAdminPassword('');
    }
  };

  const handleSelectUser = (user) => {
    onLogin(user);
  };

  const handleDeleteUser = (e, id) => {
    e.stopPropagation();
    if (window.confirm(t.deleteAsk || "Are you sure you want to delete this profile and all its data?")) {
      const updatedUsers = users.filter((u) => u.id !== id);
      localStorage.setItem('lifeplanner_users', JSON.stringify(updatedUsers));
      // Cleanup associated data
      localStorage.removeItem(`lifeplanner_tasks_${id}`);
      localStorage.removeItem(`lifeplanner_habits_${id}`);
      localStorage.removeItem(`lifeplanner_goals_${id}`);
      localStorage.removeItem(`lifeplanner_diet_${id}`);
      setUsers(updatedUsers);
    }
  };

  return (
    <div className="login-container fade-in">
      <div className="login-card glass-panel">
        <div className="login-header">
          <div className="logo-pulse login-logo"></div>
          <h1>{t.WelcomeMsg}</h1>
          <p>{t.SelectProfileMsg}</p>
        </div>

        <div className="users-list">
          {users.map((user) => (
            <div key={user.id} className="user-profile-btn" onClick={() => handleSelectUser(user)}>
              <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <span className="user-name">{user.name}</span>
              <button 
                className="delete-user-btn" 
                onClick={(e) => handleDeleteUser(e, user.id)}
                title="Delete Profile"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="divider">
          <span>{t.or}</span>
        </div>

        <form onSubmit={handleCreateUser} className="create-user-form">
          <input
            type="text"
            placeholder={t.EnterName}
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="task-input"
            maxLength={20}
          />
          <button type="submit" className="btn-primary">{t.CreateProfile}</button>
        </form>

        <div className="divider">
          <span>{t.admin}</span>
        </div>

        <div className="admin-section">
          {!showAdminPrompt ? (
            <button type="button" className="admin-btn" onClick={() => setShowAdminPrompt(true)}>
              {t.AdminAccess}
            </button>
          ) : (
            <form onSubmit={handleAdminLogin} className="admin-login-form fade-in">
               <input
                 type="password"
                 placeholder={t.adminPasswordPlaceholder}
                 value={adminPassword}
                 onChange={(e) => setAdminPassword(e.target.value)}
                 className="task-input"
                 autoFocus
               />
               <div className="admin-btn-group">
                 <button type="submit" className="btn-primary" style={{flex: 2}}>{t.login}</button>
                 <button type="button" className="btn-secondary" style={{flex: 1}} onClick={() => { setShowAdminPrompt(false); setAdminPassword(''); }}>{t.cancel}</button>
               </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
