import { useEffect, useState } from "react"

import "./globals.css"

interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string
}

function OptionsPage() {
  const [stats, setStats] = useState({
    savedToday: 0,
    savedTotal: 0,
    streak: 0
  })
  const [goals, setGoals] = useState<Goal[]>([])
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

  const updateSettings = (newSettings: typeof settings) => {
    setSettings(newSettings)
    chrome.storage.local.set({ settings: newSettings })
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <span className="text-3xl">⏸️</span>
          <div>
            <h1 className="text-2xl font-bold text-forest">PauseBuy</h1>
            <p className="text-sm text-stone">Dashboard</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-8 py-8 space-y-8">
        {/* Savings Overview */}
        <section className="animate-fade-in">
          <h2 className="text-lg font-semibold text-charcoal mb-4">Your Savings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="stats-card">
              <span className="text-3xl font-bold">${stats.savedTotal}</span>
              <span className="text-sm opacity-90 mt-2 block">Total Saved</span>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-card">
              <span className="text-3xl font-bold text-forest">${stats.savedToday}</span>
              <span className="text-sm text-stone mt-2 block">Saved Today</span>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-card">
              <span className="text-3xl font-bold text-forest">{stats.streak}</span>
              <span className="text-sm text-stone mt-2 block">Day Streak</span>
            </div>
          </div>
        </section>

        {/* Financial Goals */}
        <section className="animate-fade-in">
          <h2 className="text-lg font-semibold text-charcoal mb-4">Financial Goals</h2>
          {goals.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-card">
              <p className="text-stone mb-4">
                No goals set yet. Add a goal to track your progress!
              </p>
              <button className="btn-primary">Add Goal</button>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100
                return (
                  <div key={goal.id} className="bg-white rounded-xl p-6 shadow-card">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-charcoal">{goal.name}</h3>
                      <span className="text-sm text-stone">
                        ${goal.currentAmount.toLocaleString()} of $
                        {goal.targetAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-stone mt-2">{progress.toFixed(0)}% complete</p>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Settings */}
        <section className="animate-fade-in">
          <h2 className="text-lg font-semibold text-charcoal mb-4">Settings</h2>
          <div className="bg-white rounded-xl p-6 shadow-card space-y-6">
            {/* Friction Level */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-charcoal">Friction Level</label>
                <p className="text-sm text-stone">Higher = more questions before purchase</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={settings.frictionLevel}
                  onChange={(e) =>
                    updateSettings({
                      ...settings,
                      frictionLevel: parseInt(e.target.value)
                    })
                  }
                  className="w-32 accent-forest"
                />
                <span className="w-6 text-center font-semibold text-forest">
                  {settings.frictionLevel}
                </span>
              </div>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-charcoal">Notifications</label>
                <p className="text-sm text-stone">Get reminded about cooling-off items</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) =>
                    updateSettings({
                      ...settings,
                      notifications: e.target.checked
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-forest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest" />
              </label>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-4xl mx-auto px-8 py-6 text-center">
          <p className="text-sm text-stone">
            PauseBuy v0.1.0 — Mindful shopping, one pause at a time
          </p>
        </div>
      </footer>
    </div>
  )
}

export default OptionsPage
