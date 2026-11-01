// Server-side fallback planner (mirrors the client-side one for consistency)

export function generateFallbackPlan(eventData) {
  const { name, type = 'Birthday', budget = 50000, guestCount = 50, location = 'your city', date, currency = 'INR', preferences = {} } = eventData
  const b = Number(budget) || 50000
  const g = Number(guestCount) || 50
  const style = preferences.spendingStyle || 'Balanced'

  const allocations = getAllocations(type, style)
  const budgetBreakdown = allocations.map(({ category, pct, reason }) => ({
    category,
    estimatedCost: Math.round(b * pct),
    reason,
  }))

  const total = budgetBreakdown.reduce((s, c) => s + c.estimatedCost, 0)
  if (total > b) {
    budgetBreakdown[budgetBreakdown.length - 1].estimatedCost -= (total - b)
  }

  const daysUntil = date
    ? Math.max(0, Math.floor((new Date(date) - new Date()) / (1000 * 60 * 60 * 24)))
    : 90

  return {
    isFallback: true,
    eventSummary: `A ${style.toLowerCase()} ${type.toLowerCase()} for ${g} guests at an estimated budget of ${currency} ${b.toLocaleString()}, planned in ${location}.`,
    themeName: getTheme(type, preferences),
    themeDescription: getThemeDescription(type),
    personalizedIdeas: getIdeas(type, g, b),
    budgetBreakdown,
    timeline: getTimeline(daysUntil),
    vendorChecklist: getVendorChecklist(b),
    dayOfSchedule: getDaySchedule(),
    riskChecklist: getRisks(),
    budgetAdvice: `With ${currency} ${b.toLocaleString()} for ${g} guests, focus on venue and catering first. Keep 10% unspent as a contingency reserve.`,
    assumptions: [
      `Budget of ${currency} ${b.toLocaleString()} covers all event costs.`,
      'All cost figures are estimates; actual prices vary by region.',
      'This plan was generated in Demo Mode (AI service unavailable).',
    ],
  }
}

function getAllocations(type, style) {
  return [
    { category: 'Venue', pct: 0.28, reason: 'Venue booking and setup' },
    { category: 'Catering', pct: 0.28, reason: 'Food and beverages for all guests' },
    { category: 'Decoration', pct: 0.12, reason: 'Décor and ambiance' },
    { category: 'Photography & Videography', pct: 0.10, reason: 'Capturing memories' },
    { category: 'Entertainment', pct: 0.08, reason: 'Music and activities' },
    { category: 'Transportation', pct: 0.05, reason: 'Guest transportation' },
    { category: 'Invitations', pct: 0.02, reason: 'Invites and stationery' },
    { category: 'Miscellaneous', pct: 0.05, reason: 'Extras and tips' },
    { category: 'Emergency Contingency', pct: 0.02, reason: 'Buffer for surprises' },
  ]
}

function getTheme(type, prefs) {
  const themes = { Wedding: 'Timeless Elegance', Birthday: 'Joyful Celebration', Anniversary: 'Golden Memories', Engagement: 'Forever Begins', 'Graduation Party': 'New Horizons', 'Corporate Event': 'Professional Excellence' }
  return prefs?.theme || themes[type] || 'Elegant Celebration'
}

function getThemeDescription(type) {
  return 'A beautifully curated celebration tailored to your preferences and budget, creating lasting memories for you and your guests.'
}

function getIdeas(type, g, b) {
  return [
    { title: 'Personalized Welcome Experience', description: 'Create a memorable first impression with a personalized welcome setup at the entrance.', estimatedCost: Math.round(b * 0.03), priority: 'high' },
    { title: 'Interactive Photo Booth', description: 'Set up a themed photo booth with props for guests to take home memories.', estimatedCost: Math.round(b * 0.04), priority: 'medium' },
    { title: 'Custom Memory Book', description: 'Provide a guest book for messages and photos, creating a treasured keepsake.', estimatedCost: Math.round(b * 0.015), priority: 'medium' },
    { title: 'Themed Menu', description: 'Design a menu that reflects the event theme with dietary-friendly options.', estimatedCost: Math.round(b * 0.28), priority: 'high' },
    { title: 'Ambient Lighting Design', description: 'Use warm string lights and LED mood lighting to transform the venue.', estimatedCost: Math.round(b * 0.05), priority: 'medium' },
  ]
}

