/**
 * PauseBuy Background Service Worker
 *
 * Handles:
 * - Message routing between content scripts and popup
 * - API calls to the proxy backend
 * - Alarm scheduling for notifications
 * - Storage operations
 */

import type { PlasmoMessaging } from "@plasmohq/messaging"

// Initialize default state on install
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    // Set default values
    await chrome.storage.local.set({
      enabled: true,
      clientId: crypto.randomUUID(),
      stats: {
        savedToday: 0,
        savedTotal: 0,
        streak: 0
      },
      settings: {
        frictionLevel: 3,
        enabledSites: ["amazon.com", "ebay.com", "walmart.com", "target.com"],
        quietHours: null,
        notifications: true
      },
      goals: [],
      coolingOffList: [],
      purchaseHistory: []
    })

    console.log("PauseBuy installed and initialized")
  }
})

// Message handler types
export interface PurchaseDetectedMessage {
  type: "PURCHASE_DETECTED"
  product: {
    name: string
    price: number
    category: string
    url: string
    image?: string
  }
  site: string
  confidence: number
}

export interface SaveForLaterMessage {
  type: "SAVE_FOR_LATER"
  product: {
    name: string
    price: number
    url: string
    image?: string
  }
}

export interface PurchaseOutcomeMessage {
  type: "PURCHASE_OUTCOME"
  eventId: string
  outcome: "bought" | "saved" | "cooled_off"
  reflectionTime: number
}

export interface GetStatsMessage {
  type: "GET_STATS"
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse)
  return true // Keep channel open for async response
})

async function handleMessage(
  message: PurchaseDetectedMessage | SaveForLaterMessage | PurchaseOutcomeMessage | GetStatsMessage,
  sender: chrome.runtime.MessageSender
) {
  switch (message.type) {
    case "PURCHASE_DETECTED":
      return handlePurchaseDetected(message)

    case "SAVE_FOR_LATER":
      return handleSaveForLater(message)

    case "PURCHASE_OUTCOME":
      return handlePurchaseOutcome(message)

    case "GET_STATS":
      return handleGetStats()

    default:
      console.warn("Unknown message type:", message)
      return { error: "Unknown message type" }
  }
}

async function handlePurchaseDetected(message: PurchaseDetectedMessage) {
  const { enabled } = await chrome.storage.local.get("enabled")

  if (!enabled) {
    return { blocked: false, reason: "extension_disabled" }
  }

  // TODO: Call proxy API for reflection questions
  // For now, return fallback questions
  const fallbackQuestions = [
    "Do you need this right now, or can it wait a few days?",
    "How will you feel about this purchase in a week?",
    "Is this aligned with your current financial goals?"
  ]

  const eventId = crypto.randomUUID()

  return {
    blocked: true,
    eventId,
    questions: fallbackQuestions.slice(0, 2),
    goalImpact: null,
    riskLevel: "medium" as const
  }
}

async function handleSaveForLater(message: SaveForLaterMessage) {
  const { coolingOffList = [] } = await chrome.storage.local.get("coolingOffList")

  const newItem = {
    id: crypto.randomUUID(),
    product: message.product,
    savedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
    status: "pending" as const
  }

  coolingOffList.push(newItem)
  await chrome.storage.local.set({ coolingOffList })

  // Schedule reminder alarm
  chrome.alarms.create(`cooling-off-${newItem.id}`, {
    when: Date.now() + 48 * 60 * 60 * 1000
  })

  return { success: true, item: newItem }
}

async function handlePurchaseOutcome(message: PurchaseOutcomeMessage) {
  const { stats, purchaseHistory = [] } = await chrome.storage.local.get(["stats", "purchaseHistory"])

  // Log the event
  purchaseHistory.push({
    eventId: message.eventId,
    outcome: message.outcome,
    reflectionTime: message.reflectionTime,
    timestamp: new Date().toISOString()
  })

  // Update stats if user saved money
  if (message.outcome === "saved" || message.outcome === "cooled_off") {
    // TODO: Get actual price from the event
    stats.savedToday += 50 // Placeholder
    stats.savedTotal += 50
  }

  await chrome.storage.local.set({ stats, purchaseHistory })

  return { success: true }
}

async function handleGetStats() {
  const { stats } = await chrome.storage.local.get("stats")
  return stats || { savedToday: 0, savedTotal: 0, streak: 0 }
}

// Handle alarm for cooling-off reminders
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith("cooling-off-")) {
    const itemId = alarm.name.replace("cooling-off-", "")
    const { coolingOffList = [], settings } = await chrome.storage.local.get(["coolingOffList", "settings"])

    const item = coolingOffList.find((i: { id: string }) => i.id === itemId)

    if (item && settings?.notifications) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "assets/icon.png",
        title: "Still want this?",
        message: `Your 48-hour cooling off period for "${item.product.name}" has ended.`,
        buttons: [
          { title: "View Item" },
          { title: "Remove" }
        ]
      })
    }
  }
})

export {}
