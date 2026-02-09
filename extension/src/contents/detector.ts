/**
 * PauseBuy Content Script - Purchase Detector
 *
 * Runs on e-commerce sites to detect when users are about to make a purchase.
 * Uses multi-stage detection: URL patterns, button text, and DOM analysis.
 *
 * Click interception uses a "shield" approach: transparent divs are positioned
 * over purchase buttons so clicks hit our shield (in the content script world)
 * before reaching the page's own event handlers (in the main world).
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

// --- State ---
let handledUrl: string | null = null
let overlayActive = false
let pendingButton: HTMLElement | null = null // The button the user tried to click
const shieldedButtons = new Map<HTMLElement, HTMLElement>() // button → shield div
const SUPPRESSION_MS = 30_000 // 30 seconds after "I Still Want It"

// --- Constants ---
const CHECKOUT_URL_PATTERNS = [
  /\/checkout/i,
  /\/cart/i,
  /\/payment/i,
  /\/buy/i,
  /\/order/i,
  /\/gp\/buy/i,
  /\/gp\/cart/i
]

const PURCHASE_BUTTON_PATTERNS = [
  /buy\s*now/i,
  /add\s*to\s*cart/i,
  /place\s*(your\s*)?order/i,
  /checkout/i,
  /pay\s*now/i,
  /complete\s*purchase/i,
  /submit\s*order/i,
  /proceed\s*to\s*checkout/i,
  /confirm\s*order/i
]

// --- Scoring ---

function getUrlScore(): number {
  const url = window.location.href.toLowerCase()
  for (const pattern of CHECKOUT_URL_PATTERNS) {
    if (pattern.test(url)) return 30
  }
  return 0
}

function getButtonScore(): number {
  const buttons = document.querySelectorAll("button, input[type='submit'], a[role='button']")
  for (const button of buttons) {
    const text =
      button.textContent?.trim() ||
      (button as HTMLInputElement).value ||
      button.getAttribute("aria-label") ||
      ""
    if (PURCHASE_BUTTON_PATTERNS.some((p) => p.test(text))) return 40
  }
  return 0
}

function getDomScore(): number {
  let score = 0
  if (document.querySelectorAll('[class*="price"], [class*="total"], [data-price]').length > 0) {
    score += 10
  }
  if (
    document.querySelectorAll(
      'input[name*="card"], input[name*="credit"], input[autocomplete*="cc-"]'
    ).length > 0
  ) {
    score += 15
  }
  if (
    document.querySelector(
      '[class*="order-summary"], [class*="cart-summary"], [id*="order-summary"]'
    )
  ) {
    score += 5
  }
  return Math.min(score, 30)
}

// --- Product extraction ---

function extractProductInfo() {
  const nameSelectors = [
    // Amazon product page
    "#productTitle",
    // Amazon cart / "Added to cart" pages
    ".sc-product-title",
    ".sc-product-link",
    // eBay
    ".x-item-title__mainTitle",
    // Generic product selectors
    "h1[itemprop='name']",
    "[data-testid='product-title']",
    "h1[data-test='product-title']",
    // Best Buy
    ".sku-title h1",
    // Walmart
    ".heading-5.v-fw-regular",
    // Etsy
    "h1[data-buy-box-listing-title]",
    // Shopify
    ".product__title h1",
    ".product-single__title",
    // Generic fallbacks
    "[itemprop='name']",
    "[data-product-name]",
    ".product-title",
    ".product-name",
    "h1.title",
    "h1"
  ]

  let name = ""
  for (const selector of nameSelectors) {
    const text = document.querySelector(selector)?.textContent?.trim()
    if (text && text.length > 1 && text.length < 300) {
      name = text
      break
    }
  }
  if (!name) {
    name = document.title.replace(/\s*[-|–—:].*$/, "").trim() || "Unknown Product"
  }

  const priceSelectors = [
    ".a-price .a-offscreen",
    "#priceblock_ourprice",
    "#priceblock_dealprice",
    ".a-price-whole",
    ".x-price-primary .ux-textspans",
    "[itemprop='price']",
    "[data-testid='price-wrap'] [itemprop='price']",
    "span[itemprop='price']",
    "[data-test='product-price']",
    ".priceView-customer-price span",
    ".priceView-hero-price span",
    ".wt-text-title-03",
    "[data-buy-box-region='price'] p",
    ".product__price",
    ".price__current .money",
    ".product-price",
    "[data-price-amount]",
    "[data-price]",
    ".price",
    ".current-price",
    ".sale-price"
  ]

  let price = 0
  for (const selector of priceSelectors) {
    const el = document.querySelector(selector)
    const text =
      el?.textContent ||
      el?.getAttribute("data-price-amount") ||
      el?.getAttribute("data-price") ||
      el?.getAttribute("content") ||
      ""
    const match = text.match(/[\d,]+\.?\d*/)?.[0]
    if (match) {
      const parsed = parseFloat(match.replace(",", ""))
      if (parsed > 0) {
        price = parsed
        break
      }
    }
  }

  const imageSelectors = [
    "#landingImage",
    "#icImg",
    "[data-testid='hero-image'] img",
    "[data-test='product-image'] img",
    ".primary-image img",
    "[data-buy-box-region='image'] img",
    ".product__media img",
    ".product-featured-media img",
    ".product-image img",
    "[itemprop='image']"
  ]

  let image: string | undefined
  for (const selector of imageSelectors) {
    const el = document.querySelector<HTMLImageElement>(selector)
    if (el?.src) {
      image = el.src
      break
    }
  }

  return {
    name: name.slice(0, 200),
    price,
    category: "general",
    url: window.location.href,
    image
  }
}

