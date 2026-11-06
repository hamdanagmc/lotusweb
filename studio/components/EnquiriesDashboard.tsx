import {DownloadIcon} from '@sanity/icons/Download'
import {RefreshIcon} from '@sanity/icons/Refresh'
import {SearchIcon} from '@sanity/icons/Search'
import {
  Badge,
  type BadgeTone,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Grid,
  Heading,
  Select,
  Spinner,
  Stack,
  Tab,
  TabList,
  Text,
  TextInput,
} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {type CSSProperties, useCallback, useEffect, useMemo, useState} from 'react'
import {useClient} from 'sanity'
import {IntentLink} from 'sanity/router'
import {
  applyFilters,
  computeStats,
  contactLabel,
  dashboardCsv,
  DEFAULT_FILTERS,
  downloadCsv,
  ENQUIRIES_QUERY,
  ENQUIRY_STATUSES,
  ENQUIRY_TYPE_NAMES,
  ENQUIRY_TYPES,
  type EnquiryRow,
  type EnquiryType,
  type Filters,
  formatDubai,
  modelName,
  modelOptions,
  ofType,
  statusLabel,
  whatsAppUrl,
} from '../enquiries'

const TONES: Record<EnquiryType, BadgeTone> = {
  testDriveEnquiry: 'primary',
  interestEnquiry: 'positive',
  offerEnquiry: 'caution',
}

/** What the details column holds on each tab. */
const DETAILS_HEADING: Record<Filters['type'], string> = {
  all: 'Details',
  testDriveEnquiry: 'Showroom',
  interestEnquiry: 'Wants to know about',
  offerEnquiry: 'Offer',
}

const TABS: {id: Filters['type']; title: string}[] = [
  {id: 'all', title: 'All'},
  {id: 'testDriveEnquiry', title: 'Test drive'},
  {id: 'interestEnquiry', title: 'Know more'},
  {id: 'offerEnquiry', title: 'Offers'},
]

const cell: CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid var(--card-border-color)',
  verticalAlign: 'top',
}
const heading: CSSProperties = {
  ...cell,
  textAlign: 'left',
  color: 'var(--card-muted-fg-color)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
}
const noWrap: CSSProperties = {...cell, whiteSpace: 'nowrap'}
const muted: CSSProperties = {marginTop: 4, color: 'var(--card-muted-fg-color)', fontSize: 12}

function Stat({label, value, hint}: {label: string; value: number; hint?: string}) {
  return (
    <Card padding={3} radius={2} border>
      <Stack gap={2}>
        <Text size={1} muted>
          {label}
        </Text>
        <Heading size={3}>{value}</Heading>
        {hint ? (
          <Text size={0} muted>
            {hint}
          </Text>
        ) : null}
      </Stack>
    </Card>
  )
}

/**
 * The Enquiries tab in the Studio's top bar: test drive, know more and offer
 * enquiries in one live table, with counts, filters, status and export.
 */
