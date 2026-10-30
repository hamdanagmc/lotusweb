import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft, faChevronRight, faXmark } from '@fortawesome/free-solid-svg-icons'
import CmsLink from '@/components/common/CmsLink'
import SanityImage from '@/components/common/SanityImage'
import FlipNumber from '@/components/Index/FlipNumber'
import { useLocale } from '@/i18n/LocaleProvider'
import { ui } from '@/i18n/ui'
import { aspectRatio } from '@/sanity/image'
import { cn } from '@/lib/utils'
import type {
  CardGridSection,
  CtaButton,
  FeatureCarouselSection,
  FullWidthVideoSection,
  HeroMediaSection,
  HotspotViewerSection,
  ImageTextSection,
  IntroTextSection,
  ResponsiveMedia,
  SectionSpacing,
  PageSection,
  StatsBlockSection,
  TimelineSection,
} from '@/sanity/types'

/**
 * Renders page-builder sections (lotuscars.com-style) for vehicle pages and
 * the Lotus Story pages. Every block is optional-everything: a missing field
 * renders nothing.
 */

const SECTION_X = 'px-5 md:px-8 lg:px-[88px]'
// Tracked display caps, as on lotuscars.com. Arabic script must not be
// letter-spaced: it breaks the joins between letters.
const DISPLAY =
  'font-display uppercase [--lotus-display-tracking:0.18em] rtl:[--lotus-display-tracking:normal]'

/* Literal class maps so Tailwind sees every class it must generate. */
const PAD_TOP = {
  none: 'pt-0',
  tiny: 'pt-6 lg:pt-8',
  normal: 'pt-16 lg:pt-24',
  large: 'pt-20 lg:pt-32',
} as const
const PAD_BOTTOM = {
  none: 'pb-0',
  tiny: 'pb-6 lg:pb-8',
  normal: 'pb-16 lg:pb-24',
  large: 'pb-20 lg:pb-32',
} as const
const MOBILE_ASPECT: Record<string, string> = {
  '9/16': 'aspect-[9/16]',
  '3/4': 'aspect-[3/4]',
  '4/5': 'aspect-[4/5]',
  '1/1': 'aspect-square',
  '16/9': 'aspect-video',
}

const pad = (s?: SectionSpacing | null) =>
  cn(PAD_TOP[s?.top ?? 'normal'], PAD_BOTTOM[s?.bottom ?? 'normal'])

const onWhite = (theme?: string | null) => theme === 'white'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** One CTA. `hidden` is an editor switch, not a styling state. */
function Cta({ button, light }: { button?: CtaButton | null; light?: boolean }) {
  const { t, isRtl } = useLocale()
  if (!button || button.hidden || !t(button.label)) return null
  const style = button.style ?? 'primary'

  if (style === 'tertiary')
    return (
      <CmsLink
        link={button}
        className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] transition-opacity hover:opacity-70"
      >
        {t(button.label)}
        <span aria-hidden="true" className={cn('inline-block', isRtl && '-scale-x-100')}>
          {'→'}
        </span>
      </CmsLink>
    )

  return (
    <CmsLink
      link={button}
      className={cn(
        'inline-block px-8 py-4 text-center text-xs font-medium uppercase tracking-[0.15em] transition-colors',
        style === 'primary'
          ? 'btn-primary'
          : light
            ? 'border border-lotus-black text-lotus-black hover:bg-lotus-black hover:text-white'
            : 'border border-white text-white hover:border-lotus-yellow hover:text-lotus-yellow',
      )}
    />
  )
}

/**
 * A video; phones get the portrait cut when there is one. Picked once at load,
 * so a phone never starts downloading the desktop file first.
 */
function Video({
  src,
  mobileSrc,
  controls,
  className,
}: {
  src?: string | null
  mobileSrc?: string | null
  controls?: boolean
  className?: string
}) {
  const [phone] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  )
  const url = (phone && mobileSrc) || src || mobileSrc
  if (!url) return null
  return (
    <video
      src={url}
      autoPlay
      muted
      loop
      playsInline
      controls={controls}
      aria-hidden={controls ? undefined : true}
      className={className}
    />
  )
}