// --- Shield system ---

function isPurchaseButton(el: HTMLElement): boolean {
  const text =
    el.textContent?.trim() || (el as HTMLInputElement).value || el.getAttribute("aria-label") || ""
  return PURCHASE_BUTTON_PATTERNS.some((p) => p.test(text))
}

function findPurchaseButtons(): HTMLElement[] {
  const candidates = document.querySelectorAll(
    "button, input[type='submit'], a[role='button'], [role='button']"
  )
  const results: HTMLElement[] = []
  for (const el of candidates) {
    if (isPurchaseButton(el as HTMLElement)) {
      results.push(el as HTMLElement)
    }
  }
  return results
}

function createShield(button: HTMLElement): HTMLElement {
  const rect = button.getBoundingClientRect()
  const shield = document.createElement("div")
  shield.setAttribute("data-pausebuy-shield", "true")

  // Position absolutely in the document using scroll-adjusted coordinates
  const top = rect.top + window.scrollY
  const left = rect.left + window.scrollX

  shield.style.cssText = `
    position: absolute;
    top: ${top}px;
    left: ${left}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    z-index: 2147483646;
    cursor: pointer;
    background: transparent;
  `

  shield.addEventListener("click", (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (overlayActive || handledUrl === window.location.href) return

    isSuppressed().then((suppressed) => {
      if (suppressed) {
        removeAllShields()
        button.click()
        return
      }
      handleShieldClick(button)
    })
  })

  document.body.appendChild(shield)
  return shield
}

function handleShieldClick(button: HTMLElement) {
  // Remember which button the user tried to click
  pendingButton = button

  const product = extractProductInfo()
  const site = window.location.hostname

  chrome.runtime
    .sendMessage({
      type: "PURCHASE_DETECTED",
      product,
      site,
      confidence: 100
    })
    .then((response) => {
      if (response?.blocked) {
        handledUrl = window.location.href
      } else {
        // Background says don't block — remove shields and click through
        removeAllShields()
        button.click()
        pendingButton = null
      }
    })
    .catch(() => {
      removeAllShields()
      button.click()
      pendingButton = null
    })
}

