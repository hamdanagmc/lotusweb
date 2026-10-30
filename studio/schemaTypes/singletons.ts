import {CalendarIcon} from '@sanity/icons/Calendar'
import {CogIcon} from '@sanity/icons/Cog'
import {HomeIcon} from '@sanity/icons/Home'
import {MenuIcon} from '@sanity/icons/Menu'
import {PinIcon} from '@sanity/icons/Pin'
import {ThLargeIcon} from '@sanity/icons/ThLarge'
import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * One-of-a-kind documents. Each lives at a fixed `_id` equal to its type name
 * (see structure.ts); sanity.config.ts hides them from "Create new" and blocks
 * duplicate / delete / unpublish.
 */

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  icon: CogIcon,
  groups: [
    {name: 'general', title: 'General', default: true},
    {name: 'language', title: 'Languages'},
    {name: 'branding', title: 'Branding'},
  ],
  fields: [
    defineField({name: 'siteTitle', title: 'Site title', type: 'localeString', group: 'general'}),
    defineField({
      name: 'siteDescription',
      title: 'Site description',
      type: 'localeText',
      group: 'general',
    }),
    defineField({
      name: 'defaultLocale',
      title: 'Default language',
      type: 'string',
      group: 'language',
      options: {
        list: [
          {title: 'English', value: 'en'},
          {title: 'العربية (Arabic)', value: 'ar'},
        ],
        layout: 'radio',
      },
      initialValue: 'en',
      description: 'Served at the root URL (/). The other language lives at /ar.',
    }),
    defineField({
      name: 'enabledLocales',
      title: 'Enabled languages',
      type: 'array',
      group: 'language',
      of: [defineArrayMember({type: 'string'})],
      options: {
        list: [
          {title: 'English', value: 'en'},
          {title: 'العربية (Arabic)', value: 'ar'},
        ],
      },
      initialValue: ['en', 'ar'],
    }),
    defineField({name: 'favicon', title: 'Favicon', type: 'figure', group: 'branding'}),
    defineField({
      name: 'ogImage',
      title: 'Default social share image',
      type: 'figure',
      group: 'branding',
    }),
  ],
  preview: {prepare: () => ({title: 'Site settings'})},
})

export const navigation = defineType({
  name: 'navigation',
  title: 'Navigation',
  type: 'document',
  icon: MenuIcon,
  fields: [
    defineField({
      name: 'logoText',
      title: 'Wordmark',
      type: 'string',
      description: 'Text logo in the header. Not translated — the brand name stays Latin.',
    }),
    defineField({
      name: 'statusBadge',
      title: 'Status badge',
      type: 'object',
      fields: [
        defineField({name: 'enabled', title: 'Show badge', type: 'boolean', initialValue: true}),
        defineField({name: 'label', title: 'Label', type: 'localeString'}),
      ],
    }),
    defineField({
      name: 'links',
      title: 'Menu items',
      type: 'array',
      of: [defineArrayMember({type: 'link'})],
      description: 'Order here is the order in the header and the mobile drawer.',
      validation: (rule) => rule.max(8).warning('More than 8 items crowds the header.'),
    }),
    defineField({name: 'cta', title: 'Header button', type: 'link'}),
    defineField({
      name: 'updatesButton',
      title: 'Floating "Lotus Updates" button',
      type: 'link',
      description:
        'Yellow button fixed to the bottom corner of every page, e.g. a sign-up page for Lotus news. Remove the label to hide it.',
    }),
    defineField({
      name: 'languageToggle',
      title: 'Language toggle labels',
      type: 'object',
      options: {columns: 2},
      fields: [
        defineField({name: 'enLabel', title: 'English label', type: 'string', initialValue: 'EN'}),
        defineField({name: 'arLabel', title: 'Arabic label', type: 'string', initialValue: 'عربي'}),
      ],
    }),
  ],
  preview: {prepare: () => ({title: 'Navigation'})},
})

