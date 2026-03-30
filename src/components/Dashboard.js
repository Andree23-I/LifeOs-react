import React, { useState, useEffect } from 'react';
import './Dashboard.css';

function Dashboard({ user }) {
  const [stats, setStats] = useState({ tasksCompleted: 0, totalTasks: 0, activeHabits: 0, goalsProgress: 0 });
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    // Load real stats from localStorage scoped to this user
    const tasks = JSON.parse(localStorage.getItem(`lifeplanner_tasks_${user.id}`)) || [];
    const habits = JSON.parse(localStorage.getItem(`lifeplanner_habits_${user.id}`)) || [];
    const goals = JSON.parse(localStorage.getItem(`lifeplanner_goals_${user.id}`)) || [];

    const tasksCompleted = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;
    const activeHabits = habits.filter(h => h.streak > 0).length;
    const goalsProgress = goals.length > 0
      ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
      : 0;

    setStats({ tasksCompleted, totalTasks, activeHabits, goalsProgress });
  }, [user.id]);

  return (
    <div className="dashboard fade-in">
      <header className="page-header">
        <h1>{greeting}, {user.username || user.name || 'User'}.</h1>
        <p className="subtitle">Here's your overview for today.</p>
      </header>

      <div className="grid-container">
        <div className="glass-panel stat-card summary-card">
          <div className="stat-title">Tasks Progress</div>
          <div className="stat-value">{stats.tasksCompleted} / {stats.totalTasks}</div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: stats.totalTasks > 0 ? `${(stats.tasksCompleted / stats.totalTasks) * 100}%` : '0%' }}></div>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-title">Active Habits</div>
          <div className="stat-value">{stats.activeHabits}</div>
          <div className="stat-desc">Streaks maintained</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-title">Goals Progress</div>
          <div className="stat-value">{stats.goalsProgress}%</div>
          <div className="stat-desc">Overall completion</div>
        </div>
      </div>
      
      <div className="recent-activity glass-panel">
        <h2>Recent Activity</h2>
        <div className="empty-state">No recent activity to show. Start ticking off your tasks!</div>
      </div>
    </div>
  );
}

export default Dashboard;
