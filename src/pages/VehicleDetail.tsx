import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import '@/styles/lotus-uae-for-the-drivers.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/layout/Footer'
import CmsLink from '@/components/common/CmsLink'
import SanityImage from '@/components/common/SanityImage'
import ZoomImage from '@/components/common/ZoomImage'
import Spin360 from '@/components/common/Spin360'
import PageSkeleton from '@/components/common/PageSkeleton'
import VehicleSections from '@/components/vehicle/VehicleSections'
import FlipNumber from '@/components/Index/FlipNumber'
import NotFound from '@/pages/NotFound'
import { useLocale } from '@/i18n/LocaleProvider'
import { ui } from '@/i18n/ui'
import { useLiveQuery } from '@/sanity/useLiveQuery'
import { VEHICLE_QUERY } from '@/sanity/queries'
import { imageSrc } from '@/sanity/image'
import { cn } from '@/lib/utils'
import type { GalleryCategory, VehicleDetail as VehicleDoc } from '@/sanity/types'

const CATEGORY_LABEL: Record<GalleryCategory, { en: string; ar: string }> = {
  exterior: { en: 'Exterior', ar: 'الخارج' },
  interior: { en: 'Interior', ar: 'الداخل' },
  detail: { en: 'Detail', ar: 'التفاصيل' },
}

const SECTION_X = 'px-5 md:px-8 lg:px-[88px]'
// Figma section headings: yellow and widely tracked. .font-display pins
// letter-spacing, so the tracking goes through its variable. Arabic script
// must not be letter-spaced: it breaks the joins between letters.
const HEADING =
  'font-display text-2xl lg:text-[30px] lg:leading-9 uppercase break-words text-lotus-yellow [--lotus-display-tracking:0.18em] rtl:[--lotus-display-tracking:normal]'
