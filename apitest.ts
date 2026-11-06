import handler from './api/test-drive'
import { createHandler, type EnquiryStore, type OfferEnquiryDoc } from './api/offer-enquiry'
import {
  createHandler as createInterestHandler,
  type InterestEnquiryDoc,
  type InterestStore,
} from './api/interest-enquiry'
import { adapt } from './api/_lib/adapter'
import { RATE_LIMIT } from './api/_lib/enquiry'
import {
  DEFAULT_FILTERS,
  applyFilters,
  computeStats,
  dashboardCsv,
  formatDubai,
  modelName,
  modelOptions,
  type EnquiryRow,
} from './studio/enquiries'
import { dubaiToday, fieldErrors, normalizeUaePhone, offerEnquirySchema } from './src/lib/offerEnquiry'

/**
 * Exercises BOTH invocation styles. The Vercel Node runtime uses (req, res);
 * a handler that only speaks the Web style silently never ends the response,
 * which is what left the browser hanging.
 */
interface Captured { status: number; body: string; ended: boolean }

function mockRes(): { res: Record<string, unknown>; out: Captured } {
  const out: Captured = { status: 0, body: '', ended: false }
  const res = {
    statusCode: 200,
    setHeader: () => undefined,
    end: (body?: string) => {
      out.status = (res as { statusCode: number }).statusCode
      out.body = body ?? ''
      out.ended = true
    },
  }
  return { res: res as unknown as Record<string, unknown>, out }
}

const VALID = {
  fullName: 'Ajay Singh', email: 'a@example.com', phone: '+971501234567',
  model: 'emira', location: 'Lotus Dubai', preferredDate: '2026-10-01', locale: 'en',
}

let bad = 0
const check = (label: string, ok: boolean, detail = '') => {
  if (!ok) bad++
  console.log(`  ${ok ? '\u2713' : '\u2717'} ${label.padEnd(48)} ${detail}`)
}

async function nodeStyle(body: unknown, method = 'POST') {
  const { res, out } = mockRes()
  // Mimic a real Node request: 'end' fires even with no body.
  const req = {
    method, url: '/api/test-drive', headers: {}, body,
    on: (event: string, cb: (chunk?: unknown) => void) => {
      if (event === 'end') setTimeout(() => cb(), 0)
    },
  }
  await Promise.race([
    handler(req as never, res as never),
    new Promise((_, rej) => setTimeout(() => rej(new Error('HUNG - never ended')), 5000)),
  ])
  return out
}

async function webStyle(body: unknown, method = 'POST') {
  const request = new Request('https://local/api/test-drive', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'GET' ? undefined : JSON.stringify(body),
  })
  const response = (await handler(request)) as Response
  return { status: response.status, body: await response.text(), ended: true }
}

async function main() {
  console.log('Node signature (what Vercel actually calls):')
  let r = await nodeStyle({ fullName: 'x' })
  check('missing fields -> 400, response ended', r.ended && r.status === 400, r.body.slice(0, 40))
  r = await nodeStyle({ ...VALID, email: 'nope' })
  check('invalid email -> 400, response ended', r.ended && r.status === 400, r.body.slice(0, 40))
  r = await nodeStyle(undefined, 'GET')
  check('GET -> 405, response ended', r.ended && r.status === 405, r.body.slice(0, 40))
  r = await nodeStyle(VALID)
  check('valid -> responds (not hung)', r.ended, `status ${r.status}`)

  console.log('Web signature (dev bridge / edge):')
  const w1 = await webStyle({ fullName: 'x' })
  check('missing fields -> 400', w1.status === 400, w1.body.slice(0, 40))
  const w2 = await webStyle(VALID)
  check('valid -> responds', typeof w2.status === 'number', `status ${w2.status}`)

  await offerEnquiryTests()
  await interestEnquiryTests()
  dashboardTests()

  console.log(bad ? `\n${bad} FAILURES` : '\nall API assertions passed')
  process.exit(bad ? 1 : 0)

}

main()

/* ------------------------------------------------------------------ */
/* Offer enquiries: the shared schema, then the handler on a fake store */
/* ------------------------------------------------------------------ */

const OFFER = { _id: 'offer-eletre-x', title: 'Eletre X', models: ['Eletre X', 'Eletre X S'] }

const ENQUIRY = {
  offerId: OFFER._id,
  locale: 'en',
  source: { utmSource: 'instagram', page: '/offers/eletre-x' },
  fullName: 'Layla Al Mansoori',
  email: 'layla@example.com',
  phone: '050 123 4567',
  model: 'Eletre X',
  contactMethod: 'whatsapp',
  consent: true,
  website: '',
}

