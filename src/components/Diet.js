import React, { useState, useEffect, useRef } from 'react';
import './Diet.css';

const ACTIVITY_LABELS = {
  sedentary: 'Sedentary (Office job)',
  light: 'Light (1-3 days/week)',
  mod: 'Moderate (3-5 days/week)',
  active: 'Active (6-7 days/week)',
  very: 'Very Active (Athlete)',
};

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  mod: 1.55,
  active: 1.725,
  very: 1.9,
};

function Diet({ user }) {
  const [activeTab, setActiveTab] = useState('tracker');

  const [stats, setStats] = useState({
    age: 25,
    gender: 'male',
    weight: 70,
    height: 175,
    activity: 'sedentary',
    goal: 'maintain'
  });

  const [tdee, setTdee] = useState(0);
  const [bmr, setBmr] = useState(0);
  const [macros, setMacros] = useState({ p: 0, f: 0, c: 0 });
  const [tdeeBreakdown, setTdeeBreakdown] = useState({
    lose_aggressive: 0, lose: 0, maintain: 0, gain: 0, gain_aggressive: 0
  });

  const [foodLog, setFoodLog] = useState([]);
  const [newFood, setNewFood] = useState({ name: '', cals: '' });

  useEffect(() => {
    if (!user) return;
    const savedStats = JSON.parse(localStorage.getItem(`lifeplanner_dietstats_${user.id}`));
    const savedLog = JSON.parse(localStorage.getItem(`lifeplanner_dietlog_${user.id}`)) || [];
    if (savedStats) setStats(savedStats);
    setFoodLog(savedLog);
  }, [user.id]);

  useEffect(() => {
    if (!user) return;
    calculateAll(stats);
  }, [stats, user.id]);

  const saveStats = (updatedStats) => {
    localStorage.setItem(`lifeplanner_dietstats_${user.id}`, JSON.stringify(updatedStats));
  };

  const saveLog = (updatedLog) => {
    localStorage.setItem(`lifeplanner_dietlog_${user.id}`, JSON.stringify(updatedLog));
  };

  const calculateAll = (currentStats) => {
    // Mifflin-St Jeor
    let calculatedBmr = (10 * currentStats.weight) + (6.25 * currentStats.height) - (5 * currentStats.age);
    calculatedBmr += currentStats.gender === 'male' ? 5 : -161;
    calculatedBmr = Math.round(calculatedBmr);
    setBmr(calculatedBmr);

    const maintenance = Math.round(calculatedBmr * ACTIVITY_MULTIPLIERS[currentStats.activity]);

    setTdeeBreakdown({
      lose_aggressive: maintenance - 1000,
      lose: maintenance - 500,
      maintain: maintenance,
      gain: maintenance + 300,
      gain_aggressive: maintenance + 500,
    });

    let dailyCals = maintenance;
    if (currentStats.goal === 'lose') dailyCals -= 500;
    if (currentStats.goal === 'gain') dailyCals += 300;
    setTdee(dailyCals);

    const proteinCals = dailyCals * 0.30;
    const fatCals = dailyCals * 0.25;
    const carbCals = dailyCals * 0.45;
    setMacros({
      p: Math.round(proteinCals / 4),
      f: Math.round(fatCals / 9),
      c: Math.round(carbCals / 4),
    });
  };

  const handleStatChange = (e) => {
    const { name, value } = e.target;
    const updatedStats = { ...stats, [name]: value };
    setStats(updatedStats);
    saveStats(updatedStats);
  };

  const addFood = (e) => {
    e.preventDefault();
    if (!newFood.name || !newFood.cals) return;
    const updatedLog = [{ id: Date.now(), name: newFood.name, cals: parseInt(newFood.cals) }, ...foodLog];
    setFoodLog(updatedLog);
    saveLog(updatedLog);
    setNewFood({ name: '', cals: '' });
  };

  const deleteFood = (id) => {
    const updatedLog = foodLog.filter(f => f.id !== id);
    setFoodLog(updatedLog);
    saveLog(updatedLog);
  };

  const calsConsumed = foodLog.reduce((acc, curr) => acc + curr.cals, 0);
  const calsRemaining = Math.max(0, tdee - calsConsumed);
  const calsPercent = tdee > 0 ? Math.min(100, (calsConsumed / tdee) * 100) : 0;

  const tdeeRows = [
    { label: 'Aggressive Cut', cals: tdeeBreakdown.lose_aggressive, tag: '-1000 kcal', color: '#ef4444' },
    { label: 'Cut (Lose Fat)', cals: tdeeBreakdown.lose, tag: '-500 kcal', color: '#f97316' },
    { label: 'Maintain Weight', cals: tdeeBreakdown.maintain, tag: 'Maintenance', color: 'var(--primary)' },
    { label: 'Lean Bulk', cals: tdeeBreakdown.gain, tag: '+300 kcal', color: '#22c55e' },
    { label: 'Aggressive Bulk', cals: tdeeBreakdown.gain_aggressive, tag: '+500 kcal', color: '#a855f7' },
  ];

  return (
    <div className="diet fade-in">
      <header className="page-header">
        <h1>Diet & Nutrition</h1>
        <p className="subtitle">Track your macros and stay fueled.</p>
      </header>

      {/* Tab Navigation */}
      <div className="diet-tabs">
        <button
          className={`diet-tab-btn ${activeTab === 'tracker' ? 'active' : ''}`}
          onClick={() => setActiveTab('tracker')}
        >
          🍽️ Daily Tracker
        </button>
        <button
          className={`diet-tab-btn ${activeTab === 'tdee' ? 'active' : ''}`}
          onClick={() => setActiveTab('tdee')}
        >
          🔥 TDEE Calculator
        </button>
      </div>

      {/* ── DAILY TRACKER TAB ── */}
      {activeTab === 'tracker' && (
        <div className="diet-content">
          <div className="diet-left-col">
            <div className="glass-panel stat-card summary-card bmr-card">
              <div className="stat-title">Daily Energy Target</div>
              <div className="stat-value">{tdee} <span style={{fontSize: '1rem', color: 'var(--text-muted)'}}>kcal</span></div>

              <div className="macros-grid">
                <div className="macro-chip">Protein <strong>{macros.p}g</strong></div>
                <div className="macro-chip">Fats <strong>{macros.f}g</strong></div>
                <div className="macro-chip">Carbs <strong>{macros.c}g</strong></div>
              </div>

              <div className="diet-progress-wrap mt-4">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <span>Consumed: <strong>{calsConsumed}</strong></span>
                  <span>Remaining: <strong style={{ color: calsConsumed > tdee ? '#ef4444' : 'var(--primary)' }}>{calsRemaining}</strong></span>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${calsPercent}%`,
                      backgroundColor: calsConsumed > tdee ? '#ef4444' : 'var(--primary)'
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="glass-panel calculator-panel">
              <h2>Body Settings</h2>
              <div className="stats-form">
                <div className="form-group">
                  <label>Age</label>
                  <input type="number" name="age" value={stats.age} onChange={handleStatChange} className="task-input compact-input" />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select name="gender" value={stats.gender} onChange={handleStatChange} className="task-input compact-input">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input type="number" name="weight" value={stats.weight} onChange={handleStatChange} className="task-input compact-input" />
                </div>
                <div className="form-group">
                  <label>Height (cm)</label>
                  <input type="number" name="height" value={stats.height} onChange={handleStatChange} className="task-input compact-input" />
                </div>
                <div className="form-group">
                  <label>Activity Level</label>
                  <select name="activity" value={stats.activity} onChange={handleStatChange} className="task-input compact-input">
                    {Object.entries(ACTIVITY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Primary Goal</label>
                  <select name="goal" value={stats.goal} onChange={handleStatChange} className="task-input compact-input">
                    <option value="lose">Lose Weight (Deficit)</option>
                    <option value="maintain">Maintain Weight</option>
                    <option value="gain">Build Muscle (Surplus)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="diet-right-col">
            <div className="glass-panel food-log-panel">
              <h2>Today's Food Log</h2>
              <form onSubmit={addFood} className="food-form">
                <input
                  type="text"
                  placeholder="What did you eat?"
                  value={newFood.name}
                  onChange={(e) => setNewFood({...newFood, name: e.target.value})}
                  className="task-input compact-input"
                  style={{ flex: 2 }}
                />
                <input
                  type="number"
                  placeholder="kcal"
                  value={newFood.cals}
                  onChange={(e) => setNewFood({...newFood, cals: e.target.value})}
                  className="task-input compact-input"
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '0 1rem' }}>+</button>
              </form>
              <div className="food-list">
                {foodLog.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem' }}>No meals logged yet today!</div>
                ) : (
                  foodLog.map(food => (
                    <div key={food.id} className="food-item">
                      <span className="food-name">{food.name}</span>
                      <span className="food-cals">{food.cals} kcal</span>
                      <button className="del-btn inline-del" onClick={() => deleteFood(food.id)}>×</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TDEE CALCULATOR TAB ── */}
      {activeTab === 'tdee' && (
        <div className="tdee-section">
          <div className="tdee-top-row">
            {/* Input Panel */}
            <div className="glass-panel tdee-input-panel">
              <h2>Your Measurements</h2>
              <p className="tdee-desc">Fill in your details to calculate your Total Daily Energy Expenditure using the <strong>Mifflin-St Jeor</strong> equation.</p>
              <div className="stats-form">
                <div className="form-group">
                  <label>Age</label>
                  <input type="number" name="age" value={stats.age} onChange={handleStatChange} className="task-input compact-input" />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select name="gender" value={stats.gender} onChange={handleStatChange} className="task-input compact-input">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input type="number" name="weight" value={stats.weight} onChange={handleStatChange} className="task-input compact-input" />
                </div>
                <div className="form-group">
                  <label>Height (cm)</label>
                  <input type="number" name="height" value={stats.height} onChange={handleStatChange} className="task-input compact-input" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Activity Level</label>
                  <select name="activity" value={stats.activity} onChange={handleStatChange} className="task-input compact-input">
                    {Object.entries(ACTIVITY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* BMR / TDEE Result */}
            <div className="tdee-results-col">
              <div className="glass-panel tdee-result-card bmr-result">
                <div className="tdee-result-label">⚡ Basal Metabolic Rate (BMR)</div>
                <div className="tdee-result-value">{bmr}</div>
                <div className="tdee-result-unit">kcal / day at complete rest</div>
              </div>
              <div className="glass-panel tdee-result-card maintenance-result">
                <div className="tdee-result-label">🔥 TDEE (Maintenance)</div>
                <div className="tdee-result-value">{tdeeBreakdown.maintain}</div>
                <div className="tdee-result-unit">kcal / day with your activity level</div>
                <div className="tdee-multiplier">× {ACTIVITY_MULTIPLIERS[stats.activity]} activity multiplier</div>
              </div>
            </div>
          </div>

          {/* Calorie Scenarios Breakdown */}
          <div className="glass-panel tdee-breakdown-panel">
            <h2>Calorie Goal Breakdown</h2>
            <p className="tdee-desc">Based on your TDEE, here are the recommended calorie targets for different goals.</p>
            <div className="tdee-breakdown-table">
              {tdeeRows.map((row) => (
                <div
                  key={row.label}
                  className={`tdee-row ${stats.goal === row.label.toLowerCase() ? 'highlighted' : ''}`}
                >
                  <div className="tdee-row-dot" style={{ backgroundColor: row.color }}></div>
                  <div className="tdee-row-label">{row.label}</div>
                  <div className="tdee-row-tag" style={{ color: row.color }}>{row.tag}</div>
                  <div className="tdee-row-bar-wrap">
                    <div
                      className="tdee-row-bar"
                      style={{
                        width: `${Math.min(100, (row.cals / (tdeeBreakdown.gain_aggressive * 1.1)) * 100)}%`,
                        backgroundColor: row.color,
                      }}
                    ></div>
                  </div>
                  <div className="tdee-row-cals" style={{ color: row.color }}>{row.cals} <span>kcal</span></div>
                </div>
              ))}
            </div>
          </div>

          {/* Macro Split */}
          <div className="glass-panel tdee-macros-panel">
            <h2>Recommended Macro Split</h2>
            <p className="tdee-desc">Based on your current goal: <strong>{stats.goal === 'lose' ? 'Losing Fat' : stats.goal === 'gain' ? 'Building Muscle' : 'Maintaining Weight'}</strong></p>
            <div className="tdee-macros-grid">
              <div className="tdee-macro-card protein">
                <div className="tmacro-icon">🥩</div>
                <div className="tmacro-name">Protein</div>
                <div className="tmacro-value">{macros.p}g</div>
                <div className="tmacro-cals">{macros.p * 4} kcal · 30%</div>
                <div className="tmacro-bar-bg">
                  <div className="tmacro-bar" style={{ width: '30%', backgroundColor: '#f97316' }}></div>
                </div>
              </div>
              <div className="tdee-macro-card carbs">
                <div className="tmacro-icon">🌾</div>
                <div className="tmacro-name">Carbohydrates</div>
                <div className="tmacro-value">{macros.c}g</div>
                <div className="tmacro-cals">{macros.c * 4} kcal · 45%</div>
                <div className="tmacro-bar-bg">
                  <div className="tmacro-bar" style={{ width: '45%', backgroundColor: '#3b82f6' }}></div>
                </div>
              </div>
              <div className="tdee-macro-card fats">
                <div className="tmacro-icon">🥑</div>
                <div className="tmacro-name">Fats</div>
                <div className="tmacro-value">{macros.f}g</div>
                <div className="tmacro-cals">{macros.f * 9} kcal · 25%</div>
                <div className="tmacro-bar-bg">
                  <div className="tmacro-bar" style={{ width: '25%', backgroundColor: '#22c55e' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Diet;
