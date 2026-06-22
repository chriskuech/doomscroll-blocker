declare const browser: typeof chrome | undefined;
const api = typeof browser !== 'undefined' ? browser : chrome;

export interface Settings {
  /** Stable/beta site IDs for which blocking is disabled. */
  disabledSites: string[];
  /** Alpha site IDs for which blocking is explicitly enabled (opt-in). */
  enabledAlphaSites: string[];
}

const DEFAULTS: Settings = { disabledSites: [], enabledAlphaSites: [] };

export async function getSettings(): Promise<Settings> {
  const result = await api.storage.sync.get(DEFAULTS);
  return result as Settings;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await api.storage.sync.set(settings);
}
