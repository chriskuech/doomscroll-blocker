declare const browser: typeof chrome | undefined;
const api = typeof browser !== 'undefined' ? browser : chrome;

export interface Settings {
  /** Site IDs for which blocking is currently disabled. */
  disabledSites: string[];
}

const DEFAULTS: Settings = { disabledSites: [] };

export async function getSettings(): Promise<Settings> {
  const result = await api.storage.sync.get(DEFAULTS);
  return result as Settings;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await api.storage.sync.set(settings);
}
