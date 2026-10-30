import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import CmsLink from '@/components/common/CmsLink'
import SanityImage from '@/components/common/SanityImage'
import { useLocale } from '@/i18n/LocaleProvider'
import { ui } from '@/i18n/ui'
import { useLiveQuery } from '@/sanity/useLiveQuery'
import { SHOWROOM_OPTIONS_QUERY } from '@/sanity/queries'
import { submitEnquiry } from '@/lib/submitEnquiry'
import { cn } from '@/lib/utils'
import TextField from './TextField'
import checkIcon from '@/assets/test-drive/check.svg'
import prevIcon from '@/assets/test-drive/arrow-prev.svg'
import nextIcon from '@/assets/test-drive/arrow-next.svg'
import type { Showroom, TestDriveModel, TestDrivePage } from '@/sanity/types'

/** Figma's 88px desktop gutter, the site gutter below it. */
export const SECTION_X = 'px-5 md:px-8 lg:px-[88px]'
/** Section headings: wide tracking through the variable .font-display pins. */
export const SECTION_HEADING =
  'font-display text-[20px] leading-8 uppercase lg:text-[24px] [--lotus-display-tracking:0.18em] rtl:[--lotus-display-tracking:normal]'
/** Step content sits under the heading, past the number. */
const INDENT = 'lg:ms-[60px]'

export function StepNumber({ n }: { n: number }) {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-lotus-yellow text-base font-bold leading-6 text-black">
      {n}
    </span>
  )
}

function StepHeader({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className="flex items-start gap-5">
      <StepNumber n={n} />
      <h2 className={cn(SECTION_HEADING, 'pt-1')}>{children}</h2>
    </div>
  )
}

export function FieldError({ message }: { message?: string }) {
  return message ? (
    <span role="alert" className="mt-3 block text-xs leading-4 text-[#d32f2f]">
      {message}
    </span>
  ) : null
}

/** Outline a card while its hidden radio has keyboard focus. */
export const CARD_FOCUS =
  'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-black'

export function Checkbox({
  checked,
  onChange,
  invalid,
  className,
  children,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  invalid?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-4 text-sm leading-5 text-black', className)}>
      <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          data-invalid={invalid ? 'true' : 'false'}
          aria-invalid={invalid}
          className={cn(
            'peer size-5 cursor-pointer appearance-none border bg-white checked:border-lotus-yellow checked:bg-lotus-yellow',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black',
            invalid ? 'border-[#d32f2f]' : 'border-black',
          )}
        />
        <img
          src={checkIcon}
          alt=""
          width={9}
          height={10}
          className="pointer-events-none absolute hidden peer-checked:block"
        />
      </span>
      <span>{children}</span>
    </label>
  )
}

