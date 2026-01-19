/**
 * PauseBuy Content Script - Purchase Detector
 *
 * Runs on e-commerce sites to detect when users are about to make a purchase.
 * Uses multi-stage detection: URL patterns, button text, and DOM analysis.
 */

import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: [
    "https://*.amazon.com/*",
    "https://*.amazon.co.uk/*",
    "https://*.ebay.com/*",
    "https://*.walmart.com/*",
    "https://*.target.com/*",
    "https://*.bestbuy.com/*",
    "https://*.etsy.com/*",
    "https://*.shopify.com/*",
    "https://*.myshopify.com/*"
  ],
  run_at: "document_idle"
}

// Detection state
let lastDetection = 0
const DEBOUNCE_MS = 2000

// URL patterns that indicate checkout intent
const CHECKOUT_URL_PATTERNS = [
  /\/checkout/i,
  /\/cart/i,
  /\/payment/i,
  /\/buy/i,
  /\/order/i,
  /\/gp\/buy/i,
  /\/gp\/cart/i
]

// Button text patterns that indicate purchase intent
const PURCHASE_BUTTON_PATTERNS = [
  /buy\s*now/i,
  /place\s*(your\s*)?order/i,
  /checkout/i,
  /pay\s*now/i,
  /complete\s*purchase/i,
  /submit\s*order/i,
  /proceed\s*to\s*checkout/i,
  /confirm\s*order/i
]

/**
 * Calculate confidence score based on URL patterns
 */
function getUrlScore(): number {
  const url = window.location.href.toLowerCase()

  for (const pattern of CHECKOUT_URL_PATTERNS) {
    if (pattern.test(url)) {
      return 30
    }
  }

  return 0
}

/**
 * Calculate confidence score based on button text
 */
function getButtonScore(): number {
  const buttons = document.querySelectorAll("button, input[type='submit'], a[role='button']")
  let maxScore = 0

  for (const button of buttons) {
    const text = button.textContent?.trim() ||
                 (button as HTMLInputElement).value ||
                 button.getAttribute("aria-label") || ""

    for (const pattern of PURCHASE_BUTTON_PATTERNS) {
      if (pattern.test(text)) {
        maxScore = Math.max(maxScore, 40)
      }
    }
  }

  return maxScore
}

/**
 * Calculate confidence score based on DOM structure
 */
function getDomScore(): number {
  let score = 0

  // Check for price displays
  const priceElements = document.querySelectorAll('[class*="price"], [class*="total"], [data-price]')
  if (priceElements.length > 0) {
    score += 10
  }

  // Check for payment form elements
  const paymentInputs = document.querySelectorAll(
    'input[name*="card"], input[name*="credit"], input[autocomplete*="cc-"]'
  )
  if (paymentInputs.length > 0) {
    score += 15
  }

  // Check for order summary sections
  const orderSummary = document.querySelector(
    '[class*="order-summary"], [class*="cart-summary"], [id*="order-summary"]'
  )
  if (orderSummary) {
    score += 5
  }

  return Math.min(score, 30)
}

/**
 * Extract product information from the page
 */
function extractProductInfo() {
  // Try common product name selectors
  const nameSelectors = [
    "#productTitle",
    "[data-product-name]",
    ".product-title",
    "h1.title",
    "[itemprop='name']"
  ]

  let name = "Unknown Product"
  for (const selector of nameSelectors) {
    const element = document.querySelector(selector)
    if (element?.textContent?.trim()) {
      name = element.textContent.trim()
      break
    }
  }

  // Try common price selectors
  const priceSelectors = [
    ".a-price .a-offscreen",
    "[data-price-amount]",
    ".price",
    "[itemprop='price']"
  ]

  let price = 0
  for (const selector of priceSelectors) {
    const element = document.querySelector(selector)
    const text = element?.textContent || element?.getAttribute("data-price-amount") || ""
    const match = text.match(/[\d,]+\.?\d*/)?.[0]
    if (match) {
      price = parseFloat(match.replace(",", ""))
      break
    }
  }

  return {
    name: name.slice(0, 200), // Limit length
    price,
    category: "general", // TODO: Extract category
    url: window.location.href,
    image: document.querySelector<HTMLImageElement>("#landingImage, .product-image img")?.src
  }
}

/**
 * Main detection function
 */
function detectPurchaseIntent() {
  // Debounce rapid detections
  const now = Date.now()
  if (now - lastDetection < DEBOUNCE_MS) {
    return
  }

  const urlScore = getUrlScore()
  const buttonScore = getButtonScore()
  const domScore = getDomScore()
  const totalScore = urlScore + buttonScore + domScore

  console.log(`[PauseBuy] Detection scores - URL: ${urlScore}, Button: ${buttonScore}, DOM: ${domScore}, Total: ${totalScore}`)

  // Only trigger if confidence threshold is met
  if (totalScore >= 60) {
    lastDetection = now

    const product = extractProductInfo()
    const site = window.location.hostname

    // Send message to background script
    chrome.runtime.sendMessage({
      type: "PURCHASE_DETECTED",
      product,
      site,
      confidence: totalScore
    }).then((response) => {
      if (response?.blocked) {
        console.log("[PauseBuy] Purchase detected, showing reflection overlay")
        // TODO: Inject reflection overlay
      }
    }).catch((error) => {
      console.error("[PauseBuy] Error sending detection message:", error)
    })
  }
}

// Run detection on page load
detectPurchaseIntent()

// Watch for dynamic content changes
const observer = new MutationObserver((mutations) => {
  // Only re-check if significant DOM changes occurred
  const hasSignificantChanges = mutations.some(
    (m) => m.addedNodes.length > 0 || m.type === "attributes"
  )

  if (hasSignificantChanges) {
    detectPurchaseIntent()
  }
})

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["class", "id"]
})

// Watch for URL changes (SPA navigation)
let lastUrl = window.location.href
setInterval(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href
    detectPurchaseIntent()
  }
}, 1000)

// Watch for clicks on purchase buttons
document.addEventListener("click", (event) => {
  const target = event.target as HTMLElement
  const buttonText = target.textContent || ""

  for (const pattern of PURCHASE_BUTTON_PATTERNS) {
    if (pattern.test(buttonText)) {
      detectPurchaseIntent()
      break
    }
  }
}, true)

export {}
