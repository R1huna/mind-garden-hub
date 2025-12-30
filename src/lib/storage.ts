// LocalStorage wrapper with type safety
const STORAGE_KEYS = {
  USER: 'learnflow_user',
  NOTES: 'learnflow_notes',
  EVENTS: 'learnflow_events',
  LINKS: 'learnflow_links',
  TAGS: 'learnflow_tags',
  THEME: 'learnflow_theme',
} as const;

export function getStorageItem<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
}

export { STORAGE_KEYS };
