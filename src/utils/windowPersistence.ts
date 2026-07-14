/**
 * Versioned encoding for the persisted open-window list
 * (localStorage `<prefix>open_windows`).
 *
 * The stored payload is `{ version, windows }`. On read we accept ONLY the
 * current version; anything else — the pre-#163 bare-array format, or a payload
 * written by a newer build — is discarded (an empty list). Bumping
 * {@link OPEN_WINDOWS_VERSION} therefore lets restoration trust that every
 * persisted entry carries a real registry `appId`, so `WindowFactory` no longer
 * needs the pre-registry prop-sniffing / alias fallbacks (#163 C).
 *
 * The one-time cost of a bump is that windows open at upgrade time are dropped
 * on the next load — acceptable for an ephemeral open-window list.
 */
export const OPEN_WINDOWS_VERSION = 1;

interface PersistedOpenWindows {
  version: number;
  windows: unknown[];
}

/** Serialize the window list into the current versioned envelope. */
export const encodeOpenWindows = (windows: unknown[]): string => {
  const payload: PersistedOpenWindows = { version: OPEN_WINDOWS_VERSION, windows };
  return JSON.stringify(payload);
};

/**
 * Parse a persisted `open_windows` value, returning the window list only when
 * the envelope matches {@link OPEN_WINDOWS_VERSION}. Missing/old/newer/malformed
 * data yields an empty list rather than throwing.
 */
export const decodeOpenWindows = (raw: string | null): unknown[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed) &&
      (parsed as PersistedOpenWindows).version === OPEN_WINDOWS_VERSION &&
      Array.isArray((parsed as PersistedOpenWindows).windows)
    ) {
      return (parsed as PersistedOpenWindows).windows;
    }
  } catch {
    // Corrupt JSON — treat as no persisted windows.
  }
  return [];
};
