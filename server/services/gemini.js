import { GoogleGenAI } from '@google/genai'
import { generateFallbackPlan } from '../services/fallback.js'

const MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash'

function buildPrompt(eventData) {
  const {
    name, type, date, location, guestCount, budget, currency,
    venuePreference, preferences = {}
  } = eventData

  return `You are an expert event planning consultant. Create a detailed, personalized event plan for the following event.

EVENT DETAILS:
- Event Name: ${name}
- Event Type: ${type}
- Date: ${date}
- Location: ${location}
- Guest Count: ${guestCount}
- Total Budget: ${currency} ${budget}
- Venue Preference: ${venuePreference || 'Flexible'}
- Spending Style: ${preferences.spendingStyle || 'Balanced'}
- Food Preference: ${preferences.foodPreference || 'Mixed'}
${preferences.theme ? `- Theme: ${preferences.theme}` : ''}
${preferences.colorPalette ? `- Color Palette: ${preferences.colorPalette}` : ''}
${preferences.decorationStyle ? `- Decoration Style: ${preferences.decorationStyle}` : ''}
${preferences.entertainment ? `- Entertainment: ${preferences.entertainment}` : ''}
${preferences.photography ? `- Photography: ${preferences.photography}` : ''}
${preferences.culturalPreferences ? `- Cultural Preferences: ${preferences.culturalPreferences}` : ''}
${preferences.dietaryRequirements ? `- Dietary Requirements: ${preferences.dietaryRequirements}` : ''}
${preferences.specialRequests ? `- Special Requests: ${preferences.specialRequests}` : ''}

IMPORTANT RULES:
1. All budget categories must add up to approximately ${currency} ${budget}. Do NOT exceed this total.
2. Use the guest count (${guestCount}) when calculating catering and venue costs.
3. Label all costs as estimates. Do not invent real vendor contacts or confirmed prices.
4. Make the plan specific to the event type (${type}) and location (${location}).
5. If any cultural preferences are given, incorporate them meaningfully.
6. Generate the timeline relative to ${date} (use daysBeforeEvent as integers).

Return ONLY a valid JSON object with this exact structure. No markdown, no extra text:
{
  "eventSummary": "string",
  "themeName": "string",
  "themeDescription": "string",
  "personalizedIdeas": [
    { "title": "string", "description": "string", "estimatedCost": number, "priority": "high|medium|low" }
  ],
  "budgetBreakdown": [
    { "category": "string", "estimatedCost": number, "reason": "string" }
  ],
  "timeline": [
    { "task": "string", "daysBeforeEvent": number, "category": "string", "priority": "high|medium|low" }
  ],
  "vendorChecklist": [
    { "category": "string", "suggestedAction": "string", "priority": "high|medium|low", "estimatedCost": number }
  ],
  "dayOfSchedule": [
    { "time": "string", "activity": "string", "durationMinutes": number }
  ],
  "riskChecklist": [
    { "risk": "string", "prevention": "string" }
  ],
  "budgetAdvice": "string",
  "assumptions": ["string"]
}`
}

function validatePlan(data) {
  if (!data || typeof data !== 'object') throw new Error('Invalid plan structure')
  if (!data.eventSummary) throw new Error('Missing eventSummary')
  if (!Array.isArray(data.budgetBreakdown) || data.budgetBreakdown.length === 0) throw new Error('Missing budget breakdown')
  if (!Array.isArray(data.timeline) || data.timeline.length === 0) throw new Error('Missing timeline')
  // Ensure all cost values are numbers
  data.budgetBreakdown = data.budgetBreakdown.map(b => ({
    ...b,
    estimatedCost: Number(b.estimatedCost) || 0,
  }))
  data.personalizedIdeas = (data.personalizedIdeas || []).map(i => ({
    ...i,
    estimatedCost: Number(i.estimatedCost) || 0,
  }))
  return data
}

export async function callGemini(eventData) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured')
  }

  const ai = new GoogleGenAI({ apiKey })
  const prompt = buildPrompt(eventData)

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  })

  const text = response.text?.()
  if (!text) throw new Error('Empty response from Gemini')

  // Extract JSON from response (strip any markdown fences)
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in Gemini response')

  const parsed = JSON.parse(jsonMatch[0])
  return validatePlan(parsed)
}

export async function callGeminiWithFallback(eventData) {
  try {
    const plan = await callGemini(eventData)
    return { ...plan, isFallback: false }
  } catch (err) {
    console.warn('[Gemini] Falling back to rule-based plan:', err.message)
    const fallback = generateFallbackPlan(eventData)
    return { ...fallback, isFallback: true }
  }
}
