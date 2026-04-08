export const CRM_STORAGE_PREFIX = "skidy.crm.";
export const CRM_BACKUP_VERSION = 1;

export interface StorageSnapshotEntry {
  key: string;
  raw: string;
}

export interface StorageSnapshot {
  version: number;
  prefix: string;
  exportedAt: string;
  entries: StorageSnapshotEntry[];
}

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

export function getStorageEntriesByPrefix(prefix: string): StorageSnapshotEntry[] {
  if (!isBrowser()) return [];

  try {
    return Object.keys(window.localStorage)
      .filter((key) => key.startsWith(prefix))
      .sort()
      .map((key) => ({
        key,
        raw: window.localStorage.getItem(key) ?? "",
      }));
  } catch {
    return [];
  }
}

export function exportStorageSnapshot(prefix: string): StorageSnapshot {
  return {
    version: CRM_BACKUP_VERSION,
    prefix,
    exportedAt: new Date().toISOString(),
    entries: getStorageEntriesByPrefix(prefix),
  };
}

function isStorageSnapshot(value: unknown): value is StorageSnapshot {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<StorageSnapshot>;
  return (
    typeof candidate.version === "number" &&
    typeof candidate.prefix === "string" &&
    typeof candidate.exportedAt === "string" &&
    Array.isArray(candidate.entries) &&
    candidate.entries.every(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as StorageSnapshotEntry).key === "string" &&
        typeof (entry as StorageSnapshotEntry).raw === "string",
    )
  );
}

export function parseStorageSnapshot(raw: string): StorageSnapshot | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return isStorageSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function importStorageSnapshot(
  snapshot: StorageSnapshot,
  options?: { clearExisting?: boolean; expectedPrefix?: string },
): { imported: number } {
  if (!isBrowser()) return { imported: 0 };

  const expectedPrefix = options?.expectedPrefix ?? snapshot.prefix;
  if (snapshot.prefix !== expectedPrefix) {
    throw new Error("Snapshot prefix does not match the expected CRM prefix.");
  }

  const invalidEntry = snapshot.entries.find((entry) => !entry.key.startsWith(expectedPrefix));
  if (invalidEntry) {
    throw new Error("Snapshot contains keys outside the CRM namespace.");
  }

  if (options?.clearExisting ?? true) {
    clearStorageByPrefix(expectedPrefix);
  }

  snapshot.entries.forEach((entry) => {
    window.localStorage.setItem(entry.key, entry.raw);
  });

  return { imported: snapshot.entries.length };
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
