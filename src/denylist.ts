declare const browser: typeof chrome | undefined;
const api = typeof browser !== 'undefined' ? browser : chrome;

interface RawSiteRules {
  label: string;
  hosts: string[];
  blocked: string[];
  allowed: string[];
  release: 'alpha' | 'beta' | 'stable';
}

export interface SiteMetadata {
  id: string;
  label: string;
  release: 'alpha' | 'beta' | 'stable';
}

export interface CompiledSiteRules {
  blocked: RegExp[];
  allowed: RegExp[];
}

export interface Denylist {
  sites: SiteMetadata[];
  hostnameToSiteId: Map<string, string>;
  rulesBySiteId: Map<string, CompiledSiteRules>;
}

/**
 * Converts a glob path pattern to a prefix-anchored RegExp.
 *   *  matches any characters within a single path segment (not /)
 *   ** matches any characters including /
 */
function globToRegex(glob: string): RegExp {
  const pattern = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // escape regex specials
    .replace(/\*\*/g, '\x00')              // protect ** before replacing *
    .replace(/\*/g, '[^/]*')               // * = one segment
    // eslint-disable-next-line no-control-regex
    .replace(/\x00/g, '.*');               // ** = anything
  return new RegExp('^' + pattern);
}

export async function loadDenylist(): Promise<Denylist> {
  const response = await fetch(api.runtime.getURL('denylist.json'));
  const raw = await response.json() as Record<string, RawSiteRules>;

  const sites: SiteMetadata[] = [];
  const hostnameToSiteId = new Map<string, string>();
  const rulesBySiteId = new Map<string, CompiledSiteRules>();

  for (const [id, site] of Object.entries(raw)) {
    sites.push({ id, label: site.label, release: site.release });
    for (const host of site.hosts) {
      hostnameToSiteId.set(host, id);
    }
    rulesBySiteId.set(id, {
      blocked: site.blocked.map(globToRegex),
      allowed: site.allowed.map(globToRegex),
    });
  }

  return { sites, hostnameToSiteId, rulesBySiteId };
}
