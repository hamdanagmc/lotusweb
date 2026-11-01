/**
 * All content is fetched in a single round trip. Localised fields are returned
 * whole (`{en, ar}`) rather than resolved server-side, so switching language in
 * the UI is instant and needs no extra request.
 *
 * Reference arrays are filtered with `[defined(@->_id)]` BEFORE dereferencing.
 * A plain `[]->` keeps a null slot for any reference that does not resolve —
 * a document that was deleted, or that exists only as a draft while the page
 * referencing it is published. Those nulls reach the components and crash on
 * the first property read. Filtering first drops them server-side.
 */

import { LIVE_OFFER } from '@/lib/offerEnquiry'

const FIGURE_FIELDS = /* groq */ `
  alt,
  hotspot,
  crop,
  asset->{ _id, url, metadata { lqip, dimensions } }
`

const FIGURE = /* groq */ `{${FIGURE_FIELDS}}`

const LINK = /* groq */ `{ label, href, external }`

/** Page-builder sections: resolves every image and video a section type can hold. */
const SECTIONS = /* groq */ `{
  ...,
  media{ image ${FIGURE}, mobileImage ${FIGURE}, "video": video.asset->url, "mobileVideo": mobileVideo.asset->url },
  background{ image ${FIGURE}, mobileImage ${FIGURE}, "video": video.asset->url, "mobileVideo": mobileVideo.asset->url },
  "video": video.asset->url,
  "mobileVideo": mobileVideo.asset->url,
  image ${FIGURE},
  overline ${FIGURE},
  items[]{ ..., image ${FIGURE}, "video": video.asset->url },
  views[]{ ..., image ${FIGURE} }
}`

const VEHICLE = /* groq */ `{
  _id,
  "slug": slug.current,
  name,
  tagline,
  "logo": logo.asset->url,
  image ${FIGURE},
  specs[]{ _key, value, label },
  discoverLink ${LINK},
  testDriveLink ${LINK}
}`

const OFFER = /* groq */ `{
  _id,
  title,
  subtitle,
  image ${FIGURE},
  link ${LINK}
}`

const SERVICE_FEATURE = /* groq */ `{ _id, icon, title, description }`

const SHOWROOM = /* groq */ `{
  _id,
  name,
  locationLabel,
  address,
  hoursLabel,
  hours,
  contactLabel,
  contactText,
  contactHref,
  directionsLabel,
  directionsLinkText,
  directionsHref,
  liveStatusLabel,
  openLabel,
  closedLabel,
  isOpen
}`

