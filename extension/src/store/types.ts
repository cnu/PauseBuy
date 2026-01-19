/**
 * PauseBuy Store Types
 *
 * Data model matching the architecture specification.
 * All data is stored locally via Chrome Storage API.
 */

export interface UserProfile {
  id: string
  createdAt: string
  settings: UserSettings
}

export interface UserSettings {
  frictionLevel: 1 | 2 | 3 | 4 | 5
  enabledSites: string[]
  quietHours: { start: string; end: string } | null
  notifications: boolean
}

export interface FinancialGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string
  priority: "high" | "medium" | "low"
}

export interface TriggerCategory {
  category: string
  riskLevel: "high" | "medium" | "low"
  autoFriction: boolean
  totalSpent: number
  purchaseCount: number
}

export interface ProductInfo {
  name: string
  price: number
  category: string
  url: string
  image?: string
}

export interface PurchaseEvent {
  id: string
  timestamp: string
  product: ProductInfo
  site: string
  outcome: "bought" | "saved" | "cooled_off"
  questionsAsked: string[]
  userResponses: string[]
  reflectionTime: number
}

export interface CoolingOffItem {
  id: string
  product: {
    name: string
    price: number
    url: string
    image?: string
  }
  savedAt: string
  expiresAt: string
  status: "pending" | "purchased" | "expired" | "deleted"
  priceHistory: { date: string; price: number }[]
}

export interface Achievement {
  id: string
  type: "streak" | "savings" | "milestone"
  name: string
  unlockedAt: string
  data: Record<string, unknown>
}

export interface Stats {
  savedToday: number
  savedTotal: number
  streak: number
  lastActiveDate: string | null
}

// Store state shape
export interface PauseBuyState {
  // User
  profile: UserProfile | null

  // Financial
  goals: FinancialGoal[]

  // Tracking
  stats: Stats
  purchaseHistory: PurchaseEvent[]
  coolingOffList: CoolingOffItem[]
  triggerCategories: TriggerCategory[]
  achievements: Achievement[]

  // App state
  enabled: boolean
  isLoading: boolean
  lastSyncedAt: string | null
}

// Store actions
export interface PauseBuyActions {
  // Initialization
  initialize: () => Promise<void>

  // Profile
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>

  // Goals
  addGoal: (goal: Omit<FinancialGoal, "id">) => Promise<void>
  updateGoal: (id: string, updates: Partial<FinancialGoal>) => Promise<void>
  deleteGoal: (id: string) => Promise<void>

  // Stats
  recordSaving: (amount: number) => Promise<void>
  updateStreak: () => Promise<void>

  // Cooling-off list
  addToCoolingOff: (product: CoolingOffItem["product"]) => Promise<void>
  updateCoolingOffStatus: (id: string, status: CoolingOffItem["status"]) => Promise<void>
  removeFromCoolingOff: (id: string) => Promise<void>

  // Purchase events
  logPurchaseEvent: (event: Omit<PurchaseEvent, "id" | "timestamp">) => Promise<void>

  // Toggle
  setEnabled: (enabled: boolean) => Promise<void>
}

export type PauseBuyStore = PauseBuyState & PauseBuyActions
