import {CalendarIcon} from '@sanity/icons/Calendar'
import {CogIcon} from '@sanity/icons/Cog'
import {DocumentIcon} from '@sanity/icons/Document'
import {EnvelopeIcon} from '@sanity/icons/Envelope'
import {HomeIcon} from '@sanity/icons/Home'
import {MenuIcon} from '@sanity/icons/Menu'
import {BookIcon} from '@sanity/icons/Book'
import {PinIcon} from '@sanity/icons/Pin'
import {TagIcon} from '@sanity/icons/Tag'
import {ThLargeIcon} from '@sanity/icons/ThLarge'
import {WrenchIcon} from '@sanity/icons/Wrench'
import type {StructureResolver} from 'sanity/structure'
import {OfferEnquiriesTable, TestDriveEnquiriesTable} from './components/EnquiriesTable'
import {ENQUIRY_STATUSES} from './schemaTypes/offers'

/** Sidebar layout. Singletons open straight into their one document. */
export const structure: StructureResolver = (S) => {
  const singleton = (type: string, title: string, icon: typeof HomeIcon) =>
    S.listItem().title(title).icon(icon).child(S.document().schemaType(type).documentId(type))

  const list = (type: string, title: string, icon: typeof HomeIcon) =>
    S.listItem().title(title).icon(icon).child(S.documentTypeList(type).title(title))

  const newest = [{field: 'submittedAt', direction: 'desc' as const}]

  return S.list()
    .title('Lotus UAE')
    .items([
      singleton('homePage', 'Home page', HomeIcon),
      S.divider(),
      list('vehicle', 'Vehicles', DocumentIcon),
      list('offer', 'Offers', TagIcon),
      singleton('offersPage', 'Offers page', TagIcon),
      S.listItem()
        .title('Offer enquiries')
        .icon(EnvelopeIcon)
        .child(
          S.list()
            .title('Offer enquiries')
            .items([
              S.listItem()
                .title('All')
                .child(S.documentTypeList('offerEnquiry').title('All').defaultOrdering(newest)),
              ...ENQUIRY_STATUSES.map(({title, value}) =>
                S.listItem()
                  .id(value)
                  .title(title)
                  .child(
                    S.documentTypeList('offerEnquiry')
                      .title(title)
                      .filter('_type == "offerEnquiry" && status == $status')
                      .params({status: value})
                      .defaultOrdering(newest),
                  ),
              ),
              S.listItem()
                .title('By offer')
                .child(
                  S.documentTypeList('offer')
                    .title('By offer')
                    .child((offerId) =>
                      S.documentTypeList('offerEnquiry')
                        .title('Enquiries')
                        .filter('_type == "offerEnquiry" && offer._ref == $offerId')
                        .params({offerId})
                        .defaultOrdering(newest),
                    ),
                ),
              S.divider(),
              S.listItem()
                .title('Table and CSV export')
                .child(S.component(OfferEnquiriesTable).title('Offer enquiries')),
            ]),
        ),
      list('serviceFeature', 'Service features', WrenchIcon),
      list('showroom', 'Showrooms', PinIcon),
      S.listItem()
        .title('Lotus Story')
        .icon(BookIcon)
        .child(
          S.list()
            .title('Lotus Story')
            .items([
              S.listItem()
                .title('Pages')
                .icon(BookIcon)
                .child(S.documentTypeList('storyPage').title('Lotus Story pages')),
              singleton('storyNavigation', 'Menu', BookIcon),
            ]),
        ),
      singleton('ourNetworkPage', 'Our network page', PinIcon),
      singleton('testDrivePage', 'Test drive page', CalendarIcon),
      S.listItem()
        .title('Test drive enquiries')
        .icon(EnvelopeIcon)
        .child(
          S.documentTypeList('testDriveEnquiry')
            .title('Test drive enquiries')
            .defaultOrdering([{field: 'submittedAt', direction: 'desc'}])
            .child((id) => S.document().documentId(id).schemaType('testDriveEnquiry')),
        ),
      S.listItem()
        .title('Enquiries table')
        .icon(EnvelopeIcon)
        .child(S.component(TestDriveEnquiriesTable).title('Test drive enquiries')),
      S.divider(),
      singleton('navigation', 'Navigation', MenuIcon),
      singleton('footer', 'Footer', ThLargeIcon),
      singleton('siteSettings', 'Site settings', CogIcon),
    ])
}
