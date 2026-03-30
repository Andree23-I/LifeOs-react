import React, { useState, useEffect } from 'react';
import './Goals.css';

function Goals({ user }) {
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState('');

  // Load once when user changes
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`lifeplanner_goals_${user.id}`)) || [];
    setGoals(saved);
  }, [user.id]);

  const save = (updatedGoals) => {
    localStorage.setItem(`lifeplanner_goals_${user.id}`, JSON.stringify(updatedGoals));
  };

  const addGoal = (e) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    const updated = [...goals, { id: Date.now(), title: newGoal, progress: 0 }];
    setGoals(updated);
    save(updated);
    setNewGoal('');
  };

  const updateProgress = (id, newProgress) => {
    const updated = goals.map(g => g.id === id ? { ...g, progress: parseInt(newProgress) } : g);
    setGoals(updated);
    save(updated);
  };

  const deleteGoal = (id) => {
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
    save(updated);
  };

  return (
    <div className="goals fade-in">
      <header className="page-header">
        <h1>Long-Term Goals</h1>
        <p className="subtitle">Set your sights high and track your journey.</p>
      </header>

      <div className="glass-panel goals-container">
        <form onSubmit={addGoal} className="task-form">
          <input
            type="text"
            placeholder="Define a new life goal..."
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            className="task-input"
          />
          <button type="submit" className="btn-primary" style={{ backgroundColor: 'var(--accent)'}}>
            Set Goal
          </button>
        </form>

        <div className="goals-grid">
          {goals.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>Ready to dream big?</div>
          ) : (
            goals.map(goal => (
              <div key={goal.id} className="goal-card">
                <button className="del-btn absolute-top-right" onClick={() => deleteGoal(goal.id)}>×</button>
                <div className="goal-title">{goal.title}</div>

                <div className="progress-value">{goal.progress}%</div>

                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${goal.progress}%`,
                      backgroundColor: goal.progress === 100 ? 'var(--success)' : 'var(--accent)',
                      boxShadow: `0 0 10px ${goal.progress === 100 ? 'rgba(16,185,129,0.4)' : 'rgba(244,63,94,0.4)'}`
                    }}
                  ></div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={goal.progress}
                  onChange={(e) => updateProgress(goal.id, e.target.value)}
                  className="progress-slider"
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Goals;
