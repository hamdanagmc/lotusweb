import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Building blocks for a vehicle page's "Page sections" tab. Field names and
 * option values match the Eletre X content already in the dataset.
 */

const THEMES = [
  {title: 'Black', value: 'black'},
  {title: 'White', value: 'white'},
]
const VALIGN = [
  {title: 'Top', value: 'top'},
  {title: 'Middle', value: 'middle'},
  {title: 'Bottom', value: 'bottom'},
]
const DESKTOP_ASPECTS = ['16/9', '21/9', '3/2']
const MOBILE_ASPECTS = ['9/16', '3/4', '4/5', '1/1', '16/9']

const theme = defineField({
  name: 'theme',
  title: 'Background',
  type: 'string',
  options: {list: THEMES, layout: 'radio', direction: 'horizontal'},
  initialValue: 'black',
})
const spacing = defineField({name: 'spacing', title: 'Spacing', type: 'spacing'})
const buttons = defineField({
  name: 'buttons',
  title: 'Buttons',
  type: 'array',
  of: [defineArrayMember({type: 'ctaButton'})],
})
const aspect = (name: string, title: string, list: string[]) =>
  defineField({name, title, type: 'string', options: {list}})

export const ctaButton = defineType({
  name: 'ctaButton',
  title: 'Button',
  type: 'object',
  fields: [
    defineField({name: 'label', title: 'Label', type: 'localeString'}),
    defineField({
      name: 'href',
      title: 'URL or anchor',
      type: 'string',
      description: 'e.g. /test-drive?model=eletre-x, #range, https://example.com',
    }),
    defineField({name: 'external', title: 'Open in a new tab', type: 'boolean', initialValue: false}),
    defineField({
      name: 'style',
      title: 'Style',
      type: 'string',
      options: {
        list: [
          {title: 'Primary (yellow)', value: 'primary'},
          {title: 'Secondary (outline)', value: 'secondary'},
          {title: 'Tertiary (text link)', value: 'tertiary'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'primary',
    }),
    defineField({name: 'hidden', title: 'Hide', type: 'boolean', initialValue: false}),
  ],
  preview: {
    select: {title: 'label.en', href: 'href', hidden: 'hidden'},
    prepare: ({title, href, hidden}) => ({
      title: title || 'Button',
      subtitle: [hidden ? 'Hidden' : null, href].filter(Boolean).join(' · '),
    }),
  },
})

export const responsiveMedia = defineType({
  name: 'responsiveMedia',
  title: 'Media',
  type: 'object',
  fields: [
    defineField({name: 'image', title: 'Desktop image', type: 'figure'}),
    defineField({
      name: 'tabletImage',
      title: 'Tablet image',
      type: 'image',
      options: {hotspot: true},
      description: 'Optional. Falls back to the desktop image.',
    }),
    defineField({
      name: 'mobileImage',
      title: 'Mobile image',
      type: 'image',
      options: {hotspot: true},
      description: 'Optional. Falls back to the tablet, then desktop image.',
    }),
    defineField({
      name: 'video',
      title: 'Video (MP4)',
      type: 'file',
      options: {accept: 'video/mp4,video/webm'},
      description: 'Optional silent loop over the image, which stays as its poster.',
    }),
    defineField({
      name: 'mobileVideo',
      title: 'Mobile video (MP4)',
      type: 'file',
      options: {accept: 'video/mp4,video/webm'},
      description: 'Optional portrait version for phones. Falls back to the video above.',
    }),
  ],
})

export const spacingType = defineType({
  name: 'spacing',
  title: 'Spacing',
  type: 'object',
  options: {columns: 2},
  fields: ['top', 'bottom'].map((name) =>
    defineField({
      name,
      title: name === 'top' ? 'Top' : 'Bottom',
      type: 'string',
      options: {list: ['none', 'tiny', 'normal', 'large']},
      initialValue: 'normal',
    }),
  ),
})

export const heroMedia = defineType({
  name: 'heroMedia',
  title: 'Hero media',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localeText',
      description: 'Line breaks are kept.',
    }),
    defineField({
      name: 'titleAccent',
      title: 'Yellow title',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'isPageH1',
      title: 'Main page heading',
      type: 'boolean',
      description: 'Turn on for the first hero only.',
      initialValue: false,
    }),
    defineField({name: 'body', title: 'Text', type: 'localeText'}),
    defineField({name: 'media', title: 'Media', type: 'responsiveMedia'}),
    buttons,
    defineField({
      name: 'align',
      title: 'Text alignment',
      type: 'string',
      options: {list: ['left', 'center'], layout: 'radio', direction: 'horizontal'},
      initialValue: 'left',
    }),
    defineField({
      name: 'valign',
      title: 'Text position',
      type: 'string',
      options: {list: VALIGN, layout: 'radio', direction: 'horizontal'},
      initialValue: 'bottom',
    }),
    defineField({
      name: 'gradient',
      title: 'Shade behind text',
      type: 'string',
      options: {
        list: [
          {title: 'None', value: 'none'},
          {title: 'From the bottom', value: 'bottom'},
          {title: 'From the text side', value: 'start'},
        ],
      },
      initialValue: 'bottom',
    }),
    aspect('desktopAspect', 'Desktop shape', DESKTOP_ASPECTS),
    aspect('mobileAspect', 'Mobile shape', MOBILE_ASPECTS),
  ],
  preview: {
    select: {title: 'title.en', media: 'media.image'},
    prepare: ({title, media}) => ({title: title || 'Hero media', subtitle: 'Hero media', media}),
  },
})

