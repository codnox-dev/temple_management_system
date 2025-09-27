import React, { useEffect, useMemo, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import '../../styles/spiritual-calendar.css'
import { addMonths, format, startOfMonth } from 'date-fns'
import api, { get, post } from '@/api/api'
import { toast } from 'sonner'
import { Calendar, Clock, Star, Sun, Moon, ChevronLeft, ChevronRight, Settings, Save, X, Sparkles, Zap, Eye } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900/20 to-amber-900/30 p-6">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-amber-400/10 to-yellow-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/3 w-64 h-64 bg-gradient-to-r from-orange-400/5 to-amber-400/5 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 space-y-8">
        {/* Header Section */}
        <div className="text-center mb-16 relative">
          <div className="flex items-center justify-center mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-yellow-500/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative p-6 bg-gradient-to-br from-orange-500/25 to-amber-500/25 rounded-full border border-orange-400/40 backdrop-blur-sm shadow-2xl shadow-orange-500/20">
              <Calendar className="w-12 h-12 text-amber-300" />
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-orange-400/10 rounded-full animate-ping"></div>
            </div>
          </div>
          
          <div className="relative">
            <h1 className="text-6xl md:text-7xl font-bold mb-6 relative">
              <span className="sacred-text">Sacred Calendar</span>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-8 h-8 text-amber-400/60 animate-pulse" />
              </div>
            </h1>
            
            <div className="flex items-center justify-center mb-6">
              <div className="h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent w-32"></div>
              <Star className="w-6 h-6 text-amber-400 mx-4" />
              <div className="h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent w-32"></div>
            </div>
            
            <p className="text-orange-200/90 text-xl max-w-3xl mx-auto leading-relaxed font-light">
              Manage the divine calendar with <span className="text-amber-300 font-medium">celestial precision</span> and <span className="text-orange-300 font-medium">spiritual harmony</span>
            </p>
            
            <div className="mt-8 flex items-center justify-center space-x-8 text-amber-300/70">
              <div className="flex items-center">
                <Sun className="w-5 h-5 mr-2" />
                <span className="text-sm">Solar Calendar</span>
              </div>
              <div className="flex items-center">
                <Moon className="w-5 h-5 mr-2" />
                <span className="text-sm">Lunar Events</span>
              </div>
              <div className="flex items-center">
                <Star className="w-5 h-5 mr-2" />
                <span className="text-sm">Sacred Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-center mb-12">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 rounded-3xl blur-xl"></div>
            <div className="relative flex items-center bg-black/50 backdrop-blur-md rounded-3xl p-3 border border-orange-500/40 shadow-2xl shadow-orange-500/25">
              <button 
                className="group p-4 hover:bg-gradient-to-r hover:from-orange-500/25 hover:to-amber-500/25 rounded-2xl transition-all duration-500 text-amber-300 hover:text-amber-100 hover:scale-110 relative overflow-hidden"
                onClick={() => setDisplayMonth(addMonths(displayMonth, -1))}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <ChevronLeft className="w-7 h-7 relative z-10" />
              </button>
              
              <div className="px-12 py-3 text-center min-w-[280px] relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-900/20 via-amber-900/20 to-orange-900/20 rounded-xl"></div>
                <span className="relative text-3xl font-bold sacred-text">
                  {format(displayMonth, 'MMMM yyyy')}
                </span>
                <div className="absolute top-1 right-1">
                  <Sparkles className="w-4 h-4 text-amber-400/60 animate-pulse" />
                </div>
              </div>
              
              <button 
                className="group p-4 hover:bg-gradient-to-r hover:from-amber-500/25 hover:to-orange-500/25 rounded-2xl transition-all duration-500 text-amber-300 hover:text-amber-100 hover:scale-110 relative overflow-hidden"
                onClick={() => setDisplayMonth(addMonths(displayMonth, 1))}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent transform translate-x-full group-hover:-translate-x-full transition-transform duration-700"></div>
                <ChevronRight className="w-7 h-7 relative z-10" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Calendar Grid */}
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="bg-black/30 backdrop-blur-sm rounded-3xl p-8 border border-orange-500/30 shadow-2xl shadow-orange-500/10">
              <DayPicker
                mode="single"
                month={displayMonth}
                onMonthChange={setDisplayMonth}
                onSelect={onSelectDay}
                fromYear={2000}
                toYear={2100}
                showOutsideDays
                className="w-full calendar-spiritual"
                styles={{
                  caption: { display: 'none' }, // We'll use our custom header
                  day: { 
                    width: '100px', 
                    height: '120px', 
                    padding: '8px',
                    margin: '4px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(251, 146, 60, 0.3)',
                    transition: 'all 0.3s ease',
                  },
                  head_cell: { 
                    fontSize: '1.1rem', 
                    padding: '1rem',
                    color: '#fbbf24',
                    fontWeight: '600',
                    textAlign: 'center'
                  },
                  table: { 
                    fontSize: '1.2rem', 
                    width: '100%',
                  },
                  cell: {
                    padding: '2px'
                  }
                }}
                components={{
                  DayContent: (props) => {
                    const key = format(props.date, 'yyyy-MM-dd')
                    const d = map.get(key)
                    const dayNum = props.date.getDate()
                    const naalText = d?.naal ? String(d.naal) : ''
                    const myText = d?.malayalam_year != null && d?.malayalam_year !== '' ? String(d.malayalam_year) : ''
                    const isToday = format(props.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                    
                    return (
                      <div className={`
                        relative flex flex-col items-start w-full h-full px-3 py-3 rounded-2xl transition-all duration-500 cursor-pointer group
                        hover:bg-gradient-to-br hover:from-orange-500/25 hover:to-amber-500/25 
                        hover:border-amber-400/60 hover:shadow-xl hover:shadow-orange-500/25 hover:scale-105
                        ${isToday ? 'bg-gradient-to-br from-amber-500/35 to-orange-500/35 border-amber-400/70 glow-amber' : ''}
                        ${naalText || myText ? 'border-orange-400/40' : 'border-orange-500/20'}
                        particles
                      `}>
                        {/* Sacred shimmer effect */}
                        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-amber-400/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </div>
                        
                        <div className={`
                          relative z-10 text-lg font-bold leading-none mb-2 sacred-text
                          ${isToday ? 'text-amber-100' : 'text-orange-100'}
                        `}>
                          {dayNum}
                          {isToday && <Sun className="w-4 h-4 inline ml-1 text-amber-300 spiritual-loading" />}
                        </div>
                        
                        {(naalText || myText) && (
                          <div className="relative z-10 space-y-1 w-full">
                            {naalText && (
                              <div className="naal-badge text-xs text-amber-200/95 leading-snug break-words px-2 py-1.5 rounded-lg">
                                <Star className="w-3 h-3 inline mr-1 text-amber-300" />
                                <span className="font-medium">{naalText}</span>
                              </div>
                            )}
                            {myText && (
                              <div className="malayalam-year-badge text-xs text-orange-100/90 leading-tight break-words px-2 py-1 rounded-lg">
                                <Moon className="w-3 h-3 inline mr-1 text-orange-300" />
                                <span className="font-medium">MY: {myText}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Hover indicator */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Eye className="w-3 h-3 text-amber-300" />
                        </div>
                        
                        {/* Special day indicator */}
                        {(naalText && myText) && (
                          <div className="absolute bottom-1 right-1 opacity-60">
                            <Zap className="w-3 h-3 text-amber-400" />
                          </div>
                        )}
                      </div>
                    )
                  },
                  Caption: () => null // We handle this in the header
                }}
                footer={
                  <div className="text-center mt-6">
                    {loading && (
                      <div className="flex items-center justify-center text-amber-300">
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        Loading celestial data...
                      </div>
                    )}
                    {error && (
                      <div className="text-red-400 bg-red-900/20 px-4 py-2 rounded-lg border border-red-500/30">
                        {error}
                      </div>
                    )}
                  </div>
                }
              />
              <div className="mt-6 text-center text-orange-200/70 text-sm bg-orange-900/10 px-6 py-4 rounded-xl border border-orange-500/20">
                <Clock className="w-4 h-4 inline mr-2" />
                Click on any day to edit Naal and view detailed information in the sacred panel
              </div>
            </div>
          </div>
          {/* Sacred Control Panel */}
          <div className="space-y-6">
            {/* Range Assignment Panel */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/30 shadow-xl shadow-amber-500/10">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg mr-3">
                  <Settings className="w-5 h-5 text-amber-400" />
                </div>
                <h2 className="text-xl font-semibold bg-gradient-to-r from-amber-200 to-orange-200 bg-clip-text text-transparent">
                  Malayalam Year Range
                </h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-orange-200 mb-2">Start Date</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 bg-slate-800/50 border border-orange-500/30 rounded-xl text-orange-100 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors" 
                    value={rangeStart ? format(rangeStart, 'yyyy-MM-dd') : ''} 
                    onChange={(e) => setRangeStart(e.target.value ? new Date(e.target.value) : undefined)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-orange-200 mb-2">End Date</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 bg-slate-800/50 border border-orange-500/30 rounded-xl text-orange-100 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors" 
                    value={rangeEnd ? format(rangeEnd, 'yyyy-MM-dd') : ''} 
                    onChange={(e) => setRangeEnd(e.target.value ? new Date(e.target.value) : undefined)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-orange-200 mb-2">Malayalam Year</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-800/50 border border-orange-500/30 rounded-xl text-orange-100 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors placeholder-orange-300/50" 
                    value={malYear} 
                    onChange={(e) => setMalYear(e.target.value)}
                    placeholder="e.g., 1200"
                  />
                </div>
                <button 
                  onClick={applyRange} 
                  className="w-full px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-amber-500/25 flex items-center justify-center"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Apply Sacred Range
                </button>
              </div>
            </div>

            {/* Selected Day Panel */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/30 shadow-xl shadow-orange-500/10">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-lg mr-3">
                  <Star className="w-5 h-5 text-orange-400" />
                </div>
                <h2 className="text-xl font-semibold bg-gradient-to-r from-orange-200 to-amber-200 bg-clip-text text-transparent">
                  Sacred Day Details
                </h2>
              </div>
              {editing ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 p-4 rounded-xl border border-amber-500/20">
                    <div className="text-lg font-semibold text-amber-200 mb-2">{editing.dateISO}</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-orange-200/80">
                        <Moon className="w-4 h-4 mr-2 text-amber-400" />
                        Malayalam Year: {String(editing.malayalam_year ?? 'Not set')}
                      </div>
                      <div className="flex items-center text-orange-200/80">
                        <Settings className="w-4 h-4 mr-2 text-orange-400" />
                        Updated by: {editing.updated_by || 'System'}
                      </div>
                      <div className="flex items-center text-orange-200/80">
                        <Clock className="w-4 h-4 mr-2 text-amber-400" />
                        Last update: {editing.updated_at ? new Date(editing.updated_at).toLocaleString() : 'Never'}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-orange-200 mb-3">
                      <Star className="w-4 h-4 inline mr-2" />
                      Sacred Naal
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-slate-800/50 border border-orange-500/30 rounded-xl text-orange-100 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors"
                      value={naal}
                      onChange={(e) => setNaal(e.target.value)}
                    >
                      <option value="" className="bg-slate-800">None</option>
                      {NAALS.map((n, idx) => (
                        <option key={`naal-${idx}`} value={n} className="bg-slate-800">{n}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button 
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-green-500/25 flex items-center justify-center" 
                      onClick={saveNaal}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </button>
                    <button 
                      className="px-4 py-3 bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded-xl hover:bg-slate-600/50 transition-all duration-300 flex items-center justify-center" 
                      onClick={() => setEditing(null)}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-amber-400" />
                  </div>
                  <div className="text-orange-200/60">Select a day from the calendar to view and edit its sacred details</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
