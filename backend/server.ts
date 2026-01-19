/**
 * Simple local development server for PauseBuy backend
 *
 * This provides a standalone HTTP server for testing without Vercel CLI auth.
 * Run with: npx tsx server.ts
 */

import { createServer, IncomingMessage, ServerResponse } from "http";
import { generateWithRetry, getTimeOfDay } from "./lib/openai";
import { validateRequest, type ReflectionRequest } from "./lib/validate";

const PORT = process.env.PORT || 3001;

// CORS headers
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Extension-Id",
  "Content-Type": "application/json",
};

// Fallback questions
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
  const timeOfDay = getTimeOfDay(context.localDateTime);
  let riskScore = 0;

  if (timeOfDay === "late_night") riskScore += 2;
  else if (timeOfDay === "night") riskScore += 1;

  if (context.recentPurchaseCount > 3) riskScore += 2;
  else if (context.recentPurchaseCount > 1) riskScore += 1;

  if (context.frictionLevel >= 4) riskScore += 1;

  if (product.price > 200) riskScore += 2;
  else if (product.price > 50) riskScore += 1;

  if (riskScore >= 4) return "high";
  if (riskScore >= 2) return "medium";
  return "low";
}

function calculateGoalImpact(request: ReflectionRequest) {
  if (!request.context.goalName) return null;
  const delayDays = Math.ceil(request.product.price / 50);
  return {
    goalName: request.context.goalName,
    delayDays,
    message: `This purchase delays your "${request.context.goalName}" goal by ${delayDays} day${delayDays > 1 ? "s" : ""}.`,
  };
}

function parseBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function sendResponse(res: ServerResponse, status: number, data: unknown) {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  res.writeHead(status);
  res.end(JSON.stringify(data, null, 2));
}

async function handleGenerate(req: IncomingMessage, res: ServerResponse) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== "POST") {
    return sendResponse(res, 405, { error: "Method not allowed" });
  }

  try {
    const body = await parseBody(req);
    const validation = validateRequest(body);

    if (!validation.valid) {
      return sendResponse(res, 400, {
        error: "Invalid request",
        details: validation.errors,
      });
    }

    const request = validation.data;
    const riskLevel = determineRiskLevel(request);
    const goalImpact = calculateGoalImpact(request);
    const clientId = `local-${Date.now()}`;

    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      console.warn("[Local Server] OPENAI_API_KEY not set, using fallbacks");
      return sendResponse(res, 200, {
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

    // Call OpenAI
    const llmResponse = await generateWithRetry(request, 1);

    return sendResponse(res, 200, {
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
    console.error("[Local Server] Error:", error);

    // Return fallback on error
    return sendResponse(res, 200, {
      questions: getRandomFallbackQuestions(2),
      goalImpact: null,
      riskLevel: "medium",
      meta: {
        clientId: `local-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "fallback",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);

  console.log(`[${new Date().toISOString()}] ${req.method} ${url.pathname}`);

  if (url.pathname === "/api/generate") {
    await handleGenerate(req, res);
  } else if (url.pathname === "/health") {
    sendResponse(res, 200, {
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  } else {
    sendResponse(res, 404, { error: "Not found" });
  }
});

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║              PauseBuy Local Development Server               ║
╠══════════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${PORT}                    ║
║  API endpoint:      http://localhost:${PORT}/api/generate       ║
║  Health check:      http://localhost:${PORT}/health             ║
╠══════════════════════════════════════════════════════════════╣
║  Environment:                                                ║
║  - OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? "✓ Set" : "✗ Not set (using fallbacks)"}                         ║
╚══════════════════════════════════════════════════════════════╝
`);
});
