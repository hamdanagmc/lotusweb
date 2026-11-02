import {EnvelopeIcon} from '@sanity/icons/Envelope'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {CONTACT_METHODS, ENQUIRY_STATUSES, readOnly, sourceField} from './offers'
import {modelChoice} from './singletons'

const label = (name: string, title: string, group: string, description?: string) =>
  defineField({name, title, type: 'localeString', group, description})

/** /know-more: the "register your interest" form. Its answers are Know more enquiries. */
export const knowMorePage = defineType({
  name: 'knowMorePage',
  title: 'Know more page',
  type: 'document',
  icon: InfoOutlineIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'form', title: 'Form labels'},
    {name: 'sent', title: 'After sending'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    label('heading', 'Heading', 'content'),
    defineField({name: 'intro', title: 'Intro', type: 'localeText', group: 'content'}),
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
          description:
            'The cars visitors can ask about, in this order. "Know more" links with ?model=<vehicle slug> preselect one.',
          of: [modelChoice],
          validation: (rule) => rule.min(1),
        }),
      ],
    }),
    defineField({
      name: 'topicsStep',
      title: 'Step 1 — What would you like to know?',
      type: 'object',
      group: 'content',
      fields: [
        defineField({name: 'heading', title: 'Heading', type: 'localeString'}),
        defineField({name: 'intro', title: 'Intro', type: 'localeString'}),
        defineField({
          name: 'topics',
          title: 'Topics',
          type: 'array',
          description:
            'Visitors can tick any of these. Enquiries record the English text, so renaming a topic does not change past enquiries.',
          of: [defineArrayMember({type: 'localeString'})],
        }),
      ],
    }),
    defineField({
      name: 'detailsStep',
      title: 'Step 2 — Your details',
      type: 'object',
      group: 'content',
      fields: [defineField({name: 'heading', title: 'Heading', type: 'localeString'})],
    }),
    defineField({
      name: 'privacyStep',
      title: 'Step 3 — Privacy',
      type: 'object',
      group: 'content',
      fields: [defineField({name: 'heading', title: 'Heading', type: 'localeString'})],
    }),

    label('firstName', 'First name', 'form'),
    label('lastName', 'Last name', 'form'),
    label('email', 'Email', 'form'),
    label('phone', 'Phone', 'form'),
    label('phonePlaceholder', 'Phone placeholder', 'form'),
    label('contactMethod', 'Contact method question', 'form'),
    label('contactPhone', 'Contact method: phone call', 'form'),
    label('contactEmail', 'Contact method: email', 'form'),
    label('contactWhatsapp', 'Contact method: WhatsApp', 'form'),
    label('consent', 'Consent checkbox', 'form', '{privacy} becomes the privacy policy link.'),
    defineField({name: 'privacyLink', title: 'Privacy policy link', type: 'link', group: 'form'}),
    label('marketingConsent', 'Marketing opt-in checkbox', 'form'),
    label('submit', 'Send button', 'form'),
    label('submitting', 'Send button while sending', 'form'),

    label('successHeading', 'Heading', 'sent', '{name} becomes the visitor\'s first name, e.g. "Thank you, {name}".'),
    defineField({name: 'successBody', title: 'Message', type: 'localeText', group: 'sent'}),
    defineField({
      name: 'successCta',
      title: 'Button',
      type: 'link',
      group: 'sent',
      description: 'Optional, e.g. "Book a test drive".',
    }),

    defineField({name: 'seo', title: 'SEO & sharing', type: 'seo', group: 'seo'}),
  ],
  preview: {prepare: () => ({title: 'Know more page'})},
})

/**
 * Written by the website's /api/interest-enquiry function under a private
 * `interestEnquiry.<uuid>` ID (the dataset is public; dotted IDs are not).
 * Only the status is meant to be edited, and it saves straight away.
 */
export const interestEnquiry = defineType({
  name: 'interestEnquiry',
  title: 'Know more enquiry',
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
    readOnly(defineField({name: 'model', title: 'Model', type: 'string'})),
    readOnly(
      defineField({
        name: 'topics',
        title: 'Wants to know about',
        type: 'array',
        of: [defineArrayMember({type: 'string'})],
      }),
    ),
    readOnly(defineField({name: 'firstName', title: 'First name', type: 'string'})),
    readOnly(defineField({name: 'lastName', title: 'Last name', type: 'string'})),
    readOnly(defineField({name: 'email', title: 'Email', type: 'string'})),
    readOnly(defineField({name: 'phone', title: 'Phone', type: 'string'})),
    readOnly(
      defineField({
        name: 'contactMethod',
        title: 'Preferred contact method',
        type: 'string',
        options: {list: CONTACT_METHODS},
      }),
    ),
    readOnly(defineField({name: 'consent', title: 'Agreed to be contacted', type: 'boolean'})),
    readOnly(defineField({name: 'marketingConsent', title: 'Agreed to marketing', type: 'boolean'})),
    readOnly(defineField({name: 'locale', title: 'Site language', type: 'string'})),
    sourceField,
    readOnly(defineField({name: 'submittedAt', title: 'Received', type: 'datetime'})),
  ],
  orderings: [
    {name: 'newest', title: 'Newest first', by: [{field: 'submittedAt', direction: 'desc'}]},
  ],
  preview: {
    select: {first: 'firstName', last: 'lastName', model: 'model', status: 'status', at: 'submittedAt'},
    prepare: ({first, last, model, status, at}) => ({
      title: [first, last].filter(Boolean).join(' ') || 'Know more enquiry',
      subtitle: [
        ENQUIRY_STATUSES.find((s) => s.value === status)?.title ?? 'New',
        model,
        at ? new Date(at).toLocaleDateString() : null,
      ]
        .filter(Boolean)
        .join(' – '),
    }),
  },
})
