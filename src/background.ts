import { loadDenylist, type Denylist } from './denylist.js';
import { getSettings } from './storage.js';

declare const browser: typeof chrome | undefined;
const api = typeof browser !== 'undefined' ? browser : chrome;

let denylist: Denylist = {
  sites: [],
  hostnameToSiteId: new Map(),
  rulesBySiteId: new Map(),
};

let disabledSites = new Set<string>();

async function init(): Promise<void> {
  const [settings, loaded] = await Promise.all([getSettings(), loadDenylist()]);
  denylist = loaded;
  disabledSites = new Set(settings.disabledSites);
}

// Keep disabled-sites in sync without restarting the service worker.
api.storage.onChanged.addListener((changes) => {
  if (changes['disabledSites']) {
    disabledSites = new Set<string>((changes['disabledSites'].newValue as string[]) ?? []);
  }
});

function isBlocked(urlStr: string): boolean {
  let parsed: URL;
  try { parsed = new URL(urlStr); } catch { return false; }

  const hostname = parsed.hostname.replace(/^www\./, '');
  const siteId = denylist.hostnameToSiteId.get(hostname);
  if (!siteId) return false;
  if (disabledSites.has(siteId)) return false;

  const rules = denylist.rulesBySiteId.get(siteId);
  if (!rules) return false;

  if (rules.allowed.some(re => re.test(parsed.pathname))) return false;
  return rules.blocked.some(re => re.test(parsed.pathname));
}

function blockIfNeeded(tabId: number, url: string, frameId: number): void {
  if (frameId !== 0) return;
  if (!isBlocked(url)) return;

  const blockedPage = api.runtime.getURL('blocked.html') + '?url=' + encodeURIComponent(url);
  void api.tabs.update(tabId, { url: blockedPage });
}

api.webNavigation.onBeforeNavigate.addListener(({ tabId, url, frameId }) => {
  blockIfNeeded(tabId, url, frameId);
});

// Catches client-side push-state navigation (SPAs like Reddit).
api.webNavigation.onHistoryStateUpdated.addListener(({ tabId, url, frameId }) => {
  blockIfNeeded(tabId, url, frameId);
});

void init();
