// Storage keys
const EVENTS_KEY = 'celebrateai_events_v1'
const SETTINGS_KEY = 'celebrateai_settings_v1'

// Generate stable IDs
export function generateId() {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Safe JSON parse
function safeParseJSON(str, fallback) {
  try {
    const parsed = JSON.parse(str)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

// ─── Events ───────────────────────────────────────────────────────────────────

export function getEvents() {
  const raw = localStorage.getItem(EVENTS_KEY)
  const events = safeParseJSON(raw, [])
  return Array.isArray(events) ? events : []
}

export function getEventById(id) {
  return getEvents().find(e => e.id === id) || null
}

export function saveEvent(event) {
  const events = getEvents()
  const now = new Date().toISOString()
  const index = events.findIndex(e => e.id === event.id)
  if (index >= 0) {
    events[index] = { ...event, updatedAt: now }
  } else {
    events.unshift({ ...event, createdAt: now, updatedAt: now })
  }
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
  return event
}

export function deleteEvent(id) {
  const events = getEvents().filter(e => e.id !== id)
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
}

export function duplicateEvent(id) {
  const event = getEventById(id)
  if (!event) return null
  const newEvent = {
    ...event,
    id: generateId(),
    name: `${event.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedTasks: [],
    checklist: (event.checklist || []).map(item => ({ ...item, completed: false })),
  }
  const events = getEvents()
  events.unshift(newEvent)
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
  return newEvent
}

// ─── Settings ─────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  currency: 'INR',
  language: 'en',
  theme: 'dark',
  defaultBudget: 50000,
  defaultGuestCount: 50,
}

export function getSettings() {
  const raw = localStorage.getItem(SETTINGS_KEY)
  const saved = safeParseJSON(raw, {})
  return { ...DEFAULT_SETTINGS, ...saved }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export function getDashboardStats() {
  const events = getEvents()
  const now = new Date()

  const upcoming = events.filter(e => new Date(e.date) >= now)
  const totalBudget = events.reduce((sum, e) => sum + (Number(e.budget) || 0), 0)

  const totalTasks = events.reduce((sum, e) => {
    const tl = e.plan?.timeline || []
    const cl = e.checklist || []
    return sum + tl.length + cl.length
  }, 0)

  const completedTasks = events.reduce((sum, e) => {
    const completedTl = (e.completedTasks || []).length
    const completedCl = (e.checklist || []).filter(item => item.completed).length
    return sum + completedTl + completedCl
  }, 0)

  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return {
    totalEvents: events.length,
    upcomingEvents: upcoming.length,
    totalBudget,
    completionPct,
    recentEvents: events.slice(0, 5),
  }
}

// ─── Clear All Data ───────────────────────────────────────────────────────────

export function clearAllData() {
  localStorage.removeItem(EVENTS_KEY)
  localStorage.removeItem(SETTINGS_KEY)
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function exportData() {
  const data = {
    events: getEvents(),
    settings: getSettings(),
    exportedAt: new Date().toISOString(),
    version: 1,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `celebrateai_backup_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Currency Formatting ──────────────────────────────────────────────────────

const CURRENCY_FORMATS = {
  INR: { symbol: '₹', locale: 'en-IN' },
  USD: { symbol: '$', locale: 'en-US' },
  EUR: { symbol: '€', locale: 'de-DE' },
  GBP: { symbol: '£', locale: 'en-GB' },
  AUD: { symbol: 'A$', locale: 'en-AU' },
}

export function formatCurrency(amount, currency = 'INR') {
  const fmt = CURRENCY_FORMATS[currency] || CURRENCY_FORMATS.INR
  return new Intl.NumberFormat(fmt.locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

export const CURRENCIES = Object.keys(CURRENCY_FORMATS).map(code => ({
  code,
  ...CURRENCY_FORMATS[code],
}))
