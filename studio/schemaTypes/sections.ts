import {defineArrayMember, defineField, defineType} from 'sanity'

/** The home page sections, in page order. Each is a field on `homePage`. */

export const heroSection = defineType({
  name: 'heroSection',
  title: 'Hero',
  type: 'object',
  options: {collapsible: true, collapsed: false},
  fields: [
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'localeString'}),
    defineField({name: 'headingTop', title: 'Heading — first line', type: 'localeString'}),
    defineField({
      name: 'headingOutlined',
      title: 'Heading — second line (outlined)',
      type: 'localeString',
    }),
    defineField({name: 'image', title: 'Background image', type: 'figure'}),
    defineField({name: 'primaryCta', title: 'Primary button', type: 'link'}),
    defineField({name: 'secondaryCta', title: 'Secondary button', type: 'link'}),
    defineField({
      name: 'slides',
      title: 'Slides',
      type: 'array',
      of: [defineArrayMember({type: 'heroSlide'})],
      description: 'Once a slide is added, the slider replaces the single hero above.',
    }),
  ],
  preview: {select: {title: 'headingTop.en'}, prepare: ({title}) => ({title: title || 'Hero'})},
})

export const heroSlide = defineType({
  name: 'heroSlide',
  title: 'Slide',
  type: 'object',
  fields: [
    defineField({name: 'headingTop', title: 'Heading — first line', type: 'localeString'}),
    defineField({name: 'headingOutlined', title: 'Heading — second line', type: 'localeString'}),
    defineField({name: 'subheading', title: 'Sub-line', type: 'localeText'}),
    defineField({name: 'image', title: 'Background image', type: 'figure'}),
    defineField({name: 'primaryCta', title: 'Primary button', type: 'link'}),
    defineField({name: 'secondaryCta', title: 'Secondary button', type: 'link'}),
    defineField({
      name: 'textLink',
      title: 'Text link',
      type: 'link',
      description: 'Shown after the buttons, e.g. "View offer →".',
    }),
  ],
  preview: {
    select: {title: 'headingTop.en', subtitle: 'headingOutlined.en', media: 'image'},
    prepare: ({title, subtitle, media}) => ({title: title || 'Slide', subtitle, media}),
  },
})

export const marqueeSection = defineType({
  name: 'marqueeSection',
  title: 'Scrolling marquee',
  type: 'object',
  options: {collapsible: true, collapsed: true},
  fields: [
    defineField({name: 'enabled', title: 'Show this strip', type: 'boolean', initialValue: true}),
    defineField({
      name: 'items',
      title: 'Phrases',
      type: 'array',
      of: [defineArrayMember({type: 'localeString'})],
      description: 'Joined with bullets and looped continuously.',
    }),
    defineField({
      name: 'speedSeconds',
      title: 'Loop duration (seconds)',
      type: 'number',
      initialValue: 20,
      validation: (rule) => rule.min(5).max(120),
    }),
  ],
})

export const rangeSection = defineType({
  name: 'rangeSection',
  title: 'The Range',
  type: 'object',
  options: {collapsible: true, collapsed: true},
  fields: [
    defineField({name: 'heading', title: 'Heading', type: 'localeString'}),
    defineField({name: 'subheading', title: 'Sub-heading', type: 'localeText'}),
    defineField({name: 'viewAll', title: '"View all" link', type: 'link'}),
    defineField({
      name: 'cards',
      title: 'Model cards',
      type: 'array',
      of: [defineArrayMember({type: 'modelCard'})],
      description:
        'The homepage "Our Models" lineup, two per row. Drag to reorder; switch a card off to hide it without deleting it.',
    }),
    defineField({
      name: 'vehicles',
      title: 'Vehicles in the menu',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'vehicle'}]})],
      description:
        'The models listed in the site menu. A vehicle whose URL extends another (emira-420-sport) is listed under it. The homepage cards are set above.',
    }),
  ],
})

/** One spec on a model card: value + unit, optional secondary unit, label. */
export const modelCardSpec = defineType({
  name: 'modelCardSpec',
  title: 'Spec',
  type: 'object',
  fields: [
    defineField({
      name: 'value',
      title: 'Value',
      type: 'string',
      description: 'The number only, written as it should appear: 1,200 or 2.78. Its digits roll up on the card.',
      validation: (rule) => rule.required().warning('Empty specs are not shown on the card.'),
    }),
    defineField({name: 'unit', title: 'Unit', type: 'localeString', description: 'e.g. km, hp, sec'}),
    defineField({
      name: 'secondaryUnit',
      title: 'Secondary unit',
      type: 'localeString',
      description: 'Optional, shown small under the value, e.g. 675 kW.',
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'localeString',
      description: 'What it measures, e.g. Power, Range, 0-100 km/h.',
    }),
    defineField({
      name: 'disclaimerRef',
      title: 'Disclaimer number',
      type: 'string',
      description: 'Optional. Shown as a superscript after the value, linking to #disclaimer-<number>.',
    }),
  ],
  preview: {
    select: {value: 'value', unit: 'unit.en', label: 'label.en'},
    prepare: ({value, unit, label}) => ({
      title: value ? `${value} ${unit ?? ''}`.trim() : 'Empty — not shown',
      subtitle: label,
    }),
  },
})

