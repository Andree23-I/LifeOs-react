import React, { useState, useEffect } from 'react';
import './Tasks.css';

function Tasks({ user }) {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');

  // Load once when user changes
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`lifeplanner_tasks_${user.id}`)) || [];
    setTasks(saved);
  }, [user.id]);

  const save = (updatedTasks) => {
    localStorage.setItem(`lifeplanner_tasks_${user.id}`, JSON.stringify(updatedTasks));
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const updated = [{ id: Date.now(), text: newTask, completed: false }, ...tasks];
    setTasks(updated);
    save(updated);
    setNewTask('');
  };

  const toggleTask = (id) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(updated);
    save(updated);
  };

  const deleteTask = (id) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    save(updated);
  };

  return (
    <div className="tasks fade-in">
      <header className="page-header">
        <h1>Task Manager</h1>
        <p className="subtitle">Stay focused, stay productive.</p>
      </header>

      <div className="glass-panel tasks-container">
        <form onSubmit={addTask} className="task-form">
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="task-input"
          />
          <button type="submit" className="btn-primary">Add Task</button>
        </form>

        <div className="task-list">
          {tasks.length === 0 ? (
            <div className="empty-state">No tasks to do. You're all caught up!</div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                <label className="checkbox-container">
                  <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} />
                  <span className="checkmark"></span>
                </label>
                <div className="task-text">{task.text}</div>
                <button className="btn-delete" onClick={() => deleteTask(task.id)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Tasks;
