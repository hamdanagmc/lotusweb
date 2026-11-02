import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import CmsLink from '@/components/common/CmsLink'
import { useLocale } from '@/i18n/LocaleProvider'
import { useSite } from '@/sanity/ContentProvider'
import { SOCIAL_LABELS, socialIcon } from '@/lib/icons'

export default function Footer() {
  const site = useSite()
  const footer = site?.footer
  const { t, locale, pathFor } = useLocale()
  const navigate = useNavigate()

  const columns = (footer?.columns ?? []).filter(Boolean)
  const socials = (footer?.socialLinks ?? []).filter((s) => socialIcon(s.platform))
  const toggleTarget = locale === 'ar' ? 'en' : 'ar'
  // Offered only once the other language is ticked under Site settings → Enabled languages.
  const canSwitch = !!site?.settings?.enabledLocales?.includes(toggleTarget)

  return (
    <footer className="bg-lotus-black border-t border-lotus-border pt-16 pb-8 md:pt-24 md:pb-12 px-5 md:px-8 lg:px-20">
      {footer?.logo?.url ? (
        <img
          src={footer.logo.url}
          alt={footer.logo.alt ?? ''}
          loading="lazy"
          className="h-12 md:h-16 w-auto mb-12 md:mb-20"
        />
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 mb-12 md:mb-20">
        {columns.map((column) => (
          <div key={column._key} className="space-y-6">
            <h4 className="text-xs font-bold tracking-widest uppercase text-lotus-text-faint">
              {t(column.title)}
            </h4>
            <ul className="space-y-3 text-sm font-medium">
              {(column.links ?? []).map((link) => (
                <li key={link._key}>
                  <CmsLink
                    link={link}
                    className="hover:text-lotus-yellow transition-colors"
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}

        {socials.length > 0 || footer?.languageToggleLabel ? (
          <div className="space-y-6">
            <h4 className="text-xs font-bold tracking-widest uppercase text-lotus-text-faint">
              {t(footer?.socialTitle)}
            </h4>
            <div className="flex gap-4">
              {socials.map((social) => {
                const icon = socialIcon(social.platform)
                if (!icon || !social.url) return null
                return (
                  <a
                    key={social._key}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={SOCIAL_LABELS[social.platform!]}
                    className="w-10 h-10 border border-lotus-border flex items-center justify-center hover:bg-lotus-yellow hover:text-lotus-black hover:border-lotus-yellow transition-all"
                  >
                    <FontAwesomeIcon icon={icon} />
                  </a>
                )
              })}
            </div>
            {footer?.languageToggleLabel && canSwitch ? (
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => navigate(pathFor(toggleTarget))}
                  className="text-xs font-bold tracking-widest border-b border-lotus-yellow text-lotus-yellow"
                >
                  {footer.languageToggleLabel}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="border-t border-lotus-border pt-8 md:pt-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-xs text-lotus-text-faint tracking-widest uppercase">
        <p>{t(footer?.copyright)}</p>
        <div className="flex flex-wrap gap-x-5 gap-y-3 md:gap-8">
          {(footer?.legalLinks ?? []).map((link) => (
            <CmsLink
              key={link._key}
              link={link}
              className="hover:text-lotus-text-off transition-colors"
            />
          ))}
        </div>
      </div>
    </footer>
  )
}
