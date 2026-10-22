import {Box, Button, Card, Flex, Select, Spinner, Stack, Text, TextInput} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {useClient} from 'sanity'

type Row = {_id: string} & Record<string, string | boolean | null | undefined>

interface Column {
  key: string
  label: string
  width?: string
  date?: boolean
}

interface TableConfig {
  /** Document type, for the live listener. */
  type: string
  /** Rows, newest first. Project every column key as a flat value. */
  query: string
  /** Shown in the table and the text filter. */
  columns: Column[]
  /** Exported to CSV after the columns, not shown in the table. */
  extraCsvColumns?: Column[]
  /** Dropdown filters; options are the distinct values in the rows. */
  filters?: {key: string; label: string}[]
  filename: string
  emptyText: string
}

function formatDate(value: unknown) {
  if (!value) return '—'
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
}

/**
 * Spreadsheets run a cell that starts with = + - @ as a formula, so a
 * visitor could plant one in a form field. Quote those, except phone numbers.
 */
function csvCell(value: unknown) {
  let text = value == null ? '' : String(value)
  if (/^[=+\-@\t\r]/.test(text) && !/^\+\d+$/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

function toCsv(rows: Row[], columns: Column[]) {
  const lines = rows.map((r) => columns.map((c) => csvCell(r[c.key])).join(','))
  return [columns.map((c) => csvCell(c.label)).join(','), ...lines].join('\n')
}

/** Live table of enquiries with filters and CSV export. */
function EnquiriesTable({
  type,
  query,
  columns,
  extraCsvColumns = [],
  filters = [],
  filename,
  emptyText,
}: TableConfig) {
  const client = useClient({apiVersion: '2024-10-01'})
  const [rows, setRows] = useState<Row[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [selected, setSelected] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    try {
      setRows(await client.fetch<Row[]>(query))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [client, query])

  useEffect(() => {
    void load()
    const sub = client
      .listen('*[_type == $type]', {type}, {visibility: 'query', events: ['mutation']})
      .subscribe({next: () => void load(), error: () => undefined})
    return () => sub.unsubscribe()
  }, [client, load, type])

  const options = useMemo(
    () =>
      Object.fromEntries(
        filters.map((f) => [
          f.key,
          [...new Set((rows ?? []).map((r) => r[f.key]).filter(Boolean).map(String))].sort(),
        ]),
      ),
    [filters, rows],
  )

  const visible = useMemo(() => {
    const q = text.trim().toLowerCase()
    return (rows ?? []).filter(
      (r) =>
        filters.every((f) => !selected[f.key] || String(r[f.key] ?? '') === selected[f.key]) &&
        (!q || columns.some((c) => String(r[c.key] ?? '').toLowerCase().includes(q))),
    )
  }, [rows, text, selected, filters, columns])

  const exportCsv = () => {
    const csv = toCsv(visible, [...columns, ...extraCsvColumns])
    const url = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8;'}))
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (error) {
    return (
      <Card padding={4} tone="critical">
        <Text size={1}>Could not load enquiries: {error}</Text>
      </Card>
    )
  }

  if (!rows) {
    return (
      <Flex align="center" justify="center" padding={5}>
        <Spinner muted />
      </Flex>
    )
  }

  const cellStyle = {padding: '10px 12px', borderBottom: '1px solid var(--card-border-color)'}

  return (
    <Stack gap={4} padding={4}>
      <Flex align="center" gap={3} wrap="wrap">
        <Box flex={1} style={{minWidth: 220}}>
          <TextInput
            placeholder="Search"
            aria-label="Search enquiries"
            value={text}
            onChange={(e) => setText(e.currentTarget.value)}
          />
        </Box>
        {filters.map((f) => (
          <Box key={f.key} style={{minWidth: 160}}>
            <Select
              aria-label={f.label}
              value={selected[f.key] ?? ''}
              onChange={(e) => {
                const value = e.currentTarget.value
                setSelected((s) => ({...s, [f.key]: value}))
              }}
            >
              <option value="">All {f.label.toLowerCase()}</option>
              {options[f.key].map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>
          </Box>
        ))}
        <Text size={1} muted>
          {visible.length} of {rows.length}
        </Text>
        <Button
          text="Export CSV"
          tone="primary"
          mode="ghost"
          disabled={visible.length === 0}
          onClick={exportCsv}
        />
      </Flex>

      {visible.length === 0 ? (
        <Card padding={4} radius={2} tone="transparent" border>
          <Text size={1} muted>
            {rows.length === 0 ? emptyText : 'No enquiries match these filters.'}
          </Text>
        </Card>
      ) : (
        <Card radius={2} border overflow="auto">
          <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 13}}>
            <thead>
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    style={{
                      ...cellStyle,
                      textAlign: 'left',
                      minWidth: c.width,
                      position: 'sticky',
                      top: 0,
                      background: 'var(--card-bg-color)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Text size={1} weight="semibold" muted>
                      {c.label}
                    </Text>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r._id}>
                  {columns.map((c) => (
                    <td key={c.key} style={{...cellStyle, verticalAlign: 'top'}}>
                      <Text size={1}>
                        {c.date ? formatDate(r[c.key]) : String(r[c.key] ?? '') || '—'}
                      </Text>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </Stack>
  )
}

export function TestDriveEnquiriesTable() {
  return (
    <EnquiriesTable
      type="testDriveEnquiry"
      query={`*[_type == "testDriveEnquiry"] | order(submittedAt desc){
        _id, fullName, email, phone, model, location, preferredDate, message, locale, submittedAt
      }`}
      columns={[
        {key: 'submittedAt', label: 'Received', width: '150px', date: true},
        {key: 'fullName', label: 'Name', width: '160px'},
        {key: 'email', label: 'Email', width: '210px'},
        {key: 'phone', label: 'Phone', width: '140px'},
        {key: 'model', label: 'Model', width: '150px'},
        {key: 'location', label: 'Location', width: '150px'},
        {key: 'preferredDate', label: 'Preferred date', width: '130px'},
      ]}
      extraCsvColumns={[
        {key: 'message', label: 'Message'},
        {key: 'locale', label: 'Language'},
      ]}
      filename="test-drive-enquiries"
      emptyText="No enquiries yet. Submissions from the website appear here automatically."
    />
  )
}

export function OfferEnquiriesTable() {
  return (
    <EnquiriesTable
      type="offerEnquiry"
      query={`*[_type == "offerEnquiry"] | order(submittedAt desc){
        _id, submittedAt, fullName, email, phone, model, locale,
        "offer": coalesce(offer->title.en, offerTitle),
        "status": select(status == "contacted" => "Contacted", status == "closed" => "Closed", "New"),
        "contactMethod": select(contactMethod == "phone" => "Phone call", contactMethod == "email" => "Email", contactMethod == "whatsapp" => "WhatsApp", contactMethod),
        "utmSource": source.utmSource, "utmMedium": source.utmMedium, "utmCampaign": source.utmCampaign,
        "utmTerm": source.utmTerm, "utmContent": source.utmContent, "page": source.page, "referrer": source.referrer
      }`}
      columns={[
        {key: 'submittedAt', label: 'Received', width: '150px', date: true},
        {key: 'offer', label: 'Offer', width: '160px'},
        {key: 'status', label: 'Status', width: '100px'},
        {key: 'fullName', label: 'Name', width: '160px'},
        {key: 'email', label: 'Email', width: '210px'},
        {key: 'phone', label: 'Phone', width: '140px'},
        {key: 'model', label: 'Model', width: '130px'},
        {key: 'contactMethod', label: 'Contact by', width: '110px'},
        {key: 'utmSource', label: 'utm_source', width: '110px'},
      ]}
      extraCsvColumns={[
        {key: 'utmMedium', label: 'utm_medium'},
        {key: 'utmCampaign', label: 'utm_campaign'},
        {key: 'utmTerm', label: 'utm_term'},
        {key: 'utmContent', label: 'utm_content'},
        {key: 'page', label: 'Page'},
        {key: 'referrer', label: 'Referrer'},
        {key: 'locale', label: 'Language'},
      ]}
      filters={[
        {key: 'offer', label: 'Offers'},
        {key: 'status', label: 'Statuses'},
      ]}
      filename="offer-enquiries"
      emptyText="No offer enquiries yet. Submissions from offer pages appear here automatically."
    />
  )
}
