export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function readStorage<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota / serialization issues in fallback mode
  }
}

export function removeStorage(key: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore cleanup issues in fallback mode
  }
}

export function clearStorageByPrefix(prefix: string): void {
  if (!isBrowser()) return;
  try {
    const keys = Object.keys(window.localStorage).filter((key) => key.startsWith(prefix));
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // ignore cleanup issues in fallback mode
  }
}

export function sortByDateDesc<T>(items: T[], getter: (item: T) => string | null | undefined): T[] {
  return [...items].sort((a, b) => {
    const aDate = getter(a) ? new Date(getter(a) as string).getTime() : 0;
    const bDate = getter(b) ? new Date(getter(b) as string).getTime() : 0;
    return bDate - aDate;
  });
}

export function sortByDateAsc<T>(items: T[], getter: (item: T) => string | null | undefined): T[] {
  return [...items].sort((a, b) => {
    const aDate = getter(a) ? new Date(getter(a) as string).getTime() : 0;
    const bDate = getter(b) ? new Date(getter(b) as string).getTime() : 0;
    return aDate - bDate;
  });
}
