import type { StateStorage } from 'zustand/middleware';

/**
 * A custom storage adapter that uses `chrome.storage.local`.
 * This is necessary because Zustand's `persist` middleware expects a synchronous storage API by default,
 * but Chrome's storage API is asynchronous.
 */
export const chromeStorage: StateStorage = {
  /**
   * Retrieves an item from `chrome.storage.local`.
   * @param name - The key of the item to retrieve.
   * @returns The retrieved item's value, or null if it's not found.
   */
  getItem: async (name: string): Promise<string | null> => {
    const result = await chrome.storage.local.get(name);
    // The value from `persist` middleware is already stringified.
    return result[name] || null;
  },

  /**
   * Sets an item in `chrome.storage.local`.
   * @param name - The key of the item to set.
   * @param value - The value to set.
   */
  setItem: async (name: string, value: string): Promise<void> => {
    await chrome.storage.local.set({ [name]: value });
  },

  /**
   * Removes an item from `chrome.storage.local`.
   * @param name - The key of the item to remove.
   */
  removeItem: async (name: string): Promise<void> => {
    await chrome.storage.local.remove(name);
  },
};
