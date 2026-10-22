import {EnvelopeIcon} from '@sanity/icons/Envelope'
import {TagIcon} from '@sanity/icons/Tag'
import {defineArrayMember, defineField, defineType, type FieldDefinition} from 'sanity'

/**
 * Deliberately small: the website renders exactly these styles, lists and
 * marks. Add one here only together with the website's PortableText.tsx.
 */
const richBlock = defineArrayMember({
  type: 'block',
  styles: [
    {title: 'Paragraph', value: 'normal'},
    {title: 'Subheading', value: 'h3'},
  ],
  lists: [
    {title: 'Bullets', value: 'bullet'},
    {title: 'Numbered', value: 'number'},
  ],
  marks: {
    decorators: [
      {title: 'Bold', value: 'strong'},
      {title: 'Italic', value: 'em'},
    ],
    annotations: [
      {
        name: 'textLink',
        title: 'Link',
        type: 'object',
        fields: [
          defineField({
            name: 'href',
            title: 'URL',
            type: 'string',
            description: 'https://…, /path on this site, mailto: or tel:',
            validation: (rule) =>
              rule
                .required()
                .custom((href?: string) =>
                  !href || /^(https?:\/\/|mailto:|tel:|\/(?!\/))/.test(href)
                    ? true
                    : 'Use https://…, a /path, mailto: or tel:',
                ),
          }),
        ],
      },
    ],
  },
})

export const localeRichText = defineType({
  name: 'localeRichText',
  title: 'Rich text (EN / AR)',
  type: 'object',
  fields: [
    defineField({name: 'en', title: 'English', type: 'array', of: [richBlock]}),
    defineField({name: 'ar', title: 'العربية (Arabic)', type: 'array', of: [richBlock]}),
  ],
})

const label = (name: string, title: string, group: string, description?: string) =>
  defineField({name, title, type: 'localeString', group, description})