export const homePage = defineType({
  name: 'homePage',
  title: 'Home page',
  type: 'document',
  icon: HomeIcon,
  groups: [
    {name: 'content', title: 'Sections', default: true},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({name: 'hero', title: '1. Hero', type: 'heroSection', group: 'content'}),
    defineField({name: 'marquee', title: '2. Marquee', type: 'marqueeSection', group: 'content'}),
    defineField({
      name: 'rangeSection',
      title: '3. The Range',
      type: 'rangeSection',
      group: 'content',
    }),
    defineField({
      name: 'brandHighlight',
      title: '4. Model highlight',
      type: 'brandHighlightSection',
      group: 'content',
    }),
    defineField({name: 'story', title: '5. Our story', type: 'storySection', group: 'content'}),
    defineField({
      name: 'offersSection',
      title: '6. Exclusives',
      type: 'offersSection',
      group: 'content',
    }),
    defineField({
      name: 'serviceSection',
      title: '7. Service',
      type: 'serviceSection',
      group: 'content',
    }),
    defineField({
      name: 'showroomSection',
      title: '8. Find a Lotus Centre',
      type: 'showroomSection',
      group: 'content',
    }),
    defineField({
      name: 'contactCta',
      title: '9. Closing CTA',
      type: 'contactCtaSection',
      group: 'content',
    }),
    defineField({
      name: 'stickyBar',
      title: '10. Mobile sticky bar',
      type: 'stickyBarSection',
      group: 'content',
    }),
    defineField({name: 'seo', title: 'SEO & sharing', type: 'seo', group: 'seo'}),
  ],
  preview: {prepare: () => ({title: 'Home page'})},
})

export const footer = defineType({
  name: 'footer',
  title: 'Footer',
  type: 'document',
  icon: ThLargeIcon,
  fields: [
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      description:
        'Shown at the top-left of the footer (top-right in Arabic). Light artwork on a transparent background, SVG preferred. Leave empty to hide it.',
      options: {accept: 'image/svg+xml,image/png,image/webp'},
      fields: [defineField({name: 'alt', title: 'Alt text', type: 'string'})],
    }),
    defineField({
      name: 'columns',
      title: 'Link columns',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'footerColumn',
          fields: [
            defineField({name: 'title', title: 'Column heading', type: 'localeString'}),
            defineField({
              name: 'links',
              title: 'Links',
              type: 'array',
              of: [defineArrayMember({type: 'link'})],
            }),
          ],
          preview: {
            select: {title: 'title.en', links: 'links'},
            prepare: ({title, links}) => ({
              title: title || 'Column',
              subtitle: `${links?.length ?? 0} links`,
            }),
          },
        }),
      ],
      validation: (rule) => rule.max(3).warning('The fourth column is reserved for social links.'),
    }),
    defineField({name: 'socialTitle', title: 'Social column heading', type: 'localeString'}),
    defineField({
      name: 'socialLinks',
      title: 'Social links',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'socialLink',
          fields: [
            defineField({
              name: 'platform',
              title: 'Platform',
              type: 'string',
              options: {
                list: [
                  {title: 'Instagram', value: 'instagram'},
                  {title: 'Facebook', value: 'facebook'},
                  {title: 'X (Twitter)', value: 'twitter'},
                  {title: 'YouTube', value: 'youtube'},
                  {title: 'LinkedIn', value: 'linkedin'},
                  {title: 'TikTok', value: 'tiktok'},
                ],
              },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'Profile URL',
              type: 'url',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {select: {title: 'platform', subtitle: 'url'}},
        }),
      ],
    }),
    defineField({
      name: 'languageToggleLabel',
      title: 'Footer language toggle label',
      type: 'string',
      initialValue: 'EN / AR',
    }),
    defineField({name: 'copyright', title: 'Copyright line', type: 'localeString'}),
    defineField({
      name: 'legalLinks',
      title: 'Legal links',
      type: 'array',
      of: [defineArrayMember({type: 'link'})],
    }),
  ],
  preview: {prepare: () => ({title: 'Footer'})},
})

const label = (name: string, title: string) => defineField({name, title, type: 'localeString'})