/** A card in the "Our Models" lineup. Empty overrides fall back to the vehicle. */
export const modelCard = defineType({
  name: 'modelCard',
  title: 'Model card',
  type: 'object',
  fields: [
    defineField({
      name: 'vehicle',
      title: 'Vehicle',
      type: 'reference',
      to: [{type: 'vehicle'}],
      description: 'Supplies the name, photo, wordmark and Explore link when those are left empty below.',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'visible', title: 'Show this card', type: 'boolean', initialValue: true}),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'figure',
      description: "Square, e.g. 1200 × 1200, darker at the bottom so the specs read. Leave empty to use the vehicle's photo.",
    }),
    defineField({
      name: 'mobileImage',
      title: 'Mobile image',
      type: 'figure',
      description: 'Optional portrait version for phones, e.g. 961 × 1600. The image above is used when empty.',
    }),
    defineField({
      name: 'displayName',
      title: 'Name on the card',
      type: 'localeString',
      description: "Leave empty to use the vehicle's name.",
    }),
    defineField({
      name: 'powertrainLabel',
      title: 'Powertrain',
      type: 'localeString',
      description: 'Optional, e.g. Electric, Hybrid, Petrol.',
    }),
    defineField({name: 'introLine', title: 'Intro line', type: 'localeString', description: 'Optional.'}),
    defineField({
      name: 'startingPrice',
      title: 'Starting price',
      type: 'object',
      description: 'Optional. Shown only when an amount is filled in.',
      options: {collapsible: true, collapsed: true},
      fields: [
        defineField({
          name: 'prefix',
          title: 'Prefix',
          type: 'localeString',
          initialValue: {en: 'From'},
        }),
        defineField({name: 'currency', title: 'Currency', type: 'string', initialValue: 'AED'}),
        defineField({name: 'amount', title: 'Amount', type: 'number', validation: (rule) => rule.min(0)}),
      ],
    }),
    defineField({
      name: 'specs',
      title: 'Specs',
      type: 'array',
      of: [defineArrayMember({type: 'modelCardSpec'})],
      // Hidden cards are exempt, so switching one off never blocks publishing.
      validation: (rule) =>
        rule.custom((specs: unknown[] | undefined, context) =>
          (context.parent as {visible?: boolean} | undefined)?.visible === false ||
          specs?.length === 3
            ? true
            : 'Each card has exactly three specs.',
        ),
    }),
    defineField({
      name: 'cta',
      title: 'Button',
      type: 'link',
      description: "The yellow button. Leave the URL empty to link to the vehicle's page.",
      initialValue: {label: {en: 'Discover', ar: 'اكتشف'}},
    }),
  ],
  preview: {
    select: {
      displayName: 'displayName.en',
      vehicleName: 'vehicle.name.en',
      visible: 'visible',
      image: 'image',
      vehicleImage: 'vehicle.image',
    },
    prepare: ({displayName, vehicleName, visible, image, vehicleImage}) => ({
      title: displayName || vehicleName || 'Model card',
      subtitle: visible === false ? 'Hidden' : undefined,
      media: image?.asset ? image : vehicleImage,
    }),
  },
})

export const brandHighlightSection = defineType({
  name: 'brandHighlightSection',
  title: 'Model highlight',
  type: 'object',
  options: {collapsible: true, collapsed: true},
  fields: [
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'localeString'}),
    defineField({name: 'heading', title: 'Heading', type: 'localeString'}),
    defineField({name: 'body', title: 'Body copy', type: 'localeText'}),
    defineField({name: 'image', title: 'Image', type: 'figure'}),
    defineField({
      name: 'stats',
      title: 'Key figures',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'stat',
          fields: [
            defineField({
              name: 'value',
              title: 'Figure',
              type: 'string',
              description: 'e.g. 2.78 — numerals are the same in both languages.',
            }),
            defineField({name: 'unit', title: 'Unit (highlighted)', type: 'string'}),
            defineField({name: 'label', title: 'Label', type: 'localeString'}),
          ],
          preview: {
            select: {value: 'value', unit: 'unit', label: 'label.en'},
            prepare: ({value, unit, label}) => ({
              title: `${value ?? ''}${unit ?? ''}`,
              subtitle: label,
            }),
          },
        }),
      ],
    }),
    defineField({name: 'primaryCta', title: 'Primary button', type: 'link'}),
    defineField({name: 'secondaryCta', title: 'Secondary button', type: 'link'}),
  ],
})