export const introText = defineType({
  name: 'introText',
  title: 'Intro text',
  type: 'object',
  fields: [
    defineField({
      name: 'overline',
      title: 'Overline image',
      type: 'figure',
      description: 'Optional small image above the title, e.g. a logo.',
    }),
    defineField({name: 'title', title: 'Title', type: 'localeString'}),
    defineField({
      name: 'titleAccent',
      title: 'Yellow title',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({name: 'body', title: 'Text', type: 'localeText'}),
    buttons,
    defineField({
      name: 'align',
      title: 'Alignment',
      type: 'string',
      options: {list: ['left', 'center'], layout: 'radio', direction: 'horizontal'},
      initialValue: 'center',
    }),
    theme,
    spacing,
  ],
  preview: {
    select: {title: 'title.en'},
    prepare: ({title}) => ({title: title || 'Intro text', subtitle: 'Intro text'}),
  },
})

export const fullWidthVideo = defineType({
  name: 'fullWidthVideo',
  title: 'Full-width video',
  type: 'object',
  fields: [
    defineField({
      name: 'video',
      title: 'Video (MP4)',
      type: 'file',
      options: {accept: 'video/mp4,video/webm'},
    }),
    defineField({
      name: 'mobileVideo',
      title: 'Mobile video (MP4)',
      type: 'file',
      options: {accept: 'video/mp4,video/webm'},
      description: 'Optional portrait version for phones. Falls back to the video above.',
    }),
    defineField({
      name: 'controls',
      title: 'Show play controls',
      type: 'boolean',
      description: 'Off: plays as a silent loop.',
      initialValue: false,
    }),
    aspect('desktopAspect', 'Desktop shape', DESKTOP_ASPECTS),
    aspect('mobileAspect', 'Mobile shape', MOBILE_ASPECTS),
    theme,
    spacing,
  ],
  preview: {prepare: () => ({title: 'Full-width video'})},
})

export const statsBlock = defineType({
  name: 'statsBlock',
  title: 'Stats',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'localeString'}),
    defineField({name: 'body', title: 'Text', type: 'localeText'}),
    defineField({name: 'background', title: 'Background', type: 'responsiveMedia'}),
    defineField({
      name: 'gradient',
      title: 'Shade behind text',
      type: 'string',
      options: {
        list: [
          {title: 'None', value: 'none'},
          {title: 'From the bottom', value: 'bottom'},
          {title: 'From the text side', value: 'start'},
        ],
      },
      initialValue: 'start',
    }),
    defineField({
      name: 'stats',
      title: 'Stats',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'stat',
          fields: [
            defineField({
              name: 'value',
              title: 'Value',
              type: 'string',
              description: 'The number only, e.g. 952 or 1,200.',
            }),
            defineField({
              name: 'label',
              title: 'Label',
              type: 'localeText',
              description: 'Unit and meaning, e.g. "PS" then "700 kW" on the next line.',
            }),
            defineField({
              name: 'hasDisclaimer',
              title: 'Has a footnote',
              type: 'boolean',
              description: 'Adds the next footnote number, matching Disclaimers in order.',
              initialValue: false,
            }),
          ],
          preview: {select: {title: 'value', subtitle: 'label.en'}},
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'title.en', media: 'background.image'},
    prepare: ({title, media}) => ({title: title || 'Stats', subtitle: 'Stats', media}),
  },
})

