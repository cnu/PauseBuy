import { useState, useEffect } from "react"

import "./style.css"

function IndexPopup() {
  const [enabled, setEnabled] = useState(true)
  const [stats, setStats] = useState({
    savedToday: 0,
    savedTotal: 0,
    streak: 0
  })

  useEffect(() => {
    // Load state from storage
    chrome.storage.local.get(["enabled", "stats"], (result) => {
      if (result.enabled !== undefined) {
        setEnabled(result.enabled)
      }
      if (result.stats) {
        setStats(result.stats)
      }
    })
  }, [])

  const toggleEnabled = () => {
    const newEnabled = !enabled
    setEnabled(newEnabled)
    chrome.storage.local.set({ enabled: newEnabled })
  }

  return (
    <div className="popup-container">
      <header className="popup-header">
        <div className="logo">
          <span className="logo-icon">⏸️</span>
          <span className="logo-text">PauseBuy</span>
        </div>
        <button
          className={`toggle-btn ${enabled ? 'active' : ''}`}
          onClick={toggleEnabled}
          aria-label={enabled ? 'Disable PauseBuy' : 'Enable PauseBuy'}
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </header>

      <main className="popup-content">
        <div className="stats-card">
          <div className="stat-item">
            <span className="stat-value">${stats.savedToday}</span>
            <span className="stat-label">Saved Today</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">${stats.savedTotal}</span>
            <span className="stat-label">Total Saved</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">{stats.streak}</span>
            <span className="stat-label">Day Streak</span>
          </div>
        </div>

        <div className="quick-links">
          <button
            className="link-btn"
            onClick={() => chrome.runtime.openOptionsPage()}
          >
            View Dashboard
          </button>
        </div>
      </main>

      <footer className="popup-footer">
        <p className="tagline">Mindful shopping, one pause at a time</p>
      </footer>
    </div>
  )
}

export default IndexPopup
