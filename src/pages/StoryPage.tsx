import { NavLink, useParams } from 'react-router-dom'
import '@/styles/lotus-uae-for-the-drivers.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/layout/Footer'
import CmsLink from '@/components/common/CmsLink'
import PageSkeleton from '@/components/common/PageSkeleton'
import SiteHead from '@/components/common/SiteHead'
import VehicleSections from '@/components/vehicle/VehicleSections'
import NotFound from '@/pages/NotFound'
import { useHeaderScroll } from '@/hooks/use-header-scroll'
import { useLocale } from '@/i18n/LocaleProvider'
import { ui } from '@/i18n/ui'
import { cn } from '@/lib/utils'
import { STORY_PAGE_QUERY } from '@/sanity/queries'
import { useLiveQuery } from '@/sanity/useLiveQuery'
import type { StoryNavigationDoc, StoryPageDoc } from '@/sanity/types'

/** The main Lotus Story page's slug; every other story page is /lotus-story/<slug>. */
const LANDING = 'lotus-story'

/**
 * The menu across the Lotus Story pages, as on lotuscars.com: pinned under
 * the site header and moving up when the header hides, see-through over the
 * opening hero, black once scrolled. It takes no height of its own, so the
 * hero still starts at the top.
 */
function StoryNav({ nav }: { nav?: StoryNavigationDoc | null }) {
  const { t, localePath } = useLocale()
  const { solid: scrolled, hidden: headerHidden } = useHeaderScroll()

  const links = (nav?.links ?? []).filter((l) => l.href && t(l.label))
  if (!links.length) return null

  return (
    <nav
      aria-label={links[0] ? t(links[0].label) : undefined}
      className={cn(
        'sticky z-40 -mb-14 flex h-14 items-center gap-6 border-b px-5 transition-[top,background-color,border-color] duration-500 md:px-8 lg:px-[60px]',
        headerHidden ? 'top-0' : 'top-14 xl:top-[72px]',
        scrolled ? 'border-white/10 bg-black' : 'border-transparent bg-gradient-to-b from-black/60 to-transparent',
      )}
    >
      <ul className="flex min-w-0 flex-1 gap-8 overflow-x-auto [scrollbar-width:none] lg:gap-14">
        {links.map((l) => (
          <li key={l._key} className="shrink-0">
            <NavLink
              to={localePath(l.href!)}
              end
              className={({ isActive }) =>
                cn(
                  'block py-2 text-xs uppercase leading-4 tracking-[0.05em] transition-colors',
                  isActive ? 'text-white' : 'text-white/60 hover:text-white',
                )
              }
            >
              {t(l.label)}
            </NavLink>
          </li>
        ))}
      </ul>
      {nav?.cta?.href && t(nav.cta.label) ? (
        <CmsLink
          link={nav.cta}
          className="hidden shrink-0 bg-lotus-yellow px-8 py-4 text-xs font-semibold uppercase leading-4 text-black transition-colors hover:bg-white md:block"
        />
      ) : null}
    </nav>
  )
}

/**
 * /lotus-story and /lotus-story/:slug. Each is a Lotus Story page document in
 * the Studio, built from page sections; the menu is the Lotus Story menu
 * document.
 */
export default function StoryPage() {
  const { slug = LANDING } = useParams()
  const { t, locale } = useLocale()
  const { data, loading, error } = useLiveQuery<{
    page: StoryPageDoc | null
    nav: StoryNavigationDoc | null
  }>(STORY_PAGE_QUERY, { slug })

  if (loading && !data) return <PageSkeleton />

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-lotus-black px-8 text-center text-lotus-text-off">
        <p role="alert">{ui(locale, 'pageLoadFailed')}</p>
      </div>
    )
  }

  const page = data?.page
  // The landing page lives at /lotus-story, not /lotus-story/lotus-story.
  if (!page || (slug === LANDING) !== (page.slug === LANDING)) return <NotFound />

  const hero = page.sections?.find((s) => s._type === 'heroMedia')

  return (
    <div className="antialiased selection:bg-lotus-yellow selection:text-lotus-black">
      <SiteHead
        title={t(page.seo?.title) || t(page.title)}
        description={t(page.seo?.description)}
        image={page.seo?.ogImage ?? (hero?._type === 'heroMedia' ? hero.media?.image : null)}
      />
      <Navbar />
      <StoryNav nav={data?.nav} />
      <main className="bg-black text-white">
        <VehicleSections sections={page.sections ?? []} />
      </main>
      <Footer />
    </div>
  )
}