export const storySection = defineType({
  name: 'storySection',
  title: 'Our story',
  type: 'object',
  options: {collapsible: true, collapsed: true},
  fields: [
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'localeString'}),
    defineField({name: 'heading', title: 'Heading', type: 'localeString'}),
    defineField({
      name: 'image',
      title: 'Archive image',
      type: 'figure',
      description: 'Fills the section when there is no background video.',
    }),
    defineField({
      name: 'backgroundVideo',
      title: 'Background video (MP4, 1920×1080, ≤10 MB)',
      type: 'file',
      description:
        'Silent loop of about 10 seconds, H.264 MP4. Plays muted behind the section in place of the archive image. Remove it to go back to the image.',
      options: {accept: 'video/mp4,video/webm'},
    }),
    defineField({
      name: 'backgroundVideoMobile',
      title: 'Mobile video (portrait/square, ≤5 MB)',
      type: 'file',
      description:
        'Optional square or portrait cut of the same loop, used on phones (up to 767px wide). Without it, phones get the main video.',
      options: {accept: 'video/mp4,video/webm'},
    }),
    defineField({
      name: 'videoPoster',
      title: 'Video poster',
      type: 'image',
      description:
        'A still from the video, at least 1920px wide. Shown while the video loads, to visitors who prefer reduced motion or are saving data, and if the video cannot play.',
      options: {hotspot: true},
      validation: (rule) =>
        rule.custom((poster, context) => {
          const parent = context.parent as {backgroundVideo?: {asset?: unknown}} | undefined
          const hasPoster = Boolean((poster as {asset?: unknown} | undefined)?.asset)
          return parent?.backgroundVideo?.asset && !hasPoster
            ? 'Add a poster image whenever a background video is set.'
            : true
        }),
    }),
    defineField({name: 'leadParagraph', title: 'Lead paragraph', type: 'localeText'}),
    defineField({name: 'body', title: 'Body paragraph', type: 'localeText'}),
    defineField({name: 'link', title: 'Link', type: 'link'}),
    defineField({
      name: 'quoteBefore',
      title: 'Pull quote — before highlight',
      type: 'localeString',
    }),
    defineField({
      name: 'quoteHighlight',
      title: 'Pull quote — highlighted (yellow)',
      type: 'localeString',
    }),
    defineField({name: 'quoteAfter', title: 'Pull quote — after highlight', type: 'localeString'}),
  ],
})

export const offersSection = defineType({
  name: 'offersSection',
  title: 'Exclusives / offers',
  type: 'object',
  options: {collapsible: true, collapsed: true},
  fields: [
    defineField({name: 'heading', title: 'Heading', type: 'localeString'}),
    defineField({
      name: 'offers',
      title: 'Offers',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'offer'}]})],
    }),
  ],
})

export const serviceSection = defineType({
  name: 'serviceSection',
  title: 'Service & ownership',
  type: 'object',
  options: {collapsible: true, collapsed: true},
  fields: [
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'localeString'}),
    defineField({name: 'heading', title: 'Heading', type: 'localeString'}),
    defineField({
      name: 'features',
      title: 'Feature cards',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'serviceFeature'}]})],
    }),
  ],
})

export const showroomSection = defineType({
  name: 'showroomSection',
  title: 'Find a Lotus Centre',
  type: 'object',
  options: {collapsible: true, collapsed: true},
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'localeString',
      description: 'Optional small yellow line above the heading. Leave empty for the standard design.',
    }),
    defineField({name: 'heading', title: 'Heading', type: 'localeString'}),
    defineField({name: 'description', title: 'Description', type: 'localeText'}),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'figure',
      description:
        'Landscape, at least 1920px wide. Fills the left two-thirds on desktop and the whole section on phones, with the text over it.',
    }),
    defineField({
      name: 'cta',
      title: 'Button',
      type: 'link',
      description:
        'e.g. "Find a Lotus Centre". Without it, the button opens the directions of the showroom below.',
    }),
    defineField({
      name: 'showroom',
      title: 'Showroom',
      type: 'reference',
      to: [{type: 'showroom'}],
      description:
        'Its address and opening hours are no longer shown in this section. Only its directions link is used, as the button when none is set above.',
    }),
  ],
})

export const contactCtaSection = defineType({
  name: 'contactCtaSection',
  title: 'Closing call to action',
  type: 'object',
  options: {collapsible: true, collapsed: true},
  fields: [
    defineField({name: 'heading', title: 'Heading', type: 'localeString'}),
    defineField({name: 'subheading', title: 'Sub-heading', type: 'localeText'}),
    defineField({name: 'cta', title: 'Button', type: 'link'}),
    defineField({name: 'backgroundImage', title: 'Background image', type: 'figure'}),
    defineField({
      name: 'backgroundWord',
      title: 'Oversized background word',
      type: 'string',
      description: 'Decorative outline text behind the section, e.g. LOTUS.',
    }),
  ],
})

export const stickyBarSection = defineType({
  name: 'stickyBarSection',
  title: 'Mobile sticky bar',
  type: 'object',
  options: {collapsible: true, collapsed: true},
  fields: [
    defineField({name: 'enabled', title: 'Show on mobile', type: 'boolean', initialValue: true}),
    defineField({name: 'primaryCta', title: 'Primary button', type: 'link'}),
    defineField({name: 'secondaryCta', title: 'Secondary button', type: 'link'}),
    defineField({
      name: 'whatsappHref',
      title: 'WhatsApp link',
      type: 'url',
      validation: (rule) =>
        rule.uri({scheme: ['http', 'https', 'tel', 'whatsapp'], allowRelative: false}),
    }),
  ],
})