function fakeStore(offer: typeof OFFER | null = OFFER, fail = false) {
  const created: OfferEnquiryDoc[] = []
  const store: EnquiryStore = {
    findLiveOffer: async (id) => (offer && id === offer._id ? offer : null),
    create: async (doc) => {
      if (fail) throw Object.assign(new Error(`rejected ${doc.email}`), { statusCode: 403 })
      created.push(doc)
    },
  }
  return { store, created }
}

let ipCounter = 0
async function post(store: EnquiryStore, body: unknown, init: { ip?: string; type?: string; method?: string } = {}) {
  const run = createHandler(store, () => new Date('2026-10-21T08:00:00Z'))
  const response = await run(
    new Request('https://local/api/offer-enquiry', {
      method: init.method ?? 'POST',
      headers: {
        'Content-Type': init.type ?? 'application/json',
        'x-forwarded-for': init.ip ?? `10.0.0.${++ipCounter}`,
      },
      body: (init.method ?? 'POST') === 'GET' ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    }),
  )
  return { status: response.status, body: (await response.json().catch(() => ({}))) as Record<string, unknown> }
}

async function offerEnquiryTests() {
  console.log('Offer enquiry schema (shared by form and API):')
  const phones: [string, string | null][] = [
    ['050 123 4567', '+971501234567'],
    ['50-123-4567', '+971501234567'],
    ['+971 50 123 4567', '+971501234567'],
    ['00971501234567', '+971501234567'],
    ['(04) 123 4567', '+97141234567'],
    ['+971 050 123 4567', '+971501234567'],
    ['12345', null],
    ['+44 7700 900123', null],
    ['050 123 456a', null],
  ]
  for (const [input, want] of phones) {
    const got = normalizeUaePhone(input)
    check(`phone ${JSON.stringify(input)}`, got === want, String(got))
  }

  const schema = offerEnquirySchema(OFFER.models)
  const ok = schema.safeParse(ENQUIRY)
  check('valid enquiry parses', ok.success, ok.success ? ok.data.phone : '')
  const zwsp = String.fromCharCode(0x200b)
  const cleaned = schema.safeParse({ ...ENQUIRY, fullName: `  Layla${zwsp}\n  Al  Mansoori ` })
  check('name: invisible chars and spacing cleaned', cleaned.success && cleaned.data.fullName === 'Layla Al Mansoori')
  const arabic = schema.safeParse({ ...ENQUIRY, fullName: 'ليلى المنصوري' })
  check('name: Arabic accepted', arabic.success)
  const bad = schema.safeParse({
    ...ENQUIRY,
    fullName: '<script>',
    email: 'layla@',
    phone: '123',
    model: 'Emira',
    contactMethod: 'fax',
    consent: false,
  })
  const codes = bad.success ? {} : fieldErrors(bad.error)
  check(
    'bad fields -> one code each',
    JSON.stringify(codes) ===
      JSON.stringify({
        fullName: 'invalidName',
        email: 'invalidEmail',
        phone: 'invalidPhone',
        model: 'invalidOption',
        contactMethod: 'required',
        consent: 'consent',
      }),
    JSON.stringify(codes),
  )
  const empty = offerEnquirySchema([]).safeParse({ ...ENQUIRY, model: 'anything' })
  check('no model options -> model ignored', empty.success && empty.data.model === '')
  check('UAE date rolls over at 20:00 UTC', dubaiToday(new Date('2026-10-20T20:30:00Z')) === '2026-10-21')

  console.log('Offer enquiry handler:')
  let r = await post(fakeStore().store, ENQUIRY, { method: 'GET' })
  check('GET -> 405', r.status === 405)
  r = await post(fakeStore().store, 'fullName=x', { type: 'text/plain' })
  check('non-JSON content type -> 415', r.status === 415)
  r = await post(fakeStore().store, '{nope')
  check('malformed JSON -> 400', r.status === 400)

  const honey = fakeStore()
  r = await post(honey.store, { ...ENQUIRY, website: 'https://spam.example' })
  check('honeypot -> 201 but nothing stored', r.status === 201 && honey.created.length === 0)

  r = await post(fakeStore(null).store, ENQUIRY)
  check('offer not live -> 404', r.status === 404)
  r = await post(fakeStore().store, { ...ENQUIRY, offerId: 'drafts.offer-eletre-x' })
  check('draft / private offer id -> 400', r.status === 400)

  r = await post(fakeStore().store, { ...ENQUIRY, phone: '123', consent: false })
  check(
    'invalid fields -> 400 with codes',
    r.status === 400 && JSON.stringify(r.body.fields) === JSON.stringify({ phone: 'invalidPhone', consent: 'consent' }),
    JSON.stringify(r.body.fields),
  )

  const good = fakeStore()
  r = await post(good.store, ENQUIRY)
  const doc = good.created[0]
  check('valid -> 201 and one document', r.status === 201 && good.created.length === 1)
  check('doc id is private (dotted path)', /^offerEnquiry\.[0-9a-f-]{36}$/.test(doc?._id ?? ''), doc?._id)
  check(
    'doc links the offer, normalised, timestamped',
    doc?.offer._ref === OFFER._id &&
      doc.offer._weak === true &&
      doc.offerTitle === 'Eletre X' &&
      doc.phone === '+971501234567' &&
      doc.status === 'new' &&
      doc.submittedAt === '2026-10-21T08:00:00.000Z' &&
      doc.source.utmSource === 'instagram' &&
      !('website' in doc),
  )

  const logged: string[] = []
  const realLog = console.error
  console.error = (...args: unknown[]) => void logged.push(args.map(String).join(' '))
  r = await post(fakeStore(OFFER, true).store, ENQUIRY)
  console.error = realLog
  check('store failure -> 502', r.status === 502)
  check(
    'failure log has no PII',
    logged.length > 0 && logged.every((line) => !line.includes(ENQUIRY.email) && !line.includes('Layla')),
    logged.join(' | '),
  )

  const limited = fakeStore()
  const statuses: number[] = []
  for (let i = 0; i <= RATE_LIMIT.max; i++) statuses.push((await post(limited.store, ENQUIRY, { ip: '203.0.113.9' })).status)
  check(
    `rate limit: request ${RATE_LIMIT.max + 1} from one IP -> 429`,
    statuses.slice(0, -1).every((s) => s === 201) && statuses.at(-1) === 429,
    statuses.join(','),
  )

  const nodeRun = adapt(createHandler(fakeStore().store), 'offer-enquiry')
  const { res, out } = mockRes()
  const req = {
    method: 'POST',
    url: '/api/offer-enquiry',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '198.51.100.7' },
    body: ENQUIRY,
    on: () => undefined,
  }
  await nodeRun(req as never, res as never)
  check('Node signature: valid -> 201, response ended', out.ended && out.status === 201, out.body)
}

