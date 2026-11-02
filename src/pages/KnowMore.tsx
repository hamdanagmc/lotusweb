import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import '@/styles/lotus-uae-for-the-drivers.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/layout/Footer'
import CmsLink from '@/components/common/CmsLink'
import PageSkeleton from '@/components/common/PageSkeleton'
import PageTitleBand from '@/components/common/PageTitleBand'
import SiteHead from '@/components/common/SiteHead'
import TextField from '@/components/testdrive/TextField'
import {
  CARD_FOCUS,
  Checkbox,
  FieldError,
  INDENT,
  ModelPicker,
  SECTION_HEADING,
  SECTION_X,
  StepHeader,
  modelForParam,
} from '@/components/testdrive/TestDriveForm'
import NotFound from '@/pages/NotFound'
import { useLocale } from '@/i18n/LocaleProvider'
import { ui } from '@/i18n/ui'
import {
  interestEnquirySchema,
  type InterestEnquiryFields,
  type InterestEnquiryRequest,
} from '@/lib/interestEnquiry'
import { CONTACT_METHODS, fieldErrors, type FieldErrorCode, type FieldErrors } from '@/lib/offerEnquiry'
import { postJson } from '@/lib/submitEnquiry'
import { enquirySource } from '@/lib/utm'
import { cn } from '@/lib/utils'
import { KNOW_MORE_QUERY } from '@/sanity/queries'
import { useLiveQuery } from '@/sanity/useLiveQuery'
import type { KnowMorePageDoc } from '@/sanity/types'

const ENDPOINT = '/api/interest-enquiry'
/** The phone check is UAE-only, so the prefix is fixed rather than content. */
const PHONE_PREFIX = '+971'
const LABEL = 'text-xs leading-4 tracking-[0.15em] uppercase text-[#5a5a5a]'
/** A choice drawn as a box, yellow once picked: the offer form's contact methods. */
const chip = (on: boolean) =>
  cn(
    'flex cursor-pointer items-center justify-center border px-4 py-3 text-center text-sm leading-5 transition-colors',
    CARD_FOCUS,
    on ? 'border-black bg-lotus-yellow font-semibold' : 'border-black/20 hover:border-black',
  )

interface Values {
  /** The picked card's _key; sent as the car's English name. */
  model: string
  /** English topic text, as sent. */
  topics: string[]
  firstName: string
  lastName: string
  email: string
  phone: string
  contactMethod: string
  consent: boolean
  marketingConsent: boolean
}

const EMPTY: Values = {
  model: '',
  topics: [],
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  contactMethod: '',
  consent: false,
  marketingConsent: false,
}

/**
 * The interest form, laid out like the test-drive form: pick a car, then
 * numbered steps. Checked in the browser with the same zod schema the API
 * uses; the API's verdict wins. Copy is the Know more page document, error
 * messages are ui.ts.
 */