/** Copy for /offers and the parts of every offer page that are not the offer itself. */
export const offersPage = defineType({
  name: 'offersPage',
  title: 'Offers page',
  type: 'document',
  icon: TagIcon,
  groups: [
    {name: 'listing', title: 'Offers list', default: true},
    {name: 'detail', title: 'Offer page'},
    {name: 'form', title: 'Enquiry form'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    label('heading', 'Heading', 'listing'),
    defineField({name: 'intro', title: 'Intro', type: 'localeText', group: 'listing'}),
    defineField({
      name: 'image',
      title: 'Title band image',
      type: 'figure',
      group: 'listing',
      description: 'Optional photo behind the heading, shown dimmed.',
    }),
    defineField({
      name: 'emptyState',
      title: 'No offers message',
      type: 'localeText',
      group: 'listing',
      description: 'Shown when no offer is live.',
    }),
    label('validUntil', 'Card validity line', 'listing', '{date} becomes the end date, e.g. "Valid until {date}".'),

    label('backToOffers', 'Back link', 'detail'),
    label('startsLabel', 'Start date label', 'detail'),
    label('endsLabel', 'End date label', 'detail'),
    label('termsHeading', 'Terms heading', 'detail'),

    label('formHeading', 'Heading', 'form'),
    defineField({name: 'formIntro', title: 'Intro', type: 'localeText', group: 'form'}),
    label('fullName', 'Full name label', 'form'),
    label('email', 'Email label', 'form'),
    label('phone', 'Phone label', 'form'),
    label('phonePlaceholder', 'Phone placeholder', 'form'),
    label('model', 'Model label', 'form', 'Only shown when the offer lists models.'),
    label('modelPlaceholder', 'Model placeholder', 'form'),
    label('contactMethod', 'Contact method question', 'form'),
    label('contactPhone', 'Contact method: phone call', 'form'),
    label('contactEmail', 'Contact method: email', 'form'),
    label('contactWhatsapp', 'Contact method: WhatsApp', 'form'),
    label('consent', 'Consent checkbox', 'form', '{privacy} becomes the privacy policy link.'),
    defineField({name: 'privacyLink', title: 'Privacy policy link', type: 'link', group: 'form'}),
    label('submit', 'Send button', 'form'),
    label('submitting', 'Send button while sending', 'form'),
    label('successHeading', 'Sent: heading', 'form'),
    defineField({name: 'successBody', title: 'Sent: message', type: 'localeText', group: 'form'}),

    defineField({name: 'seo', title: 'SEO & sharing', type: 'seo', group: 'seo'}),
  ],
  preview: {prepare: () => ({title: 'Offers page'})},
})

export const ENQUIRY_STATUSES = [
  {title: 'New', value: 'new'},
  {title: 'Contacted', value: 'contacted'},
  {title: 'Closed', value: 'closed'},
]

const CONTACT_METHODS = [
  {title: 'Phone call', value: 'phone'},
  {title: 'Email', value: 'email'},
  {title: 'WhatsApp', value: 'whatsapp'},
]

const readOnly = (field: FieldDefinition) => ({...field, readOnly: true})

/**
 * Written by the website's /api/offer-enquiry function under a private
 * `offerEnquiry.<uuid>` ID (the dataset is public; dotted IDs are not).
 * Only the status is meant to be edited, and it saves straight away.
 */
export const offerEnquiry = defineType({
  name: 'offerEnquiry',
  title: 'Offer enquiry',
  type: 'document',
  icon: EnvelopeIcon,
  liveEdit: true,
  fields: [
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {list: ENQUIRY_STATUSES, layout: 'radio', direction: 'horizontal'},
      initialValue: 'new',
    }),
    readOnly(
      defineField({name: 'offer', title: 'Offer', type: 'reference', to: [{type: 'offer'}], weak: true}),
    ),
    readOnly(
      defineField({
        name: 'offerTitle',
        title: 'Offer title when sent',
        type: 'string',
        description: 'Kept in case the offer is renamed or deleted.',
      }),
    ),
    readOnly(defineField({name: 'fullName', title: 'Full name', type: 'string'})),
    readOnly(defineField({name: 'email', title: 'Email', type: 'string'})),
    readOnly(defineField({name: 'phone', title: 'Phone', type: 'string'})),
    readOnly(defineField({name: 'model', title: 'Preferred model', type: 'string'})),
    readOnly(
      defineField({
        name: 'contactMethod',
        title: 'Preferred contact method',
        type: 'string',
        options: {list: CONTACT_METHODS},
      }),
    ),
    readOnly(defineField({name: 'consent', title: 'Agreed to be contacted', type: 'boolean'})),
    readOnly(defineField({name: 'locale', title: 'Site language', type: 'string'})),
    readOnly(
      defineField({
        name: 'source',
        title: 'Source',
        type: 'object',
        options: {collapsible: true},
        fields: [
          defineField({name: 'utmSource', title: 'utm_source', type: 'string'}),
          defineField({name: 'utmMedium', title: 'utm_medium', type: 'string'}),
          defineField({name: 'utmCampaign', title: 'utm_campaign', type: 'string'}),
          defineField({name: 'utmTerm', title: 'utm_term', type: 'string'}),
          defineField({name: 'utmContent', title: 'utm_content', type: 'string'}),
          defineField({name: 'page', title: 'Page', type: 'string'}),
          defineField({name: 'referrer', title: 'Referrer', type: 'string'}),
        ],
      }),
    ),
    readOnly(defineField({name: 'submittedAt', title: 'Received', type: 'datetime'})),
  ],
  orderings: [
    {name: 'newest', title: 'Newest first', by: [{field: 'submittedAt', direction: 'desc'}]},
  ],
  preview: {
    select: {
      title: 'offer.title.en',
      snapshot: 'offerTitle',
      name: 'fullName',
      status: 'status',
      at: 'submittedAt',
    },
    prepare: ({title, snapshot, name, status, at}) => ({
      title: title || snapshot || 'Offer enquiry',
      subtitle: [
        ENQUIRY_STATUSES.find((s) => s.value === status)?.title ?? 'New',
        name,
        at ? new Date(at).toLocaleDateString() : null,
      ]
        .filter(Boolean)
        .join(' – '),
    }),
  },
})
