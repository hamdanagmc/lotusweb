import { z } from 'zod'
import {
  consentField,
  contactMethodField,
  emailField,
  nameField,
  optionField,
  phoneField,
  type EnquirySource,
} from './offerEnquiry.js'

/**
 * The "Know more" interest form rules, shared by the form and
 * api/interest-enquiry.ts. Same constraints as offerEnquiry.ts: relative
 * imports with .js, no `@/` aliases, browser globals or import.meta.env.
 */

/** `models` and `topics` are the English names listed on the Know more page document. */
export function interestEnquirySchema(models: string[], topics: string[]) {
  return z.object({
    model: optionField(models),
    // Optional: the visitor may tick none. Duplicates are dropped.
    topics: z
      .array(z.string(), { errorMap: () => ({ message: 'invalidOption' }) })
      .default([])
      .refine((list) => list.every((topic) => topics.includes(topic)), 'invalidOption')
      .transform((list) => [...new Set(list)]),
    firstName: nameField(60),
    lastName: nameField(60),
    email: emailField,
    phone: phoneField,
    contactMethod: contactMethodField,
    consent: consentField,
    marketingConsent: z.boolean().catch(false),
  })
}

export type InterestEnquiryFields = z.output<ReturnType<typeof interestEnquirySchema>>

/** What the form POSTs. `website` is the honeypot: people never fill it. */
export interface InterestEnquiryRequest {
  locale: string
  source: EnquirySource
  model: string
  topics: string[]
  firstName: string
  lastName: string
  email: string
  phone: string
  contactMethod: string
  consent: boolean
  marketingConsent: boolean
  website: string
}
