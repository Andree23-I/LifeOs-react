import React, { useContext } from 'react';
import './Sidebar.css';
import { SettingsContext } from '../contexts/SettingsContext';
import { translations } from '../translations';

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
  Diet: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
      <line x1="6" y1="1" x2="6" y2="4"></line>
      <line x1="10" y1="1" x2="10" y2="4"></line>
      <line x1="14" y1="1" x2="14" y2="4"></line>
    </svg>
  ),
};

const navItems = [
  { id: 'dashboard', labelKey: 'Dashboard', icon: Icons.Dashboard },
  { id: 'diet', labelKey: 'Diet', icon: Icons.Diet },
];

function Sidebar({ currentView, setCurrentView, user, onLogout }) {
  const { language } = useContext(SettingsContext);
  const t = translations[language];

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
              <span className="label">{t[item.labelKey]}</span>
            </button>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{(user?.username || user?.name || 'U')[0].toUpperCase()}</div>
          <div className="user-details">
            <span className="user-name">{user?.username || user?.name || 'User'}</span>
            <span className="user-role">{t.Member}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout} title={t.Logout}>
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