export const SITE_QUERY = /* groq */ `{
  "settings": *[_type == "siteSettings"][0]{
    siteTitle,
    siteDescription,
    defaultLocale,
    enabledLocales,
    favicon ${FIGURE},
    ogImage ${FIGURE}
  },

  "navigation": *[_type == "navigation"][0]{
    logoText,
    statusBadge{ enabled, label },
    links[]{ _key, label, href, external },
    cta ${LINK},
    updatesButton ${LINK},
    languageToggle{ enLabel, arLabel }
  },

  "home": *[_type == "homePage"][0]{
    seo{ title, description, ogImage ${FIGURE} },

    hero{
      eyebrow,
      headingTop,
      headingOutlined,
      image ${FIGURE},
      primaryCta ${LINK},
      secondaryCta ${LINK},
      slides[]{
        _key,
        headingTop,
        headingOutlined,
        subheading,
        image ${FIGURE},
        primaryCta ${LINK},
        secondaryCta ${LINK},
        textLink ${LINK}
      }
    },

    marquee{ enabled, speedSeconds, items[]{ _key, en, ar } },

    rangeSection{
      heading,
      subheading,
      viewAll ${LINK},
      cards[]{
        _key,
        visible,
        "vehicle": vehicle->{ _id, "slug": slug.current, name, "logo": logo.asset->url, image ${FIGURE} },
        image ${FIGURE},
        mobileImage ${FIGURE},
        displayName,
        powertrainLabel,
        introLine,
        startingPrice{ prefix, currency, amount, amountText, disclaimerRef },
        specs[]{ _key, value, unit, secondaryUnit, label, disclaimerRef },
        cta ${LINK}
      },
      "vehicles": vehicles[defined(@->_id)]-> ${VEHICLE},
      disclaimers
    },

    brandHighlight{
      eyebrow,
      heading,
      body,
      image ${FIGURE},
      stats[]{ _key, value, unit, label },
      primaryCta ${LINK},
      secondaryCta ${LINK}
    },

    story{
      eyebrow,
      heading,
      image ${FIGURE},
      backgroundVideo{ asset->{ url, mimeType, size } },
      backgroundVideoMobile{ asset->{ url, mimeType } },
      videoPoster ${FIGURE},
      leadParagraph,
      body,
      link ${LINK},
      quoteBefore,
      quoteHighlight,
      quoteAfter
    },

    offersSection{
      heading,
      "offers": offers[defined(@->_id)]-> ${OFFER}
    },

    serviceSection{
      eyebrow,
      heading,
      "features": features[defined(@->_id)]-> ${SERVICE_FEATURE}
    },

    showroomSection{
      eyebrow,
      heading,
      description,
      image ${FIGURE},
      cta ${LINK},
      "showroom": showroom-> ${SHOWROOM}
    },

    contactCta{
      heading,
      subheading,
      cta ${LINK},
      backgroundImage ${FIGURE},
      backgroundWord
    },

    stickyBar{ enabled, primaryCta ${LINK}, secondaryCta ${LINK}, whatsappHref }
  },

  "footer": *[_type == "footer"][0]{
    logo{ alt, "url": asset->url },
    columns[]{ _key, title, links[]{ _key, label, href, external } },
    socialTitle,
    socialLinks[]{ _key, platform, url },
    languageToggleLabel,
    copyright,
    legalLinks[]{ _key, label, href, external }
  }
}`

/**
 * The listener filter. Any published mutation to one of these types triggers a
 * refetch of SITE_QUERY. Drafts are excluded so in-progress edits in the Studio
 * do not churn the live site — only "Publish" moves the needle.
 */
export const LISTEN_QUERY = /* groq */ `*[
  _type in [
    "siteSettings",
    "navigation",
    "homePage",
    "vehicle",
    "offer",
    "serviceFeature",
    "showroom",
    "footer",
    "testDrivePage",
    "offersPage",
    "ourNetworkPage",
    "storyPage",
    "storyNavigation"
  ] && !(_id in path("drafts.**"))
]`

/** A single vehicle detail page, looked up by slug. */
export const VEHICLE_QUERY = /* groq */ `*[_type == "vehicle" && slug.current == $slug][0]{
  _id,
  "slug": slug.current,
  name,
  tagline,
  overview,
  image ${FIGURE},
  heroImage ${FIGURE},
  heroVideo{ asset->{ url, mimeType } },
  sections[] ${SECTIONS},
  specs[]{ _key, value, label },
  specsImage ${FIGURE},
  specsLink ${LINK},
  featureImage ${FIGURE},
  carousel{ heading, intro, slides[]{ _key, caption, image ${FIGURE} } },
  features[]{ _key, heading, body, image ${FIGURE} },
  banner{ heading, body, link ${LINK}, image ${FIGURE} },
  gallery[]{ _key, category, ${FIGURE_FIELDS} },
  spin360{
    enabled,
    frames[]{ _key, ${FIGURE_FIELDS} }
  },
  specTableHeading,
  specTableIntro,
  specVariants,
  specGroups[]{
    _key,
    title,
    rows[]{ _key, label, value, values }
  },
  disclaimers,
  seo{ title, description, ogImage ${FIGURE} },
  testDriveLink ${LINK}
}`

