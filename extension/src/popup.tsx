import { useEffect, useState } from "react"

import "./globals.css"

function IndexPopup() {
  const [enabled, setEnabled] = useState(true)
  const [stats, setStats] = useState({
    savedToday: 0,
    savedTotal: 0,
    streak: 0
  })

  useEffect(() => {
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
    <div className="w-80 min-h-[280px] flex flex-col bg-[#f8f8f8]">
      {/* Header */}
      <header className="flex justify-between items-center p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⏸️</span>
          <span className="text-lg font-semibold text-forest">PauseBuy</span>
        </div>
        <button
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200
            ${
              enabled
                ? "bg-forest text-white border-2 border-forest"
                : "bg-white text-stone border-2 border-gray-200"
            } hover:-translate-y-0.5`}
          onClick={toggleEnabled}
          aria-label={enabled ? "Disable PauseBuy" : "Enable PauseBuy"}
        >
          {enabled ? "ON" : "OFF"}
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 p-4">
        {/* Stats Card */}
        <div className="stats-card flex justify-between items-center">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold">${stats.savedToday}</span>
            <span className="text-xs opacity-90 mt-1">Saved Today</span>
          </div>
          <div className="w-px h-10 bg-white/30" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold">${stats.savedTotal}</span>
            <span className="text-xs opacity-90 mt-1">Total Saved</span>
          </div>
          <div className="w-px h-10 bg-white/30" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold">{stats.streak}</span>
            <span className="text-xs opacity-90 mt-1">Day Streak</span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-4">
          <button className="btn-secondary w-full" onClick={() => chrome.runtime.openOptionsPage()}>
            View Dashboard
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-3 text-center border-t border-gray-200 bg-white">
        <p className="text-xs text-stone">Mindful shopping, one pause at a time</p>
      </footer>
    </div>
  )
}

export default IndexPopup
