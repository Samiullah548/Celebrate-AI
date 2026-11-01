// AI plan generation via backend API
// Falls back to rule-based planning when the API is unavailable

// In production: set VITE_API_URL to your backend base URL (e.g. https://your-api.railway.app)
// In development: Vite dev-server proxy handles /api → http://localhost:5000
const API_BASE = import.meta.env.VITE_API_URL || ''
const API_URL = `${API_BASE}/api/plan-event`

export async function generateAIPlan(eventData) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
      signal: AbortSignal.timeout(60000),
    })

    if (!response.ok) {
      let errorMessage = `Server error (${response.status})`
      try {
        const errJson = await response.json()
        if (errJson && errJson.error) {
          errorMessage = errJson.error
        }
      } catch {
        const rawText = await response.text().catch(() => '')
        if (rawText && !rawText.toLowerCase().includes('<!doctype') && !rawText.toLowerCase().includes('<html')) {
          errorMessage = rawText.slice(0, 160)
        } else if (response.status === 405) {
          errorMessage = 'API routing error (405 Method Not Allowed). Check Vercel serverless function configuration.'
        } else if (response.status === 504) {
          errorMessage = 'Gateway timeout (504). AI generation took longer than allowed.'
        }
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    if (data.isFallback || data.fallback) {
      return { ...data, isFallback: true }
    }
    return { ...data, isFallback: false }
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('AI plan generation timed out (60s). Please try again.')
    }
    // Propagate meaningful error messages to the UI
    throw err
  }
}


// ─── Rule-Based Fallback Planner ─────────────────────────────────────────────

