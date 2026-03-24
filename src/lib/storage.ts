export const STORAGE_KEYS = {
  USER: 'ecosort_user',
  ITEMS: 'ecosort_items',
  HISTORY: 'ecosort_history',
};

/**
 * Save data to browser local storage.
 * @param key Local Storage key
 * @param data Data object to store
 */
export const saveData = <T>(key: string, data: T): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Error saving data to local storage:`, e);
    }
  }
};

/**
 * Load data from browser local storage.
 * @param key Local Storage key
 * @returns The parsed data or null if not found
 */
export const loadData = <T>(key: string): T | null => {
  if (typeof window !== 'undefined') {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) as T : null;
    } catch (e) {
      console.error(`Error loading data from local storage:`, e);
      return null;
    }
  }
  return null;
};

/**
 * Delete data from browser local storage.
 * @param key Local Storage key
 */
export const deleteData = (key: string): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Error deleting data from local storage:`, e);
    }
  }
};
