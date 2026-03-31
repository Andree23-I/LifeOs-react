import React, { useState, useEffect, useContext } from 'react';
import './Diet.css';
import { SettingsContext } from '../contexts/SettingsContext';
import { translations } from '../translations';


const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  mod: 1.55,
  active: 1.725,
  very: 1.9,
};

function Diet({ user }) {
  const { language } = useContext(SettingsContext);
  const t = translations[language];

  const ACTIVITY_LABELS = {
    sedentary: t.activitySedentary,
    light: t.activityLight,
    mod: t.activityMod,
    active: t.activityActive,
    very: t.activityVery,
  };

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
    { label: t.aggressiveCut, rawLabel: 'lose_aggressive', cals: tdeeBreakdown.lose_aggressive, tag: '-1000 kcal', color: '#ef4444' },
    { label: t.cutLoseFat, rawLabel: 'lose', cals: tdeeBreakdown.lose, tag: '-500 kcal', color: '#f97316' },
    { label: t.maintenance, rawLabel: 'maintain', cals: tdeeBreakdown.maintain, tag: 'Maintenance', color: 'var(--primary)' },
    { label: t.leanBulk, rawLabel: 'gain', cals: tdeeBreakdown.gain, tag: '+300 kcal', color: '#22c55e' },
    { label: t.aggressiveBulk, rawLabel: 'gain_aggressive', cals: tdeeBreakdown.gain_aggressive, tag: '+500 kcal', color: '#a855f7' },
  ];

  return (
    <div className="diet fade-in">
      <header className="page-header">
        <h1>{t.dietNutrition}</h1>
        <p className="subtitle">{t.trackMacros}</p>
      </header>

      {/* Tab Navigation */}
      <div className="diet-tabs">
        <button
          className={`diet-tab-btn ${activeTab === 'tracker' ? 'active' : ''}`}
          onClick={() => setActiveTab('tracker')}
        >
          {t.dailyTracker}
        </button>
        <button
          className={`diet-tab-btn ${activeTab === 'tdee' ? 'active' : ''}`}
          onClick={() => setActiveTab('tdee')}
        >
          {t.tdeeCalc}
        </button>
      </div>

      {/* ── DAILY TRACKER TAB ── */}
      {activeTab === 'tracker' && (
        <div className="diet-content">
          <div className="diet-left-col">
            <div className="glass-panel stat-card summary-card bmr-card">
              <div className="stat-title">{t.dailyEnergyTarget}</div>
              <div className="stat-value">{tdee} <span style={{fontSize: '1rem', color: 'var(--text-muted)'}}>kcal</span></div>

              <div className="macros-grid">
                <div className="macro-chip">{t.protein} <strong>{macros.p}g</strong></div>
                <div className="macro-chip">{t.fats} <strong>{macros.f}g</strong></div>
                <div className="macro-chip">{t.carbs} <strong>{macros.c}g</strong></div>
              </div>

              <div className="diet-progress-wrap mt-4">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <span>{t.consumed}: <strong>{calsConsumed}</strong></span>
                  <span>{t.remaining}: <strong style={{ color: calsConsumed > tdee ? '#ef4444' : 'var(--primary)' }}>{calsRemaining}</strong></span>
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
              <h2>{t.bodySettings}</h2>
              <div className="stats-form">
                <div className="form-group">
                  <label>{t.age}</label>
                  <input type="number" name="age" value={stats.age} onChange={handleStatChange} className="task-input compact-input" />
                </div>
                <div className="form-group">
                  <label>{t.gender}</label>
                  <select name="gender" value={stats.gender} onChange={handleStatChange} className="task-input compact-input">
                    <option value="male">{t.male}</option>
                    <option value="female">{t.female}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t.weight}</label>
                  <input type="number" name="weight" value={stats.weight} onChange={handleStatChange} className="task-input compact-input" />
                </div>
                <div className="form-group">
                  <label>{t.height}</label>
                  <input type="number" name="height" value={stats.height} onChange={handleStatChange} className="task-input compact-input" />
                </div>
                <div className="form-group">
                  <label>{t.activityLevel}</label>
                  <select name="activity" value={stats.activity} onChange={handleStatChange} className="task-input compact-input">
                    {Object.entries(ACTIVITY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t.primaryGoal}</label>
                  <select name="goal" value={stats.goal} onChange={handleStatChange} className="task-input compact-input">
                    <option value="lose">{t.loseWeight}</option>
                    <option value="maintain">{t.maintainWeight}</option>
                    <option value="gain">{t.buildMuscle}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="diet-right-col">
            <div className="glass-panel food-log-panel">
              <h2>{t.todaysFoodLog}</h2>
              <form onSubmit={addFood} className="food-form">
                <input
                  type="text"
                  placeholder={t.whatDidYouEat}
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
                  <div className="empty-state" style={{ padding: '2rem' }}>{t.noMealsLogged}</div>
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
              <h2>{t.measurements}</h2>
              <p className="tdee-desc">{t.tdeeDesc1}</p>
              <div className="stats-form">
                <div className="form-group">
                  <label>{t.age}</label>
                  <input type="number" name="age" value={stats.age} onChange={handleStatChange} className="task-input compact-input" />
                </div>
                <div className="form-group">
                  <label>{t.gender}</label>
                  <select name="gender" value={stats.gender} onChange={handleStatChange} className="task-input compact-input">
                    <option value="male">{t.male}</option>
                    <option value="female">{t.female}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t.weight}</label>
                  <input type="number" name="weight" value={stats.weight} onChange={handleStatChange} className="task-input compact-input" />
                </div>
                <div className="form-group">
                  <label>{t.height}</label>
                  <input type="number" name="height" value={stats.height} onChange={handleStatChange} className="task-input compact-input" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>{t.activityLevel}</label>
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
                <div className="tdee-result-label">{t.bmrLabel}</div>
                <div className="tdee-result-value">{bmr}</div>
                <div className="tdee-result-unit">{t.bmrUnit}</div>
              </div>
              <div className="glass-panel tdee-result-card maintenance-result">
                <div className="tdee-result-label">{t.tdeeLabel}</div>
                <div className="tdee-result-value">{tdeeBreakdown.maintain}</div>
                <div className="tdee-result-unit">{t.tdeeUnit}</div>
                <div className="tdee-multiplier">× {ACTIVITY_MULTIPLIERS[stats.activity]} {t.activityMultiplier}</div>
              </div>
            </div>
          </div>

          {/* Calorie Scenarios Breakdown */}
          <div className="glass-panel tdee-breakdown-panel">
            <h2>{t.calorieGoalBreakdown}</h2>
            <p className="tdee-desc">{t.tdeeDesc2}</p>
            <div className="tdee-breakdown-table">
              {tdeeRows.map((row) => (
                <div
                  key={row.label}
                  className={`tdee-row ${stats.goal === row.rawLabel ? 'highlighted' : ''}`}
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
            <h2>{t.recommendedMacroSplit}</h2>
            <p className="tdee-desc">{t.macroDesc1} <strong>{stats.goal === 'lose' ? t.losingFat : stats.goal === 'gain' ? t.buildingMuscle : t.maintainingWeight}</strong></p>
            <div className="tdee-macros-grid">
              <div className="tdee-macro-card protein">
                <div className="tmacro-icon">🥩</div>
                <div className="tmacro-name">{t.protein}</div>
                <div className="tmacro-value">{macros.p}g</div>
                <div className="tmacro-cals">{macros.p * 4} kcal · 30%</div>
                <div className="tmacro-bar-bg">
                  <div className="tmacro-bar" style={{ width: '30%', backgroundColor: '#f97316' }}></div>
                </div>
              </div>
              <div className="tdee-macro-card carbs">
                <div className="tmacro-icon">🌾</div>
                <div className="tmacro-name">{t.carbohydrates}</div>
                <div className="tmacro-value">{macros.c}g</div>
                <div className="tmacro-cals">{macros.c * 4} kcal · 45%</div>
                <div className="tmacro-bar-bg">
                  <div className="tmacro-bar" style={{ width: '45%', backgroundColor: '#3b82f6' }}></div>
                </div>
              </div>
              <div className="tdee-macro-card fats">
                <div className="tmacro-icon">🥑</div>
                <div className="tmacro-name">{t.fats}</div>
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
