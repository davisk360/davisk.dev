// Honeypot endpoints — spec §4 (docs/superpowers/specs/2026-08-27-antiscrape-hardening-design.md).
// The only links to these paths are invisible (display:none, aria-hidden,
// nofollow) anchors in BaseLayout, so only automated HTML parsers ever fetch
// them. Serving a plausible decoy keeps the spider crawling; the flag write
// blocks the same IP from /resume.pdf at the gate for 30 days.
import { getStore } from '@netlify/blobs';
import type { Config, Context } from '@netlify/edge-functions';
import {
  FLAG_TTL_MS,
  OFFICIAL_BOT_TOKENS,
  STORE_NAME,
  TRAP_PATHS,
  flagKey,
  normalizeIp,
} from './lib/config.ts';

// Minimal valid ZIP: end-of-central-directory record with zero entries.
const EMPTY_ZIP = new Uint8Array([
  0x50, 0x4b, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
]);

export default async function handler(
  request: Request,
  _context: Context,
): Promise<Response> {
  const userAgent = request.headers.get('user-agent') ?? '';
  const ip = normalizeIp(
    request.headers.get('x-nf-client-connection-ip') ?? 'unknown',
  );

  // Official bots can stumble onto trap URLs through link extraction; the
  // gate skips them anyway, so never flag them — keeps the flag set clean.
  if (!isOfficialBot(userAgent)) {
    try {
      const store = getStore(STORE_NAME);
      // onlyIfNew: the first hit fixes the 30-day window; repeat hits don't extend it.
      await store.set(flagKey(ip), '1', {
        metadata: { expiresAt: Date.now() + FLAG_TTL_MS },
        onlyIfNew: true,
      });
    } catch {
      // Flagging is best-effort; still serve the decoy below.
    }
  }

  const isZip = new URL(request.url).pathname.endsWith('.zip');
  return new Response(isZip ? EMPTY_ZIP : decoyPdf(), {
    status: 200,
    headers: {
      'Content-Type': isZip ? 'application/zip' : 'application/pdf',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}

function isOfficialBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return OFFICIAL_BOT_TOKENS.some((token) => ua.includes(token));
}

// Byte-correct minimal one-page PDF (empty content stream) so text extraction
// yields nothing. Offsets are computed, so the xref table is always valid.
// ASCII-only, so sending it as a string body is byte-identical to the bytes.
function decoyPdf(): string {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /Resources << >> /MediaBox [0 0 612 792] /Contents 4 0 R >>',
    '<< /Length 0 >>\nstream\n\nendstream',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return pdf;
}

export const config: Config = { path: [...TRAP_PATHS] };
