import React, { useEffect, useMemo, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { addMonths, format, startOfMonth } from 'date-fns'
import api, { get, post } from '@/api/api'
import { toast } from 'sonner'

type CalendarDay = {
  dateISO: string
  year: number
  month: number
  day: number
  weekday: number
  malayalam_year?: number | string | null
  naal?: string | null
  metadata: Record<string, unknown>
  updated_at: string
  updated_by?: string | null
  created_at: string
  version: number
}

type MonthResponse = {
  days: CalendarDay[]
  lastModified: string
}

// Available Naals list (Malayalam with transliteration)
const NAALS = ['അശ്വതി (Ashwathi)','ഭരണി (Bharani)','കാർത്തിക (Karthika)','രോഹിണി (Rohini)','മകയിരം (Makayiram)','തിരുവാതിര (Thiruvathira)','പുണർതം (Punartham)','പൂയം (Pooyam)','ആയില്യം (Aayilyam)','മകം (Makam)','പൂരം (Pooram)','ഉത്രം (Uthram)','അത്തം (Atham)','ചിത്തിര (Chithira)','ചോതി (Chothi)','വിശാഖം (Vishakham)','അനിഴം (Anizham)','തൃക്കേട്ട (Thrikketta)','മൂലം (Moolam)','പൂരാടം (Pooradam)','ഉത്രാടം (Uthradam)','തിരുവോണം (Thiruvonam)','അവിട്ടം (Avittam)','ചതയം (Chathayam)','പൂരുരുട്ടാതി (Pooruruttathi)','ഉത്തൃട്ടാതി (Uthruttathi)','രേവതി (Revathi)']

function useMonthData(year: number, month: number) {
  const [data, setData] = useState<MonthResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    get<MonthResponse>(`/v1/calendar/${year}/${month}`)
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((e) => {
        if (!cancelled) setError(e?.response?.data?.detail || e.message)
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [year, month])

  return { data, loading, error, refetch: () => get<MonthResponse>(`/v1/calendar/${year}/${month}`).then(setData) }
}

export default function CalendarManagement() {
  const today = useMemo(() => new Date(), [])
  const [displayMonth, setDisplayMonth] = useState(startOfMonth(today))
  const year = displayMonth.getFullYear()
  const month = displayMonth.getMonth() + 1
  const { data, loading, error, refetch } = useMonthData(year, month)
  const map = useMemo(() => new Map((data?.days || []).map((d) => [d.dateISO, d])), [data])

  const [rangeStart, setRangeStart] = useState<Date | undefined>(undefined)
  const [rangeEnd, setRangeEnd] = useState<Date | undefined>(undefined)
  const [malYear, setMalYear] = useState<string>('')

  const [editing, setEditing] = useState<CalendarDay | null>(null)
  const [naal, setNaal] = useState<string>('')

  const onSelectDay = (d?: Date) => {
    if (!d) return
    // Use local date formatting to avoid timezone shifting which caused previous-day selection
    const key = format(d, 'yyyy-MM-dd')
    const day = map.get(key)
    if (day) {
      setEditing(day)
      setNaal(day.naal || '')
    } else {
      // Not prepopulated yet, create/edit
      setEditing({
        dateISO: key,
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        day: d.getDate(),
        weekday: d.getDay(),
        malayalam_year: null,
        naal: '',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: null,
        version: 0,
      })
      setNaal('')
    }
  }

  const applyRange = async () => {
    if (!rangeStart || !rangeEnd || !malYear.trim()) {
      toast.error('Select start, end and Malayalam year')
      return
    }
    const start = rangeStart.toISOString().slice(0, 10)
    const end = rangeEnd.toISOString().slice(0, 10)
    try {
      // dry run
      const preview = await post<{ matched: number; dryRun: boolean }, unknown>(
        '/v1/calendar/range/malayalam-year',
        { start_date: start, end_date: end, malayalam_year: malYear, dryRun: true }
      )
      if (!confirm(`This will set Malayalam Year=${malYear} for ${preview.matched} days. Proceed?`)) return
      const res = await post<{ matched: number; dryRun: boolean }, unknown>(
        '/v1/calendar/range/malayalam-year',
        { start_date: start, end_date: end, malayalam_year: malYear, dryRun: false }
      )
      toast.success(`Updated ${res.matched} days`)
      // Refresh current month data to reflect changes
      refetch()
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || e.message)
    }
  }

  const saveNaal = async () => {
    if (!editing) return
    try {
      await post('/v1/calendar/day/naal', { date: editing.dateISO, naal, version: editing.version })
      toast.success('Saved')
      setEditing(null)
      // Refresh to get updated version and values
      refetch()
    } catch (e: any) {
      if (e?.response?.status === 409) toast.error('Version conflict, please refresh the month')
      else toast.error(e?.response?.data?.detail || e.message)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Calendar Management</h1>
        <div className="space-x-2">
          <button className="px-2 py-1 border rounded" onClick={() => setDisplayMonth(addMonths(displayMonth, -1))}>
            Prev
          </button>
          <span className="min-w-[180px] inline-block text-center">{format(displayMonth, 'MMMM yyyy')}</span>
          <button className="px-2 py-1 border rounded" onClick={() => setDisplayMonth(addMonths(displayMonth, 1))}>
            Next
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <DayPicker
            mode="single"
            month={displayMonth}
            onMonthChange={setDisplayMonth}
            onSelect={onSelectDay}
            fromYear={2000}
            toYear={2100}
            showOutsideDays
            className="w-full"
            styles={{
              caption: { fontSize: '1.25rem' },
              day: { width: 100, height: 120, padding: 4 },
              head_cell: { fontSize: '1.05rem', padding: '0.8rem' },
              table: { fontSize: '1.15rem', width: '100%' },
            }}
            components={{
              DayContent: (props) => {
                const key = format(props.date, 'yyyy-MM-dd')
                const d = map.get(key)
                const dayNum = props.date.getDate()
                const naalText = d?.naal ? String(d.naal) : ''
                const myText = d?.malayalam_year != null && d?.malayalam_year !== '' ? String(d.malayalam_year) : ''
                return (
                  <div className="flex flex-col items-start w-full h-full px-2 py-2">
                    <div className="text-base md:text-lg font-semibold leading-none">{dayNum}</div>
                    {(naalText || myText) && (
                      <div className="mt-2 space-y-1 w-full">
                        {naalText && <div className="text-[13px] md:text-sm text-emerald-800 leading-snug break-words">{naalText}</div>}
                        {myText && <div className="text-[12px] text-blue-800 leading-tight break-words">{myText}</div>}
                      </div>
                    )}
                  </div>
                )
              },
              Caption: (props) => {
                const m = props.displayMonth.getMonth()
                const y = props.displayMonth.getFullYear()
                const months = [
                  'January','February','March','April','May','June','July','August','September','October','November','December'
                ]
                const years = Array.from({ length: 2100 - 2000 + 1 }, (_, i) => 2000 + i)
                return (
                  <div className="flex items-center justify-between px-2 py-2">
                    <select
                      className="border rounded px-2 py-1"
                      value={m}
                      onChange={(e) => {
                        const nm = Number(e.target.value)
                        const d = new Date(y, nm, 1)
                        setDisplayMonth(startOfMonth(d))
                      }}
                    >
                      {months.map((name, idx) => (
                        <option key={name} value={idx}>{name}</option>
                      ))}
                    </select>
                    <select
                      className="border rounded px-2 py-1"
                      value={y}
                      onChange={(e) => {
                        const ny = Number(e.target.value)
                        const d = new Date(ny, m, 1)
                        setDisplayMonth(startOfMonth(d))
                      }}
                    >
                      {years.map((yy) => (
                        <option key={yy} value={yy}>{yy}</option>
                      ))}
                    </select>
                  </div>
                )
              }
            }}
            footer={loading ? 'Loading…' : error ? <span className="text-red-600">{error}</span> : null}
          />
          {/* Overlay metadata under the calendar grid */}
          <div className="mt-2 text-sm text-gray-600">
            Click a day to edit Naal. Days will show Malayalam year and Naal in the side panel when selected.
          </div>
        </div>
        <div className="space-y-4">
          <div className="border rounded p-3">
            <h2 className="font-medium mb-2">Assign Malayalam Year (Range)</h2>
            <div className="space-y-2">
              <label className="block text-sm">Start Date</label>
              <input type="date" className="border rounded px-2 py-1 w-full" value={rangeStart ? format(rangeStart, 'yyyy-MM-dd') : ''} onChange={(e) => setRangeStart(e.target.value ? new Date(e.target.value) : undefined)} />
              <label className="block text-sm">End Date</label>
              <input type="date" className="border rounded px-2 py-1 w-full" value={rangeEnd ? format(rangeEnd, 'yyyy-MM-dd') : ''} onChange={(e) => setRangeEnd(e.target.value ? new Date(e.target.value) : undefined)} />
              <label className="block text-sm">Malayalam Year</label>
              <input type="text" className="border rounded px-2 py-1 w-full" value={malYear} onChange={(e) => setMalYear(e.target.value)} />
              <button onClick={applyRange} className="px-3 py-1 rounded bg-blue-600 text-white">Apply Range</button>
            </div>
          </div>

          <div className="border rounded p-3">
            <h2 className="font-medium mb-2">Selected Day</h2>
            {editing ? (
              <div className="space-y-2">
                <div className="text-sm text-gray-700">{editing.dateISO}</div>
                <div className="text-sm text-gray-700">Malayalam Year: {String(editing.malayalam_year ?? '')}</div>
                <div className="text-sm text-gray-700">Updated by: {editing.updated_by || ''}</div>
                <div className="text-sm text-gray-700">Updated at: {editing.updated_at ? new Date(editing.updated_at).toLocaleString() : ''}</div>
                <label className="block text-sm">Naal</label>
                <select
                  className="border rounded px-2 py-2 w-full"
                  value={naal}
                  onChange={(e) => setNaal(e.target.value)}
                >
                  <option value="">None</option>
                  {NAALS.map((n, idx) => (
                    <option key={`naal-${idx}`} value={n}>{n}</option>
                  ))}
                </select>
                <div className="space-x-2">
                  <button className="px-3 py-1 rounded bg-green-600 text-white" onClick={saveNaal}>Save</button>
                  <button className="px-3 py-1 rounded border" onClick={() => setEditing(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">Select a day to edit.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