/* ------------------------------------------------------------------ */
/* Know more (interest) enquiries: the handler on a fake store          */
/* ------------------------------------------------------------------ */

const OPTIONS = { models: ['Eletre X', 'Emira'], topics: ['Prices and offers', 'Finance'] }

const INTEREST = {
  locale: 'ar',
  source: { page: '/ar/know-more' },
  model: 'Eletre X',
  topics: ['Finance', 'Finance'],
  firstName: 'Layla',
  lastName: 'Al Mansoori',
  email: 'layla@example.com',
  phone: '050 123 4567',
  contactMethod: 'email',
  consent: true,
  marketingConsent: true,
  website: '',
}

async function interestEnquiryTests() {
  console.log('Know more enquiry handler:')
  const created: InterestEnquiryDoc[] = []
  const store = (options: typeof OPTIONS | null = OPTIONS): InterestStore => ({
    findOptions: async () => options,
    create: async (doc) => void created.push(doc),
  })
  const send = async (s: InterestStore, body: unknown) => {
    const run = createInterestHandler(s, () => new Date('2026-11-01T08:00:00Z'))
    const response = await run(
      new Request('https://local/api/interest-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `10.1.0.${++ipCounter}` },
        body: JSON.stringify(body),
      }),
    )
    return { status: response.status, body: (await response.json().catch(() => ({}))) as Record<string, unknown> }
  }

  let r = await send(store(null), INTEREST)
  check('page not published -> 503', r.status === 503)
  r = await send(store(), { ...INTEREST, website: 'spam' })
  check('honeypot -> 201 but nothing stored', r.status === 201 && created.length === 0)
  r = await send(store(), { ...INTEREST, model: 'Eletre', topics: ['Bitcoin'], lastName: '', consent: false })
  check(
    'invalid fields -> 400 with codes',
    r.status === 400 &&
      JSON.stringify(r.body.fields) ===
        JSON.stringify({ model: 'invalidOption', topics: 'invalidOption', lastName: 'required', consent: 'consent' }),
    JSON.stringify(r.body.fields),
  )
  r = await send(store(), { ...INTEREST, topics: undefined })
  check('no topics -> accepted as none', r.status === 201 && created.at(-1)?.topics.length === 0)

  r = await send(store(), INTEREST)
  const doc = created.at(-1)
  check('valid -> 201', r.status === 201)
  check('doc id is private (dotted path)', /^interestEnquiry\.[0-9a-f-]{36}$/.test(doc?._id ?? ''), doc?._id)
  check(
    'doc normalised, deduped, timestamped',
    doc?.phone === '+971501234567' &&
      JSON.stringify(doc.topics) === '["Finance"]' &&
      doc.status === 'new' &&
      doc.locale === 'ar' &&
      doc.marketingConsent === true &&
      doc.submittedAt === '2026-11-01T08:00:00.000Z' &&
      doc.source.page === '/ar/know-more' &&
      !('website' in doc),
    JSON.stringify(doc),
  )
}

