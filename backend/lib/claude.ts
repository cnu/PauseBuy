/**
 * Claude API Client
 *
 * Handles communication with Anthropic's Claude API for generating
 * personalized reflection questions.
 */

import Anthropic from "@anthropic-ai/sdk"

import type { ReflectionRequest } from "./validate"

// Initialize Anthropic client (uses ANTHROPIC_API_KEY env var)
const anthropic = new Anthropic()

const MODEL = "claude-3-haiku-20240307"
const MAX_TOKENS = 300
const TEMPERATURE = 0.7
const TIMEOUT_MS = 5000

export interface ClaudeResponse {
  questions: string[]
  reasoning?: string
}

/**
 * Build the prompt for Claude based on user context
 */
function buildPrompt(request: ReflectionRequest): string {
  const { product, context } = request

  const timeContext = {
    morning: "It's morning",
    afternoon: "It's the afternoon",
    evening: "It's evening",
    night: "It's nighttime",
    late_night: "It's late at night (after 11 PM)"
  }[context.timeOfDay]

  const goalContext = context.goalName
    ? `The user has a financial goal called "${context.goalName}".`
    : "The user hasn't set any specific financial goals."

  const recentContext =
    context.recentPurchaseCount > 0
      ? `The user has made ${context.recentPurchaseCount} purchase(s) in this category recently.`
      : ""

  return `You are a supportive financial wellness companion helping users make mindful purchase decisions. Your tone is warm, curious, and non-judgmental - like a thoughtful friend who wants the best for them.

Guidelines:
- Never shame or criticize the user
- Ask questions that promote genuine reflection
- Be brief - generate exactly 2-3 questions
- Reference their specific goals when relevant
- Consider time of day and emotional context
- End with an empowering choice, not a command

Context:
- Product: ${product.name}
- Price: $${product.price}
- Category: ${product.category}
- ${timeContext}
- ${goalContext}
- ${recentContext}
- User's preferred friction level: ${context.frictionLevel}/5 (higher = wants more reflection)

Generate 2-3 reflective questions that help the user pause and consider this purchase. Focus on need vs want, emotional state, and goal alignment. Keep each question under 25 words.

Respond with ONLY a JSON object in this exact format:
{"questions": ["question 1", "question 2", "question 3"]}`
}

/**
 * Parse Claude's response into structured format
 */
function parseResponse(content: string): ClaudeResponse {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return {
          questions: parsed.questions.slice(0, 3).map((q: string) => q.trim())
        }
      }
    }
  } catch (e) {
    console.error("[Claude] Failed to parse JSON response:", e)
  }

  // Fallback: try to extract questions from plain text
  const lines = content
    .split("\n")
    .filter((line) => line.trim().endsWith("?"))
    .slice(0, 3)

  if (lines.length > 0) {
    return { questions: lines.map((l) => l.replace(/^[\d\.\-\*]\s*/, "").trim()) }
  }

  throw new Error("Could not parse Claude response")
}

/**
 * Generate reflection questions using Claude API
 */
export async function generateReflectionQuestions(
  request: ReflectionRequest
): Promise<ClaudeResponse> {
  const prompt = buildPrompt(request)

  // Create abort controller for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const message = await anthropic.messages.create(
      {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      },
      {
        signal: controller.signal
      }
    )

    clearTimeout(timeoutId)

    // Extract text content from response
    const textContent = message.content.find((block) => block.type === "text")
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text content in Claude response")
    }

    return parseResponse(textContent.text)
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Claude API timeout")
      }
      throw error
    }

    throw new Error("Unknown error calling Claude API")
  }
}

/**
 * Generate questions with retry logic
 */
export async function generateWithRetry(
  request: ReflectionRequest,
  maxRetries: number = 1
): Promise<ClaudeResponse> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await generateReflectionQuestions(request)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(
        `[Claude] Attempt ${attempt + 1} failed:`,
        lastError.message
      )

      // Don't retry on certain errors
      if (
        lastError.message.includes("Invalid API key") ||
        lastError.message.includes("rate limit")
      ) {
        break
      }
    }
  }

  throw lastError || new Error("All retry attempts failed")
}