function getTimeline(daysUntil) {
  return [
    { task: 'Finalize event concept and theme', daysBeforeEvent: Math.min(90, daysUntil), category: 'Planning', priority: 'high' },
    { task: 'Set and confirm total budget', daysBeforeEvent: Math.min(85, daysUntil), category: 'Budget', priority: 'high' },
    { task: 'Research and shortlist venues', daysBeforeEvent: Math.min(80, daysUntil), category: 'Venue', priority: 'high' },
    { task: 'Book and confirm venue', daysBeforeEvent: Math.min(70, daysUntil), category: 'Venue', priority: 'high' },
    { task: 'Send save-the-date notifications', daysBeforeEvent: Math.min(60, daysUntil), category: 'Invitations', priority: 'medium' },
    { task: 'Book catering service', daysBeforeEvent: Math.min(55, daysUntil), category: 'Catering', priority: 'high' },
    { task: 'Book photographer/videographer', daysBeforeEvent: Math.min(50, daysUntil), category: 'Photography', priority: 'high' },
    { task: 'Send formal invitations', daysBeforeEvent: Math.min(40, daysUntil), category: 'Invitations', priority: 'high' },
    { task: 'Confirm catering menu', daysBeforeEvent: Math.min(21, daysUntil), category: 'Catering', priority: 'high' },
    { task: 'Confirm final guest count', daysBeforeEvent: Math.min(14, daysUntil), category: 'Venue', priority: 'high' },
    { task: 'Prepare day-of timeline', daysBeforeEvent: Math.min(7, daysUntil), category: 'Planning', priority: 'high' },
    { task: 'Final venue walkthrough', daysBeforeEvent: Math.min(3, daysUntil), category: 'Venue', priority: 'high' },
    { task: 'Event day — final coordination', daysBeforeEvent: 0, category: 'Planning', priority: 'high' },
  ].filter(t => t.daysBeforeEvent >= 0)
}

function getVendorChecklist(b) {
  return [
    { category: 'Venue', suggestedAction: 'Visit and compare at least 3 venues; confirm capacity and amenities.', priority: 'high', estimatedCost: Math.round(b * 0.28) },
    { category: 'Catering', suggestedAction: 'Request menus and per-plate quotes from caterers; confirm dietary options.', priority: 'high', estimatedCost: Math.round(b * 0.28) },
    { category: 'Decoration', suggestedAction: 'Share theme references with decorator; request itemized quote.', priority: 'medium', estimatedCost: Math.round(b * 0.12) },
    { category: 'Photography & Videography', suggestedAction: 'Review portfolios; confirm deliverables and timeline.', priority: 'high', estimatedCost: Math.round(b * 0.10) },
    { category: 'Entertainment', suggestedAction: 'Book DJ or band; share playlist preferences and schedule.', priority: 'medium', estimatedCost: Math.round(b * 0.08) },
    { category: 'Invitations', suggestedAction: 'Design and send invitations at least 4 weeks before the event.', priority: 'medium', estimatedCost: Math.round(b * 0.02) },
    { category: 'Transportation', suggestedAction: 'Arrange pickup/drop for key guests; coordinate with drivers.', priority: 'low', estimatedCost: Math.round(b * 0.05) },
  ]
}

function getDaySchedule() {
  return [
    { time: '9:00 AM', activity: 'Venue setup — decorators and caterers arrive', durationMinutes: 120 },
    { time: '11:00 AM', activity: 'Technical setup — sound and lighting check', durationMinutes: 60 },
    { time: '12:00 PM', activity: 'Host and family arrive for final walkthrough', durationMinutes: 30 },
    { time: '2:00 PM', activity: 'Guests begin arriving — welcome drinks served', durationMinutes: 45 },
    { time: '3:00 PM', activity: 'Main event begins', durationMinutes: 60 },
    { time: '4:00 PM', activity: 'Meal service', durationMinutes: 90 },
    { time: '5:30 PM', activity: 'Cake cutting / main highlight', durationMinutes: 30 },
    { time: '6:00 PM', activity: 'Entertainment and open celebration', durationMinutes: 90 },
    { time: '7:30 PM', activity: 'Vote of thanks and farewell', durationMinutes: 30 },
    { time: '8:30 PM', activity: 'Venue cleanup and vendor settlement', durationMinutes: 60 },
  ]
}

function getRisks() {
  return [
    { risk: 'Venue cancellation', prevention: 'Have a backup venue shortlisted and confirm a written contract.' },
    { risk: 'Caterer unable to deliver', prevention: 'Sign a written agreement; have a backup caterer contact ready.' },
    { risk: 'Key vendor no-show', prevention: 'Confirm 48 hours before the event; keep backup contacts.' },
    { risk: 'Guest count significantly higher than RSVP', prevention: 'Prepare 10–15% buffer seating and catering.' },
    { risk: 'Weather disruptions', prevention: 'Arrange a covered backup area or tent.' },
    { risk: 'Budget overrun', prevention: 'Keep 10% of the budget unallocated as contingency.' },
  ]
}