/** Figma "Choose your model": a scrolling row of radio cards with arrows. */
function ModelPicker({
  legend,
  models,
  value,
  onChange,
  invalid,
}: {
  legend: string
  models: TestDriveModel[]
  value: string
  onChange: (key: string) => void
  invalid: boolean
}) {
  const { t, locale, isRtl } = useLocale()
  const track = useRef<HTMLDivElement>(null)
  const [overflows, setOverflows] = useState(false)

  useEffect(() => {
    const el = track.current
    if (!el) return
    const ro = new ResizeObserver(() => setOverflows(el.scrollWidth > el.clientWidth + 1))
    ro.observe(el)
    return () => ro.disconnect()
  }, [models.length])

  // One card (plus the 24px gap) per click; scrollLeft runs negative in RTL.
  const scroll = (direction: 1 | -1) => {
    const el = track.current
    const card = el?.firstElementChild as HTMLElement | null
    el?.scrollBy({ left: direction * ((card?.offsetWidth ?? 360) + 24) * (isRtl ? -1 : 1), behavior: 'smooth' })
  }

  const arrow = 'absolute top-1/2 z-10 hidden size-10 -translate-y-1/2 place-items-center bg-black lg:grid'

  return (
    // min-w-0: a fieldset otherwise refuses to shrink below its content.
    <fieldset className="relative mt-10 min-w-0">
      <legend className="sr-only">{legend}</legend>
      <div
        ref={track}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {models.map((m) => {
          const selected = value === m._key
          const name = t(m.name) || t(m.vehicle?.name)
          return (
            <label
              key={m._key}
              className={cn(
                'relative flex w-[min(360px,80vw)] shrink-0 cursor-pointer snap-start flex-col border-2 p-[2px]',
                CARD_FOCUS,
                selected ? 'border-lotus-yellow' : 'border-[#e5e5e5] hover:border-[#999]',
              )}
            >
              <input
                type="radio"
                name="model"
                value={m._key}
                checked={selected}
                onChange={() => onChange(m._key)}
                data-invalid={invalid ? 'true' : 'false'}
                className="sr-only"
              />
              {/* The whole 4:3 studio shot, edge to edge, as on lotuscars.com: a
                  square crop cut the cars' noses and tails off. */}
              <span className="relative block aspect-[4/3] overflow-hidden bg-[#f2f2f2]">
                <SanityImage
                  image={m.image?.asset ? m.image : m.vehicle?.image}
                  fallbackAlt={name}
                  sizes="(min-width: 640px) 360px, 80vw"
                  width={720}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {/* Figma ticks every box; only the chosen one here, as it is a single choice. */}
                <span
                  className={cn(
                    'absolute start-4 top-4 grid size-6 place-items-center border-2',
                    selected ? 'border-lotus-yellow bg-lotus-yellow' : 'border-[#999] bg-white',
                  )}
                >
                  {selected ? <img src={checkIcon} alt="" width={9} height={10} /> : null}
                </span>
              </span>
              <span className="flex flex-col gap-[10.5px] px-5 pb-[22.5px] pt-5">
                <span className="text-[18px] font-semibold uppercase leading-7 tracking-[0.15em] text-black">
                  {name}
                </span>
                {t(m.powertrain) ? (
                  <span className="text-[10px] uppercase leading-[15px] tracking-[0.15em] text-[#5a5a5a]">
                    {t(m.powertrain)}
                  </span>
                ) : null}
              </span>
            </label>
          )
        })}
      </div>
      {overflows ? (
        <>
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label={ui(locale, 'previous')}
            className={cn(arrow, '-start-5')}
          >
            <img src={prevIcon} alt="" width={7.5} height={12} className="rtl:-scale-x-100" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label={ui(locale, 'next')}
            className={cn(arrow, '-end-5')}
          >
            <img src={nextIcon} alt="" width={7.5} height={12} className="rtl:-scale-x-100" />
          </button>
        </>
      ) : null}
    </fieldset>
  )
}

type Values = Record<'model' | 'centre' | 'firstName' | 'lastName' | 'email' | 'phone', string>
type Errors = Partial<Record<keyof Values | 'consent' | 'form', string>>

const EMPTY: Values = { model: '', centre: '', firstName: '', lastName: '', email: '', phone: '' }

/** `?model=` carries a vehicle slug; prefer the card that is that vehicle itself (Eletre over Eletre X). */
function modelForParam(models: TestDriveModel[], param?: string): string {
  if (!param) return ''
  const byKey = models.find((m) => m._key === param)
  if (byKey) return byKey._key
  const matches = models.filter((m) => m.vehicle?.slug === param)
  return (matches.find((m) => !m.name?.en) ?? matches[0])?._key ?? ''
}

/**
 * Figma "Book a test drive": choose a model, then three numbered steps —
 * your details, a Lotus Centre, privacy — and send. All copy comes from the
 * Test drive page document.
 */