export default function EnquiriesDashboard() {
  const client = useClient({apiVersion: '2024-10-01'})
  const toast = useToast()
  const [rows, setRows] = useState<EnquiryRow[] | null>(null)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setRows(await client.fetch<EnquiryRow[]>(ENQUIRIES_QUERY))
      setUpdatedAt(new Date())
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [client])

  // A new enquiry or a colleague's status change shows up without a refresh.
  useEffect(() => {
    void load()
    const subscription = client
      .listen(
        '*[_type in $types]',
        {types: ENQUIRY_TYPE_NAMES},
        {visibility: 'query', events: ['mutation'], includeResult: false},
      )
      .subscribe({next: () => void load(), error: () => undefined})
    return () => subscription.unsubscribe()
  }, [client, load])

  const all = useMemo(() => rows ?? [], [rows])
  const current = useMemo(() => ofType(all, filters.type), [all, filters.type])
  const stats = useMemo(() => computeStats(current), [current])
  const models = useMemo(() => modelOptions(current), [current])
  const visible = useMemo(() => applyFilters(all, filters), [all, filters])

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((f) => ({...f, [key]: value}))

  // A tab may not have the chosen car, so the model filter starts over on each one.
  const chooseTab = (type: Filters['type']) => setFilters((f) => ({...f, type, model: ''}))

  async function changeStatus(row: EnquiryRow, status: string) {
    setSavingId(row._id)
    try {
      await client.patch(row._id).set({status}).commit()
      setRows((list) => (list ?? []).map((r) => (r._id === row._id ? {...r, status} : r)))
      toast.push({status: 'success', title: `${row.name || 'Enquiry'} marked ${statusLabel(status)}`})
    } catch (err) {
      toast.push({
        status: 'error',
        title: 'The status was not saved',
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setSavingId(null)
    }
  }

  const clearable = filters.search !== '' || filters.status !== '' || filters.model !== ''
  // The test drive form never asks, so that column would always be empty on its tab.
  const asksContactMethod = filters.type !== 'testDriveEnquiry'

  return (
    <Card height="fill" overflow="auto">
      <Container width={5} padding={4} style={{maxWidth: 1400}}>
        <Stack gap={5}>
          <Flex align="center" justify="space-between" wrap="wrap" gap={3}>
            <Stack gap={2}>
              <Heading size={3}>Enquiries</Heading>
              <Text size={1} muted>
                {updatedAt
                  ? `Updated ${updatedAt.toLocaleTimeString('en-GB', {timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit'})}, Dubai time`
                  : 'Loading…'}
              </Text>
            </Stack>
            <Flex gap={2}>
              <Button icon={RefreshIcon} text="Refresh" mode="ghost" onClick={() => void load()} />
              <Button
                icon={DownloadIcon}
                text={`Export CSV (${visible.length})`}
                tone="primary"
                disabled={visible.length === 0}
                onClick={() => downloadCsv(dashboardCsv(visible), 'lotus-enquiries')}
              />
            </Flex>
          </Flex>

          <TabList gap={1}>
            {TABS.map((tab) => (
              <Tab
                key={tab.id}
                id={`enquiries-tab-${tab.id}`}
                aria-controls="enquiries-panel"
                label={`${tab.title} (${ofType(all, tab.id).length})`}
                selected={filters.type === tab.id}
                onClick={() => chooseTab(tab.id)}
              />
            ))}
          </TabList>

          <Stack gap={5} id="enquiries-panel">
            <Grid gridTemplateColumns={[2, 3, 5]} gap={3}>
              <Stat label="Total" value={stats.total} />
              <Stat label="New" value={stats.new} hint="not yet contacted" />
              <Stat label="Contacted" value={stats.contacted} />
              <Stat label="Closed" value={stats.closed} />
              <Stat label="Last 7 days" value={stats.lastWeek} />
            </Grid>

            <Card padding={3} radius={2} border>
              <Grid gridTemplateColumns={[1, 2, 4]} gap={3}>
                <TextInput
                  icon={SearchIcon}
                  aria-label="Search enquiries"
                  placeholder="Search name, email, phone, message…"
                  value={filters.search}
                  onChange={(e) => setFilter('search', e.currentTarget.value)}
                />
                <Select
                  aria-label="Filter by status"
                  value={filters.status}
                  onChange={(e) => setFilter('status', e.currentTarget.value)}
                >
                  <option value="">All statuses</option>
                  {ENQUIRY_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.title}
                    </option>
                  ))}
                </Select>
                <Select
                  aria-label="Filter by model"
                  value={filters.model}
                  onChange={(e) => setFilter('model', e.currentTarget.value)}
                >
                  <option value="">All models</option>
                  {models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
                <Select
                  aria-label="Sort"
                  value={filters.sort}
                  onChange={(e) => setFilter('sort', e.currentTarget.value as Filters['sort'])}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </Select>
              </Grid>
            </Card>

            {error ? (
              <Card padding={4} radius={2} tone="critical" border>
                <Text size={1}>Could not load enquiries: {error}</Text>
              </Card>
            ) : !rows ? (
              <Flex justify="center" padding={5}>
                <Spinner muted />
              </Flex>
            ) : visible.length === 0 ? (
              <Card padding={5} radius={2} border>
                <Stack gap={4}>
                  <Text align="center" muted>
                    {current.length === 0
                      ? 'No enquiries here yet. They appear as soon as someone sends the form.'
                      : 'No enquiries match these filters.'}
                  </Text>
                  {clearable ? (
                    <Flex justify="center">
                      <Button
                        text="Clear filters"
                        mode="ghost"
                        onClick={() => setFilters((f) => ({...DEFAULT_FILTERS, type: f.type, sort: f.sort}))}
                      />
                    </Flex>
                  ) : null}
                </Stack>
              </Card>
            ) : (
              <Stack gap={3}>
                <Text size={1} muted>
                  Showing {visible.length} of {current.length}
                </Text>
                <Card radius={2} border overflow="auto">
                  <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 13, color: 'var(--card-fg-color)'}}>
                    <thead>
                      <tr>
                        {[
                          'Received',
                          ...(filters.type === 'all' ? ['Type'] : []),
                          'Name',
                          'Email',
                          'Phone',
                          'Model',
                          DETAILS_HEADING[filters.type],
                          ...(asksContactMethod ? ['Contact by'] : []),
                          'Status',
                          '',
                        ].map((title) => (
                          <th key={title || 'open'} scope="col" style={heading}>
                            {title}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((r) => (
                        <tr key={r._id}>
                          <td style={noWrap}>{formatDubai(r.submittedAt) || '—'}</td>
                          {filters.type === 'all' ? (
                            <td style={noWrap}>
                              <Badge tone={TONES[r._type]} fontSize={0}>
                                {ENQUIRY_TYPES[r._type]}
                              </Badge>
                            </td>
                          ) : null}
                          <td style={{...cell, fontWeight: 600}}>{r.name || '—'}</td>
                          <td style={cell}>{r.email ? <a href={`mailto:${r.email}`}>{r.email}</a> : '—'}</td>
                          <td style={noWrap}>{r.phone ? <a href={`tel:${r.phone.replace(/\s/g, '')}`}>{r.phone}</a> : '—'}</td>
                          <td style={noWrap}>{modelName(r.model) || '—'}</td>
                          <td style={{...cell, minWidth: 180, maxWidth: 320}}>
                            {r.details || '—'}
                            {r.preferredDate ? <div style={muted}>Preferred date: {r.preferredDate}</div> : null}
                            {r.message ? <div style={muted}>{r.message}</div> : null}
                          </td>
                          {asksContactMethod ? (
                            <td style={noWrap}>
                              {r.contactMethod === 'whatsapp' && whatsAppUrl(r.phone) ? (
                                <a href={whatsAppUrl(r.phone)} target="_blank" rel="noreferrer">
                                  {contactLabel(r.contactMethod)}
                                </a>
                              ) : (
                                contactLabel(r.contactMethod) || '—'
                              )}
                            </td>
                          ) : null}
                          <td style={{...cell, minWidth: 130}}>
                            <Select
                              aria-label={`Status for ${r.name || 'this enquiry'}`}
                              fontSize={1}
                              padding={2}
                              value={r.status}
                              disabled={savingId === r._id}
                              onChange={(e) => void changeStatus(r, e.currentTarget.value)}
                            >
                              {ENQUIRY_STATUSES.map((s) => (
                                <option key={s.value} value={s.value}>
                                  {s.title}
                                </option>
                              ))}
                            </Select>
                          </td>
                          <td style={noWrap}>
                            <IntentLink intent="edit" params={{id: r._id, type: r._type}}>
                              Open
                            </IntentLink>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </Stack>
            )}

            <Box>
              <Text size={0} muted>
                This page contains personal data. Share exports only with the sales team.
              </Text>
            </Box>
          </Stack>
        </Stack>
      </Container>
    </Card>
  )
}
