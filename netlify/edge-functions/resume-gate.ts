// Gate for /resume.pdf — spec §3 (docs/superpowers/specs/2026-08-27-antiscrape-hardening-design.md).
// Check order: training-class deny → official-bot pass → scraper deny →
// honeypot flag → rate limit → next(). All denials use empty bodies so an
// abuser can't tell which check tripped. Everything touching Blobs fails open.
import { getStore } from '@netlify/blobs';
import type { Config, Context } from '@netlify/edge-functions';
import {
  LIMIT_PER_DAY,
  LIMIT_PER_MINUTE,
  OFFICIAL_BOT_TOKENS,
  SCRAPER_UA_REGEX,
  STORE_NAME,
  TRAINING_BOT_REGEX,
  clientIp,
  flagKey,
  normalizeIp,
} from './lib/config.ts';

export default async function handler(
  request: Request,
  context: Context,
): Promise<Response> {
  const userAgent = request.headers.get('user-agent') ?? '';

  // Training-class AI crawlers first: must precede the official-bot pass
  // because "Applebot-Extended" contains "Applebot".
  if (TRAINING_BOT_REGEX.test(userAgent)) {
    return deny();
  }

  // Official search/answer-engine bots skip every remaining check.
  if (isOfficialBot(userAgent)) {
    return context.next();
  }

  // Known scraper tooling and library defaults.
  if (SCRAPER_UA_REGEX.test(userAgent)) {
    return deny();
  }

  // Everything below reads/writes Blobs and fails open on any storage error —
  // a Netlify hiccup must never block a real recruiter.
  const ip = normalizeIp(clientIp(context, request));

  try {
    const store = getStore(STORE_NAME);

    // Honeypot flag set? Lazily expired — Blobs has no native TTL.
    const flag = await store.getWithMetadata(flagKey(ip), {
      consistency: 'strong',
    });
    if (flag) {
      if (Number(flag.metadata?.expiresAt ?? 0) > Date.now()) {
        return deny();
      }
      await store.delete(flagKey(ip));
    }

    // Fixed-window rate limits per normalized IP.
    const now = Date.now();
    const minuteKey = `rl-m:${ip}:${Math.floor(now / 60_000)}`;
    const dayKey = `rl-d:${ip}:${Math.floor(now / 86_400_000)}`;

    const [minuteCount, dayCount] = await Promise.all([
      store.get(minuteKey, { consistency: 'strong' }),
      store.get(dayKey, { consistency: 'strong' }),
    ]);

    const minuteHits = Number(minuteCount ?? 0) + 1;
    const dayHits = Number(dayCount ?? 0) + 1;

    if (minuteHits > LIMIT_PER_MINUTE || dayHits > LIMIT_PER_DAY) {
      const secondsInMinute = 60 - (Math.floor(now / 1000) % 60);
      const secondsInDay = 86_400 - (Math.floor(now / 1000) % 86_400);
      const retryAfter =
        minuteHits > LIMIT_PER_MINUTE ? secondsInMinute : secondsInDay;
      return new Response(null, {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'Cache-Control': 'no-store',
        },
      });
    }

    await Promise.all([
      store.set(minuteKey, String(minuteHits)),
      store.set(dayKey, String(dayHits)),
    ]);
  } catch {
    // Fail open.
  }

  return context.next();
}

function isOfficialBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return OFFICIAL_BOT_TOKENS.some((token) => ua.includes(token));
}

function deny(): Response {
  // Empty body: never teach an abuser which check tripped.
  return new Response(null, {
    status: 403,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export const config: Config = {
  path: ['/resume.pdf', '/Kelly_Davis_Resume_GTM_Engineer.pdf'],
};
