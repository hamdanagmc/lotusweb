/**
 * POST /api/interest-enquiry: records a "Know more" form (/know-more) in Sanity.
 *
 * Checks, in order: the shared ones in _lib/enquiry.ts (method, content type,
 * per-IP rate limit, body size, honeypot), that the Know more page is
 * published, then the visitor's answers against the same zod schema the form
 * uses, with the models and topics that page lists.
 *
 * Saved as `interestEnquiry.<uuid>`: the dataset is public, and only dotted
 * IDs stay out of the public API. Nothing here logs request bodies or values.
 * Environment variables as api/offer-enquiry.ts.
 */

import { randomUUID } from 'node:crypto'
import { adapt } from './_lib/adapter.js'
import { json, logFailure, readEnquiry, sanityClient } from './_lib/enquiry.js'
import { fieldErrors, sourceMetaSchema, type EnquirySource } from '../src/lib/offerEnquiry.js'
import { interestEnquirySchema, type InterestEnquiryFields } from '../src/lib/interestEnquiry.js'

/** English names: what the form submits and the schema accepts. */
export interface InterestOptions {
  models: string[]
  topics: string[]
}

export interface InterestEnquiryDoc {
  _id: string
  _type: 'interestEnquiry'
  status: 'new'
  model: string
  topics: string[]
  firstName: string
  lastName: string
  email: string
  phone: string
  contactMethod: string
  consent: true
  marketingConsent: boolean
  locale: string
  source: EnquirySource
  submittedAt: string
}

/** Where enquiries go. Swappable so the handler can be tested without Sanity. */
export interface InterestStore {
  /** null when the Know more page is not published. */
  findOptions(): Promise<InterestOptions | null>
  create(doc: InterestEnquiryDoc): Promise<void>
}

export const sanityStore: InterestStore = {
  findOptions: async () => {
    const page = await sanityClient().fetch<{
      models: { name?: string | null }[] | null
      topics: { en?: string | null }[] | null
    } | null>(
      `*[_id == "knowMorePage"][0]{
        "models": modelStep.models[defined(vehicle->_id)]{ "name": coalesce(name.en, vehicle->name.en) },
        "topics": topicsStep.topics[defined(en)]{ en }
      }`,
    )
    if (!page) return null
    return {
      models: (page.models ?? []).flatMap((m) => (m.name ? [m.name] : [])),
      topics: (page.topics ?? []).flatMap((t) => (t.en ? [t.en] : [])),
    }
  },
  create: async (doc) => {
    await sanityClient().create(doc)
  },
}

export function createHandler(store: InterestStore, clock = () => new Date()) {
  return async function webHandler(request: Request): Promise<Response> {
    const body = await readEnquiry(request)
    if (body instanceof Response) return body

    let options: InterestOptions | null
    try {
      options = await store.findOptions()
    } catch (error) {
      logFailure('interest-enquiry', 'page lookup', error)
      return json({ error: 'Could not record enquiry' }, 502)
    }
    if (!options?.models.length) return json({ error: 'Form not available' }, 503)

    const fields = interestEnquirySchema(options.models, options.topics).safeParse(body)
    if (!fields.success) {
      return json({ error: 'Invalid fields', fields: fieldErrors<InterestEnquiryFields>(fields.error) }, 400)
    }
    // Every meta field falls back rather than failing, so this cannot throw.
    const meta = sourceMetaSchema.parse(body)

    const doc: InterestEnquiryDoc = {
      _id: `interestEnquiry.${randomUUID()}`,
      _type: 'interestEnquiry',
      status: 'new',
      ...fields.data,
      locale: meta.locale,
      source: meta.source,
      // The server's clock, never one the browser claims.
      submittedAt: clock().toISOString(),
    }

    try {
      await store.create(doc)
    } catch (error) {
      logFailure('interest-enquiry', 'create', error)
      return json({ error: 'Could not record enquiry' }, 502)
    }
    return json({ ok: true }, 201)
  }
}

export default adapt(createHandler(sanityStore), 'interest-enquiry')
