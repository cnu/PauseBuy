/**
 * PauseBuy Store
 *
 * Main Zustand store with Chrome Storage persistence.
 * Manages all application state including user profile,
 * goals, stats, and cooling-off list.
 */

import { create } from "zustand"

import { chromeStorage } from "./chromeStorage"
import type {
  CoolingOffItem,
  FinancialGoal,
  PauseBuyState,
  PauseBuyStore,
  PurchaseEvent,
  UserProfile,
  UserSettings
} from "./types"

const DEFAULT_SETTINGS: UserSettings = {
  frictionLevel: 3,
  enabledSites: [
    "amazon.com",
    "amazon.co.uk",
    "ebay.com",
    "walmart.com",
    "target.com",
    "bestbuy.com",
    "etsy.com"
  ],
  quietHours: null,
  notifications: true
}

const DEFAULT_STATE: PauseBuyState = {
  profile: null,
  goals: [],
  stats: {
    savedToday: 0,
    savedTotal: 0,
    streak: 0,
    lastActiveDate: null
  },
  purchaseHistory: [],
  coolingOffList: [],
  triggerCategories: [],
  achievements: [],
  enabled: true,
  isLoading: true,
  lastSyncedAt: null
}

// Keys to persist to Chrome Storage (excludes transient state)
const PERSISTED_KEYS: (keyof PauseBuyState)[] = [
  "profile",
  "goals",
  "stats",
  "purchaseHistory",
  "coolingOffList",
  "triggerCategories",
  "achievements",
  "enabled"
]

export const usePauseBuyStore = create<PauseBuyStore>()(
  chromeStorage(
    (set, get) => ({
      ...DEFAULT_STATE,

      // Initialize store from Chrome Storage
      initialize: async () => {
        try {
          const result = await chrome.storage.local.get("pausebuy-store")
          const stored = result["pausebuy-store"] || {}

          // Create profile if doesn't exist
          let profile = stored.profile as UserProfile | null
          if (!profile) {
            profile = {
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              settings: DEFAULT_SETTINGS
            }
          }

          // Check and update streak
          const stats = stored.stats || DEFAULT_STATE.stats
          const today = new Date().toISOString().split("T")[0]
          const lastActive = stats.lastActiveDate

          if (lastActive) {
            const lastDate = new Date(lastActive)
            const todayDate = new Date(today)
            const diffDays = Math.floor(
              (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
            )

            if (diffDays > 1) {
              // Streak broken
              stats.streak = 0
            }
            if (diffDays >= 1) {
              // New day - reset daily savings
              stats.savedToday = 0
            }
          }

          set({
            ...stored,
            profile,
            stats,
            isLoading: false,
            lastSyncedAt: new Date().toISOString()
          })
        } catch (error) {
          console.error("[PauseBuy] Failed to initialize store:", error)
          set({ isLoading: false })
        }
      },

      // Update user settings
      updateSettings: async (settings) => {
        const { profile } = get()
        if (!profile) return

        const updatedProfile = {
          ...profile,
          settings: { ...profile.settings, ...settings }
        }

        set({ profile: updatedProfile })
      },

      // Add a new financial goal
      addGoal: async (goalData) => {
        const { goals } = get()
        const newGoal: FinancialGoal = {
          ...goalData,
          id: crypto.randomUUID()
        }

        set({ goals: [...goals, newGoal] })
      },

      // Update an existing goal
      updateGoal: async (id, updates) => {
        const { goals } = get()
        const updatedGoals = goals.map((goal) =>
          goal.id === id ? { ...goal, ...updates } : goal
        )

        set({ goals: updatedGoals })
      },

      // Delete a goal
      deleteGoal: async (id) => {
        const { goals } = get()
        set({ goals: goals.filter((goal) => goal.id !== id) })
      },

      // Record money saved from resisting an impulse purchase
      recordSaving: async (amount) => {
        const { stats } = get()
        const today = new Date().toISOString().split("T")[0]

        const updatedStats = {
          ...stats,
          savedToday: stats.savedToday + amount,
          savedTotal: stats.savedTotal + amount,
          lastActiveDate: today
        }

        set({ stats: updatedStats })
      },

      // Update streak (call daily)
      updateStreak: async () => {
        const { stats } = get()
        const today = new Date().toISOString().split("T")[0]

        if (stats.lastActiveDate !== today) {
          set({
            stats: {
              ...stats,
              streak: stats.streak + 1,
              lastActiveDate: today
            }
          })
        }
      },

      // Add item to cooling-off list
      addToCoolingOff: async (product) => {
        const { coolingOffList } = get()

        // Check for duplicates by URL
        if (coolingOffList.some((item) => item.product.url === product.url)) {
          console.log("[PauseBuy] Item already in cooling-off list")
          return
        }

        const newItem: CoolingOffItem = {
          id: crypto.randomUUID(),
          product,
          savedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          status: "pending",
          priceHistory: [{ date: new Date().toISOString(), price: product.price }]
        }

        set({ coolingOffList: [...coolingOffList, newItem] })

        // Schedule alarm for reminder
        try {
          await chrome.alarms.create(`cooling-off-${newItem.id}`, {
            when: Date.now() + 48 * 60 * 60 * 1000
          })
        } catch (error) {
          console.error("[PauseBuy] Failed to create alarm:", error)
        }
      },

      // Update cooling-off item status
      updateCoolingOffStatus: async (id, status) => {
        const { coolingOffList } = get()
        const updatedList = coolingOffList.map((item) =>
          item.id === id ? { ...item, status } : item
        )

        set({ coolingOffList: updatedList })
      },

      // Remove item from cooling-off list
      removeFromCoolingOff: async (id) => {
        const { coolingOffList } = get()
        set({ coolingOffList: coolingOffList.filter((item) => item.id !== id) })

        // Clear the alarm
        try {
          await chrome.alarms.clear(`cooling-off-${id}`)
        } catch (error) {
          console.error("[PauseBuy] Failed to clear alarm:", error)
        }
      },

      // Log a purchase event
      logPurchaseEvent: async (eventData) => {
        const { purchaseHistory, triggerCategories } = get()

        const event: PurchaseEvent = {
          ...eventData,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString()
        }

        // Update trigger category stats
        const category = event.product.category
        const existingCategory = triggerCategories.find(
          (tc) => tc.category === category
        )

        let updatedCategories = [...triggerCategories]
        if (existingCategory) {
          updatedCategories = triggerCategories.map((tc) =>
            tc.category === category
              ? {
                  ...tc,
                  purchaseCount: tc.purchaseCount + 1,
                  totalSpent:
                    event.outcome === "bought"
                      ? tc.totalSpent + event.product.price
                      : tc.totalSpent
                }
              : tc
          )
        } else {
          updatedCategories.push({
            category,
            riskLevel: "medium",
            autoFriction: false,
            totalSpent: event.outcome === "bought" ? event.product.price : 0,
            purchaseCount: 1
          })
        }

        set({
          purchaseHistory: [...purchaseHistory, event],
          triggerCategories: updatedCategories
        })
      },

      // Toggle extension enabled/disabled
      setEnabled: async (enabled) => {
        set({ enabled })
      }
    }),
    {
      name: "pausebuy-store",
      partialize: (state) => {
        // Only persist specific keys
        const persisted: Partial<PauseBuyState> = {}
        for (const key of PERSISTED_KEYS) {
          ;(persisted as Record<string, unknown>)[key] = state[key]
        }
        return persisted
      }
    }
  )
)

// Export types
export * from "./types"
