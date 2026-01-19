import { useState, useEffect } from "react"

import "./style.css"

/**
 * PauseBuy Dashboard / Options Page
 *
 * Full analytics dashboard with goal management, pattern insights, and settings.
 */

function OptionsPage() {
  const [stats, setStats] = useState({
    savedToday: 0,
    savedTotal: 0,
    streak: 0
  })
  const [goals, setGoals] = useState<Array<{
    id: string
    name: string
    targetAmount: number
    currentAmount: number
    deadline: string
  }>>([])
  const [settings, setSettings] = useState({
    frictionLevel: 3,
    notifications: true
  })

  useEffect(() => {
    chrome.storage.local.get(["stats", "goals", "settings"], (result) => {
      if (result.stats) setStats(result.stats)
      if (result.goals) setGoals(result.goals)
      if (result.settings) setSettings(result.settings)
    })
  }, [])

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="logo">
          <span className="logo-icon">⏸️</span>
          <span className="logo-text">PauseBuy</span>
        </div>
        <h1>Dashboard</h1>
      </header>

      <main className="dashboard-content">
        <section className="section">
          <h2>Your Savings</h2>
          <div className="stats-grid">
            <div className="stats-card large">
              <span className="stat-value">${stats.savedTotal}</span>
              <span className="stat-label">Total Saved</span>
            </div>
            <div className="stats-card">
              <span className="stat-value">${stats.savedToday}</span>
              <span className="stat-label">Saved Today</span>
            </div>
            <div className="stats-card">
              <span className="stat-value">{stats.streak}</span>
              <span className="stat-label">Day Streak</span>
            </div>
          </div>
        </section>

        <section className="section">
          <h2>Financial Goals</h2>
          {goals.length === 0 ? (
            <div className="empty-state">
              <p>No goals set yet. Add a goal to track your progress!</p>
              <button className="primary-btn">Add Goal</button>
            </div>
          ) : (
            <div className="goals-list">
              {goals.map((goal) => (
                <div key={goal.id} className="goal-card">
                  <div className="goal-info">
                    <h3>{goal.name}</h3>
                    <p>${goal.currentAmount} of ${goal.targetAmount}</p>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(goal.currentAmount / goal.targetAmount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="section">
          <h2>Settings</h2>
          <div className="settings-form">
            <div className="setting-row">
              <label>Friction Level</label>
              <input
                type="range"
                min="1"
                max="5"
                value={settings.frictionLevel}
                onChange={(e) => {
                  const newSettings = { ...settings, frictionLevel: parseInt(e.target.value) }
                  setSettings(newSettings)
                  chrome.storage.local.set({ settings: newSettings })
                }}
              />
              <span>{settings.frictionLevel}</span>
            </div>
            <div className="setting-row">
              <label>Notifications</label>
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => {
                  const newSettings = { ...settings, notifications: e.target.checked }
                  setSettings(newSettings)
                  chrome.storage.local.set({ settings: newSettings })
                }}
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="dashboard-footer">
        <p>PauseBuy v0.1.0 - Mindful shopping, one pause at a time</p>
      </footer>
    </div>
  )
}

export default OptionsPage