function shieldPurchaseButtons() {
  if (handledUrl === window.location.href) return

  const buttons = findPurchaseButtons()

  for (const button of buttons) {
    // Skip if already shielded
    if (shieldedButtons.has(button)) {
      // Update position of existing shield (button may have moved)
      updateShieldPosition(button)
      continue
    }

    const rect = button.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) continue // Not visible

    const shield = createShield(button)
    shieldedButtons.set(button, shield)
  }
}

function updateShieldPosition(button: HTMLElement) {
  const shield = shieldedButtons.get(button)
  if (!shield) return

  const rect = button.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) {
    shield.style.display = "none"
    return
  }

  shield.style.display = ""
  shield.style.top = `${rect.top + window.scrollY}px`
  shield.style.left = `${rect.left + window.scrollX}px`
  shield.style.width = `${rect.width}px`
  shield.style.height = `${rect.height}px`
}

function removeAllShields() {
  for (const [, shield] of shieldedButtons) {
    shield.remove()
  }
  shieldedButtons.clear()
}

// --- Suppression across navigations ---

async function isSuppressed(): Promise<boolean> {
  const { proceedUntil } = await chrome.storage.session.get("proceedUntil")
  return typeof proceedUntil === "number" && Date.now() < proceedUntil
}

function setSuppression(): void {
  chrome.storage.session.set({ proceedUntil: Date.now() + SUPPRESSION_MS })
}

// --- Auto-detection for cart/checkout pages ---

let lastAutoDetection = 0
const AUTO_DETECT_DEBOUNCE_MS = 2000

async function autoDetectPurchaseIntent() {
  if (handledUrl === window.location.href) return
  if (await isSuppressed()) return

  const now = Date.now()
  if (now - lastAutoDetection < AUTO_DETECT_DEBOUNCE_MS) return

  const urlScore = getUrlScore()
  const buttonScore = getButtonScore()
  const domScore = getDomScore()
  const totalScore = urlScore + buttonScore + domScore

  console.log(
    `[PauseBuy] Detection scores - URL: ${urlScore}, Button: ${buttonScore}, DOM: ${domScore}, Total: ${totalScore}`
  )

  // Auto-trigger overlay on high-confidence pages (cart, checkout)
  if (totalScore >= 60) {
    lastAutoDetection = now

    const product = extractProductInfo()
    const site = window.location.hostname

    chrome.runtime
      .sendMessage({
        type: "PURCHASE_DETECTED",
        product,
        site,
        confidence: totalScore
      })
      .then((response) => {
        if (response?.blocked) {
          handledUrl = window.location.href
        }
      })
      .catch((error) => {
        console.error("[PauseBuy] Error sending detection message:", error)
      })
  }
}

// --- Initialization ---

// Run auto-detection and shield buttons on page load
autoDetectPurchaseIntent()
shieldPurchaseButtons()

// Watch for dynamic content changes (e.g., SPA re-renders, lazy-loaded buttons)
const observer = new MutationObserver((mutations) => {
  const hasSignificantChanges = mutations.some(
    (m) => m.addedNodes.length > 0 || m.type === "attributes"
  )
  if (hasSignificantChanges) {
    autoDetectPurchaseIntent()
    shieldPurchaseButtons()
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
    handledUrl = null
    removeAllShields()
    autoDetectPurchaseIntent()
    shieldPurchaseButtons()
  }
}, 1000)

// Update shield positions on window resize
window.addEventListener(
  "resize",
  () => {
    for (const [button] of shieldedButtons) {
      updateShieldPosition(button)
    }
  },
  { passive: true }
)

// --- Message listener ---

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "SHOW_OVERLAY") {
    overlayActive = true
  } else if (message.type === "PROCEED_WITH_PURCHASE") {
    // User chose "I Still Want It" — suppress detection, remove shields, click through
    overlayActive = false
    setSuppression()
    removeAllShields()
    handledUrl = window.location.href
    if (pendingButton) {
      pendingButton.click()
      pendingButton = null
    }
  } else if (message.type === "RESET_DETECTION") {
    // User dismissed or saved — remove shields, mark as handled
    overlayActive = false
    removeAllShields()
    handledUrl = window.location.href
    pendingButton = null
  }
})

export {}