export function generateFallbackPlan(eventData) {
  const {
    name,
    type = 'Birthday',
    budget = 50000,
    guestCount = 50,
    location = 'your city',
    date,
    currency = 'INR',
    preferences = {},
  } = eventData

  const b = Number(budget) || 50000
  const g = Number(guestCount) || 50
  const style = preferences.spendingStyle || 'Balanced'

  // Budget allocation percentages by category
  const allocations = getAllocations(type, style)
  const budgetBreakdown = allocations.map(({ category, pct, reason }) => ({
    category,
    estimatedCost: Math.round(b * pct),
    reason,
  }))

  // Validate total
  const total = budgetBreakdown.reduce((s, c) => s + c.estimatedCost, 0)
  if (total > b) {
    const diff = total - b
    budgetBreakdown[budgetBreakdown.length - 1].estimatedCost -= diff
  }

  const daysUntil = date
    ? Math.max(0, Math.floor((new Date(date) - new Date()) / (1000 * 60 * 60 * 24)))
    : 90

  return {
    isFallback: true,
    eventSummary: `A ${style.toLowerCase()} ${type.toLowerCase()} for ${g} guests at an estimated budget of ${budget} ${currency}, planned in ${location}.`,
    themeName: getTheme(type, preferences),
    themeDescription: getThemeDescription(type, preferences),
    personalizedIdeas: getIdeas(type, g, b, preferences),
    budgetBreakdown,
    timeline: getTimeline(daysUntil, type),
    vendorChecklist: getVendorChecklist(type, b, g),
    dayOfSchedule: getDaySchedule(type),
    riskChecklist: getRisks(type, location),
    budgetAdvice: getBudgetAdvice(b, g, style),
    assumptions: [
      `Budget of ${currency} ${b.toLocaleString()} covers all event costs.`,
      `Guest count of ${g} persons assumed for venue and catering.`,
      'All cost figures are estimates; actual prices may vary by region.',
      'This plan was generated without the live AI service (Demo Mode).',
    ],
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAllocations(type, style) {
  const base = {
    Wedding: [
      { category: 'Venue', pct: 0.30, reason: 'Central to the wedding experience' },
      { category: 'Catering', pct: 0.25, reason: 'Food and drinks for all guests' },
      { category: 'Decoration', pct: 0.12, reason: 'Floral and décor arrangements' },
      { category: 'Photography & Video', pct: 0.10, reason: 'Capturing memories' },
      { category: 'Entertainment', pct: 0.08, reason: 'Music and performances' },
      { category: 'Invitations & Stationery', pct: 0.03, reason: 'Cards and digital invites' },
      { category: 'Transportation', pct: 0.05, reason: 'Guest and couple transport' },
      { category: 'Miscellaneous', pct: 0.05, reason: 'Contingency and extras' },
      { category: 'Emergency Contingency', pct: 0.02, reason: 'Unexpected expenses' },
    ],
    Birthday: [
      { category: 'Venue', pct: 0.25, reason: 'Party venue or hall rental' },
      { category: 'Catering', pct: 0.30, reason: 'Food, cake, and beverages' },
      { category: 'Decoration', pct: 0.15, reason: 'Theme decorations and balloons' },
      { category: 'Entertainment', pct: 0.12, reason: 'Games and activities' },
      { category: 'Photography', pct: 0.08, reason: 'Capturing the celebration' },
      { category: 'Invitations', pct: 0.03, reason: 'Party invites' },
      { category: 'Miscellaneous', pct: 0.05, reason: 'Favors and extras' },
      { category: 'Emergency Contingency', pct: 0.02, reason: 'Buffer for surprises' },
    ],
  }

  const fallback = [
    { category: 'Venue', pct: 0.28, reason: 'Venue booking and setup' },
    { category: 'Catering', pct: 0.28, reason: 'Food and beverages' },
    { category: 'Decoration', pct: 0.12, reason: 'Décor and ambiance' },
    { category: 'Photography', pct: 0.10, reason: 'Photography and videography' },
    { category: 'Entertainment', pct: 0.08, reason: 'Music and performances' },
    { category: 'Transportation', pct: 0.05, reason: 'Guest transportation' },
    { category: 'Miscellaneous', pct: 0.07, reason: 'Miscellaneous expenses' },
    { category: 'Emergency Contingency', pct: 0.02, reason: 'Emergency buffer' },
  ]

  return base[type] || fallback
}

function getTheme(type, prefs) {
  const themes = {
    Wedding: 'Timeless Elegance',
    Birthday: 'Joyful Celebration',
    Anniversary: 'Golden Memories',
    Engagement: 'Forever Begins',
    'Graduation Party': 'New Horizons',
    'Corporate Event': 'Professional Excellence',
    'Community Event': 'Together We Celebrate',
    Festival: 'Cultural Vibrancy',
  }
  return prefs.theme || themes[type] || 'Elegant Celebration'
}

function getThemeDescription(type, prefs) {
  const desc = {
    Wedding: 'A classic and romantic setting with elegant floral arrangements, warm lighting, and a sophisticated atmosphere that will make your special day truly unforgettable.',
    Birthday: 'A vibrant and joyful celebration designed around the guest of honor, filled with personal touches, fun activities, and memorable moments.',
    Anniversary: 'A warm and intimate gathering celebrating your journey together, with nostalgic elements and meaningful touches that honor your love story.',
    'Corporate Event': 'A polished, professional setting that balances networking opportunities with memorable experiences, reinforcing your brand and team spirit.',
  }
  return desc[type] || 'A beautifully curated celebration tailored to your preferences and budget, creating lasting memories for you and your guests.'
}

function getIdeas(type, guestCount, budget, prefs) {
  const perPerson = budget / Math.max(guestCount, 1)
  return [
    {
      title: 'Personalized Welcome Experience',
      description: `Create a memorable first impression with a personalized welcome setup at the entrance — a sign with the event name, welcome drinks, and a photo opportunity spot.`,
      estimatedCost: Math.round(budget * 0.03),
      priority: 'high',
    },
    {
      title: 'Interactive Guest Activities',
      description: `Set up interactive stations — a photo booth, a message wall, or a DIY activity — to keep guests engaged and create lasting memories.`,
      estimatedCost: Math.round(budget * 0.04),
      priority: 'medium',
    },
    {
      title: 'Custom Memory Book',
      description: `Provide a guest book for messages and Polaroid photos, creating a treasured keepsake for the host.`,
      estimatedCost: Math.round(budget * 0.015),
      priority: 'medium',
    },
    {
      title: 'Themed Menu',
      description: `Design a menu that reflects the event theme, including dietary-friendly options for all guests.`,
      estimatedCost: Math.round(perPerson * guestCount * 0.3),
      priority: 'high',
    },
    {
      title: 'Ambient Lighting Design',
      description: `Use warm string lights, candles, or LED mood lighting to transform the venue into a magical space without exceeding the décor budget.`,
      estimatedCost: Math.round(budget * 0.05),
      priority: 'medium',
    },
  ]
}

function getTimeline(daysUntil, type) {
  const tasks = [
    { task: 'Finalize event concept and theme', daysBeforeEvent: Math.min(90, daysUntil), category: 'Planning', priority: 'high' },
    { task: 'Set and confirm total budget', daysBeforeEvent: Math.min(85, daysUntil - 5), category: 'Budget', priority: 'high' },
    { task: 'Research and shortlist venues', daysBeforeEvent: Math.min(80, daysUntil - 10), category: 'Venue', priority: 'high' },
    { task: 'Book and confirm venue', daysBeforeEvent: Math.min(70, daysUntil - 20), category: 'Venue', priority: 'high' },
    { task: 'Send save-the-date notifications', daysBeforeEvent: Math.min(60, daysUntil - 30), category: 'Invitations', priority: 'medium' },
    { task: 'Book catering service', daysBeforeEvent: Math.min(55, daysUntil - 35), category: 'Catering', priority: 'high' },
    { task: 'Book photographer/videographer', daysBeforeEvent: Math.min(50, daysUntil - 40), category: 'Photography', priority: 'high' },
    { task: 'Finalize decoration plan', daysBeforeEvent: Math.min(45, daysUntil - 45), category: 'Decoration', priority: 'medium' },
    { task: 'Send formal invitations', daysBeforeEvent: Math.min(40, daysUntil - 50), category: 'Invitations', priority: 'high' },
    { task: 'Book entertainment', daysBeforeEvent: Math.min(35, daysUntil - 55), category: 'Entertainment', priority: 'medium' },
    { task: 'Confirm catering menu', daysBeforeEvent: Math.min(21, daysUntil - 69), category: 'Catering', priority: 'high' },
    { task: 'Confirm final guest count with venue', daysBeforeEvent: Math.min(14, daysUntil - 76), category: 'Venue', priority: 'high' },
    { task: 'Arrange transportation logistics', daysBeforeEvent: Math.min(10, daysUntil - 80), category: 'Transportation', priority: 'medium' },
    { task: 'Prepare day-of timeline and briefing', daysBeforeEvent: Math.min(7, daysUntil - 83), category: 'Planning', priority: 'high' },
    { task: 'Final venue walkthrough and setup check', daysBeforeEvent: Math.min(3, daysUntil - 87), category: 'Venue', priority: 'high' },
    { task: 'Collect any outstanding payments', daysBeforeEvent: Math.min(2, daysUntil - 88), category: 'Budget', priority: 'medium' },
    { task: 'Event day — final coordination', daysBeforeEvent: 0, category: 'Planning', priority: 'high' },
  ]
  return tasks.filter(t => t.daysBeforeEvent >= 0)
}

function getVendorChecklist(type, budget, guestCount) {
  return [
    { category: 'Venue', suggestedAction: 'Visit and compare at least 3 venues; confirm capacity, parking, and amenities.', priority: 'high', estimatedCost: Math.round(budget * 0.28) },
    { category: 'Catering', suggestedAction: 'Request menus and per-plate quotes from 2–3 caterers; confirm dietary options.', priority: 'high', estimatedCost: Math.round(budget * 0.28) },
    { category: 'Decoration', suggestedAction: 'Share theme references with decorator; request a mood board and itemized quote.', priority: 'medium', estimatedCost: Math.round(budget * 0.12) },
    { category: 'Photography & Videography', suggestedAction: 'Review portfolios; confirm deliverables, timeline, and file formats.', priority: 'high', estimatedCost: Math.round(budget * 0.10) },
    { category: 'Entertainment', suggestedAction: 'Book DJ, band, or emcee; share playlist preferences and schedule.', priority: 'medium', estimatedCost: Math.round(budget * 0.08) },
    { category: 'Invitations', suggestedAction: 'Design and send invitations at least 4 weeks before the event.', priority: 'medium', estimatedCost: Math.round(budget * 0.02) },
    { category: 'Transportation', suggestedAction: 'Arrange pickup/drop for key guests; coordinate with drivers on day.', priority: 'low', estimatedCost: Math.round(budget * 0.05) },
    { category: 'Equipment & AV', suggestedAction: 'Confirm microphones, projector, and sound system availability with venue.', priority: 'low', estimatedCost: Math.round(budget * 0.03) },
    { category: 'Miscellaneous', suggestedAction: 'Budget for favors, tips for vendors, and any last-minute needs.', priority: 'low', estimatedCost: Math.round(budget * 0.04) },
  ]
}

function getDaySchedule(type) {
  const base = [
    { time: '9:00 AM', activity: 'Venue setup begins — decorators and caterers arrive', durationMinutes: 120 },
    { time: '11:00 AM', activity: 'Technical setup — sound, lighting, and AV check', durationMinutes: 60 },
    { time: '12:00 PM', activity: 'Host and family arrive for final walkthrough', durationMinutes: 30 },
    { time: '12:30 PM', activity: 'Photography setup and pre-event shots', durationMinutes: 60 },
    { time: '2:00 PM', activity: 'Guests begin arriving — welcome drinks served', durationMinutes: 45 },
    { time: '3:00 PM', activity: 'Main event begins — opening ceremony or program', durationMinutes: 60 },
    { time: '4:00 PM', activity: 'Lunch or dinner service', durationMinutes: 90 },
    { time: '5:30 PM', activity: 'Cake cutting / main highlight of the event', durationMinutes: 30 },
    { time: '6:00 PM', activity: 'Entertainment and open celebration', durationMinutes: 90 },
    { time: '7:30 PM', activity: 'Vote of thanks and farewell', durationMinutes: 15 },
    { time: '7:45 PM', activity: 'Guest departure begins', durationMinutes: 30 },
    { time: '8:30 PM', activity: 'Venue cleanup and vendor settlement', durationMinutes: 60 },
  ]
  return base
}

function getRisks(type, location) {
  return [
    { risk: 'Venue cancellation at the last minute', prevention: 'Have a backup venue shortlisted and confirm a written contract with the primary venue.' },
    { risk: 'Caterer unable to deliver on event day', prevention: 'Sign a written agreement; have a backup caterer contact ready.' },
    { risk: 'Key vendor (photographer, DJ) no-show', prevention: 'Confirm 48 hours before the event; keep backup contacts.' },
    { risk: 'Guest count significantly higher than RSVP', prevention: 'Prepare 10–15% buffer seating and catering quantities.' },
    { risk: 'Weather disruptions for outdoor elements', prevention: 'Arrange a covered backup area or tent; check the forecast 72 hours before.' },
    { risk: 'Budget overrun', prevention: 'Keep 10% of the budget unallocated as a contingency fund.' },
    { risk: 'Technical failures (sound, lighting)', prevention: 'Test all equipment the day before; have a technician on standby.' },
  ]
}

function getBudgetAdvice(budget, guestCount, style) {
  const perPerson = Math.round(budget / Math.max(guestCount, 1))
  return `With a budget of ${budget.toLocaleString()} for ${guestCount} guests, you have approximately ${perPerson.toLocaleString()} per person. Focus on the venue and catering first as they account for the largest share. For a ${style.toLowerCase()} event, prioritize quality over quantity — fewer but higher-quality elements create a more memorable experience. Always keep 8–10% of the budget unspent until the day of the event as a contingency reserve.`
}
