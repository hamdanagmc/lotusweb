import { ui, type UiKey } from '@/i18n/ui'
import type { Link, LocaleString, SitePayload, Vehicle } from './types'

export interface NavItem {
  key: string
  link: Link
}

export interface NavModel {
  key: string
  name?: LocaleString | null
  children: NavItem[]
}

/** Everything the navbar and its drawer render, in one place. */
export interface NavConfig {
  primary: NavItem[]
  cta: Link | null
  models: NavModel[]
  secondary: NavItem[]
  utility: NavItem[]
}

/** Both languages of an interface string, so CmsLink can `t()` it like CMS copy. */
const label = (key: UiKey): LocaleString => ({ en: ui('en', key), ar: ui('ar', key) })

const item = (key: UiKey, href: string): NavItem => ({ key, link: { label: label(key), href } })

/**
 * Top-bar links and button come from the Studio's Navigation document; the
 * models come from the homepage "Our Models" list, so the menu always matches
 * the showcase. A vehicle whose slug extends another's (emira-420-sport) is
 * listed under it rather than as a model of its own.
 */
export function buildNav(site: SitePayload | null): NavConfig {
  const vehicles = (site?.home?.rangeSection?.vehicles ?? []).filter(
    (v): v is Vehicle & { slug: string } => Boolean(v?.slug),
  )
  const parentOf = (v: { slug: string }) => vehicles.find((p) => v.slug.startsWith(`${p.slug}-`))

  return {
    primary: (site?.navigation?.links ?? []).map((link) => ({ key: link._key, link })),
    cta: site?.navigation?.cta ?? null,
    models: vehicles
      .filter((v) => !parentOf(v))
      .map((model) => ({
        key: model.slug,
        name: model.name,
        children: [
          {
            key: 'explore',
            link: {
              label: {
                en: `${ui('en', 'explore')} ${model.name?.en ?? ''}`.trim(),
                ar: `${ui('ar', 'explore')} ${model.name?.ar ?? ''}`.trim(),
              },
              href: `/vehicles/${model.slug}`,
            },
          },
          ...vehicles
            .filter((v) => parentOf(v) === model)
            .map((v) => ({ key: v.slug, link: { label: v.name, href: `/vehicles/${v.slug}` } })),
          // The test-drive page, with this model preselected.
          { key: 'test-drive', link: { label: label('bookTestDrive'), href: `/test-drive?model=${model.slug}` } },
        ],
      })),
    secondary: [
      item('navOffers', '/offers'),
      item('navService', '#service'),
      item('navStory', '/lotus-story'),
    ],
    utility: [item('navShowrooms', '/our-network'), item('navContact', '#contact')],
  }
}
