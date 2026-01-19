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

import { callProxyAPI, isRateLimited } from "./lib/api"

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
  handleMessage(message, sender).then(async (response) => {
    // If purchase was blocked, send overlay message to the tab
    if (response?.blocked && sender.tab?.id) {
      await chrome.tabs.sendMessage(sender.tab.id, {
        type: "SHOW_OVERLAY",
        eventId: response.eventId,
        product: message.product,
        questions: response.questions,
        goalImpact: response.goalImpact,
        riskLevel: response.riskLevel
      })
    }
    sendResponse(response)
  })
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
  const { enabled, settings } = await chrome.storage.local.get(["enabled", "settings"])

  if (!enabled) {
    return { blocked: false, reason: "extension_disabled" }
  }

  // Check quiet hours
  if (settings?.quietHours) {
    const now = new Date()
    const currentHour = now.getHours()
    const { start, end } = settings.quietHours
    if (
      (start <= end && currentHour >= start && currentHour < end) ||
      (start > end && (currentHour >= start || currentHour < end))
    ) {
      return { blocked: false, reason: "quiet_hours" }
    }
  }

  // Check if site is in enabled list
  if (settings?.enabledSites?.length > 0) {
    const siteEnabled = settings.enabledSites.some((site: string) => message.site.includes(site))
    if (!siteEnabled) {
      return { blocked: false, reason: "site_not_enabled" }
    }
  }

  // Check confidence threshold (minimum 50%)
  if (message.confidence < 50) {
    return { blocked: false, reason: "low_confidence" }
  }

  const eventId = crypto.randomUUID()

  // Call proxy API for reflection questions
  const { response, rateLimit } = await callProxyAPI(message.product)

  // Log event for tracking
  const { purchaseHistory = [] } = await chrome.storage.local.get("purchaseHistory")
  purchaseHistory.push({
    id: eventId,
    eventId, // Keep for backwards compatibility
    product: message.product,
    site: message.site,
    confidence: message.confidence,
    timestamp: new Date().toISOString(),
    riskLevel: response.riskLevel,
    questionsAsked: response.questions,
    userResponses: [], // Will be updated on outcome
    reflectionTime: 0, // Will be updated on outcome
    outcome: "pending" as const, // Will be updated on outcome
    source: response.meta?.source || "unknown"
  })
  await chrome.storage.local.set({ purchaseHistory })

  return {
    blocked: true,
    eventId,
    questions: response.questions,
    goalImpact: response.goalImpact,
    riskLevel: response.riskLevel,
    rateLimit
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
  const { stats, purchaseHistory = [] } = await chrome.storage.local.get([
    "stats",
    "purchaseHistory"
  ])

  // Find and update the existing event
  const eventIndex = purchaseHistory.findIndex(
    (e: { eventId?: string; id?: string }) =>
      e.eventId === message.eventId || e.id === message.eventId
  )

  let savedAmount = 0

  if (eventIndex !== -1) {
    const event = purchaseHistory[eventIndex]
    event.outcome = message.outcome
    event.reflectionTime = message.reflectionTime
    savedAmount = event.product?.price || 0
  } else {
    // Fallback: create new entry if event not found
    purchaseHistory.push({
      id: message.eventId,
      eventId: message.eventId,
      outcome: message.outcome,
      reflectionTime: message.reflectionTime,
      timestamp: new Date().toISOString()
    })
  }

  // Update stats if user saved money
  if (message.outcome === "saved" || message.outcome === "cooled_off") {
    stats.savedToday += savedAmount
    stats.savedTotal += savedAmount
  }

  await chrome.storage.local.set({ stats, purchaseHistory })

  return { success: true, savedAmount }
}

async function handleGetStats() {
  const { stats } = await chrome.storage.local.get("stats")
  return stats || { savedToday: 0, savedTotal: 0, streak: 0 }
}

// Handle alarm for cooling-off reminders
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith("cooling-off-")) {
    const itemId = alarm.name.replace("cooling-off-", "")
    const { coolingOffList = [], settings } = await chrome.storage.local.get([
      "coolingOffList",
      "settings"
    ])

    const item = coolingOffList.find((i: { id: string }) => i.id === itemId)

    if (item && settings?.notifications) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "assets/icon.png",
        title: "Still want this?",
        message: `Your 48-hour cooling off period for "${item.product.name}" has ended.`,
        buttons: [{ title: "View Item" }, { title: "Remove" }]
      })
    }
  }
})

export {}