/** Desktop/mobile image plus the optional silent video loop on top. */
function Media({ media, priority }: { media?: ResponsiveMedia | null; priority?: boolean }) {
  const { t } = useLocale()
  if (!media) return null
  const img = 'absolute inset-0 h-full w-full object-cover'
  const hasMobile = !!media.mobileImage?.asset
  return (
    <>
      {media.image?.asset ? (
        <SanityImage
          image={media.image}
          priority={priority}
          sizes="100vw"
          fallbackAlt={t(media.image.alt)}
          className={cn(img, hasMobile && 'hidden md:block')}
        />
      ) : null}
      {hasMobile ? (
        <SanityImage image={media.mobileImage} priority={priority} sizes="100vw" className={cn(img, 'md:hidden')} />
      ) : null}
      <Video src={media.video} mobileSrc={media.mobileVideo} className={cn(img, 'motion-reduce:hidden')} />
    </>
  )
}

function Hero({ s }: { s: HeroMediaSection }) {
  const { t, isRtl } = useLocale()
  const Heading = s.isPageH1 ? 'h1' : 'h2'
  const center = s.align === 'center'
  const valign = s.valign ?? 'bottom'
  const gradient = s.gradient ?? 'none'
  const hasText = !!(t(s.title) || t(s.body) || s.buttons?.length)

  return (
    <section
      className={cn(
        'relative flex w-full overflow-hidden bg-black',
        MOBILE_ASPECT[s.mobileAspect ?? '3/4'] ?? 'aspect-[3/4]',
        'md:aspect-video',
        // The page-opening hero fills tall screens rather than letterboxing.
        s.isPageH1 && 'md:max-h-[min(900px,100svh)] md:min-h-[560px]',
        valign === 'top' ? 'items-start' : valign === 'middle' ? 'items-center' : 'items-end',
      )}
    >
      <div className="absolute inset-0">
        <Media media={s.media} priority={!!s.isPageH1} />
        {gradient === 'bottom' ? (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
        ) : null}
        {gradient === 'start' ? (
          <div
            className={cn(
              'absolute inset-0 to-transparent',
              isRtl ? 'bg-gradient-to-l' : 'bg-gradient-to-r',
              'from-black/75 via-black/30',
            )}
          />
        ) : null}
      </div>
      {hasText ? (
        <div
          className={cn(
            'relative w-full py-12 md:py-16',
            SECTION_X,
            center && 'flex flex-col items-center text-center',
          )}
        >
          {t(s.title) ? (
            <Heading
              className={cn(
                DISPLAY,
                'whitespace-pre-line',
                s.isPageH1
                  ? 'text-[32px] leading-[1.2] lg:text-[44px] lg:leading-[1.15]'
                  : 'text-2xl leading-[1.25] lg:text-[28px] lg:leading-9',
                s.titleAccent ? 'text-lotus-yellow' : 'text-white',
              )}
            >
              {t(s.title)}
            </Heading>
          ) : null}
          {t(s.body) ? (
            <p className="mt-4 max-w-md whitespace-pre-line text-sm font-light leading-6 text-white/90">
              {t(s.body)}
            </p>
          ) : null}
          {s.buttons?.length ? (
            <div className={cn('mt-8 flex flex-wrap gap-4', center && 'justify-center')}>
              {s.buttons.map((b) => (
                <Cta key={b._key} button={b} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

function Intro({ s }: { s: IntroTextSection }) {
  const { t } = useLocale()
  const light = onWhite(s.theme)
  const center = (s.align ?? 'center') === 'center'
  return (
    <section
      className={cn(light ? 'bg-white text-lotus-black' : 'bg-black text-white', pad(s.spacing), SECTION_X)}
    >
      <div className={cn(center ? 'mx-auto flex max-w-2xl flex-col items-center text-center' : 'max-w-3xl')}>
        {s.overline?.asset ? (
          <SanityImage image={s.overline} sizes="200px" className="mb-8 h-12 w-auto object-contain" />
        ) : null}
        {t(s.title) ? (
          <h2
            className={cn(
              DISPLAY,
              'whitespace-pre-line text-2xl leading-[1.3] lg:text-[30px] lg:leading-[1.35]',
              s.titleAccent && 'text-lotus-yellow',
            )}
          >
            {t(s.title)}
          </h2>
        ) : null}
        {t(s.body) ? (
          <p
            className={cn(
              'mt-6 whitespace-pre-line text-sm font-light leading-6 lg:text-[15px] lg:leading-7',
              light ? 'text-lotus-black/80' : 'text-white/90',
            )}
          >
            {t(s.body)}
          </p>
        ) : null}
        {s.buttons?.length ? (
          <div className={cn('mt-8 flex flex-wrap gap-4', center && 'justify-center')}>
            {s.buttons.map((b) => (
              <Cta key={b._key} button={b} light={light} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}

function FullVideo({ s }: { s: FullWidthVideoSection }) {
  if (!s.video && !s.mobileVideo) return null
  return (
    <section className={cn('bg-black', pad(s.spacing))}>
      {/* The brand film: silent loop; controls let the visitor take over. */}
      <Video
        src={s.video}
        mobileSrc={s.mobileVideo}
        controls={s.controls ?? false}
        className={cn('w-full object-cover md:aspect-video', s.mobileVideo ? 'aspect-[9/16]' : 'aspect-video')}
      />
    </section>
  )
}

function Stats({ s }: { s: StatsBlockSection }) {
  const { t, isRtl } = useLocale()
  const ref = useRef<HTMLDivElement>(null)
  // Reduced motion starts on the final values, so there is nothing to roll.
  const [rolled, setRolled] = useState(prefersReducedMotion)
  const stats = (s.stats ?? []).filter((x) => x.value)

  useEffect(() => {
    const el = ref.current
    if (rolled || !el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.4) {
          setRolled(true)
          io.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [rolled])

  return (
    <section className="relative flex min-h-[560px] flex-col justify-between overflow-hidden bg-black lg:min-h-[640px]">
      <div className="absolute inset-0">
        <Media media={s.background} />
        {(s.gradient ?? 'start') !== 'none' ? (
          <div
            className={cn(
              'absolute inset-0 to-transparent',
              s.gradient === 'bottom'
                ? 'bg-gradient-to-t from-black/80 via-black/25'
                : cn(isRtl ? 'bg-gradient-to-l' : 'bg-gradient-to-r', 'from-black/80 via-black/30'),
            )}
          />
        ) : null}
      </div>
      <div className={cn('relative pt-14 lg:pt-20', SECTION_X)}>
        {t(s.title) ? (
          <h2 className={cn(DISPLAY, 'max-w-md text-2xl leading-[1.25] text-white lg:text-[28px] lg:leading-9')}>
            {t(s.title)}
          </h2>
        ) : null}
        {t(s.body) ? (
          <p className="mt-5 max-w-md whitespace-pre-line text-sm font-light leading-6 text-white/85">
            {t(s.body)}
          </p>
        ) : null}
      </div>
      {stats.length ? (
        <div
          ref={ref}
          className={cn('relative flex flex-wrap gap-x-14 gap-y-8 pb-14 pt-12 lg:gap-x-20 lg:pb-20', SECTION_X)}
        >
          {stats.map((x) => (
            <div key={x._key} className="flex items-start gap-3">
              <div className="font-display text-4xl font-light leading-none text-white lg:text-[44px]">
                <FlipNumber value={x.value ?? ''} rolled={rolled} />
              </div>
              {t(x.label) || x.hasDisclaimer ? (
                <div className="whitespace-pre-line pt-0.5 text-[10px] uppercase leading-[1.6] tracking-[0.12em] text-white/70 lg:text-[11px]">
                  <bdi>{t(x.label)}</bdi>
                  {x.hasDisclaimer ? '*' : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function Carousel({ s }: { s: FeatureCarouselSection }) {
  const { t, locale, isRtl } = useLocale()
  const ref = useRef<HTMLDivElement>(null)
  const light = onWhite(s.theme)
  const perView = s.itemsPerView === 3 ? 3 : s.itemsPerView === 1 ? 1 : 2
  const items = (s.items ?? []).filter((x) => x.image?.asset || x.video || t(x.title))
  if (!items.length) return null

  // One card plus the gap. scrollLeft runs negative in RTL.
  const step = (dir: -1 | 1) => {
    const el = ref.current
    const card = el?.firstElementChild as HTMLElement | null
    if (el && card) el.scrollBy({ left: dir * (card.offsetWidth + 24) * (isRtl ? -1 : 1) })
  }

  const arrows = s.showArrows !== false && items.length > perView

  return (
    <section className={cn(light ? 'bg-white text-lotus-black' : 'bg-black text-white', pad(s.spacing))}>
      {t(s.heading) || arrows ? (
        <div className={cn('mb-8 flex items-end justify-between gap-6 lg:mb-10', SECTION_X)}>
          <h2 className={cn(DISPLAY, 'text-xl leading-7 lg:text-[22px]', !t(s.heading) && 'sr-only')}>
            {t(s.heading) || t(items[0]?.title)}
          </h2>
          {arrows ? (
            <div className="ms-auto flex shrink-0 gap-3">
              {([-1, 1] as const).map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => step(dir)}
                  aria-label={ui(locale, dir < 0 ? 'previous' : 'next')}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center border transition-colors',
                    light
                      ? 'border-lotus-black/25 hover:border-lotus-black'
                      : 'border-white/25 hover:border-lotus-yellow hover:text-lotus-yellow',
                  )}
                >
                  <FontAwesomeIcon icon={dir < 0 !== isRtl ? faChevronLeft : faChevronRight} className="h-3" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        ref={ref}
        className={cn(
          'flex snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain motion-safe:scroll-smooth [scrollbar-width:none]',
          'scroll-px-5 md:scroll-px-8 lg:scroll-px-[88px]',
          SECTION_X,
        )}
      >
        {items.map((item) => (
          <article
            key={item._key}
            className={cn(
              'w-[80vw] shrink-0 snap-start',
              perView === 3 ? 'md:w-[27vw]' : perView === 1 ? 'md:w-[72vw]' : 'md:w-[40vw]',
            )}
          >
            {item.video || item.image?.asset ? (
            <div className={cn('relative overflow-hidden', perView === 3 ? 'aspect-[4/3]' : 'aspect-[3/2]')}>
              {item.video ? (
                <video
                  src={item.video}
                  autoPlay
                  muted
                  loop
                  playsInline
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
                />
              ) : null}
              {item.image?.asset ? (
                <SanityImage
                  image={item.image}
                  sizes="(min-width: 768px) 40vw, 80vw"
                  fallbackAlt={t(item.title)}
                  className={cn('absolute inset-0 h-full w-full object-cover', item.video && 'motion-safe:hidden')}
                />
              ) : null}
            </div>
            ) : null}
            {t(item.title) ? <h3 className="mt-4 text-sm font-semibold leading-5">{t(item.title)}</h3> : null}
            {t(item.body) ? (
              <p
                className={cn(
                  'mt-2 whitespace-pre-line text-xs font-light leading-5',
                  light ? 'text-lotus-black/70' : 'text-white/70',
                )}
              >
                {t(item.body)}
              </p>
            ) : null}
            {item.button ? (
              <div className="mt-4">
                <Cta button={item.button} light={light} />
              </div>
            ) : null}
          </article>
        ))}
      </div>

      {s.button && !s.button.hidden && t(s.button.label) ? (
        <div className="mt-10 text-center">
          <Cta button={s.button} light={light} />
        </div>
      ) : null}
    </section>
  )
}

function ImageText({ s }: { s: ImageTextSection }) {
  const { t } = useLocale()
  const light = onWhite(s.theme)
  return (
    <section
      className={cn(
        light ? 'bg-white text-lotus-black' : 'bg-black text-white',
        pad(s.spacing),
        SECTION_X,
        'grid items-center gap-8 lg:grid-cols-12 lg:gap-12',
      )}
    >
      <div className={cn('lg:col-span-4', s.reverse ? 'lg:order-2 lg:col-start-9' : 'lg:col-start-1')}>
        {t(s.title) ? (
          <h2
            className={cn(
              DISPLAY,
              'text-2xl leading-[1.25] lg:text-[28px] lg:leading-9',
              s.titleAccent && 'text-lotus-yellow',
            )}
          >
            {t(s.title)}
          </h2>
        ) : null}
        {t(s.body) ? (
          <p
            className={cn(
              'mt-5 whitespace-pre-line text-sm font-light leading-6',
              light ? 'text-lotus-black/75' : 'text-white/80',
            )}
          >
            {t(s.body)}
          </p>
        ) : null}
        {s.buttons?.length ? (
          <div className="mt-8 flex flex-wrap gap-4">
            {s.buttons.map((b) => (
              <Cta key={b._key} button={b} light={light} />
            ))}
          </div>
        ) : null}
      </div>
      {s.image?.asset ? (
        <div className={cn('lg:col-span-7', s.reverse ? 'lg:order-1 lg:col-start-1' : 'lg:col-start-6')}>
          <SanityImage
            image={s.image}
            sizes="(min-width: 1024px) 55vw, 100vw"
            fallbackAlt={t(s.title)}
            className="aspect-[3/2] w-full object-cover"
          />
        </div>
      ) : null}
    </section>
  )
}

/**
 * A photo with numbered pins; each opens a short note. Views (Front, Rear,
 * Interior) switch through tabs. The image keeps its own shape so the pins,
 * placed as percentages of it, stay on the parts they describe.
 */
function Hotspots({ s }: { s: HotspotViewerSection }) {
  const { t, locale, isRtl } = useLocale()
  const [tab, setTab] = useState(0)
  const [open, setOpen] = useState<string | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const views = (s.views ?? []).filter((v) => v.image?.asset)

  // Phones show the photo wider than the screen; start each view centred.
  // scrollLeft runs negative in RTL.
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = ((el.scrollWidth - el.clientWidth) / 2) * (isRtl ? -1 : 1)
  }, [tab, isRtl])

  if (!views.length) return null

  const view = views[Math.min(tab, views.length - 1)]
  const pins = (view.pins ?? []).filter((p) => p.x != null && p.y != null && t(p.body))
  const active = pins.find((p) => p._key === open)
  const Heading = s.isPageH1 ? 'h1' : 'h2'
  const noteId = `${s._key}-note`
  const panelId = `${s._key}-view`

  return (
    <section
      className="relative bg-black text-white"
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(null)
      }}
    >
      {t(s.title) ? (
        <div className={cn('pt-24 md:pointer-events-none md:absolute md:inset-x-0 md:top-0 md:z-10 md:pt-28', SECTION_X)}>
          <Heading
            className={cn(
              DISPLAY,
              'whitespace-pre-line text-[32px] leading-[1.2] lg:text-[44px] lg:leading-[1.15]',
              s.titleAccent ? 'text-lotus-yellow' : 'text-white',
            )}
          >
            {t(s.title)}
          </Heading>
        </div>
      ) : null}

      {/* The note is positioned against this wrapper on desktop and sits
          below the photo on phones, where the photo is too small for it. */}
      <div className="relative">
        {/* On phones the photo is too small for its pins at screen width, so
            it renders wider and scrolls sideways (drag or swipe). */}
        <div
          ref={scroller}
          className="overflow-x-auto overscroll-x-contain [scrollbar-width:none] md:overflow-visible"
        >
        <div
          id={panelId}
          role="tabpanel"
          className="relative w-[220%] md:w-full"
          style={{ aspectRatio: aspectRatio(view.image) }}
        >
          <SanityImage
            image={view.image}
            priority={!!s.isPageH1}
            sizes="100vw"
            fallbackAlt={t(view.label)}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {pins.map((p, i) => (
            <button
              key={p._key}
              type="button"
              onClick={() => setOpen(open === p._key ? null : p._key)}
              aria-label={`${ui(locale, 'feature')} ${i + 1}`}
              aria-expanded={open === p._key}
              aria-controls={open === p._key ? noteId : undefined}
              // Pins are placed on the photo, which never mirrors, so they use
              // physical left/top in both reading directions.
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 ring-1 ring-white/40 backdrop-blur-sm transition-shadow hover:ring-lotus-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lotus-yellow aria-expanded:ring-2 aria-expanded:ring-lotus-yellow"
            >
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-lotus-yellow" />
            </button>
          ))}
        </div>
        </div>

        {active ? (
          <div
            id={noteId}
            aria-live="polite"
            // Placed next to its pin from md up; below the photo on phones.
            style={{ '--x': `${active.x}%`, '--y': `${active.y}%` } as CSSProperties}
            className={cn(
              'relative mx-5 mt-4 border border-white/15 bg-black/85 p-5 pe-11 text-sm font-light leading-6 backdrop-blur md:absolute md:left-[var(--x)] md:top-[var(--y)] md:mx-0 md:mt-0 md:w-72',
              // Open away from the nearer edge so the note stays on the photo.
              (active.x ?? 0) > 55 ? 'md:-translate-x-[calc(100%_+_1.5rem)]' : 'md:translate-x-6',
              (active.y ?? 0) > 70 ? 'md:-translate-y-full' : (active.y ?? 0) > 25 && 'md:-translate-y-1/2',
            )}
          >
            {t(active.body)}
            <button
              type="button"
              onClick={() => setOpen(null)}
              aria-label={ui(locale, 'close')}
              className="absolute end-2 top-2 flex h-8 w-8 items-center justify-center text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lotus-yellow"
            >
              <FontAwesomeIcon icon={faXmark} className="h-3.5" />
            </button>
          </div>
        ) : null}
      </div>

      {views.length > 1 || s.buttons?.length ? (
        <div className={cn('flex flex-col items-center gap-6 py-8 md:py-10', SECTION_X)}>
          {views.length > 1 ? (
            <div role="tablist" className="flex flex-wrap justify-center gap-x-8 gap-y-3">
              {views.map((v, i) => (
                <button
                  key={v._key}
                  type="button"
                  role="tab"
                  aria-selected={i === tab}
                  aria-controls={panelId}
                  onClick={() => {
                    setTab(i)
                    setOpen(null)
                  }}
                  className={cn(
                    'border-b pb-1 text-xs uppercase tracking-[0.15em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lotus-yellow',
                    i === tab ? 'border-lotus-yellow text-white' : 'border-transparent text-white/55 hover:text-white',
                  )}
                >
                  {t(v.label)}
                </button>
              ))}
            </div>
          ) : null}
          {s.buttons?.length ? (
            <div className="flex flex-wrap justify-center gap-4">
              {s.buttons.map((b) => (
                <Cta key={b._key} button={b} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

const GRID_COLS = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
} as const
const GRID_ASPECT = {
  '3/2': 'aspect-[3/2]',
  '4/3': 'aspect-[4/3]',
  '1/1': 'aspect-square',
  '16/9': 'aspect-video',
  '2/1': 'aspect-[2/1]',
} as const

/** Rows of cards. A card with a link is one link as a whole, labelled like lotuscars.com ("TYPE 12 →"). */
function CardGrid({ s }: { s: CardGridSection }) {
  const { t, isRtl } = useLocale()
  const light = onWhite(s.theme)
  const center = s.align === 'center'
  const items = (s.items ?? []).filter((x) => x.image?.asset || x.video || t(x.title) || t(x.button?.label))
  if (!items.length) return null

  return (
    <section className={cn(light ? 'bg-white text-lotus-black' : 'bg-black text-white', pad(s.spacing), SECTION_X)}>
      {t(s.heading) ? (
        <h2 className={cn(DISPLAY, 'mb-10 text-center text-xl leading-7 lg:text-[22px]')}>{t(s.heading)}</h2>
      ) : null}
      <ul className={cn('grid gap-x-6 gap-y-12', GRID_COLS[s.columns ?? 3] ?? GRID_COLS[3])}>
        {items.map((item) => {
          const label = item.button && !item.button.hidden ? t(item.button.label) : ''
          const content = (
            <>
              {item.image?.asset || item.video ? (
                <div className={cn('relative overflow-hidden', GRID_ASPECT[s.aspect ?? '3/2'] ?? GRID_ASPECT['3/2'])}>
                  {item.image?.asset ? (
                    <SanityImage
                      image={item.image}
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
                      fallbackAlt={t(item.title) || label}
                      className={cn(
                        'absolute inset-0 h-full w-full transition-transform duration-500',
                        // Logos are transparent: the blurred placeholder would stay visible behind them.
                        s.fit === 'contain' ? 'object-contain !bg-none' : 'object-cover',
                        label && 'motion-safe:group-hover:scale-105',
                      )}
                    />
                  ) : null}
                  <Video src={item.video} className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden" />
                </div>
              ) : null}
              <div className={cn(center && 'text-center')}>
                {t(item.title) ? (
                  <h3 className="mt-6 text-base font-semibold uppercase leading-6 tracking-[0.05em]">{t(item.title)}</h3>
                ) : null}
                {t(item.body) ? (
                  <p
                    className={cn(
                      'mt-2 whitespace-pre-line text-sm font-light leading-6',
                      light ? 'text-lotus-black/75' : 'text-white/80',
                    )}
                  >
                    {t(item.body)}
                  </p>
                ) : null}
                {label ? (
                  <span className="mt-10 inline-flex items-center gap-2 text-base font-bold uppercase leading-6">
                    {label}
                    <span aria-hidden="true" className={cn('inline-block transition-transform group-hover:translate-x-1', isRtl && '-scale-x-100')}>
                      {'→'}
                    </span>
                  </span>
                ) : null}
              </div>
            </>
          )
          return (
            <li key={item._key}>
              {label && item.button?.href ? (
                <CmsLink link={item.button} className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lotus-yellow">
                  {content}
                </CmsLink>
              ) : (
                content
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** Decades of year-by-year milestones, as the lotuscars.com timeline table. */
function Timeline({ s }: { s: TimelineSection }) {
  const { t } = useLocale()
  const eras = (s.eras ?? []).filter((e) => e.entries?.length)
  if (!eras.length) return null
  return (
    <section className={cn('bg-black text-white', pad(s.spacing), SECTION_X)}>
      {t(s.heading) ? (
        <h2 className="mb-10 text-center text-lg font-normal uppercase leading-7 tracking-[0.15em] lg:text-xl">
          {t(s.heading)}
        </h2>
      ) : null}
      <div className="mx-auto max-w-[1166px] space-y-14">
        {eras.map((era) => (
          <div key={era._key}>
            <h3 className="border-b-2 border-[#444] pb-3 text-center text-base font-semibold leading-6 text-lotus-yellow">
              {era.label}
            </h3>
            <dl>
              {(era.entries ?? []).map((e) => (
                <div
                  key={e._key}
                  className="grid grid-cols-[56px_1fr] items-center gap-3 border-b border-[#444] px-2 py-2.5 md:grid-cols-[80px_1fr]"
                >
                  <dt className="text-sm leading-6 md:text-base">{e.year}</dt>
                  <dd className="whitespace-pre-line text-sm leading-6 md:text-base">{t(e.text)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function VehicleSections({ sections }: { sections: PageSection[] }) {
  return (
    <>
      {sections.map((s) => {
        switch (s._type) {
          case 'heroMedia':
            return <Hero key={s._key} s={s} />
          case 'introText':
            return <Intro key={s._key} s={s} />
          case 'fullWidthVideo':
            return <FullVideo key={s._key} s={s} />
          case 'statsBlock':
            return <Stats key={s._key} s={s} />
          case 'featureCarousel':
            return <Carousel key={s._key} s={s} />
          case 'imageText':
            return <ImageText key={s._key} s={s} />
          case 'hotspotViewer':
            return <Hotspots key={s._key} s={s} />
          case 'cardGrid':
            return <CardGrid key={s._key} s={s} />
          case 'timeline':
            return <Timeline key={s._key} s={s} />
          default:
            return null
        }
      })}
    </>
  )
}