export default function TestDriveForm({
  data,
  initialModel,
  onSuccess,
}: {
  data?: TestDrivePage | null
  initialModel?: string
  onSuccess?: (name: string) => void
}) {
  const { t, locale } = useLocale()
  const { data: showrooms } = useLiveQuery<Showroom[]>(SHOWROOM_OPTIONS_QUERY)
  const models = data?.modelStep?.models ?? []
  const L = data?.labels

  const [values, setValues] = useState<Values>(EMPTY)
  const [consent, setConsent] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [sending, setSending] = useState(false)

  // Arriving from a car's page or menu link: preselect it.
  const preselected = modelForParam(models, initialModel)
  useEffect(() => {
    if (preselected) setValues((v) => (v.model ? v : { ...v, model: preselected }))
  }, [preselected])

  // With a single centre there is nothing to choose.
  useEffect(() => {
    if (showrooms?.length === 1) setValues((v) => (v.centre ? v : { ...v, centre: showrooms[0]._id }))
  }, [showrooms])

  const set = (field: keyof Values, value: string) => {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined, form: undefined }))
  }

  const validate = (): Errors => {
    const req = t(L?.required)
    const next: Errors = {}
    for (const field of Object.keys(EMPTY) as (keyof Values)[]) {
      if (!values[field].trim()) next[field] = req
    }
    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      next.email = t(L?.invalidEmail)
    }
    if (!consent) next.consent = req
    return next
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) {
      // After the re-render, so the first field still marked invalid gets focus.
      requestAnimationFrame(() => document.querySelector<HTMLElement>('form [data-invalid="true"]')?.focus())
      return
    }
    const model = models.find((m) => m._key === values.model)
    const centre = showrooms?.find((s) => s._id === values.centre)
    const fullName = `${values.firstName.trim()} ${values.lastName.trim()}`
    setSending(true)
    try {
      // English names, so the dealer reads the same thing whatever the visitor's language.
      await submitEnquiry({
        fullName,
        email: values.email.trim(),
        phone: [L?.phonePrefix, values.phone.trim()].filter(Boolean).join(' '),
        model: model?.name?.en || model?.vehicle?.name?.en || t(model?.name),
        location: centre?.name?.en || t(centre?.name),
        preferredDate: '',
        message: '',
        country: L?.countryValue?.en || t(L?.countryValue),
        marketingConsent: marketing,
        locale,
      })
      onSuccess?.(fullName)
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : String(error) })
      setSending(false)
    }
  }

  // {privacy} and {terms} in the consent text become the CMS links.
  const consentText = t(L?.privacyConsent)
    .split(/(\{privacy\}|\{terms\})/)
    .map((part, i) =>
      part === '{privacy}' || part === '{terms}' ? (
        <CmsLink
          key={i}
          link={part === '{privacy}' ? data?.privacyStep?.privacyLink : data?.privacyStep?.termsLink}
          className="underline decoration-1 underline-offset-2"
        />
      ) : (
        part
      ),
    )

  const section = cn('border-b border-black/10 py-14 lg:py-20', SECTION_X)

  return (
    <form onSubmit={onSubmit} noValidate className="bg-white text-black">
      <section className={section}>
        <h2 className={SECTION_HEADING}>{t(data?.modelStep?.heading)}</h2>
        {t(data?.modelStep?.intro) ? (
          <p className="mt-3 text-sm font-light leading-5 text-[#5a5a5a]">{t(data?.modelStep?.intro)}</p>
        ) : null}
        <ModelPicker
          legend={t(data?.modelStep?.heading)}
          models={models}
          value={values.model}
          onChange={(key) => set('model', key)}
          invalid={!!errors.model}
        />
        <FieldError message={errors.model} />
      </section>

      <section className={section}>
        <StepHeader n={1}>{t(data?.detailsStep?.heading)}</StepHeader>
        <div className={cn('mt-8 grid max-w-[768px] gap-x-10 gap-y-7 sm:grid-cols-2 lg:mt-12', INDENT)}>
          <TextField className="sm:col-span-2" label={t(L?.country)} value={t(L?.countryValue)} disabled />
          <TextField
            label={t(L?.firstName)}
            placeholder={t(L?.firstNamePlaceholder)}
            autoComplete="given-name"
            value={values.firstName}
            onChange={(v) => set('firstName', v)}
            error={errors.firstName}
          />
          <TextField
            label={t(L?.lastName)}
            placeholder={t(L?.lastNamePlaceholder)}
            autoComplete="family-name"
            value={values.lastName}
            onChange={(v) => set('lastName', v)}
            error={errors.lastName}
          />
          <TextField
            label={t(L?.email)}
            type="email"
            placeholder={t(L?.emailPlaceholder)}
            autoComplete="email"
            value={values.email}
            onChange={(v) => set('email', v)}
            error={errors.email}
          />
          <TextField
            label={t(L?.phone)}
            type="tel"
            prefix={L?.phonePrefix ?? undefined}
            placeholder={t(L?.phonePlaceholder)}
            autoComplete="tel-national"
            value={values.phone}
            onChange={(v) => set('phone', v)}
            error={errors.phone}
          />
        </div>
      </section>

      <section className={section}>
        <StepHeader n={2}>{t(data?.centreStep?.heading)}</StepHeader>
        {t(data?.centreStep?.intro) ? (
          <p className={cn('mt-6 max-w-[576px] text-sm font-light leading-5 text-[#5a5a5a]', INDENT)}>
            {t(data?.centreStep?.intro)}
          </p>
        ) : null}
        <fieldset className={cn('mt-10 grid min-w-0 gap-6 sm:grid-cols-2 lg:grid-cols-3', INDENT)}>
          <legend className="sr-only">{t(data?.centreStep?.heading)}</legend>
          {(showrooms ?? []).map((s) => {
            const selected = values.centre === s._id
            return (
              <label
                key={s._id}
                className={cn(
                  'relative flex cursor-pointer flex-col border-2 p-[2px]',
                  CARD_FOCUS,
                  selected ? 'border-lotus-yellow' : 'border-[#e5e5e5] hover:border-[#999]',
                )}
              >
                <input
                  type="radio"
                  name="centre"
                  value={s._id}
                  checked={selected}
                  onChange={() => set('centre', s._id)}
                  data-invalid={errors.centre ? 'true' : 'false'}
                  className="sr-only"
                />
                <SanityImage
                  image={s.image}
                  fallbackAlt={t(s.name)}
                  sizes="(min-width: 1024px) 385px, (min-width: 640px) 50vw, 100vw"
                  className="h-[180px] w-full object-cover"
                />
                <span className="flex items-start justify-between gap-4 p-5">
                  <span className="flex flex-col gap-1">
                    <span className="text-sm font-semibold leading-5">{t(s.name)}</span>
                    <span className="whitespace-pre-line text-xs leading-4 text-[#5a5a5a]">{t(s.address)}</span>
                  </span>
                  <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full border-2 border-[#999]">
                    {selected ? <span className="size-[10px] bg-lotus-yellow" /> : null}
                  </span>
                </span>
              </label>
            )
          })}
        </fieldset>
        <div className={INDENT}>
          <FieldError message={errors.centre} />
        </div>
      </section>

      <section className={cn('py-14 lg:py-20', SECTION_X)}>
        <StepHeader n={3}>{t(data?.privacyStep?.heading)}</StepHeader>
        <div className={cn('mt-8 flex max-w-[672px] flex-col gap-5 lg:mt-10', INDENT)}>
          <div>
            <Checkbox
              checked={consent}
              invalid={!!errors.consent}
              onChange={(checked) => {
                setConsent(checked)
                setErrors((e) => ({ ...e, consent: undefined }))
              }}
            >
              {consentText}{' '}
              {t(L?.consentRequired) ? <span className="text-[#5a5a5a]">{t(L?.consentRequired)}</span> : null}
            </Checkbox>
            <div className="ms-9">
              <FieldError message={errors.consent} />
            </div>
          </div>
          <Checkbox checked={marketing} onChange={setMarketing} className="pb-5">
            {t(L?.marketingConsent)}
          </Checkbox>

          {errors.form ? (
            <div role="alert" className="space-y-1 border border-[#d32f2f] bg-[#d32f2f]/5 p-4">
              <p className="text-sm font-semibold">{t(L?.errorTitle)}</p>
              <p className="text-sm text-[#5a5a5a]">{t(L?.errorBody)}</p>
              <p className="break-words font-mono text-xs text-[#5a5a5a]">{errors.form}</p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={sending}
            className="w-full bg-lotus-yellow py-5 text-sm font-semibold uppercase leading-5 tracking-[0.15em] text-black transition-colors hover:bg-[#e6c800] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? t(L?.submitting) : t(L?.submit)}
          </button>
        </div>
      </section>
    </form>
  )
}
