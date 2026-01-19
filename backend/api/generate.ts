/**
 * PauseBuy Proxy API - Generate Reflection Questions
 *
 * This Edge Function proxies requests to OpenAI GPT-5 Mini API, keeping the API key
 * secure on the server side. It handles CORS, request validation, and returns
 * personalized reflection questions.
 *
 * POST /api/generate
 * Body: { product: { name, price, category }, context: { timeOfDay, goalName, ... } }
 * Returns: { questions: string[], goalImpact: object | null, riskLevel: string }
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

import { generateWithRetry } from "../lib/openai";
import { checkRateLimit, getClientId } from "../lib/ratelimit";
import { validateRequest, type ReflectionRequest } from "../lib/validate";

// CORS headers for Chrome extension
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // In production, restrict to extension ID
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Extension-Id",
  "Access-Control-Expose-Headers":
    "X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset",
};

// Fallback questions when API is unavailable
const FALLBACK_QUESTIONS = [
  "Do you need this right now, or can it wait a few days?",
  "How will you feel about this purchase in a week?",
  "Is this aligned with your current financial goals?",
  "Would you still want this if there was no sale?",
  "Do you already own something that serves this purpose?",
];

function getRandomFallbackQuestions(count: number = 2): string[] {
  const shuffled = [...FALLBACK_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function determineRiskLevel(
  request: ReflectionRequest,
): "low" | "medium" | "high" {
  const { product, context } = request;

  let riskScore = 0;

  // Late night shopping is higher risk
  if (context.timeOfDay === "late_night") {
    riskScore += 2;
  } else if (context.timeOfDay === "night") {
    riskScore += 1;
  }

  // Recent purchases in same category
  if (context.recentPurchaseCount > 3) {
    riskScore += 2;
  } else if (context.recentPurchaseCount > 1) {
    riskScore += 1;
  }

  // Higher friction preference means user wants more intervention
  if (context.frictionLevel >= 4) {
    riskScore += 1;
  }

  // Price-based risk (higher prices = more consideration needed)
  if (product.price > 200) {
    riskScore += 2;
  } else if (product.price > 50) {
    riskScore += 1;
  }

  if (riskScore >= 4) return "high";
  if (riskScore >= 2) return "medium";
  return "low";
}

function calculateGoalImpact(request: ReflectionRequest) {
  if (!request.context.goalName) return null;

  // Simplified calculation - real implementation would use actual goal data
  const delayDays = Math.ceil(request.product.price / 50); // ~$50/day savings rate

  return {
    goalName: request.context.goalName,
    delayDays,
    message: `This purchase delays your "${request.context.goalName}" goal by ${delayDays} day${delayDays > 1 ? "s" : ""}.`,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    return res.status(200).end();
  }

  // Set CORS headers for all responses
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Validate request body
  const validation = validateRequest(req.body);
  if (!validation.valid) {
    return res.status(400).json({
      error: "Invalid request",
      details: validation.errors,
    });
  }

  const request = validation.data;

  // Get client ID for rate limiting
  const extensionId = req.headers["x-extension-id"] as string | undefined;
  const clientIp =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
    (req.headers["x-real-ip"] as string) ||
    undefined;
  const clientId = getClientId(extensionId, clientIp);

  // Check rate limit
  const rateLimit = await checkRateLimit(clientId);

  // Set rate limit headers on all responses
  res.setHeader("X-RateLimit-Limit", rateLimit.limit.toString());
  res.setHeader("X-RateLimit-Remaining", rateLimit.remaining.toString());
  res.setHeader("X-RateLimit-Reset", rateLimit.resetAt.toString());

  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: "Rate limit exceeded",
      message: `Daily limit of ${rateLimit.limit} requests exceeded. Resets at ${new Date(rateLimit.resetAt).toISOString()}.`,
      resetAt: rateLimit.resetAt,
    });
  }

  // Calculate common response fields
  const riskLevel = determineRiskLevel(request);
  const goalImpact = calculateGoalImpact(request);

  try {
    // TODO: pb-oe1 - Log to Opik

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn("[PauseBuy API] OPENAI_API_KEY not set, using fallbacks");
      return res.status(200).json({
        questions: getRandomFallbackQuestions(
          request.context.frictionLevel >= 4 ? 3 : 2,
        ),
        goalImpact,
        riskLevel,
        meta: {
          clientId,
          timestamp: new Date().toISOString(),
          source: "fallback",
          reason: "api_key_not_configured",
        },
      });
    }

    // Call OpenAI GPT-5 Mini API with retry
    const llmResponse = await generateWithRetry(request, 1);

    return res.status(200).json({
      questions: llmResponse.questions,
      goalImpact,
      riskLevel,
      meta: {
        clientId,
        timestamp: new Date().toISOString(),
        source: "openai",
      },
    });
  } catch (error) {
    console.error("[PauseBuy API] Error:", error);

    // Return fallback on any error
    const questionCount = request.context.frictionLevel >= 4 ? 3 : 2;

    return res.status(200).json({
      questions: getRandomFallbackQuestions(questionCount),
      goalImpact,
      riskLevel,
      meta: {
        clientId,
        timestamp: new Date().toISOString(),
        source: "fallback",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}
