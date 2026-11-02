/**
 * What every enquiry function shares: the Sanity client, a per-IP rate limit,
 * JSON responses, failure logs without personal data, and the checks each
 * request gets before its own (see readEnquiry).
 *
 * `_lib` is underscore-prefixed so Vercel does not deploy it as a function.
 */

import { createClient } from '@sanity/client'

const MAX_BODY_CHARS = 10_000
export const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 }

export class ConfigError extends Error {
  name = 'ConfigError'
}

/** Built per request: a module-level client would throw before any response on missing env. */
export function sanityClient() {
  const projectId = process.env.SANITY_PROJECT_ID
  const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN
  if (!projectId) throw new ConfigError('SANITY_PROJECT_ID is not set')
  if (!token) throw new ConfigError('SANITY_WRITE_TOKEN is not set')
  return createClient({
    projectId,
    dataset: process.env.SANITY_DATASET || 'production',
    token,
    apiVersion: '2024-10-01',
    useCdn: false,
    // With a token the default would include drafts: only published content counts.
    perspective: 'published',
  })
}

// ponytail: per-instance memory, so a cold start or a second instance starts
// a fresh count. Move to Vercel KV / Upstash if spam gets through.
const hits = new Map<string, number[]>()

export function isRateLimited(key: string, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs)
  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 5_000) {
    for (const [k, times] of hits) if (now - times[times.length - 1] >= RATE_LIMIT.windowMs) hits.delete(k)
  }
  return recent.length > RATE_LIMIT.max
}

export const json = (body: unknown, status: number, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } })

export function logFailure(name: string, stage: string, error: unknown) {
  const type = error instanceof Error ? error.name : 'unknown'
  const status = (error as { statusCode?: number })?.statusCode
  // Config messages name env vars only; any other message could echo data.
  const detail = error instanceof ConfigError ? error.message : status ? `HTTP ${status}` : ''
  console.error(`[${name}] ${stage} failed: ${type} ${detail}`.trim())
}

/**
 * Method and content type, the rate limit, body size, a JSON object, then the
 * honeypot. Returns the parsed body, or the response to send instead.
 */
export async function readEnquiry(request: Request): Promise<Record<string, unknown> | Response> {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, { Allow: 'POST' })
  // JSON-only also means a cross-site browser POST needs a CORS preflight, which this never grants.
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return json({ error: 'Expected application/json' }, 415)
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
  if (isRateLimited(ip)) {
    return json({ error: 'Too many requests' }, 429, { 'Retry-After': String(RATE_LIMIT.windowMs / 1000) })
  }

  const raw = await request.text()
  if (raw.length > MAX_BODY_CHARS) return json({ error: 'Request too large' }, 413)

  let body: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new TypeError()
    body = parsed as Record<string, unknown>
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  // People never see the honeypot; bots fill it. Answer as if it worked so they do not adapt.
  if (typeof body.website === 'string' && body.website.trim() !== '') return json({ ok: true }, 201)
  return body
}
