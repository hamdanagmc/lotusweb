import { useEffect, useRef, useState } from 'react'
import CmsLink from '@/components/common/CmsLink'
import MissingContent from '@/components/common/MissingContent'
import SanityImage from '@/components/common/SanityImage'
import { useLocale } from '@/i18n/LocaleProvider'
import { cn } from '@/lib/utils'
import { buildSrcSet } from '@/sanity/image'
import type { Figure, RangeSectionData } from '@/sanity/types'
import FlipNumber from './FlipNumber'
import '@/styles/model-showcase.css'

export interface ModelCardData {
  id: string
  name: string
  logo?: string
  image?: Figure | null
  mobileImage?: Figure | null
  intro: string
  powertrain: string
  price: string
  specs: { key: string; value: string; secondary: string; label: string; ref: string }[]
  href: string
  ctaLabel: string
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * <bdi> on CMS text: an untranslated English label ("0-100 km/h") keeps its
 * reading order on the Arabic page instead of flipping to "km/h 0-100".
 */
function ModelCard({ card, pairHasSecondary }: { card: ModelCardData; pairHasSecondary: boolean }) {
  const hasSecondary = card.specs.some((s) => s.secondary)
  const ref = useRef<HTMLElement>(null)
  // Reduced motion starts on the final values, so there is nothing to roll.
  const [rolled, setRolled] = useState(prefersReducedMotion)

  useEffect(() => {
    const el = ref.current
    if (rolled || !el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        // The first callback fires on observe with any overlap, so check the
        // ratio rather than isIntersecting.
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
    <article ref={ref} className="model-card">
      {/* Phones get the portrait crop when there is one, as on the Lotus global site. */}
      <picture>
        {card.mobileImage?.asset ? (
          <source media="(max-width: 991px)" srcSet={buildSrcSet(card.mobileImage)} sizes="100vw" />
        ) : null}
        <SanityImage
          image={card.image}
          fallbackAlt={card.name}
          sizes="(min-width: 992px) 45vw, 100vw"
          className="model-card__img"
        />
      </picture>
      <div className="model-card__content">
        <div className="text-center">
          <h3 className="model-card__name font-display uppercase">
            {card.logo ? <img src={card.logo} alt={card.name} loading="lazy" /> : card.name}
          </h3>
          {card.intro ? (
            <p className="model-card__label">
              <bdi>{card.intro}</bdi>
            </p>
          ) : null}
          {card.powertrain ? (
            <p className="model-card__label">
              <bdi>{card.powertrain}</bdi>
            </p>
          ) : null}
        </div>
        <div>
          {card.price ? (
            <p className="model-card__label mb-4">
              <bdi>{card.price}</bdi>
            </p>
          ) : null}
          {card.specs.length > 0 ? (
            <div className="model-card__specs">
              {card.specs.map((spec) => (
                <div key={spec.key} className="min-w-0 flex-1">
                  <div className="model-card__value">
                    <FlipNumber value={spec.value} rolled={rolled} />
                    {spec.ref ? (
                      <sup className="ms-0.5 text-[10px]">
                        <a href={`#disclaimer-${spec.ref}`}>{spec.ref}</a>
                      </sup>
                    ) : null}
                  </div>
                  {/* A blank secondary line keeps the labels level with a
                      cell that has one: in this card always, and beside the
                      partner card on desktop. */}
                  {spec.secondary ? (
                    <div className="model-card__label">
                      <bdi>{spec.secondary}</bdi>
                    </div>
                  ) : hasSecondary || pairHasSecondary ? (
                    <div
                      aria-hidden="true"
                      className={cn('model-card__label', !hasSecondary && 'model-card__label--pair')}
                    >
                      {'\u00a0'}
                    </div>
                  ) : null}
                  {spec.label ? (
                    <div className="model-card__label">
                      <bdi>{spec.label}</bdi>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
          <div className="model-card__actions">
            <CmsLink link={{ href: card.href }} className="model-card__btn">
              {card.ctaLabel}
            </CmsLink>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function ModelShowcase({ data }: { data?: RangeSectionData | null }) {
  const { t } = useLocale()
  if (!data) return null

  const cards: ModelCardData[] = (data.cards ?? [])
    .filter((c) => c.visible !== false && c.vehicle)
    .map((c) => {
      const v = c.vehicle!
      const price = c.startingPrice
      return {
        id: c._key,
        name: t(c.displayName) || t(v.name),
        logo: v.logo ?? undefined,
        image: c.image?.asset ? c.image : v.image,
        mobileImage: c.mobileImage,
        intro: t(c.introLine),
        powertrain: t(c.powertrainLabel),
        price:
          price?.amount != null
            ? [t(price.prefix), price.currency, price.amount.toLocaleString('en-US')].filter(Boolean).join(' ')
            : '',
        // The unit goes through FlipNumber with the number, as the old
        // "905 HP" values did; only the digits roll.
        specs: (c.specs ?? [])
          .filter((s) => s.value?.trim())
          .map((s, i) => ({
            key: s._key ?? String(i),
            value: [s.value, t(s.unit)].filter(Boolean).join(' '),
            secondary: t(s.secondaryUnit),
            label: t(s.label),
            ref: s.disclaimerRef?.trim() ?? '',
          })),
        href: c.cta?.href || (v.slug ? `/vehicles/${v.slug}` : ''),
        ctaLabel: t(c.cta?.label, 'Explore'),
      }
    })

  // A heading with no cards under it reads as a broken page. Say why instead.
  if (cards.length === 0) {
    return <MissingContent section={t(data.heading) || 'Our Models'} documentType="vehicle" />
  }

  const rows: ModelCardData[][] = []
  for (let i = 0; i < cards.length; i += 2) rows.push(cards.slice(i, i + 2))

  return (
    <section id="range" className="model-showcase bg-black text-white">
      <div className="model-showcase__inner">
        <header className="model-showcase__header">
          <h2 className="model-showcase__title uppercase">{t(data.heading)}</h2>
          {t(data.subheading) ? (
            <p className="model-showcase__subtitle">{t(data.subheading)}</p>
          ) : null}
        </header>
        <div className="model-grid">
          {rows.map((row) => (
            <div key={row[0].id} className="model-row">
              {row.map((card) => (
                <ModelCard
                  key={card.id}
                  card={card}
                  pairHasSecondary={row.some((c) => c.specs.some((s) => s.secondary))}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
