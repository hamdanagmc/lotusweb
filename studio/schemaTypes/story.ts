import {BookIcon} from '@sanity/icons/Book'
import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * The Lotus Story pages (/lotus-story and /lotus-story/<slug>), modelled on
 * lotuscars.com/en-AE/lotus-story. Their bodies reuse the vehicle page
 * sections, plus the card grid and timeline below.
 */

const theme = defineField({
  name: 'theme',
  title: 'Background',
  type: 'string',
  options: {
    list: [
      {title: 'Black', value: 'black'},
      {title: 'White', value: 'white'},
    ],
    layout: 'radio',
    direction: 'horizontal',
  },
  initialValue: 'black',
})
const spacing = defineField({name: 'spacing', title: 'Spacing', type: 'spacing'})

/** Rows of cards: heritage cars, design principles, materials, partners. */
export const cardGrid = defineType({
  name: 'cardGrid',
  title: 'Card grid',
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
          name: 'gridCard',
          fields: [
            defineField({name: 'image', title: 'Image', type: 'figure'}),
            defineField({
              name: 'video',
              title: 'Video (MP4)',
              type: 'file',
              options: {accept: 'video/mp4,video/webm'},
              description: 'Optional silent loop over the image.',
            }),
            defineField({name: 'title', title: 'Title', type: 'localeString'}),
            defineField({name: 'body', title: 'Text', type: 'localeText'}),
            defineField({
              name: 'button',
              title: 'Link',
              type: 'ctaButton',
              description: 'Makes the whole card a link. The label is shown on the card.',
            }),
          ],
          preview: {
            select: {title: 'title.en', label: 'button.label.en', media: 'image'},
            prepare: ({title, label, media}) => ({title: title || label || 'Card', media}),
          },
        }),
      ],
    }),
    defineField({
      name: 'columns',
      title: 'Cards per row (desktop)',
      type: 'number',
      options: {list: [2, 3, 4, 5], layout: 'radio', direction: 'horizontal'},
      initialValue: 3,
    }),
    defineField({
      name: 'aspect',
      title: 'Image shape',
      type: 'string',
      options: {list: ['3/2', '4/3', '1/1', '16/9', '2/1'], layout: 'radio', direction: 'horizontal'},
      initialValue: '3/2',
    }),
    defineField({
      name: 'align',
      title: 'Text alignment',
      type: 'string',
      options: {list: ['left', 'center'], layout: 'radio', direction: 'horizontal'},
      initialValue: 'left',
    }),
    defineField({
      name: 'fit',
      title: 'Image fit',
      type: 'string',
      description: 'Contain keeps logos and product shots whole.',
      options: {list: ['cover', 'contain'], layout: 'radio', direction: 'horizontal'},
      initialValue: 'cover',
    }),
    theme,
    spacing,
  ],
  preview: {
    select: {title: 'heading.en', items: 'items', media: 'items.0.image'},
    prepare: ({title, items, media}) => ({
      title: title || 'Card grid',
      subtitle: `Card grid · ${items?.length ?? 0} cards`,
      media,
    }),
  },
})

/** Decades with year-by-year entries. */
export const timeline = defineType({
  name: 'timeline',
  title: 'Timeline',
  type: 'object',
  fields: [
    defineField({name: 'heading', title: 'Heading', type: 'localeString'}),
    defineField({
      name: 'eras',
      title: 'Decades',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'timelineEra',
          fields: [
            defineField({name: 'label', title: 'Label', type: 'string', description: 'e.g. 1950s'}),
            defineField({
              name: 'entries',
              title: 'Entries',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'timelineEntry',
                  fields: [
                    defineField({name: 'year', title: 'Year', type: 'string'}),
                    defineField({name: 'text', title: 'Text', type: 'localeText', description: 'Line breaks are kept.'}),
                  ],
                  preview: {select: {title: 'year', subtitle: 'text.en'}},
                }),
              ],
            }),
          ],
          preview: {
            select: {title: 'label', entries: 'entries'},
            prepare: ({title, entries}) => ({title, subtitle: `${entries?.length ?? 0} entries`}),
          },
        }),
      ],
    }),
    spacing,
  ],
  preview: {
    select: {title: 'heading.en', eras: 'eras'},
    prepare: ({title, eras}) => ({title: title || 'Timeline', subtitle: `Timeline · ${eras?.length ?? 0} decades`}),
  },
})

export const storyPage = defineType({
  name: 'storyPage',
  title: 'Lotus Story page',
  type: 'document',
  icon: BookIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localeString',
      group: 'content',
      description: 'For the Studio and the browser tab; the page itself shows the sections.',
      validation: (rule) => rule.custom((v?: {en?: string}) => (v?.en ? true : 'English title is required.')),
    }),
    defineField({
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      group: 'content',
      description: '"lotus-story" is the main page (/lotus-story); any other slug is /lotus-story/<slug>.',
      options: {source: 'title.en', maxLength: 60},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      group: 'content',
      description: 'The page body, top to bottom. Drag to reorder.',
      of: [
        defineArrayMember({type: 'heroMedia'}),
        defineArrayMember({type: 'introText'}),
        defineArrayMember({type: 'imageText'}),
        defineArrayMember({type: 'fullWidthVideo'}),
        defineArrayMember({type: 'featureCarousel'}),
        defineArrayMember({type: 'cardGrid'}),
        defineArrayMember({type: 'timeline'}),
      ],
    }),
    defineField({name: 'seo', title: 'SEO & sharing', type: 'seo', group: 'seo'}),
  ],
  preview: {
    select: {title: 'title.en', slug: 'slug.current'},
    prepare: ({title, slug}) => ({
      title,
      subtitle: slug === 'lotus-story' ? '/lotus-story' : `/lotus-story/${slug ?? ''}`,
    }),
  },
})

/** The sticky menu across every Lotus Story page. */
export const storyNavigation = defineType({
  name: 'storyNavigation',
  title: 'Lotus Story menu',
  type: 'document',
  icon: BookIcon,
  fields: [
    defineField({
      name: 'links',
      title: 'Links',
      type: 'array',
      of: [defineArrayMember({type: 'link'})],
      description: 'In order. The link for the page being viewed is highlighted.',
    }),
    defineField({name: 'cta', title: 'Button', type: 'link', description: 'Optional, at the end of the menu.'}),
  ],
  preview: {prepare: () => ({title: 'Lotus Story menu'})},
})
