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
    const savedStats = JSON.parse(localStorage.getItem(`lifeplanner_dietstats_${user.id}`));
    const savedLog = JSON.parse(localStorage.getItem(`lifeplanner_dietlog_${user.id}`)) || [];
    
    const dailyCalories = savedLog.reduce((sum, item) => sum + (parseInt(item.cals) || 0), 0);
    
    // Calcola il TDEE se disponibile nei savedStats, altrimenti usa un default ragionevole
    let tdee = 2000;
    if (savedStats) {
      // Mifflin-St Jeor (stessa logica di Diet.js)
      let calculatedBmr = (10 * savedStats.weight) + (6.25 * savedStats.height) - (5 * savedStats.age);
      calculatedBmr += savedStats.gender === 'male' ? 5 : -161;
      
      const multipliers = { sedentary: 1.2, light: 1.375, mod: 1.55, active: 1.725, very: 1.9 };
      const maintenance = Math.round(calculatedBmr * (multipliers[savedStats.activity] || 1.2));
      
      tdee = maintenance;
      if (savedStats.goal === 'lose') tdee -= 500;
      if (savedStats.goal === 'gain') tdee += 300;
    }

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
