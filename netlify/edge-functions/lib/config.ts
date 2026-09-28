// Shared tuning knobs for the davisk.dev anti-scrape edge functions.
// Both resume-gate.ts and honey-trap.ts import from here — single place to tune.
// Spec: docs/superpowers/specs/2026-08-27-antiscrape-hardening-design.md

/** Netlify Blobs store shared by the gate and the honeypots. */
export const STORE_NAME = 'antiscrape';

/**
 * Official search/answer-engine bots that skip every gate check. We trust
 * their documented politeness instead of doing slow reverse-DNS lookups at
 * the edge. Accepted risk: a spoofed official UA bypasses the gate.
 */
export const OFFICIAL_BOT_TOKENS: readonly string[] = [
  'googlebot',
  'bingbot',
  'oai-searchbot',
  'chatgpt-user',
  'perplexitybot',
  'claude-searchbot',
  'applebot',
];

/**
 * Library/tooling user-agent signatures favored by bulk scrapers → instant 403.
 * Runs AFTER the official-bot pass so official crawlers are never caught here.
 */
export const SCRAPER_UA_REGEX =
  /python-requests|python-urllib|httpx|aiohttp|scrapy|curl|wget|go-http-client|java\/|libwww-perl|ahrefsbot|semrushbot|mj12bot|dotbot|petalbot/i;

/**
 * Training-class AI crawlers: welcome everywhere else on the site (robots.txt)
 * but denied on /resume.pdf — mirrors the robots.txt policy at the edge for
 * crawlers that ignore it. Checked BEFORE the official-bot pass because the
 * token "applebot-extended" contains "applebot" (no other token overlaps).
 */
export const TRAINING_BOT_REGEX =
  /gptbot|ccbot|claudebot|anthropic-ai|google-extended|applebot-extended|amazonbot|bytespider|diffbot|meta-externalagent|facebookbot|imagesift/i;

/** Fixed-window rate limits per normalized IP. */
export const LIMIT_PER_MINUTE = 8;
export const LIMIT_PER_DAY = 40;

/** How long a honeypot flag keeps its IP blocked from /resume.pdf. */
export const FLAG_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Trap paths served by honey-trap.ts; linked (hidden) from BaseLayout. */
export const TRAP_PATHS = [
  '/archive/resume-draft-v2.pdf',
  '/downloads/portfolio-assets.zip',
] as const;

/**
 * Bucket an IP for rate limiting / flagging. IPv6 collapses to its /64 prefix
 * so a rotating interface identifier can't mint fresh buckets; IPv4-mapped
 * IPv6 is reduced to plain IPv4 so all IPv4 clients don't share one bucket.
 */
export function normalizeIp(ip: string): string {
  const value = ip.trim().toLowerCase();
  const mapped = value.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped) return mapped[1];
  if (!value.includes(':')) return value; // IPv4 or unknown
  let groups = value.split('::');
  if (groups.length === 2) {
    const head = groups[0] === '' ? [] : groups[0].split(':');
    const tail = groups[1] === '' ? [] : groups[1].split(':');
    const filler = Array(Math.max(0, 8 - head.length - tail.length)).fill('0');
    groups = [...head, ...filler, ...tail];
  } else {
    groups = value.split(':');
  }
  return groups.slice(0, 4).join(':');
}

/** Blobs key for a honeypot-flagged IP. */
export function flagKey(ip: string): string {
  return `flag:${ip}`;
}

/**
 * Real client IP for rate limiting / flagging. Netlify Edge exposes it on
 * context.ip; the x-nf-client-connection-ip header was observed MISSING in
 * production (2026-08-27), which collapsed every client to 'unknown' and let
 * one bot's honeypot hit block all humans. Prefer context.ip always.
 */
export function clientIp(context: { ip?: string }, request: Request): string {
  return (
    context.ip ??
    request.headers.get('x-nf-client-connection-ip') ??
    'unknown'
  );
}
