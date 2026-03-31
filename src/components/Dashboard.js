import React, { useState, useEffect, useContext } from 'react';
import './Dashboard.css';
import { SettingsContext } from '../contexts/SettingsContext';
import { translations } from '../translations';

function Dashboard({ user }) {
  const { language } = useContext(SettingsContext);
  const t = translations[language];
  const [stats, setStats] = useState({ dailyCalories: 0, tdee: 0 });
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(t.goodMorning);
    else if (hour < 18) setGreeting(t.goodAfternoon);
    else setGreeting(t.goodEvening);

    // Load diet stats from localStorage scoped to this user
    const savedDietData = JSON.parse(localStorage.getItem(`lifeplanner_diet_${user.id}`));
    const today = new Date().toISOString().split('T')[0];
    
    let dailyCalories = 0;
    if (savedDietData && savedDietData.history && savedDietData.history[today]) {
       dailyCalories = savedDietData.history[today].reduce((sum, item) => sum + parseInt(item.calories || 0), 0);
    }
    
    const tdee = savedDietData?.tdee || 2000;

    setStats({ dailyCalories, tdee });
  }, [user.id, t.goodMorning, t.goodAfternoon, t.goodEvening]);

  return (
    <div className="dashboard fade-in">
      <header className="page-header">
        <h1>{greeting}, {user.username || user.name || 'User'}.</h1>
        <p className="subtitle">{t.overviewToday}</p>
      </header>

      <div className="grid-container">
        <div className="glass-panel stat-card summary-card">
          <div className="stat-title">{t.dailyCalories}</div>
          <div className="stat-value">{stats.dailyCalories} / {stats.tdee} kcal</div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: stats.tdee > 0 ? `${Math.min((stats.dailyCalories / stats.tdee) * 100, 100)}%` : '0%', backgroundColor: stats.dailyCalories > stats.tdee ? 'var(--accent)' : 'var(--primary)' }}></div>
          </div>
        </div>
      </div>
      
      <div className="recent-activity glass-panel">
        <h2>{t.recentActivity}</h2>
        <div className="empty-state">{t.noRecentActivity}</div>
      </div>
    </div>
  );
}

export default Dashboard;
