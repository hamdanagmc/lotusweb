import {at, defineMigration, setIfMissing} from 'sanity/migrate'

/**
 * Seeds the homepage "Our Models" cards (homePage.rangeSection.cards).
 *
 *   npx sanity migrations run model-lineup                            dry run
 *   npx sanity migrations run model-lineup --no-dry-run --no-confirm  write
 *
 * setIfMissing: once the cards exist, re-running changes nothing, so editors'
 * changes are never overwritten. Arabic is filled only where the CMS already
 * had a translation (names, Power, hp, sec, Explore); the rest is left empty
 * for translators. Prices and disclaimer numbers are left for the business team.
 */

const ls = (en: string, ar?: string) => ({_type: 'localeString', en, ...(ar ? {ar} : {})})

const HP = ls('hp', 'حصان')
const SEC = ls('sec', 'ث')
const POWER = ls('Power', 'القوة')
const ZERO_TO_100 = ls('0-100 km/h')

const spec = (
  _key: string,
  value: string,
  unit: ReturnType<typeof ls> | undefined,
  label: ReturnType<typeof ls>,
  secondaryUnit?: ReturnType<typeof ls>,
) => ({
  _key,
  _type: 'modelCardSpec',
  value,
  ...(unit ? {unit} : {}),
  ...(secondaryUnit ? {secondaryUnit} : {}),
  label,
  disclaimerRef: '',
})

const vehicle = (id: string) => ({_type: 'reference', _ref: id})
// No URL: the button links to the vehicle's page.
const cta = {_type: 'link', label: ls('Explore', 'اكتشف')}

const CARDS = [
  {
    _key: 'emeya',
    _type: 'modelCard',
    vehicle: vehicle('vehicle-emeya'),
    visible: true,
    powertrainLabel: ls('Electric'),
    // Emeya 900 (flagship) figures.
    specs: [
      spec('charge', '15', ls('min'), ls('Charges to 80%')),
      spec('power', '918', HP, POWER, ls('675 kW')),
      spec('accel', '2.78', SEC, ZERO_TO_100),
    ],
    cta,
  },
  {
    _key: 'eletre-x',
    _type: 'modelCard',
    // TODO: there is no Eletre X vehicle page yet, so this card uses the
    // Eletre document (photo and Explore link) until one exists.
    vehicle: vehicle('vehicle-eletre'),
    visible: true,
    displayName: ls('Eletre X'),
    powertrainLabel: ls('Hybrid'),
    specs: [
      spec('range', '1,200', ls('km'), ls('Range')),
      // Unit per the Figma card (952 HP); no translated Eletre X copy exists.
      spec('power', '952', HP, POWER),
      spec('accel', '3.3', SEC, ZERO_TO_100),
    ],
    cta,
  },
  {
    _key: 'emira',
    _type: 'modelCard',
    vehicle: vehicle('vehicle-emira'),
    visible: true,
    powertrainLabel: ls('Petrol'),
    // Emira 420 figures; the separate 420 Sport card is hidden below.
    specs: [
      spec('power', '416', HP, POWER, ls('310 kW')),
      spec('accel', '3.9', SEC, ZERO_TO_100),
      spec('top-speed', '300', ls('km/h'), ls('Top speed')),
    ],
    cta,
  },
  {
    _key: 'eletre',
    _type: 'modelCard',
    vehicle: vehicle('vehicle-eletre'),
    visible: true,
    powertrainLabel: ls('Electric'),
    specs: [
      spec('power', '905', HP, POWER),
      spec('accel', '2.95', SEC, ZERO_TO_100),
      // TODO: empty values are not shown on the site.
      spec('todo', '', undefined, ls('TODO: third spec to be confirmed by the business team')),
    ],
    cta,
  },
  {
    _key: 'emira-420-sport',
    _type: 'modelCard',
    vehicle: vehicle('vehicle-emira-420-sport'),
    visible: false,
  },
]

export default defineMigration({
  title: 'Seed the homepage "Our Models" cards',
  documentTypes: ['homePage'],
  migrate: {
    document() {
      return at('rangeSection.cards', setIfMissing(CARDS))
    },
  },
})
