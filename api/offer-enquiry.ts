/**
 * POST /api/offer-enquiry: records an enquiry from an offer page in Sanity.
 *
 * Checks, in order: the shared ones in _lib/enquiry.ts (method, content type,
 * per-IP rate limit, body size, honeypot), that the offer is published and
 * live today, then the visitor's answers against the same zod schema the form
 * uses.
 *
 * Enquiries are created as `offerEnquiry.<uuid>`. Both datasets are public,
 * and Sanity only keeps documents whose ID contains a dot private, so this
 * keeps names, emails and phone numbers out of the public API.
 *
 * Nothing here logs request bodies or field values: only error types.
 *
 * Server-side environment variables (never bundled into the site):
 *   SANITY_PROJECT_ID, SANITY_DATASET
 *   SANITY_WRITE_TOKEN — Editor role (SANITY_API_WRITE_TOKEN also works)
 *
 * Relative imports carry .js: package.json is "type": "module", and Node's
 * ESM loader on Vercel does not guess extensions.
 */

import { randomUUID } from 'node:crypto'
import { adapt } from './_lib/adapter.js'
import { json, logFailure, readEnquiry, sanityClient } from './_lib/enquiry.js'
import {
  LIVE_OFFER,
  dubaiToday,
  enquiryMetaSchema,
  fieldErrors,
  offerEnquirySchema,
  type EnquirySource,
} from '../src/lib/offerEnquiry.js'

export interface LiveOffer {
  _id: string
  title: string
  /** English names: what the form submits and the schema accepts. */
  models: string[]
}

export interface OfferEnquiryDoc {
  _id: string
  _type: 'offerEnquiry'
  status: 'new'
  offer: { _type: 'reference'; _ref: string; _weak: true }
  offerTitle: string
  fullName: string
  email: string
  phone: string
  model?: string
  contactMethod: string
  consent: true
  locale: string
  source: EnquirySource
  submittedAt: string
}

/** Where enquiries go. Swappable so the handler can be tested without Sanity. */
export interface EnquiryStore {
  findLiveOffer(id: string, today: string): Promise<LiveOffer | null>
  create(doc: OfferEnquiryDoc): Promise<void>
}

export const sanityStore: EnquiryStore = {
  findLiveOffer: (id, today) =>
    sanityClient().fetch<LiveOffer | null>(
      `*[${LIVE_OFFER} && _id == $id][0]{ _id, "title": coalesce(title.en, ""), "models": coalesce(modelOptions[defined(en)].en, []) }`,
      { id, today },
    ),
  create: async (doc) => {
    await sanityClient().create(doc)
  },
}

export function createHandler(store: EnquiryStore, clock = () => new Date()) {
  return async function webHandler(request: Request): Promise<Response> {
    const body = await readEnquiry(request)
    if (body instanceof Response) return body

    const meta = enquiryMetaSchema.safeParse(body)
    if (!meta.success) return json({ error: 'Unknown offer' }, 400)

    const now = clock()
    let offer: LiveOffer | null
    try {
      offer = await store.findLiveOffer(meta.data.offerId, dubaiToday(now))
    } catch (error) {
      logFailure('offer-enquiry', 'offer lookup', error)
      return json({ error: 'Could not record enquiry' }, 502)
    }
    if (!offer) return json({ error: 'Offer not available' }, 404)

    const fields = offerEnquirySchema(offer.models).safeParse(body)
    if (!fields.success) return json({ error: 'Invalid fields', fields: fieldErrors(fields.error) }, 400)

    const doc: OfferEnquiryDoc = {
      _id: `offerEnquiry.${randomUUID()}`,
      _type: 'offerEnquiry',
      status: 'new',
      offer: { _type: 'reference', _ref: offer._id, _weak: true },
      offerTitle: offer.title,
      fullName: fields.data.fullName,
      email: fields.data.email,
      phone: fields.data.phone,
      model: fields.data.model || undefined,
      contactMethod: fields.data.contactMethod,
      consent: true,
      locale: meta.data.locale,
      source: meta.data.source,
      // The server's clock, never one the browser claims.
      submittedAt: now.toISOString(),
    }

    try {
      await store.create(doc)
    } catch (error) {
      logFailure('offer-enquiry', 'create', error)
      return json({ error: 'Could not record enquiry' }, 502)
    }
    return json({ ok: true }, 201)
  }
}

export default adapt(createHandler(sanityStore), 'offer-enquiry')
