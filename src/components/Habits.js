import React, { useState, useEffect } from 'react';
import './Habits.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function Habits({ user }) {
  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState('');

  // Load once when user changes
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`lifeplanner_habits_${user.id}`)) || [];
    setHabits(saved);
  }, [user.id]);

  const save = (updatedHabits) => {
    localStorage.setItem(`lifeplanner_habits_${user.id}`, JSON.stringify(updatedHabits));
  };

  const addHabit = (e) => {
    e.preventDefault();
    if (!newHabit.trim()) return;
    const habit = {
      id: Date.now(),
      name: newHabit,
      streak: 0,
      days: { Mon: false, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false, Sun: false }
    };
    const updated = [...habits, habit];
    setHabits(updated);
    save(updated);
    setNewHabit('');
  };

  const toggleDay = (habitId, day) => {
    const updated = habits.map(h => {
      if (h.id === habitId) {
        const updatedDays = { ...h.days, [day]: !h.days[day] };
        const streak = Object.values(updatedDays).filter(Boolean).length;
        return { ...h, days: updatedDays, streak };
      }
      return h;
    });
    setHabits(updated);
    save(updated);
  };

  const deleteHabit = (id) => {
    const updated = habits.filter(h => h.id !== id);
    setHabits(updated);
    save(updated);
  };

  return (
    <div className="habits fade-in">
      <header className="page-header">
        <h1>Habit Tracker</h1>
        <p className="subtitle">Build better routines over time.</p>
      </header>

      <div className="glass-panel habits-container">
        <form onSubmit={addHabit} className="task-form">
          <input
            type="text"
            placeholder="Add a new daily habit..."
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            className="task-input"
          />
          <button type="submit" className="btn-primary">Add Habit</button>
        </form>

        <div className="habits-list">
          {habits.length === 0 ? (
            <div className="empty-state">No habits tracked yet. Start small!</div>
          ) : (
            <div className="habits-table">
              <div className="habits-header">
                <div className="habit-name-col">Habit</div>
                <div className="days-col">
                  {DAYS.map(day => <div key={day} className="day-label">{day}</div>)}
                </div>
                <div className="streak-col">Streak</div>
              </div>

              {habits.map(habit => (
                <div key={habit.id} className="habit-row">
                  <div className="habit-name-col">
                    <span>{habit.name}</span>
                    <button className="del-btn" onClick={() => deleteHabit(habit.id)}>×</button>
                  </div>
                  <div className="days-col">
                    {DAYS.map(day => (
                      <button
                        key={day}
                        className={`day-btn ${habit.days[day] ? 'completed' : ''}`}
                        onClick={() => toggleDay(habit.id, day)}
                      >
                      </button>
                    ))}
                  </div>
                  <div className="streak-col">
                    <span className="streak-badge">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px'}}>
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                      </svg>
                      {habit.streak}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Habits;
