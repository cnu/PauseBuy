/**
 * Chrome Storage Middleware for Zustand
 *
 * Persists store state to chrome.storage.local and syncs
 * changes across extension components (popup, options, background).
 */

import type { StateCreator, StoreMutatorIdentifier } from "zustand"

type ChromeStorageOptions = {
  name: string
  partialize?: (state: unknown) => unknown
}

type ChromeStorage = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  initializer: StateCreator<T, Mps, Mcs>,
  options: ChromeStorageOptions
) => StateCreator<T, Mps, Mcs>

/**
 * Chrome Storage middleware for Zustand
 *
 * Usage:
 * ```ts
 * const useStore = create(
 *   chromeStorage(
 *     (set) => ({ ... }),
 *     { name: 'pausebuy-store' }
 *   )
 * )
 * ```
 */
export const chromeStorage: ChromeStorage = (initializer, options) => (set, get, api) => {
  const { name, partialize = (state) => state } = options

  // Load initial state from Chrome Storage
  const loadFromStorage = async (): Promise<Partial<ReturnType<typeof get>>> => {
    try {
      const result = await chrome.storage.local.get(name)
      return result[name] || {}
    } catch (error) {
      console.error("[PauseBuy] Failed to load from Chrome Storage:", error)
      return {}
    }
  }

  // Save state to Chrome Storage
  const saveToStorage = async (state: ReturnType<typeof get>) => {
    try {
      const partialState = partialize(state)
      await chrome.storage.local.set({ [name]: partialState })
    } catch (error) {
      console.error("[PauseBuy] Failed to save to Chrome Storage:", error)
    }
  }

  // Wrap set to persist on every update
  const persistentSet: typeof set = (...args) => {
    set(...args)
    saveToStorage(get())
  }

  // Create the store with wrapped set
  const store = initializer(persistentSet, get, api)

  // Initialize from storage
  loadFromStorage().then((storedState) => {
    if (Object.keys(storedState).length > 0) {
      set({ ...store, ...storedState } as Partial<ReturnType<typeof get>>)
    }
  })

  // Listen for changes from other extension contexts
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes[name]) {
      const newValue = changes[name].newValue
      if (newValue) {
        // Only update if the change came from another context
        const currentState = partialize(get())
        if (JSON.stringify(currentState) !== JSON.stringify(newValue)) {
          set(newValue as Partial<ReturnType<typeof get>>)
        }
      }
    }
  })

  return store
}

/**
 * Helper to create an async-aware store initializer
 * that properly handles Chrome Storage loading
 */
export async function initializeStore<T>(
  storeName: string,
  defaultState: T
): Promise<T> {
  try {
    const result = await chrome.storage.local.get(storeName)
    const stored = result[storeName]

    if (stored) {
      return { ...defaultState, ...stored }
    }

    // First time: save defaults
    await chrome.storage.local.set({ [storeName]: defaultState })
    return defaultState
  } catch (error) {
    console.error("[PauseBuy] Failed to initialize store:", error)
    return defaultState
  }
}

/**
 * Helper to sync a specific key to Chrome Storage
 */
export async function syncToStorage<T>(key: string, value: T): Promise<void> {
  try {
    await chrome.storage.local.set({ [key]: value })
  } catch (error) {
    console.error(`[PauseBuy] Failed to sync ${key} to storage:`, error)
  }
}

/**
 * Helper to get a specific key from Chrome Storage
 */
export async function getFromStorage<T>(key: string): Promise<T | null> {
  try {
    const result = await chrome.storage.local.get(key)
    return result[key] || null
  } catch (error) {
    console.error(`[PauseBuy] Failed to get ${key} from storage:`, error)
    return null
  }
}