const BODY_MUTED = 'text-base font-light leading-6 text-[#9a9a9a]'
const CAPTION = 'text-xs uppercase leading-4 tracking-[0.15em]'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Headline specs over a dimmed image. The numbers roll up on first sight. */
function SpecsCard({ data }: { data: VehicleDoc }) {
  const { t } = useLocale()
  const ref = useRef<HTMLDivElement>(null)
  // Reduced motion starts on the final values, so there is nothing to roll.
  const [rolled, setRolled] = useState(prefersReducedMotion)
  const specs = (data.specs ?? []).filter((s) => t(s.value))

  useEffect(() => {
    const el = ref.current
    if (rolled || !el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRolled(true)
          io.disconnect()
        }
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [rolled, specs.length])

  if (!specs.length) return null

  return (
    <section className={cn('bg-black py-16 lg:py-24', SECTION_X)}>
      <div className="relative flex min-h-[560px] flex-col justify-end overflow-hidden border border-white/5 bg-[#0b0b0b] p-6 md:min-h-[640px] md:p-12 lg:aspect-[1264/900] lg:min-h-0">
        {data.specsImage?.asset ? (
          <SanityImage
            image={data.specsImage}
            sizes="(min-width: 1024px) 88vw, 100vw"
            fallbackAlt={t(data.name)}
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent via-50% to-transparent" />
        <div ref={ref} className="relative grid gap-8 sm:grid-cols-3 sm:gap-12">
          {specs.map((s) => (
            <div key={s._key} className="min-w-0">
              <div className="font-display text-5xl font-light leading-none text-lotus-yellow lg:text-[60px]">
                <FlipNumber value={t(s.value)} rolled={rolled} />
              </div>
              <div className="mt-3 text-[11px] uppercase leading-4 tracking-[0.15em] text-[#9a9a9a]">
                <bdi>{t(s.label)}</bdi>
              </div>
            </div>
          ))}
        </div>
        {t(data.specsLink?.label) ? (
          <CmsLink
            link={data.specsLink}
            className={cn('relative mt-12 self-start text-lotus-yellow transition-colors hover:text-white', CAPTION)}
          >
            {t(data.specsLink?.label)}{' '}
            <span aria-hidden="true" className="inline-block rtl:-scale-x-100">
              {'→'}
            </span>
          </CmsLink>
        ) : null}
      </div>
    </section>
  )
}

/** Portrait slides that scroll sideways, with the next one peeking in. */
function Carousel({ data }: { data: NonNullable<VehicleDoc['carousel']> }) {
  const { t, locale, isRtl } = useLocale()
  const ref = useRef<HTMLDivElement>(null)
  const slides = (data.slides ?? []).filter((s) => s.image?.asset)
  if (!slides.length) return null

  // One slide plus the gap. scrollLeft runs negative in RTL. The container's
  // motion-safe:scroll-smooth decides whether it animates.
  const step = (dir: -1 | 1) => {
    const el = ref.current
    const slide = el?.firstElementChild as HTMLElement | null
    if (el && slide) el.scrollBy({ left: dir * (slide.offsetWidth + 24) * (isRtl ? -1 : 1) })
  }

  return (
    <section className="bg-black py-20 lg:py-32">
      <div className={cn('mb-8 flex items-end justify-between gap-6 lg:mb-12', SECTION_X)}>
        <div className="max-w-xl">
          {t(data.heading) ? <h2 className={HEADING}>{t(data.heading)}</h2> : null}
          {t(data.intro) ? <p className={cn('mt-4', BODY_MUTED)}>{t(data.intro)}</p> : null}
        </div>
        {slides.length > 1 ? (
          <div className="hidden shrink-0 gap-4 md:flex">
            {([-1, 1] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => step(dir)}
                aria-label={ui(locale, dir < 0 ? 'previous' : 'next')}
                className="flex h-12 w-12 items-center justify-center border border-white/20 text-white transition-colors hover:border-lotus-yellow hover:text-lotus-yellow"
              >
                <FontAwesomeIcon icon={dir < 0 !== isRtl ? faChevronLeft : faChevronRight} className="h-3" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div
        ref={ref}
        className={cn(
          'flex snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain motion-safe:scroll-smooth [scrollbar-width:none] scroll-px-5 md:scroll-px-8 lg:scroll-px-[88px]',
          SECTION_X,
        )}
      >
        {slides.map((s) => (
          <figure key={s._key} className="relative aspect-[8/9] w-[85vw] shrink-0 snap-start md:w-[55.5vw]">
            <SanityImage
              image={s.image}
              sizes="(min-width: 768px) 56vw, 85vw"
              fallbackAlt={t(s.caption)}
              className="h-full w-full object-cover"
            />
            {t(s.caption) ? (
              // The gradient keeps white captions readable on light photos.
              <figcaption
                className={cn(
                  'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-6 pt-16 text-white lg:p-10 lg:pt-20',
                  CAPTION,
                )}
              >
                {t(s.caption)}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </section>
  )
}

export default function VehicleDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { t, locale, localePath, isRtl } = useLocale()
  const { data, loading } = useLiveQuery<VehicleDoc>(VEHICLE_QUERY, { slug: slug ?? '' })
  const [filter, setFilter] = useState<GalleryCategory | 'all'>('all')

  const gallery = useMemo(() => {
    const all = (data?.gallery ?? []).filter(Boolean)
    return filter === 'all' ? all : all.filter((g) => g.category === filter)
  }, [data, filter])

  const categories = useMemo(() => {
    const present = new Set((data?.gallery ?? []).map((g) => g.category).filter(Boolean))
    return Array.from(present) as GalleryCategory[]
  }, [data])

  if (loading && !data) return <PageSkeleton />
  if (!data) return <NotFound />

  const frames = (data.spin360?.frames ?? []).filter(Boolean)
  const showSpin = data.spin360?.enabled !== false && frames.length > 0
  const banner = data.banner
  const variants = data.specVariants ?? []
  const specGroups = data.specGroups ?? []
  // Label column plus one per variant, or a single value column.
  const specCols: CSSProperties = {
    gridTemplateColumns: `repeat(${1 + Math.max(variants.length, 1)}, minmax(0, 1fr))`,
  }
  const disclaimers = (data.disclaimers ?? []).map((d) => t(d)).filter(Boolean)
  const sections = (data.sections ?? []).filter(Boolean)

  // Vehicles with a built page ("Page sections" in the Studio) render it as
  // the whole body — the first section is the hero. Others keep the fixed
  // layout below.
  if (sections.length > 0) {
    return (
      <div className="antialiased selection:bg-lotus-yellow selection:text-lotus-black">
        <Navbar />
        <main>
          <VehicleSections sections={sections} />
        </main>
        <Footer />
        {disclaimers.length ? (
          <div className={cn('border-t border-white/5 bg-black pb-10 pt-[41px]', SECTION_X)}>
            <ol className="max-w-[896px] space-y-3 text-[11px] font-light leading-[17.88px] text-[#6b6b6b]">
              {disclaimers.map((text, i) => (
                <li key={i}>
                  <sup className="text-[8.3px]">{i + 1}</sup> {text}
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="antialiased selection:bg-lotus-yellow selection:text-lotus-black">
      <Navbar />

      <main>
        {/* Hero: Figma's 900px, or the window height when the window is shorter. */}
        <section className="relative h-[min(780px,100svh)] min-h-[560px] md:h-[720px] md:min-h-0 lg:h-[min(900px,100svh)] lg:min-h-[640px] w-full overflow-hidden flex items-end">
          <div className="absolute inset-0 z-0">
            <div
              className={cn(
                'absolute inset-0 z-10',
                isRtl
                  ? 'bg-gradient-to-l from-lotus-black via-lotus-black/50 to-transparent'
                  : 'bg-gradient-to-r from-lotus-black via-lotus-black/50 to-transparent',
              )}
            />
            <SanityImage
              image={data.heroImage ?? data.image}
              priority
              sizes="100vw"
              fallbackAlt={t(data.name)}
              className="w-full h-full object-cover"
            />
            {/* Plays over the image, which stays as its poster. Hidden for
                reduced motion, leaving the image. */}
            {data.heroVideo?.asset?.url ? (
              <video
                key={data.heroVideo.asset.url}
                src={data.heroVideo.asset.url}
                poster={imageSrc(data.heroImage ?? data.image, 1920)}
                autoPlay
                muted
                loop
                playsInline
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
              />
            ) : null}
          </div>
          <div className="container mx-auto px-5 md:px-8 lg:px-20 relative z-20 pb-16">
            <Link
              to={localePath('/#range')}
              className="text-xs font-bold tracking-widest uppercase text-lotus-text-muted hover:text-lotus-yellow transition-colors"
            >
              {isRtl ? '→' : '←'} {ui(locale, 'backToRange')}
            </Link>
            <h1 className="font-display text-6xl lg:text-8xl font-bold uppercase tracking-tight mt-4">
              {t(data.name)}
            </h1>
            <p className="text-lg text-lotus-text-muted mt-3 max-w-xl">{t(data.tagline)}</p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link
                to={localePath(`/test-drive${data.slug ? `?model=${data.slug}` : ''}`)}
                className="btn-primary px-10 py-4 text-sm font-bold tracking-widest uppercase"
              >
                {ui(locale, 'bookTestDrive')}
              </Link>
              <Link
                to={localePath(`/know-more${data.slug ? `?model=${data.slug}` : ''}`)}
                className="border border-white px-10 py-4 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:border-lotus-yellow hover:text-lotus-yellow"
              >
                {ui(locale, 'knowMore')}
              </Link>
            </div>
          </div>
        </section>

        <SpecsCard data={data} />

        {t(data.overview) ? (
          <section className={cn('bg-black pb-16 lg:pb-24', SECTION_X)}>
            <p className="max-w-3xl text-xl font-light leading-relaxed">{t(data.overview)}</p>
          </section>
        ) : null}

        {data.featureImage?.asset ? (
          <SanityImage
            image={data.featureImage}
            sizes="100vw"
            fallbackAlt={t(data.name)}
            className="block aspect-[16/10] w-full object-cover"
          />
        ) : null}

        {data.carousel ? <Carousel data={data.carousel} /> : null}

        {/* Half image, half text; the image swaps sides each panel. */}
        {(data.features ?? []).map((f, i) => (
          <section key={f._key} className="grid bg-black lg:aspect-[16/10] lg:grid-cols-2">
            <div className={cn('relative aspect-[4/3] lg:aspect-auto', i % 2 === 1 && 'lg:order-last')}>
              <SanityImage
                image={f.image}
                sizes="(min-width: 1024px) 50vw, 100vw"
                fallbackAlt={t(f.heading)}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-center bg-[#0b0b0b] px-5 py-16 md:px-8 lg:px-20">
              {t(f.heading) ? <h2 className={HEADING}>{t(f.heading)}</h2> : null}
              {t(f.body) ? <p className={cn('mt-6 max-w-md', BODY_MUTED)}>{t(f.body)}</p> : null}
            </div>
          </section>
        ))}

        {banner && (t(banner.heading) || banner.image?.asset) ? (
          <section className="relative flex min-h-[560px] items-center justify-center overflow-hidden bg-black px-6 py-20 text-center md:aspect-[16/10] md:min-h-0">
            <SanityImage
              image={banner.image}
              sizes="100vw"
              fallbackAlt={t(banner.heading)}
              className="absolute inset-0 h-full w-full object-cover opacity-50"
            />
            <div className="relative">
              {t(banner.heading) ? <h2 className={HEADING}>{t(banner.heading)}</h2> : null}
              {t(banner.body) ? (
                <p className="mx-auto mt-6 max-w-lg text-base font-light leading-6 text-white">{t(banner.body)}</p>
              ) : null}
              <CmsLink
                link={banner.link}
                className={cn(
                  'mt-8 inline-block border border-white px-10 py-4 font-medium text-white transition-colors hover:border-lotus-yellow hover:text-lotus-yellow',
                  CAPTION,
                )}
              />
            </div>
          </section>
        ) : null}

        {/* 360 */}
        {showSpin ? (
          <section className="px-5 md:px-8 lg:px-20 py-20 border-b border-lotus-border">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-6xl font-bold uppercase tracking-tighter mb-10">
              {ui(locale, 'view360')}
            </h2>
            <Spin360 frames={frames} label={`${t(data.name)} ${ui(locale, 'view360')}`} />
          </section>
        ) : null}

        {/* Gallery with zoom */}
        {(data.gallery ?? []).length > 0 ? (
          <section className="px-5 md:px-8 lg:px-20 py-20 border-b border-lotus-border">
            <div className="flex flex-wrap justify-between items-end gap-6 mb-10">
              <h2 className="font-display text-3xl sm:text-4xl lg:text-6xl font-bold uppercase tracking-tighter">
                {ui(locale, 'gallery')}
              </h2>
              {categories.length > 1 ? (
                <div className="flex flex-wrap gap-3">
                  {(['all', ...categories] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFilter(c as GalleryCategory | 'all')}
                      className={cn(
                        'px-5 py-2 text-xs font-bold tracking-widest uppercase border transition-colors',
                        filter === c
                          ? 'border-lotus-yellow text-lotus-yellow'
                          : 'border-lotus-border text-lotus-text-muted hover:border-lotus-text-muted',
                      )}
                    >
                      {c === 'all'
                        ? ui(locale, 'all')
                        : CATEGORY_LABEL[c as GalleryCategory][locale]}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {gallery.map((img, i) => (
                <ZoomImage
                  key={img._key}
                  image={img}
                  alt={t(img.alt, t(data.name))}
                  className={cn(
                    'rounded-sm',
                    // First image spans both columns for a stronger opening.
                    i === 0 ? 'md:col-span-2 aspect-[21/9]' : 'aspect-[4/3]',
                  )}
                />
              ))}
            </div>
            <p className="text-xs tracking-widest uppercase text-lotus-text-faint mt-6">
              {ui(locale, 'zoomHint')}
            </p>
          </section>
        ) : null}

        {/* Full specifications: collapsible groups, one column per variant. */}
        {specGroups.length > 0 ? (
          <section id="specifications" className={cn('border-t border-white/5 bg-black py-20 lg:py-28', SECTION_X)}>
            <div className="mx-auto max-w-2xl text-center">
              {t(data.specTableHeading) ? <h2 className={HEADING}>{t(data.specTableHeading)}</h2> : null}
              {t(data.specTableIntro) ? <p className={cn('mt-4', BODY_MUTED)}>{t(data.specTableIntro)}</p> : null}
            </div>
            <div className="mx-auto mt-12 max-w-[896px] lg:mt-16">
              {variants.length > 0 ? (
                <div
                  className="grid gap-4 border-b border-white/15 pb-5 text-center text-xs font-semibold uppercase leading-4 tracking-[0.15em]"
                  style={specCols}
                >
                  <span />
                  {variants.map((v, i) => (
                    <span key={i} className={i === variants.length - 1 ? 'text-lotus-yellow' : 'text-white'}>
                      {t(v)}
                    </span>
                  ))}
                </div>
              ) : null}
              {specGroups.map((group, gi) => (
                <details key={group._key} open={gi === 0} className="group border-b border-white/10">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-sm font-semibold uppercase leading-5 tracking-[0.15em] text-white [&::-webkit-details-marker]:hidden">
                    {t(group.title)}
                    <FontAwesomeIcon icon={faChevronDown} className="h-3 transition-transform group-open:rotate-180" />
                  </summary>
                  <div>
                    {(group.rows ?? []).map((row) => (
                      <div key={row._key} className="grid gap-4 py-3 text-sm leading-5 even:bg-[#0b0b0b]" style={specCols}>
                        <span className="text-[#9a9a9a]">{t(row.label)}</span>
                        {(variants.length ? variants.map((_, i) => row.values?.[i]) : [row.value]).map((v, i) => (
                          <span key={i} className="text-center text-white">
                            {t(v)}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <Footer />
      {disclaimers.length ? (
        <div className={cn('border-t border-white/5 bg-black pb-10 pt-[41px]', SECTION_X)}>
          <ol className="max-w-[896px] space-y-3 text-[11px] font-light leading-[17.88px] text-[#6b6b6b]">
            {disclaimers.map((text, i) => (
              <li key={i}>
                <sup className="text-[8.3px]">{i + 1}</sup> {text}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  )
}