/* ------------------------------------------------------------------ */
/* The Studio's Enquiries dashboard: filters, counts and export          */
/* ------------------------------------------------------------------ */

function dashboardTests() {
  console.log('Enquiries dashboard:')
  const rows: EnquiryRow[] = [
    { _id: 'a', _type: 'testDriveEnquiry', status: 'new', submittedAt: '2026-09-02T08:00:00Z', name: 'Old Slug', phone: '+971 50 111 2222', model: 'emira-420-sport', details: 'Dubai' },
    { _id: 'b', _type: 'testDriveEnquiry', status: 'contacted', submittedAt: '2026-11-05T08:00:00Z', name: 'New Name', phone: '+971 50 333 4444', model: 'Emira 420 Sport', details: 'Dubai', message: 'Weekend please' },
    { _id: 'c', _type: 'interestEnquiry', status: 'new', submittedAt: '2026-11-04T08:00:00Z', name: 'Layla Know', email: 'layla@example.com', model: 'Eletre X', details: 'Finance, Service and warranty', contactMethod: 'whatsapp', marketingConsent: true },
    { _id: 'd', _type: 'offerEnquiry', status: 'closed', submittedAt: '2026-10-01T08:00:00Z', name: '=HYPERLINK("x")', phone: '+971501234567', model: 'eletre-x', details: 'Eletre X offer', marketingConsent: null },
  ]
  const ids = (list: EnquiryRow[]) => list.map((r) => r._id).join('')

  check('slug and name show the same', modelName('emira-420-sport') === 'Emira 420 Sport' && modelName('Emira 420 Sport') === 'Emira 420 Sport')
  check('model filter lists each car once', modelOptions(rows).join('|') === 'Eletre X|Emira 420 Sport', modelOptions(rows).join('|'))
  check('newest first by default', ids(applyFilters(rows, DEFAULT_FILTERS)) === 'bcda', ids(applyFilters(rows, DEFAULT_FILTERS)))
  check('oldest first', ids(applyFilters(rows, { ...DEFAULT_FILTERS, sort: 'oldest' })) === 'adcb')
  check('tab limits the type', ids(applyFilters(rows, { ...DEFAULT_FILTERS, type: 'testDriveEnquiry' })) === 'ba')
  check('status filter', ids(applyFilters(rows, { ...DEFAULT_FILTERS, status: 'new' })) === 'ca')
  check('model filter matches slug and name', ids(applyFilters(rows, { ...DEFAULT_FILTERS, model: 'Emira 420 Sport' })) === 'ba')
  check('search ignores case', ids(applyFilters(rows, { ...DEFAULT_FILTERS, search: 'LAYLA' })) === 'c')
  check('search finds a number however it is spaced', ids(applyFilters(rows, { ...DEFAULT_FILTERS, search: '501112222' })) === 'a')
  check('search reads the message', ids(applyFilters(rows, { ...DEFAULT_FILTERS, search: 'weekend' })) === 'b')
  check('filtering leaves the source list alone', ids(rows) === 'abcd')

  const stats = computeStats(rows, new Date('2026-11-06T08:00:00Z').getTime())
  check(
    'counts by status and last 7 days',
    stats.total === 4 && stats.new === 2 && stats.contacted === 1 && stats.closed === 1 && stats.lastWeek === 2,
    JSON.stringify(stats),
  )
  check('dates show in Dubai time', formatDubai('2026-11-05T20:30:00Z').startsWith('06 Nov 2026'), formatDubai('2026-11-05T20:30:00Z'))
  check('bad or missing date shows nothing', formatDubai('nope') === '' && formatDubai(null) === '')

  const csv = dashboardCsv(rows)
  const lines = csv.split('\n')
  check('export has a header and one line per enquiry', lines.length === 5 && lines[0].startsWith('"Received (Dubai time)","Type","Status"'))
  check('export uses readable labels', lines[3].includes('"Know more","New"') && lines[3].includes('"WhatsApp"') && lines[3].includes('"Yes"'), lines[3].slice(0, 90))
  check('export defuses spreadsheet formulas', lines[4].includes(`"'=HYPERLINK(""x"")"`), lines[4].slice(0, 80))
  check('export keeps a phone number as it is', lines[4].includes('"+971501234567"'))
}
