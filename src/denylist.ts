export interface RawSiteRules {
  label: string;
  hosts: string[];
  blocked: string[];
  allowed: string[];
}


export interface CompiledSiteRules {
  blocked: RegExp[];
  allowed: RegExp[];
}

export interface CompiledDenylist {
  /** bare hostname (www. stripped) → site ID */
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

export function compileDenylist(raw: Record<string, RawSiteRules>): CompiledDenylist {
  const hostnameToSiteId = new Map<string, string>();
  const rulesBySiteId = new Map<string, CompiledSiteRules>();

  for (const [siteId, site] of Object.entries(raw)) {
    for (const host of site.hosts) {
      hostnameToSiteId.set(host, siteId);
    }
    rulesBySiteId.set(siteId, {
      blocked: site.blocked.map(globToRegex),
      allowed: site.allowed.map(globToRegex),
    });
  }

  return { hostnameToSiteId, rulesBySiteId };
}
