import { useEffect, useState } from "react"

import "./globals.css"

import { usePauseBuyStore } from "./store"
import type { FinancialGoal } from "./store/types"

function OptionsPage() {
  const {
    profile,
    stats,
    goals,
    isLoading,
    initialize,
    updateSettings,
    addGoal,
    updateGoal,
    deleteGoal
  } = usePauseBuyStore()

  const [showAddGoal, setShowAddGoal] = useState(false)
  const [newGoal, setNewGoal] = useState({
    name: "",
    targetAmount: "",
    deadline: "",
    priority: "medium" as FinancialGoal["priority"]
  })

  useEffect(() => {
    initialize()
  }, [initialize])

  const handleAddGoal = async () => {
    if (!newGoal.name || !newGoal.targetAmount) return

    await addGoal({
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: 0,
      deadline: newGoal.deadline || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      priority: newGoal.priority
    })

    setNewGoal({ name: "", targetAmount: "", deadline: "", priority: "medium" })
    setShowAddGoal(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center">
        <div className="text-stone">Loading...</div>
      </div>
    )
  }

  const settings = profile?.settings

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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-charcoal">Financial Goals</h2>
            <button className="btn-primary text-sm py-2 px-4" onClick={() => setShowAddGoal(true)}>
              Add Goal
            </button>
          </div>

          {/* Add Goal Form */}
          {showAddGoal && (
            <div className="bg-white rounded-xl p-6 shadow-card mb-4 animate-slide-up">
              <h3 className="font-semibold text-charcoal mb-4">New Goal</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Goal Name</label>
                  <input
                    type="text"
                    value={newGoal.name}
                    onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                    placeholder="e.g., Summer Vacation"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Target Amount
                  </label>
                  <input
                    type="number"
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                    placeholder="5000"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Priority</label>
                  <select
                    value={newGoal.priority}
                    onChange={(e) =>
                      setNewGoal({
                        ...newGoal,
                        priority: e.target.value as FinancialGoal["priority"]
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button className="btn-primary flex-1" onClick={handleAddGoal}>
                    Save Goal
                  </button>
                  <button className="btn-secondary flex-1" onClick={() => setShowAddGoal(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {goals.length === 0 && !showAddGoal ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-card">
              <p className="text-stone mb-4">
                No goals set yet. Add a goal to track your progress!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100
                return (
                  <div key={goal.id} className="bg-white rounded-xl p-6 shadow-card">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-charcoal">{goal.name}</h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            goal.priority === "high"
                              ? "bg-red-100 text-red-700"
                              : goal.priority === "medium"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {goal.priority} priority
                        </span>
                      </div>
                      <button
                        className="text-stone hover:text-clay text-sm"
                        onClick={() => deleteGoal(goal.id)}
                      >
                        Delete
                      </button>
                    </div>
                    <div className="flex justify-between text-sm text-stone mb-2">
                      <span>${goal.currentAmount.toLocaleString()}</span>
                      <span>${goal.targetAmount.toLocaleString()}</span>
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
                  value={settings?.frictionLevel || 3}
                  onChange={(e) =>
                    updateSettings({ frictionLevel: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 })
                  }
                  className="w-32 accent-forest"
                />
                <span className="w-6 text-center font-semibold text-forest">
                  {settings?.frictionLevel || 3}
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
                  checked={settings?.notifications ?? true}
                  onChange={(e) => updateSettings({ notifications: e.target.checked })}
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