export const featureCarousel = defineType({
  name: 'featureCarousel',
  title: 'Feature carousel',
  type: 'object',
  fields: [
    defineField({name: 'heading', title: 'Heading', type: 'localeString'}),
    defineField({
      name: 'items',
      title: 'Cards',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'featureItem',
          fields: [
            defineField({name: 'image', title: 'Image', type: 'figure'}),
            defineField({
              name: 'video',
              title: 'Video (MP4)',
              type: 'file',
              options: {accept: 'video/mp4,video/webm'},
              description: 'Optional. Plays instead of the image.',
            }),
            defineField({name: 'title', title: 'Title', type: 'localeString'}),
            defineField({name: 'body', title: 'Text', type: 'localeText'}),
            defineField({name: 'button', title: 'Button', type: 'ctaButton'}),
          ],
          preview: {select: {title: 'title.en', media: 'image'}},
        }),
      ],
    }),
    defineField({
      name: 'itemsPerView',
      title: 'Cards per view (desktop)',
      type: 'number',
      options: {list: [1, 2, 3], layout: 'radio', direction: 'horizontal'},
      initialValue: 3,
    }),
    defineField({name: 'showArrows', title: 'Show arrows', type: 'boolean', initialValue: true}),
    defineField({name: 'button', title: 'Button under the cards', type: 'ctaButton'}),
    theme,
    spacing,
  ],
  preview: {
    select: {title: 'heading.en', items: 'items'},
    prepare: ({title, items}) => ({
      title: title || 'Feature carousel',
      subtitle: `Feature carousel · ${items?.length ?? 0} cards`,
    }),
  },
})

export const imageText = defineType({
  name: 'imageText',
  title: 'Image and text',
  type: 'object',
  fields: [
    defineField({name: 'image', title: 'Image', type: 'figure'}),
    defineField({name: 'title', title: 'Title', type: 'localeString'}),
    defineField({name: 'titleAccent', title: 'Yellow title', type: 'boolean', initialValue: false}),
    defineField({name: 'body', title: 'Text', type: 'localeText'}),
    buttons,
    defineField({
      name: 'reverse',
      title: 'Image on the right',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'valign',
      title: 'Text position',
      type: 'string',
      options: {list: VALIGN, layout: 'radio', direction: 'horizontal'},
      initialValue: 'middle',
    }),
    theme,
    spacing,
  ],
  preview: {
    select: {title: 'title.en', media: 'image'},
    prepare: ({title, media}) => ({title: title || 'Image and text', subtitle: 'Image and text', media}),
  },
})

const percent = (name: string, title: string, description: string) =>
  defineField({
    name,
    title,
    type: 'number',
    description,
    validation: (rule) => rule.required().min(0).max(100),
  })

export const hotspotViewer = defineType({
  name: 'hotspotViewer',
  title: 'Hotspot viewer',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localeText',
      description: 'Optional, top left. Line breaks are kept.',
    }),
    defineField({name: 'titleAccent', title: 'Yellow title', type: 'boolean', initialValue: false}),
    defineField({
      name: 'isPageH1',
      title: 'Main page heading',
      type: 'boolean',
      description: 'Turn on when this opens the page.',
      initialValue: false,
    }),
    defineField({
      name: 'views',
      title: 'Views',
      type: 'array',
      description: 'One tab per view, e.g. Front, Rear, Interior.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'hotspotView',
          fields: [
            defineField({name: 'label', title: 'Tab label', type: 'localeString'}),
            defineField({
              name: 'image',
              title: 'Image',
              type: 'figure',
              description: 'Shown at its own shape, so pins stay where they are placed.',
            }),
            defineField({
              name: 'pins',
              title: 'Pins',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'hotspotPin',
                  fields: [
                    percent('x', 'Across (%)', '0 is the left edge of the image, 100 the right.'),
                    percent('y', 'Down (%)', '0 is the top edge of the image, 100 the bottom.'),
                    defineField({name: 'body', title: 'Text', type: 'localeText'}),
                  ],
                  preview: {
                    select: {title: 'body.en', x: 'x', y: 'y'},
                    prepare: ({title, x, y}) => ({title: title || 'Pin', subtitle: `${x ?? '?'}% across, ${y ?? '?'}% down`}),
                  },
                }),
              ],
            }),
          ],
          preview: {
            select: {title: 'label.en', media: 'image', pins: 'pins'},
            prepare: ({title, media, pins}) => ({
              title: title || 'View',
              subtitle: `${pins?.length ?? 0} pins`,
              media,
            }),
          },
        }),
      ],
    }),
    buttons,
  ],
  preview: {
    select: {title: 'title.en', media: 'views.0.image'},
    prepare: ({title, media}) => ({title: title || 'Hotspot viewer', subtitle: 'Hotspot viewer', media}),
  },
})
