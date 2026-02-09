/**
 * Reflection Overlay Content Script
 *
 * Injects a modal overlay when a purchase is detected, displaying
 * reflection questions to help users pause before buying.
 */

import cssText from "data-text:~/globals.css"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import { useEffect, useState } from "react"

export const config: PlasmoCSConfig = {
  matches: [
    "*://*.amazon.com/*",
    "*://*.ebay.com/*",
    "*://*.walmart.com/*",
    "*://*.target.com/*",
    "*://*.bestbuy.com/*",
    "*://*.etsy.com/*",
    "*://*.shopify.com/*",
    "*://*/*" // Fallback for any site
  ],
  all_frames: false
}

// Inject Tailwind styles into shadow DOM
export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

interface GoalImpact {
  goalName: string
  delayDays: number
  message: string
}

interface OverlayData {
  eventId: string
  product: {
    name: string
    price: number
    url?: string
    image?: string
  }
  questions: string[]
  goalImpact: GoalImpact | null
  riskLevel: "low" | "medium" | "high"
}

function ReflectionOverlay() {
  const [visible, setVisible] = useState(false)
  const [data, setData] = useState<OverlayData | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(
    new Set()
  )
  const [reflectionStartTime, setReflectionStartTime] = useState<number>(0)

  useEffect(() => {
    // Listen for show overlay messages from background script
    const handleMessage = (
      message: { type: string } & Partial<OverlayData>,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void
    ) => {
      if (message.type === "SHOW_OVERLAY" && message.eventId) {
        setData({
          eventId: message.eventId,
          product: message.product!,
          questions: message.questions!,
          goalImpact: message.goalImpact ?? null,
          riskLevel: message.riskLevel || "medium"
        })
        setVisible(true)
        setCurrentQuestion(0)
        setAnsweredQuestions(new Set())
        setReflectionStartTime(Date.now())
        sendResponse({ received: true })
      } else if (message.type === "HIDE_OVERLAY") {
        setVisible(false)
        setData(null)
        sendResponse({ received: true })
      }
      return true
    }

    chrome.runtime.onMessage.addListener(handleMessage)
    return () => chrome.runtime.onMessage.removeListener(handleMessage)
  }, [])

  const handleAnswerQuestion = () => {
    setAnsweredQuestions((prev) => new Set([...prev, currentQuestion]))
    if (currentQuestion < (data?.questions.length || 0) - 1) {
      setCurrentQuestion((prev) => prev + 1)
    }
  }

  const handleSaveForLater = async () => {
    if (!data) return

    const reflectionTime = Math.floor((Date.now() - reflectionStartTime) / 1000)

    // Send save for later message
    await chrome.runtime.sendMessage({
      type: "SAVE_FOR_LATER",
      product: data.product
    })

    // Record outcome
    await chrome.runtime.sendMessage({
      type: "PURCHASE_OUTCOME",
      eventId: data.eventId,
      outcome: "saved",
      reflectionTime
    })

    // Tell detector to remove shields (user decided not to buy)
    await chrome.runtime.sendMessage({ type: "RESET_DETECTION" })

    setVisible(false)
    setData(null)
  }

  const handleProceed = async () => {
    if (!data) return

    const reflectionTime = Math.floor((Date.now() - reflectionStartTime) / 1000)

    // Record outcome
    await chrome.runtime.sendMessage({
      type: "PURCHASE_OUTCOME",
      eventId: data.eventId,
      outcome: "bought",
      reflectionTime
    })

    // Tell detector to re-click the original button
    await chrome.runtime.sendMessage({ type: "PROCEED_WITH_PURCHASE" })

    setVisible(false)
    setData(null)
  }

  const handleDismiss = () => {
    // Reset detection so user can trigger overlay again if they click the button
    chrome.runtime.sendMessage({ type: "RESET_DETECTION" })
    setVisible(false)
    setData(null)
  }

  if (!visible || !data) return null

  const allQuestionsAnswered = answeredQuestions.size >= data.questions.length
  const riskColors = {
    low: "bg-sage",
    medium: "bg-terracotta",
    high: "bg-clay"
  }

  return (
    <div
      className="fixed inset-0 z-[2147483647] flex items-center justify-center animate-fade-in"
      style={{ backgroundColor: "rgba(26, 26, 26, 0.92)" }}
    >
      <div className="bg-graphite rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-grow">
        {/* Header */}
        <div className="bg-gradient-primary p-4 relative">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">
                Take a moment
              </h2>
              <p className="text-white/80 text-sm">
                Let's think about this purchase
              </p>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4 border-b border-slate">
          <div className="flex items-start gap-3">
            {data.product.image && (
              <img
                src={data.product.image}
                alt={data.product.name}
                className="w-16 h-16 object-cover rounded-lg bg-slate"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium truncate">
                {data.product.name}
              </h3>
              <p className="text-fresh text-xl font-bold">
                ${data.product.price.toFixed(2)}
              </p>
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs text-white mt-1 ${riskColors[data.riskLevel]}`}
              >
                {data.riskLevel === "high"
                  ? "High impulse risk"
                  : data.riskLevel === "medium"
                    ? "Moderate risk"
                    : "Low risk"}
              </span>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="p-4">
          <div className="space-y-3">
            {data.questions.map((question, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg transition-all duration-300 ${
                  idx === currentQuestion
                    ? "bg-forest/30 border border-fresh/50"
                    : answeredQuestions.has(idx)
                      ? "bg-slate/50 opacity-60"
                      : "bg-slate/30 opacity-40"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                      answeredQuestions.has(idx)
                        ? "bg-fresh text-charcoal"
                        : idx === currentQuestion
                          ? "bg-forest text-white"
                          : "bg-slate text-stone"
                    }`}
                  >
                    {answeredQuestions.has(idx) ? "✓" : idx + 1}
                  </span>
                  <p className="text-white/90 text-sm leading-relaxed">
                    {question}
                  </p>
                </div>
                {idx === currentQuestion && !answeredQuestions.has(idx) && (
                  <button
                    onClick={handleAnswerQuestion}
                    className="mt-2 ml-8 text-fresh text-sm hover:text-fresh/80 transition-colors"
                  >
                    I've considered this →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Goal Impact */}
        {data.goalImpact && (
          <div className="px-4 pb-4">
            <div className="bg-terracotta/20 border border-terracotta/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-4 h-4 text-terracotta"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <span className="text-terracotta text-sm font-medium">
                  Goal Impact
                </span>
              </div>
              <p className="text-white/80 text-sm">{data.goalImpact.message}</p>
              {/* Progress bar visualization */}
              <div className="mt-2 h-2 bg-slate rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-terracotta to-clay transition-all duration-500"
                  style={{
                    width: `${Math.min(100, data.goalImpact.delayDays * 10)}%`
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 bg-charcoal/50 flex gap-3">
          <button
            onClick={handleSaveForLater}
            className="flex-1 bg-forest hover:bg-forest-deep text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Save for Later
          </button>
          <button
            onClick={handleProceed}
            disabled={!allQuestionsAnswered}
            className={`flex-1 font-medium py-3 px-4 rounded-lg transition-all ${
              allQuestionsAnswered
                ? "bg-slate hover:bg-stone text-white"
                : "bg-slate/50 text-stone cursor-not-allowed"
            }`}
          >
            I Still Want It
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReflectionOverlay
