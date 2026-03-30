import React, { useState, useEffect } from 'react';
import './Login.css';

function Login({ onLogin }) {
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState('');

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

  const handleSelectUser = (user) => {
    onLogin(user);
  };

  const handleDeleteUser = (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this profile and all its data?")) {
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
          <h1>Welcome to LifeOS</h1>
          <p>Select your profile or create a new one to continue.</p>
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
          <span>OR</span>
        </div>

        <form onSubmit={handleCreateUser} className="create-user-form">
          <input
            type="text"
            placeholder="Enter your name..."
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="task-input"
            maxLength={20}
          />
          <button type="submit" className="btn-primary">Create Profile</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