export const testDrivePage = defineType({
  name: 'testDrivePage',
  title: 'Test drive page',
  type: 'document',
  icon: CalendarIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'labels', title: 'Form labels'},
    {name: 'thanks', title: 'Thank you'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'localeString',
      group: 'content',
      description: 'Optional small yellow line above the heading.',
    }),
    defineField({name: 'heading', title: 'Heading', type: 'localeString', group: 'content'}),
    defineField({name: 'intro', title: 'Intro copy', type: 'localeText', group: 'content'}),
    defineField({
      name: 'image',
      title: 'Title band image',
      type: 'figure',
      group: 'content',
      description: 'Landscape, at least 1920px wide. Shown dimmed behind the heading.',
    }),
    defineField({
      name: 'modelStep',
      title: 'Choose your model',
      type: 'object',
      group: 'content',
      fields: [
        defineField({name: 'heading', title: 'Heading', type: 'localeString'}),
        defineField({name: 'intro', title: 'Intro', type: 'localeString'}),
        defineField({
          name: 'models',
          title: 'Models',
          type: 'array',
          description: 'The cars visitors can choose, in this order.',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'testDriveModel',
              title: 'Model',
              fields: [
                defineField({
                  name: 'vehicle',
                  title: 'Vehicle',
                  type: 'reference',
                  to: [{type: 'vehicle'}],
                  description:
                    'Links from this car\'s pages preselect this card. Supplies the name and photo when left empty below.',
                  validation: (rule) => rule.required(),
                }),
                defineField({name: 'name', title: 'Name on the card', type: 'localeString'}),
                defineField({
                  name: 'powertrain',
                  title: 'Powertrain',
                  type: 'localeString',
                  description: 'e.g. Petrol, All-electric, Plug-in hybrid.',
                }),
                defineField({
                  name: 'image',
                  title: 'Photo',
                  type: 'figure',
                  description: 'Square studio shot on a light grey background.',
                }),
              ],
              preview: {
                select: {name: 'name.en', vehicleName: 'vehicle.name.en', subtitle: 'powertrain.en', image: 'image', vehicleImage: 'vehicle.image'},
                prepare: ({name, vehicleName, subtitle, image, vehicleImage}) => ({
                  title: name || vehicleName || 'Model',
                  subtitle,
                  media: image?.asset ? image : vehicleImage,
                }),
              },
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'detailsStep',
      title: 'Step 1 — Your details',
      type: 'object',
      group: 'content',
      fields: [defineField({name: 'heading', title: 'Heading', type: 'localeString'})],
    }),
    defineField({
      name: 'centreStep',
      title: 'Step 2 — Find a Lotus Centre',
      type: 'object',
      group: 'content',
      description: 'The centres listed are the Showroom documents.',
      fields: [
        defineField({name: 'heading', title: 'Heading', type: 'localeString'}),
        defineField({name: 'intro', title: 'Intro', type: 'localeString'}),
      ],
    }),
    defineField({
      name: 'privacyStep',
      title: 'Step 3 — Privacy',
      type: 'object',
      group: 'content',
      fields: [
        defineField({name: 'heading', title: 'Heading', type: 'localeString'}),
        defineField({
          name: 'privacyLink',
          title: 'Privacy Notice link',
          type: 'link',
          description: 'Replaces {privacy} in the privacy consent text (Form labels).',
        }),
        defineField({
          name: 'termsLink',
          title: 'Terms and Conditions link',
          type: 'link',
          description: 'Replaces {terms} in the privacy consent text (Form labels).',
        }),
      ],
    }),
    defineField({
      name: 'nextSteps',
      title: 'What happens next',
      type: 'object',
      group: 'content',
      fields: [
        defineField({name: 'heading', title: 'Heading', type: 'localeString'}),
        defineField({
          name: 'items',
          title: 'Steps',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'nextStep',
              fields: [
                defineField({name: 'title', title: 'Title', type: 'localeString'}),
                defineField({name: 'body', title: 'Text', type: 'localeText'}),
              ],
              preview: {select: {title: 'title.en', subtitle: 'body.en'}},
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'disclaimers',
      title: 'Disclaimers',
      type: 'array',
      group: 'content',
      description: 'Numbered footnotes under the footer.',
      of: [defineArrayMember({type: 'localeText'})],
    }),
    defineField({
      name: 'locationPlaceholder',
      title: 'Location dropdown placeholder',
      type: 'localeString',
      group: 'content',
      description: 'Not shown in the current design.',
    }),
    defineField({
      name: 'modelPlaceholder',
      title: 'Model dropdown placeholder',
      type: 'localeString',
      group: 'content',
      description: 'Not shown in the current design.',
    }),
    defineField({
      name: 'labels',
      title: 'Form labels and messages',
      type: 'object',
      group: 'labels',
      description: 'Every piece of text inside the form, including validation messages.',
      fields: [
        label('country', 'Country'),
        label('countryValue', 'Country shown in the locked field'),
        label('firstName', 'First name'),
        label('firstNamePlaceholder', 'First name placeholder'),
        label('lastName', 'Last name'),
        label('lastNamePlaceholder', 'Last name placeholder'),
        label('email', 'Email'),
        label('emailPlaceholder', 'Email placeholder'),
        label('phone', 'Phone'),
        label('phonePlaceholder', 'Phone placeholder'),
        defineField({
          name: 'phonePrefix',
          title: 'Phone country code',
          type: 'string',
          description: 'Shown before the phone field and sent with the number, e.g. +971.',
        }),
        {
          ...label('privacyConsent', 'Privacy consent checkbox'),
          description:
            'Write {privacy} and {terms} where the Privacy Notice and Terms links go (set under Step 3 — Privacy).',
        },
        label('consentRequired', 'Consent checkbox — "(Required)" note'),
        label('marketingConsent', 'Marketing opt-in checkbox'),
        label('submit', 'Submit button'),
        {...label('consent', 'Consent checkbox (old)'), description: 'Not shown in the current design.'},
        {...label('fullName', 'Full name'), description: 'Not shown in the current design.'},
        {...label('model', 'Model of interest'), description: 'Not shown in the current design.'},
        {...label('location', 'Preferred location'), description: 'Not shown in the current design.'},
        {...label('preferredDate', 'Preferred date'), description: 'Not shown in the current design.'},
        {...label('message', 'Message'), description: 'Not shown in the current design.'},
        label('submitting', 'Submit button while sending'),
        label('required', 'Validation: required field'),
        label('invalidEmail', 'Validation: invalid email'),
        label('errorTitle', 'Submission failed — title'),
        label('errorBody', 'Submission failed — body'),
      ],
    }),
    defineField({
      name: 'thankYou',
      title: 'Thank you page',
      type: 'object',
      group: 'thanks',
      fields: [
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'localeString'}),
        defineField({name: 'heading', title: 'Heading', type: 'localeString'}),
        defineField({name: 'body', title: 'Body copy', type: 'localeText'}),
        defineField({name: 'primaryCta', title: 'Primary button', type: 'link'}),
        defineField({name: 'secondaryCta', title: 'Secondary button', type: 'link'}),
        defineField({name: 'image', title: 'Background image', type: 'figure'}),
      ],
    }),
    defineField({name: 'seo', title: 'SEO & sharing', type: 'seo', group: 'seo'}),
  ],
  preview: {prepare: () => ({title: 'Test drive page'})},
})

/** /our-network: the list of Lotus branches. The branches are the Showroom documents. */
export const ourNetworkPage = defineType({
  name: 'ourNetworkPage',
  title: 'Our network page',
  type: 'document',
  icon: PinIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({name: 'heading', title: 'Heading', type: 'localeString', group: 'content'}),
    defineField({name: 'intro', title: 'Intro', type: 'localeText', group: 'content'}),
    defineField({
      name: 'image',
      title: 'Title band image',
      type: 'figure',
      group: 'content',
      description: 'Optional photo behind the heading, shown dimmed.',
    }),
    defineField({
      name: 'countLabel',
      title: 'Number of locations',
      type: 'localeString',
      group: 'content',
      description: '{count} becomes the number of showrooms, e.g. "Locations: {count}".',
    }),
    defineField({
      name: 'emptyState',
      title: 'No locations message',
      type: 'localeText',
      group: 'content',
    }),
    defineField({name: 'seo', title: 'SEO & sharing', type: 'seo', group: 'seo'}),
  ],
  preview: {prepare: () => ({title: 'Our network page'})},
})

export const SINGLETON_TYPES = new Set<string>([
  siteSettings.name,
  navigation.name,
  homePage.name,
  footer.name,
  testDrivePage.name,
  'offersPage',
  ourNetworkPage.name,
  'storyNavigation',
])
