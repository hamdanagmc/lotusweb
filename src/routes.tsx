import type { RouteObject } from 'react-router-dom'
import { Navigate, Outlet } from 'react-router-dom'
import Index from '@/pages/Index'
import NotFound from '@/pages/NotFound'
import VehicleDetail from '@/pages/VehicleDetail'
import TestDrive from '@/pages/TestDrive'
import ThankYou from '@/pages/ThankYou'
import Offers from '@/pages/Offers'
import OfferDetail from '@/pages/OfferDetail'
import OurNetwork from '@/pages/OurNetwork'
import StoryPage from '@/pages/StoryPage'
import { LOCALES, LocaleProvider } from '@/i18n/LocaleProvider'
import ScrollManager from '@/components/common/ScrollManager'
import type { Locale } from '@/sanity/types'

/**
 * The route table, built rather than hardcoded so the default language can be
 * changed in Site Settings without touching code.
 *
 * Exported as data (not JSX) so the paths can be asserted in a test — a
 * mistyped path here is otherwise invisible until someone clicks the link.
 */
function LocaleLayout({ locale, defaultLocale }: { locale: Locale; defaultLocale: Locale }) {
  return (
    <LocaleProvider locale={locale} defaultLocale={defaultLocale}>
      <ScrollManager />
      <Outlet />
    </LocaleProvider>
  )
}

export function buildRoutes(defaultLocale: Locale): RouteObject[] {
  const pages: RouteObject[] = [
    { index: true, element: <Index /> },
    { path: 'vehicles/:slug', element: <VehicleDetail /> },
    { path: 'test-drive', element: <TestDrive /> },
    { path: 'test-drive/thank-you', element: <ThankYou /> },
    { path: 'offers', element: <Offers /> },
    { path: 'offers/:slug', element: <OfferDetail /> },
    { path: 'our-network', element: <OurNetwork /> },
    { path: 'lotus-story', element: <StoryPage /> },
    { path: 'lotus-story/:slug', element: <StoryPage /> },
    { path: '*', element: <NotFound /> },
  ]

  const others = LOCALES.filter((l) => l !== defaultLocale)

  return [
    {
      path: '/',
      element: <LocaleLayout locale={defaultLocale} defaultLocale={defaultLocale} />,
      children: pages,
    },
    ...others.map<RouteObject>((locale) => ({
      path: `/${locale}`,
      element: <LocaleLayout locale={locale} defaultLocale={defaultLocale} />,
      children: pages,
    })),
    // The default language's own prefix duplicates the root.
    { path: `/${defaultLocale}`, element: <Navigate to="/" replace /> },
  ]
}

/** Path shapes the app must serve. Used by the route test. */
export const EXPECTED_PATHS = [
  '/',
  '/vehicles/emira',
  '/test-drive',
  '/test-drive/thank-you',
  '/offers',
  '/offers/eletre-x',
  '/our-network',
  '/lotus-story',
  '/lotus-story/theory-1',
  '/ar',
  '/ar/',
  '/ar/vehicles/emira',
  '/ar/test-drive',
  '/ar/test-drive/thank-you',
  '/ar/offers',
  '/ar/offers/eletre-x',
  '/ar/our-network',
  '/ar/lotus-story',
  '/ar/lotus-story/about-lotus',
]
