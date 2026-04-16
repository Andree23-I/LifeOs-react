import React, { useState, useEffect, useContext } from 'react';
import './Groceries.css';
import { SettingsContext } from '../contexts/SettingsContext';
import { translations } from '../translations';

function Groceries({ user }) {
  const { language } = useContext(SettingsContext);
  const t = translations[language];

  const [items, setItems] = useState([]);
  const [inputValue, setInputValue] = useState('');

  // Load from localStorage
  useEffect(() => {
    if (user && user.id) {
      const saved = localStorage.getItem(`lifeplanner_groceries_${user.id}`);
      if (saved) {
        setItems(JSON.parse(saved));
      } else {
        setItems([]);
      }
    }
  }, [user]);

  // Save to localStorage when items change
  useEffect(() => {
    if (user && user.id) {
      localStorage.setItem(`lifeplanner_groceries_${user.id}`, JSON.stringify(items));
    }
  }, [items, user]);

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    const newItem = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      completed: false
    };
    
    setItems([...items, newItem]);
    setInputValue('');
  };

  const toggleItem = (id) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const deleteItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const clearCompleted = () => {
    setItems(items.filter(item => !item.completed));
  };

  return (
    <div className="groceries-container fade-in">
      <div className="groceries-header">
        <h2>{t.myGroceries || (language === 'it' ? 'La mia Spesa' : 'My Groceries')}</h2>
        {items.some(item => item.completed) && (
          <button className="btn-secondary clear-btn" onClick={clearCompleted}>
            {t.clearCompleted || 'Clear Completed'}
          </button>
        )}
      </div>

      <div className="groceries-content glass-panel">
        <form onSubmit={handleAddItem} className="add-grocery-form">
          <input
            type="text"
            className="task-input"
            placeholder={t.addGrocery || 'Add item...'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" className="btn-primary add-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </form>

        <div className="grocery-list">
          {items.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <p>{t.noGroceries || 'Your list is empty!'}</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className={`grocery-item ${item.completed ? 'completed' : ''}`}>
                <div className="grocery-item-content" onClick={() => toggleItem(item.id)}>
                  <div className={`checkbox ${item.completed ? 'checked' : ''}`}>
                    {item.completed && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                  <span className="item-text">{item.text}</span>
                </div>
                <button 
                  className="delete-item-btn" 
                  onClick={() => deleteItem(item.id)}
                  title="Delete"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
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

export default Groceries;