/** The test-drive page, its form copy and its thank-you page. */
export const TEST_DRIVE_QUERY = /* groq */ `*[_type == "testDrivePage"][0]{
  eyebrow,
  heading,
  intro,
  image ${FIGURE},
  modelStep{
    heading,
    intro,
    models[defined(vehicle->_id)]{
      _key,
      name,
      powertrain,
      image ${FIGURE},
      "vehicle": vehicle->{ _id, "slug": slug.current, name, image ${FIGURE} }
    }
  },
  detailsStep{ heading },
  centreStep{ heading, intro },
  privacyStep{ heading, privacyLink ${LINK}, termsLink ${LINK} },
  nextSteps{ heading, items[]{ _key, title, body } },
  disclaimers,
  labels{
    country, countryValue, firstName, firstNamePlaceholder, lastName, lastNamePlaceholder,
    email, emailPlaceholder, phone, phonePlaceholder, phonePrefix,
    privacyConsent, consentRequired, marketingConsent,
    submit, submitting, required, invalidEmail, errorTitle, errorBody
  },
  thankYou{
    eyebrow,
    heading,
    body,
    primaryCta ${LINK},
    secondaryCta ${LINK},
    image ${FIGURE}
  },
  seo{ title, description, ogImage ${FIGURE} }
}`

/** Showroom options for the "preferred location" dropdown. */
export const SHOWROOM_OPTIONS_QUERY = /* groq */ `*[_type == "showroom"]{
  _id,
  name,
  address,
  image ${FIGURE}
}`

const OFFER_CARD = /* groq */ `
  _id,
  "slug": slug.current,
  title,
  summary,
  badge,
  endDate,
  ctaLabel,
  image ${FIGURE}
`

/** /offers: the page copy and every live offer, in the editors' order. Needs $today. */
export const OFFERS_QUERY = /* groq */ `{
  "page": *[_type == "offersPage"][0]{
    heading, intro, image ${FIGURE}, emptyState, validUntil,
    seo{ title, description, ogImage ${FIGURE} }
  },
  "offers": *[${LIVE_OFFER}] | order(coalesce(sortOrder, 1000) asc, _createdAt desc){ ${OFFER_CARD} }
}`

/** One live offer by slug, plus the shared page labels. Needs $slug and $today. */
export const OFFER_QUERY = /* groq */ `{
  "page": *[_type == "offersPage"][0]{
    backToOffers, startsLabel, endsLabel, termsHeading,
    formHeading, formIntro, fullName, email, phone, phonePlaceholder, model, modelPlaceholder,
    contactMethod, contactPhone, contactEmail, contactWhatsapp, consent, privacyLink ${LINK},
    submit, submitting, successHeading, successBody
  },
  "offer": *[${LIVE_OFFER} && slug.current == $slug][0]{
    ${OFFER_CARD},
    startDate,
    heroImage ${FIGURE},
    body,
    terms,
    modelOptions[defined(en)]{ _key, en, ar },
    seo{ title, description, ogImage ${FIGURE} }
  }
}`

/** /our-network: the page copy and every showroom, each one a branch. */
export const OUR_NETWORK_QUERY = /* groq */ `{
  "page": *[_type == "ourNetworkPage"][0]{
    heading, intro, image ${FIGURE}, countLabel, emptyState,
    seo{ title, description, ogImage ${FIGURE} }
  },
  "showrooms": *[_type == "showroom"] | order(name.en asc){
    _id, name, branchType, image ${FIGURE},
    locationLabel, address,
    contactLabel, contactText, contactHref,
    hoursLabel, hours,
    serviceHoursLabel, serviceHours,
    directionsLinkText, directionsHref
  }
}`

/** One Lotus Story page by slug ("lotus-story" is the main page), plus the shared menu. */
export const STORY_PAGE_QUERY = /* groq */ `{
  "page": *[_type == "storyPage" && slug.current == $slug][0]{
    title,
    "slug": slug.current,
    sections[] ${SECTIONS},
    seo{ title, description, ogImage ${FIGURE} }
  },
  "nav": *[_type == "storyNavigation"][0]{
    links[]{ _key, label, href, external },
    cta ${LINK}
  }
}`
