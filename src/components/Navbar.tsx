import { useEffect, useMemo, useRef, useState } from 'react'
import { useHeaderScroll } from '@/hooks/use-header-scroll'
import type { MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Globe, X } from 'lucide-react'
import CmsLink from '@/components/common/CmsLink'
import LotusLogo from '@/components/common/LotusLogo'
import { useLocale } from '@/i18n/LocaleProvider'
import { ui } from '@/i18n/ui'
import { useSite } from '@/sanity/ContentProvider'
import { buildNav, type NavItem } from '@/sanity/nav'
import { cn } from '@/lib/utils'
import '@/styles/navbar.css'

/** Chevrons point "forward", so they mirror in Arabic. */
const CHEVRON = 'shrink-0 rtl:-scale-x-100'
const PANE = 'nav-pane overflow-y-auto px-[24px] pb-[32px] pt-[8px] md:px-[40px]'
const SMALL_LINK =
  'flex min-h-[40px] w-full items-center justify-between gap-[12px] text-start text-[13px] font-medium uppercase tracking-[0.18em] hover:opacity-60 transition-opacity'
const MODEL_TYPE = 'text-[clamp(22px,5vw,28px)] font-light uppercase tracking-[0.2em]'

/** Sizes are px, not rem: from 1024px the root font size scales with the viewport. */
export default function Navbar() {
  const site = useSite()
  const nav = useMemo(() => buildNav(site), [site])
  const { t, locale, pathFor } = useLocale()
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [subKey, setSubKey] = useState<string | null>(null)
  const [subOpen, setSubOpen] = useState(false)
  const { solid, hidden } = useHeaderScroll()

  const drawerRef = useRef<HTMLElement>(null)
  const menuBtn = useRef<HTMLButtonElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const backBtn = useRef<HTMLButtonElement>(null)
  // The model button that opened the sub pane; Back returns focus to it.
  const subTrigger = useRef<HTMLButtonElement | null>(null)

  const close = () => {
    subTrigger.current = null
    setSubOpen(false)
    setOpen(false)
  }

  // While open: lock the page, focus the close button, Esc closes, Tab stays
  // inside the drawer. On close, focus goes back to the menu button.
  useEffect(() => {
    if (!open) return
    const menuButton = menuBtn.current
    document.body.style.overflow = 'hidden'
    closeBtn.current?.focus({ preventScroll: true })

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return close()
      if (e.key !== 'Tab' || !drawerRef.current) return
      const items = [...drawerRef.current.querySelectorAll<HTMLElement>('a[href], button')].filter(
        (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility === 'visible',
      )
      const first = items[0]
      const last = items[items.length - 1]
      const edge = e.shiftKey ? first : last
      if (document.activeElement === edge || !drawerRef.current.contains(document.activeElement)) {
        e.preventDefault()
        ;(e.shiftKey ? last : first)?.focus({ preventScroll: true })
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
      menuButton?.focus({ preventScroll: true })
    }
  }, [open])

  // preventScroll: focusing into a pane mid-slide would otherwise scroll the
  // clipped track and break the animation.
  useEffect(() => {
    if (subOpen) backBtn.current?.focus({ preventScroll: true })
    else subTrigger.current?.focus({ preventScroll: true })
  }, [subOpen])

  /** Any link in the drawer closes it (CmsLink renders test-drive links as buttons). */
  const closeOnLink = (e: MouseEvent) => {
    if ((e.target as Element).closest('a, button')) close()
  }

  const toggleTarget = locale === 'ar' ? 'en' : 'ar'
  const toggle = site?.navigation?.languageToggle
  const sub = nav.models.find((m) => m.key === subKey)

  const smallLinks = (items: NavItem[], chevron: boolean, className?: string) => (
    <ul onClick={closeOnLink} className={className}>
      {items.map(({ key, link }) => (
        <li key={key}>
          <CmsLink link={link} className={SMALL_LINK}>
            <span>{t(link.label)}</span>
            {chevron ? <ChevronRight aria-hidden className={cn(CHEVRON, 'size-[14px]')} /> : null}
          </CmsLink>
        </li>
      ))}
    </ul>
  )

  return (
    <>
      <header
        id="header"
        className={cn(
          'site-nav fixed inset-x-0 top-0 z-[100] grid h-[56px] grid-cols-[1fr_auto_1fr] items-center gap-[16px] px-[20px] text-lotus-text-off md:px-[32px] lg:px-[48px] xl:h-[72px]',
          solid || open ? 'bg-lotus-black/[.92] backdrop-blur-md' : 'bg-transparent',
          hidden && !open && '-translate-y-full',
        )}
      >
        {/* Only when the Studio's Navigation document has links; it has none now. */}
        {nav.primary.length > 0 ? (
          <nav
            aria-label={ui(locale, 'menu')}
            className="col-start-1 row-start-1 hidden items-center gap-[24px] justify-self-start lg:flex xl:gap-[32px]"
          >
            {nav.primary.map(({ key, link }) => (
              <CmsLink
                key={key}
                link={link}
                className="site-nav-link flex h-[40px] items-center whitespace-nowrap text-[13px] font-medium uppercase tracking-[0.18em]"
              >
                <span className="nav-link relative">{t(link.label)}</span>
              </CmsLink>
            ))}
          </nav>
        ) : null}

        <Link
          to={pathFor(locale)}
          aria-label={site?.navigation?.logoText || 'Lotus'}
          className="col-start-2 row-start-1 flex h-[40px] items-center transition-colors hover:text-lotus-yellow"
        >
          <LotusLogo title={site?.navigation?.logoText || 'Lotus'} className="h-6 w-auto" />
        </Link>

        {/* Phones: `contents` puts the language switch on the start side, so the
            logo stays centred; there isn't room for both beside it. */}
        <div className="contents sm:col-start-3 sm:row-start-1 sm:flex sm:items-center sm:justify-self-end sm:gap-[16px]">
          <button
            type="button"
            onClick={() => navigate(pathFor(toggleTarget))}
            aria-label={ui(locale, toggleTarget === 'ar' ? 'switchToArabic' : 'switchToEnglish')}
            className="col-start-1 row-start-1 h-[40px] justify-self-start whitespace-nowrap px-[4px] text-[12px] font-bold tracking-widest transition-colors hover:text-lotus-yellow"
          >
            {toggle?.enLabel ?? 'EN'} / {toggle?.arLabel ?? 'عربي'}
          </button>
          {nav.cta ? (
            <CmsLink
              link={nav.cta}
              className="btn-primary hidden h-[40px] items-center whitespace-nowrap px-[20px] text-[12px] font-bold uppercase tracking-widest sm:inline-flex"
            />
          ) : null}
          <button
            ref={menuBtn}
            type="button"
            onClick={() => (open ? close() : setOpen(true))}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={ui(locale, open ? 'closeMenu' : 'openMenu')}
            className="menu-btn col-start-3 row-start-1 size-[40px] justify-self-end hover:text-lotus-yellow"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <div className={cn('nav-overlay', open && 'is-open')} onClick={close} aria-hidden="true" />

      <aside
        ref={drawerRef}
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label={ui(locale, 'menu')}
        className={cn('nav-drawer bg-lotus-yellow text-lotus-black', open && 'is-open')}
      >
        <div className="flex h-[56px] shrink-0 items-center justify-end px-[12px] md:px-[28px] xl:h-[72px]">
          <button
            ref={closeBtn}
            type="button"
            onClick={close}
            aria-label={ui(locale, 'closeMenu')}
            className="grid size-[40px] place-items-center hover:opacity-60"
          >
            <X aria-hidden className="size-[24px]" strokeWidth={1.5} />
          </button>
        </div>

        <div className="min-h-0 grow overflow-hidden">
          <div className={cn('nav-track', subOpen && 'is-sub')}>
            <div className={PANE} aria-hidden={subOpen}>
              <ul>
                {nav.models.map((model) => (
                  <li key={model.key}>
                    <button
                      type="button"
                      onClick={(e) => {
                        subTrigger.current = e.currentTarget
                        setSubKey(model.key)
                        setSubOpen(true)
                      }}
                      className={cn(
                        MODEL_TYPE,
                        'flex min-h-[56px] w-full items-center justify-between gap-[16px] text-start hover:opacity-60 transition-opacity',
                      )}
                    >
                      {t(model.name)}
                      <ChevronRight aria-hidden className={cn(CHEVRON, 'size-[22px]')} strokeWidth={1.5} />
                    </button>
                  </li>
                ))}
              </ul>

              {smallLinks(nav.secondary, true, 'mt-[32px] border-t border-lotus-black/20 pt-[16px]')}
              {smallLinks(nav.utility, false, 'mt-[24px] opacity-70')}

              {nav.cta ? (
                <div onClick={closeOnLink} className="mt-[32px] sm:hidden">
                  <CmsLink
                    link={nav.cta}
                    className="flex h-[48px] w-full items-center justify-center bg-lotus-black text-[12px] font-bold uppercase tracking-widest text-lotus-text-off"
                  />
                </div>
              ) : null}
            </div>

            <div className={PANE} aria-hidden={!subOpen}>
              <button
                ref={backBtn}
                type="button"
                onClick={() => setSubOpen(false)}
                className="-ms-[4px] flex h-[40px] items-center gap-[4px] text-[13px] font-medium uppercase tracking-[0.18em] hover:opacity-60"
              >
                <ChevronLeft aria-hidden className={cn(CHEVRON, 'size-[16px]')} />
                {ui(locale, 'back')}
              </button>
              {sub ? (
                <>
                  <h2 className={cn(MODEL_TYPE, 'mb-[16px] mt-[24px]')}>{t(sub.name)}</h2>
                  {smallLinks(sub.children, true, 'border-t border-lotus-black/20 pt-[8px]')}
                </>
              ) : null}
            </div>
          </div>
        </div>

        <p className="flex h-[48px] shrink-0 items-center gap-[8px] bg-lotus-black px-[24px] text-[12px] uppercase tracking-[0.1em] text-white md:px-[40px]">
          <Globe aria-hidden className="size-[16px]" strokeWidth={1.5} />
          {ui(locale, 'location')}
        </p>
      </aside>

      {/* Figma "Floating Lotus Updates button". Under the dialogs (z-50) and
          the open menu; hidden when the Studio field has no label. */}
      <CmsLink
        link={site?.navigation?.updatesButton}
        className="fixed bottom-[16px] bg-lotus-yellow text-lotus-black transition-colors hover:bg-[#e6c800] end-[16px] z-40 px-[24px] py-[16px] text-[12px] font-semibold uppercase leading-[16px] tracking-[0.15em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lotus-yellow md:bottom-[32px] md:end-[32px]"
      />
    </>
  )
}
