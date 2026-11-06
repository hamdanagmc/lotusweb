/**
 * What the enquiry types share: their statuses, and the pure helpers behind
 * the Enquiries dashboard. No React or Sanity imports, so apitest.ts in the
 * website project can test them.
 */

export const ENQUIRY_STATUSES = [
  {title: 'New', value: 'new'},
  {title: 'Contacted', value: 'contacted'},
  {title: 'Closed', value: 'closed'},
]

export const CONTACT_METHODS = [
  {title: 'Phone call', value: 'phone'},
  {title: 'Email', value: 'email'},
  {title: 'WhatsApp', value: 'whatsapp'},
]

export const ENQUIRY_TYPES = {
  testDriveEnquiry: 'Test drive',
  interestEnquiry: 'Know more',
  offerEnquiry: 'Offer',
} as const
export type EnquiryType = keyof typeof ENQUIRY_TYPES

export interface EnquiryRow {
  _id: string
  _type: EnquiryType
  status: string
  submittedAt?: string | null
  name?: string | null
  email?: string | null
  phone?: string | null
  model?: string | null
  /** What it is about: the showroom, the topics or the offer. */
  details?: string | null
  contactMethod?: string | null
  preferredDate?: string | null
  message?: string | null
  country?: string | null
  marketingConsent?: boolean | null
  locale?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  utmTerm?: string | null
  utmContent?: string | null
  page?: string | null
  referrer?: string | null
}

export const ENQUIRY_TYPE_NAMES = Object.keys(ENQUIRY_TYPES) as EnquiryType[]

/** Every enquiry as one flat row. Test drive enquiries from before the status field count as new. */
export const ENQUIRIES_QUERY = /* groq */ `*[
  _type in ${JSON.stringify(ENQUIRY_TYPE_NAMES)} && !(_id in path("drafts.**")) && !(_id in path("versions.**"))
]{
  _id, _type, email, phone, model, contactMethod, preferredDate, message, country, marketingConsent, locale,
  "status": coalesce(status, "new"),
  "submittedAt": coalesce(submittedAt, _createdAt),
  "name": coalesce(fullName, firstName + " " + lastName),
  "details": select(
    _type == "testDriveEnquiry" => location,
    _type == "interestEnquiry" => array::join(coalesce(topics, []), ", "),
    _type == "offerEnquiry" => coalesce(offer->title.en, offerTitle)
  ),
  "utmSource": source.utmSource, "utmMedium": source.utmMedium, "utmCampaign": source.utmCampaign,
  "utmTerm": source.utmTerm, "utmContent": source.utmContent, "page": source.page, "referrer": source.referrer
}`

/**
 * Older test drive enquiries saved the car's slug ("emira-420-sport"), newer
 * ones its name ("Emira 420 Sport"). Show both the same way, so the model
 * filter lists each car once.
 */
export function modelName(model?: string | null): string {
  const value = model?.trim() ?? ''
  if (!/^[a-z0-9-]+$/.test(value)) return value
  return value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const dubaiFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Dubai',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export function formatDubai(iso?: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : dubaiFormat.format(date)
}

/** wa.me chat link for a stored number such as "+971501234567". */
export function whatsAppUrl(phone?: string | null): string {
  const digits = (phone ?? '').replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : ''
}

const label = (list: {title: string; value: string}[], value?: string | null) =>
  list.find((item) => item.value === value)?.title ?? value ?? ''

export const statusLabel = (status?: string | null) => label(ENQUIRY_STATUSES, status)
export const contactLabel = (method?: string | null) => label(CONTACT_METHODS, method)

export interface Filters {
  type: 'all' | EnquiryType
  search: string
  status: string
  model: string
  sort: 'newest' | 'oldest'
}

export const DEFAULT_FILTERS: Filters = {type: 'all', search: '', status: '', model: '', sort: 'newest'}

export const ofType = (rows: EnquiryRow[], type: Filters['type']) =>
  type === 'all' ? rows : rows.filter((r) => r._type === type)

