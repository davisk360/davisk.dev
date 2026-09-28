// Site-wide guard — extends the anti-scrape policy beyond /resume.pdf.
// 1. IPs honeypot-flagged by honey-trap.ts (they followed invisible, nofollow
//    trap links — bots only) get 403 across the whole site, not just the resume.
// 2. The config-level rate limit throttles per-IP request floods; Netlify
//    returns 429 over the limit automatically.
// Runs BEFORE resume-gate.ts in the chain (declaration order), so a flagged IP
// never even reaches the gate. All Blobs reads fail open — a Netlify hiccup
// must never block a real recruiter. Static assets skip the flag check to keep
// page loads fast; the platform rate limit still covers them.
import { getStore } from '@netlify/blobs';
import type { Config, Context } from '@netlify/edge-functions';
import {
  OFFICIAL_BOT_TOKENS,
  STORE_NAME,
  clientIp,
  flagKey,
  normalizeIp,
} from './lib/config.ts';

export default async function handler(
  request: Request,
  context: Context,
): Promise<Response> {
  const userAgent = request.headers.get('user-agent') ?? '';

  // Honeypot flagging never touches official bots (honey-trap skips them), so
  // their flag set is clean by construction — pass them straight through.
  if (isOfficialBot(userAgent)) {
    return context.next();
  }

  const { pathname } = new URL(request.url);
  if (isAssetPath(pathname)) {
    return context.next();
  }

  try {
    const store = getStore(STORE_NAME);
    const flag = await store.getWithMetadata(
      flagKey(normalizeIp(clientIp(context, request))),
      { consistency: 'strong' },
    );
    if (flag) {
      if (Number(flag.metadata?.expiresAt ?? 0) > Date.now()) {
        return deny();
      }
      // Lazily expired — same cleanup policy as resume-gate.ts.
      await store.delete(flagKey(normalizeIp(clientIp(context, request))));
    }
  } catch {
    // Fail open.
  }

  return context.next();
}

function isOfficialBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return OFFICIAL_BOT_TOKENS.some((token) => ua.includes(token));
}

function isAssetPath(pathname: string): boolean {
  return (
    pathname.startsWith('/_astro/') ||
    /\.(?:css|js|mjs|map|png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf|eot|txt|xml|webmanifest)$/i.test(
      pathname,
    )
  );
}

function deny(): Response {
  // Empty body: never teach an abuser which check tripped.
  return new Response(null, {
    status: 403,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export const config: Config = {
  path: '*',
  rateLimit: {
    // Generous ceiling: a human page view loads ~15 assets in a few seconds,
    // and Lighthouse-style audits stay well under it. Bulk scrapers don't.
    windowLimit: 120,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};
