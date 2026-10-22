import {defineField, defineType} from 'sanity'

/** Every translatable field is an object keyed by locale: `{en, ar}`. */
export const localeString = defineType({
  name: 'localeString',
  title: 'Text (EN / AR)',
  type: 'object',
  options: {columns: 2},
  fields: [
    defineField({name: 'en', title: 'English', type: 'string'}),
    defineField({name: 'ar', title: 'العربية (Arabic)', type: 'string'}),
  ],
  preview: {
    select: {en: 'en', ar: 'ar'},
    prepare: ({en, ar}) => ({title: en || ar || '(empty)', subtitle: en ? ar : undefined}),
  },
})

export const localeText = defineType({
  name: 'localeText',
  title: 'Paragraph (EN / AR)',
  type: 'object',
  fields: [
    defineField({name: 'en', title: 'English', type: 'text', rows: 4}),
    defineField({name: 'ar', title: 'العربية (Arabic)', type: 'text', rows: 4}),
  ],
  preview: {
    select: {en: 'en', ar: 'ar'},
    prepare: ({en, ar}) => ({title: en || ar || '(empty)'}),
  },
})

/** Alt text is required only once an image has been uploaded. */
const altText = defineField({
  name: 'alt',
  title: 'Alternative text',
  type: 'localeString',
  validation: (rule) =>
    rule.custom((value: {en?: string} | undefined, context) =>
      (context.parent as {asset?: unknown} | undefined)?.asset
        ? value?.en
          ? true
          : 'English alt text is required for accessibility.'
        : true,
    ),
})

export const figure = defineType({
  name: 'figure',
  title: 'Image',
  type: 'image',
  options: {hotspot: true},
  fields: [
    {...altText, description: 'Describe the image for screen readers and search engines.'},
  ],
  preview: {
    select: {media: 'asset', title: 'alt.en'},
    prepare: ({media, title}) => ({media, title: title || 'Image'}),
  },
})

export const galleryImage = defineType({
  name: 'galleryImage',
  title: 'Gallery image',
  type: 'image',
  options: {hotspot: true},
  fields: [
    altText,
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Exterior', value: 'exterior'},
          {title: 'Interior', value: 'interior'},
          {title: 'Detail', value: 'detail'},
        ],
        layout: 'radio',
      },
      initialValue: 'exterior',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {media: 'asset', title: 'alt.en', subtitle: 'category'},
    prepare: ({media, title, subtitle}) => ({media, title: title || 'Gallery image', subtitle}),
  },
})

export const link = defineType({
  name: 'link',
  title: 'Link',
  type: 'object',
  fields: [
    defineField({name: 'label', title: 'Label', type: 'localeString'}),
    defineField({
      name: 'href',
      title: 'URL or anchor',
      type: 'string',
      description: 'e.g. #range, /ar, https://example.com, tel:+97141234567',
    }),
    defineField({name: 'external', title: 'Open in a new tab', type: 'boolean', initialValue: false}),
  ],
  preview: {select: {title: 'label.en', subtitle: 'href'}},
})

export const seo = defineType({
  name: 'seo',
  title: 'SEO & sharing',
  type: 'object',
  options: {collapsible: true, collapsed: true},
  fields: [
    defineField({name: 'title', title: 'Meta title', type: 'localeString'}),
    defineField({name: 'description', title: 'Meta description', type: 'localeText'}),
    defineField({
      name: 'keywords',
      title: 'Keywords',
      type: 'localeString',
      description: 'Comma-separated.',
    }),
    defineField({
      name: 'ogImage',
      title: 'Social share image',
      type: 'figure',
      description: 'Recommended 1200 × 630.',
    }),
  ],
})