/** The cars on these rows, each once, for the model filter. */
export function modelOptions(rows: EnquiryRow[]): string[] {
  return [...new Set(rows.map((r) => modelName(r.model)).filter(Boolean))].sort()
}

const normalise = (text: string) => text.toLowerCase().replace(/\s+/g, ' ').trim()
const time = (r: EnquiryRow) => new Date(r.submittedAt ?? 0).getTime() || 0

export function applyFilters(rows: EnquiryRow[], f: Filters): EnquiryRow[] {
  const query = normalise(f.search)
  const compact = query.replace(/ /g, '')
  const kept = ofType(rows, f.type).filter((r) => {
    if (f.status && r.status !== f.status) return false
    if (f.model && modelName(r.model) !== f.model) return false
    if (!query) return true
    const text = normalise(
      [r.name, r.email, r.phone, modelName(r.model), r.details, r.message].filter(Boolean).join(' '),
    )
    // The compact check finds a number however it was spaced: "050 123" and "050123".
    return text.includes(query) || text.replace(/ /g, '').includes(compact)
  })
  return kept.sort((a, b) => (f.sort === 'oldest' ? time(a) - time(b) : time(b) - time(a)))
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export function computeStats(rows: EnquiryRow[], now = Date.now()) {
  const count = (status: string) => rows.filter((r) => r.status === status).length
  return {
    total: rows.length,
    new: count('new'),
    contacted: count('contacted'),
    closed: count('closed'),
    lastWeek: rows.filter((r) => now - time(r) < WEEK_MS).length,
  }
}

type Cell = string | boolean | null | undefined

export interface CsvColumn {
  key: string
  label: string
}

/**
 * Spreadsheets run a cell that starts with = + - @ as a formula, so a visitor
 * could plant one in a form field. Quote those, except phone numbers.
 */
function csvCell(value: unknown) {
  let text = value == null ? '' : String(value)
  if (/^[=+\-@\t\r]/.test(text) && !/^\+\d+$/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

export function toCsv(rows: Record<string, Cell>[], columns: CsvColumn[]) {
  const lines = rows.map((r) => columns.map((c) => csvCell(r[c.key])).join(','))
  return [columns.map((c) => csvCell(c.label)).join(','), ...lines].join('\n')
}

/** The byte order mark tells Excel the file is UTF-8, so Arabic names stay readable. */
export function downloadCsv(csv: string, filename: string) {
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], {type: 'text/csv;charset=utf-8;'}))
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

const DASHBOARD_COLUMNS: CsvColumn[] = [
  {key: 'received', label: 'Received (Dubai time)'},
  {key: 'type', label: 'Type'},
  {key: 'statusName', label: 'Status'},
  {key: 'name', label: 'Name'},
  {key: 'email', label: 'Email'},
  {key: 'phone', label: 'Phone'},
  {key: 'modelName', label: 'Model'},
  {key: 'details', label: 'Details'},
  {key: 'contactBy', label: 'Contact by'},
  {key: 'preferredDate', label: 'Preferred date'},
  {key: 'message', label: 'Message'},
  {key: 'country', label: 'Country'},
  {key: 'marketing', label: 'Marketing opt-in'},
  {key: 'locale', label: 'Language'},
  {key: 'utmSource', label: 'utm_source'},
  {key: 'utmMedium', label: 'utm_medium'},
  {key: 'utmCampaign', label: 'utm_campaign'},
  {key: 'utmTerm', label: 'utm_term'},
  {key: 'utmContent', label: 'utm_content'},
  {key: 'page', label: 'Page'},
  {key: 'referrer', label: 'Referrer'},
]

export function dashboardCsv(rows: EnquiryRow[]) {
  return toCsv(
    rows.map((r) => ({
      ...r,
      received: formatDubai(r.submittedAt),
      type: ENQUIRY_TYPES[r._type],
      statusName: statusLabel(r.status),
      modelName: modelName(r.model),
      contactBy: contactLabel(r.contactMethod),
      marketing: r.marketingConsent == null ? '' : r.marketingConsent ? 'Yes' : 'No',
    })),
    DASHBOARD_COLUMNS,
  )
}
