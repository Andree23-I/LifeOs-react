import React from 'react';
import './Sidebar.css';

// Custom SVG Icons (Lucide-like)
const Icons = {
  Dashboard: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1"></rect>
      <rect x="14" y="3" width="7" height="5" rx="1"></rect>
      <rect x="14" y="12" width="7" height="9" rx="1"></rect>
      <rect x="3" y="16" width="7" height="5" rx="1"></rect>
    </svg>
  ),
  Tasks: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4"></polyline>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
    </svg>
  ),
  Habits: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20"></path>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  ),
  Goals: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  ),
  Diet: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
      <line x1="6" y1="1" x2="6" y2="4"></line>
      <line x1="10" y1="1" x2="10" y2="4"></line>
      <line x1="14" y1="1" x2="14" y2="4"></line>
    </svg>
  )
};

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard },
  { id: 'tasks', label: 'Tasks', icon: Icons.Tasks },
  { id: 'habits', label: 'Habits', icon: Icons.Habits },
  { id: 'goals', label: 'Goals', icon: Icons.Goals },
  { id: 'diet', label: 'Diet', icon: Icons.Diet },
];

function Sidebar({ currentView, setCurrentView, user, onLogout }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo-pulse"></div>
        <h2>LifeOS</h2>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              className={`nav-btn ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentView(item.id)}
            >
              <span className="icon-wrapper">
                <IconComponent />
              </span>
              <span className="label">{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{(user?.username || user?.name || 'U')[0].toUpperCase()}</div>
          <div className="user-details">
            <span className="user-name">{user?.username || user?.name || 'User'}</span>
            <span className="user-role">Member</span>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout} title="Logout">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
        <p className="version">v1.0.0</p>
      </div>
    </div>
  );
}

export default Sidebar;
