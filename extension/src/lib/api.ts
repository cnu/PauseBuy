/**
 * Client Proxy Module
 *
 * Handles communication with the PauseBuy proxy backend.
 * Includes rate limit handling, error recovery, and fallbacks.
 */

import type { FinancialGoal } from "../store/types"

import { calculateGoalImpact } from "./goalImpact"

// Backend API URL - use environment variable in production
const API_BASE_URL = process.env.PLASMO_PUBLIC_API_URL || "https://pausebuy-api.vercel.app"

// Fallback questions when API is unavailable
const FALLBACK_QUESTIONS = [
  "Do you need this right now, or can it wait a few days?",
  "How will you feel about this purchase in a week?",
  "Is this aligned with your current financial goals?",
  "Would you still want this if there was no sale?",
  "Do you already own something that serves this purpose?"
]

export interface ProductInfo {
  name: string
  price: number
  category: string
  url?: string
  image?: string
}

export interface ReflectionContext {
  timeOfDay: "morning" | "afternoon" | "evening" | "night" | "late_night"
  goalName?: string
  recentPurchaseCount: number
  frictionLevel: number
}

export interface ReflectionRequest {
  product: ProductInfo
  context: ReflectionContext
}

export interface GoalImpact {
  goalName: string
  delayDays: number
  message: string
}

export interface ReflectionResponse {
  questions: string[]
  goalImpact: GoalImpact | null
  riskLevel: "low" | "medium" | "high"
  meta?: {
    clientId: string
    timestamp: string
    source: "claude" | "fallback"
    error?: string
    reason?: string
  }
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  resetAt: number
}

export interface APIError {
  error: string
  message?: string
  resetAt?: number
}

/**
 * Get the current time of day category
 */
function getTimeOfDay(): ReflectionContext["timeOfDay"] {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return "morning"
  if (hour >= 12 && hour < 17) return "afternoon"
  if (hour >= 17 && hour < 21) return "evening"
  if (hour >= 21 && hour < 23) return "night"
  return "late_night"
}

/**
 * Get client ID from storage (created on extension install)
 */
async function getClientId(): Promise<string> {
  const { clientId } = await chrome.storage.local.get("clientId")
  return clientId || "unknown"
}

/**
 * Get random fallback questions
 */
function getRandomFallbackQuestions(count: number = 2): string[] {
  const shuffled = [...FALLBACK_QUESTIONS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * Determine local risk level based on context
 */
function determineLocalRiskLevel(
  product: ProductInfo,
  context: ReflectionContext
): "low" | "medium" | "high" {
  let score = 0

  // Late night shopping
  if (context.timeOfDay === "late_night") score += 2
  else if (context.timeOfDay === "night") score += 1

  // Recent purchases
  if (context.recentPurchaseCount > 3) score += 2
  else if (context.recentPurchaseCount > 1) score += 1

  // Price-based
  if (product.price > 200) score += 2
  else if (product.price > 50) score += 1

  if (score >= 4) return "high"
  if (score >= 2) return "medium"
  return "low"
}

/**
 * Create a fallback response when API is unavailable
 */
function createFallbackResponse(
  product: ProductInfo,
  context: ReflectionContext,
  goals: FinancialGoal[],
  error?: string
): ReflectionResponse {
  const questionCount = context.frictionLevel >= 4 ? 3 : 2

  // Use the goal impact calculator for accurate impact assessment
  const impact = calculateGoalImpact(goals, product.price)

  return {
    questions: getRandomFallbackQuestions(questionCount),
    goalImpact: impact
      ? {
          goalName: impact.goalName,
          delayDays: impact.delayDays,
          message: impact.message
        }
      : null,
    riskLevel: determineLocalRiskLevel(product, context),
    meta: {
      clientId: "local",
      timestamp: new Date().toISOString(),
      source: "fallback",
      error
    }
  }
}

/**
 * Call the proxy API to generate reflection questions
 */
export async function callProxyAPI(
  product: ProductInfo,
  partialContext?: Partial<ReflectionContext>
): Promise<{ response: ReflectionResponse; rateLimit?: RateLimitInfo }> {
  // Build full context
  const { settings, goals, purchaseHistory } = await chrome.storage.local.get([
    "settings",
    "goals",
    "purchaseHistory"
  ])

  // Count recent purchases in same category (last 7 days)
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recentPurchases = (purchaseHistory || []).filter(
    (p: { timestamp: string; category?: string }) =>
      new Date(p.timestamp).getTime() > weekAgo && (!p.category || p.category === product.category)
  )

  // Get primary goal name
  const primaryGoal = (goals || []).find((g: { isPrimary?: boolean }) => g.isPrimary)

  const context: ReflectionContext = {
    timeOfDay: getTimeOfDay(),
    goalName: primaryGoal?.name,
    recentPurchaseCount: recentPurchases.length,
    frictionLevel: settings?.frictionLevel || 3,
    ...partialContext
  }

  const request: ReflectionRequest = { product, context }

  try {
    const clientId = await getClientId()

    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Extension-Id": clientId
      },
      body: JSON.stringify(request)
    })

    // Extract rate limit info from headers
    const rateLimit: RateLimitInfo = {
      limit: parseInt(response.headers.get("X-RateLimit-Limit") || "100", 10),
      remaining: parseInt(response.headers.get("X-RateLimit-Remaining") || "100", 10),
      resetAt: parseInt(
        response.headers.get("X-RateLimit-Reset") || String(Date.now() + 86400000),
        10
      )
    }

    // Handle rate limiting
    if (response.status === 429) {
      const errorData: APIError = await response.json()
      console.warn("[PauseBuy API] Rate limited:", errorData.message)

      // Store rate limit info
      await chrome.storage.local.set({
        rateLimitInfo: {
          exceeded: true,
          resetAt: errorData.resetAt || rateLimit.resetAt
        }
      })

      return {
        response: createFallbackResponse(product, context, goals || [], "rate_limit_exceeded"),
        rateLimit
      }
    }

    // Handle other errors
    if (!response.ok) {
      const errorText = await response.text()
      console.error("[PauseBuy API] Error:", response.status, errorText)
      return {
        response: createFallbackResponse(
          product,
          context,
          goals || [],
          `api_error_${response.status}`
        ),
        rateLimit
      }
    }

    const data: ReflectionResponse = await response.json()

    // Clear rate limit exceeded flag on success
    await chrome.storage.local.set({
      rateLimitInfo: {
        exceeded: false,
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt
      }
    })

    return { response: data, rateLimit }
  } catch (error) {
    // Network error or other failure
    console.error("[PauseBuy API] Network error:", error)
    return {
      response: createFallbackResponse(
        product,
        context,
        goals || [],
        error instanceof Error ? error.message : "network_error"
      )
    }
  }
}

/**
 * Check if we're currently rate limited
 */
export async function isRateLimited(): Promise<boolean> {
  const { rateLimitInfo } = await chrome.storage.local.get("rateLimitInfo")
  if (!rateLimitInfo?.exceeded) return false

  // Check if reset time has passed
  if (Date.now() > rateLimitInfo.resetAt) {
    await chrome.storage.local.set({
      rateLimitInfo: { ...rateLimitInfo, exceeded: false }
    })
    return false
  }

  return true
}

/**
 * Get rate limit status
 */
export async function getRateLimitStatus(): Promise<RateLimitInfo | null> {
  const { rateLimitInfo } = await chrome.storage.local.get("rateLimitInfo")
  if (!rateLimitInfo) return null

  return {
    limit: 100,
    remaining: rateLimitInfo.remaining || 0,
    resetAt: rateLimitInfo.resetAt || Date.now()
  }
}
