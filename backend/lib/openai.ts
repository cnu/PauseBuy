/**
 * OpenAI API Client
 *
 * Handles communication with OpenAI's GPT-5 Mini API for generating
 * personalized reflection questions.
 */

import OpenAI from "openai";

import type { ReflectionRequest } from "./validate";

// Lazy-initialized OpenAI client to allow startup without API key
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    openaiClient = new OpenAI();
  }
  return openaiClient;
}

const MODEL = "gpt-5-mini";
// GPT-5-mini is a reasoning model that uses internal thinking tokens
// Reasoning can use 500-1500 tokens, plus we need ~200 for output
const MAX_COMPLETION_TOKENS = 2000;
// Note: GPT-5 Mini only supports temperature=1 (default)
const TIMEOUT_MS = 30000; // Reasoning models take longer

export interface LLMResponse {
  questions: string[];
  reasoning?: string;
}

/**
 * Build the prompt based on user context
 */
function buildPrompt(request: ReflectionRequest): string {
  const { product, context } = request;

  const timeContext = {
    morning: "It's morning",
    afternoon: "It's the afternoon",
    evening: "It's evening",
    night: "It's nighttime",
    late_night: "It's late at night (after 11 PM)",
  }[context.timeOfDay];

  const goalContext = context.goalName
    ? `The user has a financial goal called "${context.goalName}".`
    : "The user hasn't set any specific financial goals.";

  const recentContext =
    context.recentPurchaseCount > 0
      ? `The user has made ${context.recentPurchaseCount} purchase(s) in this category recently.`
      : "";

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
{"questions": ["question 1", "question 2", "question 3"]}`;
}

/**
 * Parse the LLM response into structured format
 */
function parseResponse(content: string): LLMResponse {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return {
          questions: parsed.questions.slice(0, 3).map((q: string) => q.trim()),
        };
      }
    }
  } catch (e) {
    console.error("[OpenAI] Failed to parse JSON response:", e);
  }

  // Fallback: try to extract questions from plain text
  const lines = content
    .split("\n")
    .filter((line) => line.trim().endsWith("?"))
    .slice(0, 3);

  if (lines.length > 0) {
    return {
      questions: lines.map((l) => l.replace(/^[\d\.\-\*]\s*/, "").trim()),
    };
  }

  throw new Error("Could not parse LLM response");
}

/**
 * Generate reflection questions using OpenAI API
 */
export async function generateReflectionQuestions(
  request: ReflectionRequest,
): Promise<LLMResponse> {
  const prompt = buildPrompt(request);

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const completion = await getOpenAIClient().chat.completions.create(
      {
        model: MODEL,
        max_completion_tokens: MAX_COMPLETION_TOKENS,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    // Extract text content from response
    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    return parseResponse(content);
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("OpenAI API timeout");
      }
      throw error;
    }

    throw new Error("Unknown error calling OpenAI API");
  }
}

/**
 * Generate questions with retry logic
 */
export async function generateWithRetry(
  request: ReflectionRequest,
  maxRetries: number = 1,
): Promise<LLMResponse> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await generateReflectionQuestions(request);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `[OpenAI] Attempt ${attempt + 1} failed:`,
        lastError.message,
      );

      // Don't retry on certain errors
      if (
        lastError.message.includes("Invalid API key") ||
        lastError.message.includes("rate limit")
      ) {
        break;
      }
    }
  }

  throw lastError || new Error("All retry attempts failed");
}