function KnowMoreForm({ page, initialModel }: { page: KnowMorePageDoc; initialModel?: string }) {
  const { t, locale } = useLocale()
  const formRef = useRef<HTMLFormElement>(null)
  const sentRef = useRef<HTMLHeadingElement>(null)
  const [values, setValues] = useState<Values>(EMPTY)
  const [website, setWebsite] = useState('')
  const [errors, setErrors] = useState<FieldErrors<InterestEnquiryFields>>({})
  const [formError, setFormError] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')

  const models = page.modelStep?.models ?? []
  const topics = page.topicsStep?.topics ?? []
  const englishName = (key: string) => {
    const m = models.find((model) => model._key === key)
    return m?.name?.en || m?.vehicle?.name?.en || ''
  }

  // Arriving from a car's "Know more" button: preselect it.
  const preselected = modelForParam(models, initialModel)
  useEffect(() => {
    if (preselected) setValues((v) => (v.model ? v : { ...v, model: preselected }))
  }, [preselected])

  // Move focus to the confirmation so screen readers announce it.
  useEffect(() => {
    if (status === 'sent') sentRef.current?.focus()
  }, [status])

  const message = (code?: FieldErrorCode) =>
    code ? ui(locale, code === 'consent' ? 'contactConsent' : code) : undefined

  const set = <K extends keyof Values>(field: K, value: Values[K]) => {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
    setFormError('')
  }

  const toggleTopic = (topic: string) =>
    set('topics', values.topics.includes(topic) ? values.topics.filter((x) => x !== topic) : [...values.topics, topic])

  const focusFirstInvalid = () =>
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[data-invalid="true"]')?.focus())

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (status === 'sending') return

    const answers = { ...values, model: englishName(values.model) }
    const schema = interestEnquirySchema(
      models.map((m) => englishName(m._key)),
      topics.map((topic) => topic.en ?? ''),
    )
    const parsed = schema.safeParse(answers)
    if (!parsed.success) {
      setErrors(fieldErrors<InterestEnquiryFields>(parsed.error))
      focusFirstInvalid()
      return
    }

    setStatus('sending')
    const payload: InterestEnquiryRequest = { ...answers, locale, source: enquirySource(), website }
    try {
      const response = await postJson(ENDPOINT, payload)
      if (response.ok) {
        setStatus('sent')
        return
      }
      const body = (await response.json().catch(() => ({}))) as { fields?: FieldErrors<InterestEnquiryFields> }
      if (response.status === 400 && body.fields) {
        setErrors(body.fields)
        focusFirstInvalid()
      } else {
        setFormError(ui(locale, response.status === 429 ? 'tooManyEnquiries' : 'enquiryFailed'))
      }
    } catch {
      setFormError(ui(locale, 'enquiryFailed'))
    }
    setStatus('idle')
  }

  if (status === 'sent') {
    return (
      <section className={cn('bg-white py-20 text-black lg:py-28', SECTION_X)}>
        <div className="max-w-[672px]">
          <h2 ref={sentRef} tabIndex={-1} className={cn(SECTION_HEADING, 'outline-none')}>
            {t(page.successHeading).replace('{name}', values.firstName.trim())}
          </h2>
          {t(page.successBody) ? (
            <p className="mt-4 whitespace-pre-line text-sm leading-6 text-[#5a5a5a]">{t(page.successBody)}</p>
          ) : null}
          {page.successCta?.href && t(page.successCta.label) ? (
            <CmsLink
              link={page.successCta}
              className="mt-10 inline-block bg-lotus-yellow px-10 py-5 text-sm font-semibold uppercase leading-5 tracking-[0.15em] text-black transition-colors hover:bg-[#e6c800]"
            />
          ) : null}
        </div>
      </section>
    )
  }

  // {privacy} in the consent text becomes the CMS privacy link.
  const consentText = t(page.consent)
    .split(/(\{privacy\})/)
    .map((part, i) =>
      part === '{privacy}' ? (
        <CmsLink key={i} link={page.privacyLink} className="underline decoration-1 underline-offset-2" />
      ) : (
        part
      ),
    )

  const sending = status === 'sending'
  const methodLabel = { phone: page.contactPhone, email: page.contactEmail, whatsapp: page.contactWhatsapp }
  const section = cn('border-b border-black/10 py-14 lg:py-20', SECTION_X)
  let step = 0

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="relative bg-white text-black">
      <section className={section}>
        <h2 className={SECTION_HEADING}>{t(page.modelStep?.heading)}</h2>
        {t(page.modelStep?.intro) ? (
          <p className="mt-3 text-sm font-light leading-5 text-[#5a5a5a]">{t(page.modelStep?.intro)}</p>
        ) : null}
        <ModelPicker
          legend={t(page.modelStep?.heading)}
          models={models}
          value={values.model}
          onChange={(key) => set('model', key)}
          invalid={!!errors.model}
        />
        <FieldError message={message(errors.model)} />
      </section>

      {topics.length ? (
        <section className={section}>
          <StepHeader n={++step}>{t(page.topicsStep?.heading)}</StepHeader>
          {t(page.topicsStep?.intro) ? (
            <p className={cn('mt-6 max-w-[576px] text-sm font-light leading-5 text-[#5a5a5a]', INDENT)}>
              {t(page.topicsStep?.intro)}
            </p>
          ) : null}
          <fieldset className={cn('mt-8 flex min-w-0 max-w-[768px] flex-wrap gap-3 lg:mt-10', INDENT)}>
            <legend className="sr-only">{t(page.topicsStep?.heading)}</legend>
            {topics.map((topic) => {
              const on = values.topics.includes(topic.en ?? '')
              return (
                <label key={topic._key} className={chip(on)}>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggleTopic(topic.en ?? '')}
                    className="sr-only"
                  />
                  {t(topic)}
                </label>
              )
            })}
          </fieldset>
          <div className={INDENT}>
            <FieldError message={message(errors.topics)} />
          </div>
        </section>
      ) : null}

      <section className={section}>
        <StepHeader n={++step}>{t(page.detailsStep?.heading)}</StepHeader>
        <div className={cn('mt-8 grid max-w-[768px] gap-x-10 gap-y-7 sm:grid-cols-2 lg:mt-12', INDENT)}>
          <TextField
            label={t(page.firstName)}
            name="firstName"
            autoComplete="given-name"
            maxLength={60}
            required
            value={values.firstName}
            onChange={(v) => set('firstName', v)}
            error={message(errors.firstName)}
          />
          <TextField
            label={t(page.lastName)}
            name="lastName"
            autoComplete="family-name"
            maxLength={60}
            required
            value={values.lastName}
            onChange={(v) => set('lastName', v)}
            error={message(errors.lastName)}
          />
          <TextField
            label={t(page.email)}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={200}
            required
            value={values.email}
            onChange={(v) => set('email', v)}
            error={message(errors.email)}
          />
          <TextField
            label={t(page.phone)}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            prefix={PHONE_PREFIX}
            placeholder={t(page.phonePlaceholder)}
            maxLength={20}
            required
            value={values.phone}
            onChange={(v) => set('phone', v)}
            error={message(errors.phone)}
          />
          <fieldset className="min-w-0 sm:col-span-2">
            <legend className={LABEL}>{t(page.contactMethod)}</legend>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:max-w-[480px]">
              {CONTACT_METHODS.map((method) => (
                <label key={method} className={chip(values.contactMethod === method)}>
                  <input
                    type="radio"
                    name="contactMethod"
                    value={method}
                    checked={values.contactMethod === method}
                    onChange={() => set('contactMethod', method)}
                    data-invalid={errors.contactMethod ? 'true' : 'false'}
                    aria-invalid={!!errors.contactMethod}
                    className="sr-only"
                  />
                  {t(methodLabel[method])}
                </label>
              ))}
            </div>
            <FieldError message={message(errors.contactMethod)} />
          </fieldset>
        </div>
      </section>

      <section className={cn('py-14 lg:py-20', SECTION_X)}>
        <StepHeader n={++step}>{t(page.privacyStep?.heading)}</StepHeader>
        <div className={cn('mt-8 flex max-w-[672px] flex-col gap-5 lg:mt-10', INDENT)}>
          <div>
            <Checkbox checked={values.consent} invalid={!!errors.consent} onChange={(on) => set('consent', on)}>
              {consentText}
            </Checkbox>
            <div className="ms-9">
              <FieldError message={message(errors.consent)} />
            </div>
          </div>
          {t(page.marketingConsent) ? (
            <Checkbox
              checked={values.marketingConsent}
              onChange={(on) => set('marketingConsent', on)}
              className="pb-5"
            >
              {t(page.marketingConsent)}
            </Checkbox>
          ) : null}

          {/* Honeypot: off-screen and skipped by keyboard and screen readers, so only bots fill it. */}
          <div aria-hidden="true" className="absolute -start-[10000px] top-0 h-px w-px overflow-hidden">
            <label>
              Website
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>
          </div>

          {formError ? (
            <p role="alert" className="border border-[#d32f2f] bg-[#d32f2f]/5 p-4 text-sm leading-5">
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={sending}
            className="w-full bg-lotus-yellow py-5 text-sm font-semibold uppercase leading-5 tracking-[0.15em] text-black transition-colors hover:bg-[#e6c800] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? t(page.submitting) : t(page.submit)}
          </button>
        </div>
      </section>
    </form>
  )
}

/**
 * /know-more: register interest in a car. Every "Know more" button comes
 * here; ?model=<slug> preselects the car. All copy is the Know more page
 * document in the Studio; answers become Know more enquiries there.
 */
export default function KnowMore() {
  const { t, locale } = useLocale()
  const [params] = useSearchParams()
  const { data, loading, error } = useLiveQuery<KnowMorePageDoc | null>(KNOW_MORE_QUERY)

  if (loading && !data) return <PageSkeleton />

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-lotus-black px-8 text-center text-lotus-text-off">
        <p role="alert">{ui(locale, 'pageLoadFailed')}</p>
      </div>
    )
  }

  if (!data) return <NotFound />

  return (
    <div className="antialiased selection:bg-lotus-yellow selection:text-lotus-black">
      <SiteHead
        title={t(data.seo?.title) || t(data.heading)}
        description={t(data.seo?.description)}
        image={data.seo?.ogImage ?? data.image}
      />
      <Navbar />
      <main>
        <PageTitleBand heading={t(data.heading)} intro={t(data.intro)} image={data.image} />
        <KnowMoreForm page={data} initialModel={params.get('model') ?? undefined} />
      </main>
      <Footer />
    </div>
  )
}
