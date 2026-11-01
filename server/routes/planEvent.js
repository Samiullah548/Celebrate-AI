import express from 'express'
import { callGeminiWithFallback } from '../services/gemini.js'

export const planEventRoute = express.Router()

function validateEventData(data) {
  const errors = []
  if (!data.name || typeof data.name !== 'string') errors.push('Event name is required')
  if (!data.type) errors.push('Event type is required')
  if (!data.date) errors.push('Event date is required')
  if (!data.location) errors.push('Location is required')
  if (!data.guestCount || Number(data.guestCount) < 1) errors.push('Valid guest count is required')
  if (!data.budget || Number(data.budget) < 1) errors.push('Valid budget is required')
  return errors
}

planEventRoute.post('/', async (req, res) => {
  try {
    const eventData = req.body

    const errors = validateEventData(eventData)
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(', ') })
    }

    // Sanitize inputs
    const sanitized = {
      name: String(eventData.name).slice(0, 200),
      type: String(eventData.type).slice(0, 100),
      date: String(eventData.date),
      location: String(eventData.location).slice(0, 200),
      guestCount: Math.min(Math.max(Number(eventData.guestCount), 1), 10000),
      budget: Math.min(Math.max(Number(eventData.budget), 1), 100000000),
      currency: String(eventData.currency || 'INR').slice(0, 5),
      venuePreference: String(eventData.venuePreference || '').slice(0, 100),
      preferences: {
        spendingStyle: String(eventData.preferences?.spendingStyle || '').slice(0, 50),
        foodPreference: String(eventData.preferences?.foodPreference || '').slice(0, 50),
        theme: String(eventData.preferences?.theme || '').slice(0, 200),
        colorPalette: String(eventData.preferences?.colorPalette || '').slice(0, 200),
        decorationStyle: String(eventData.preferences?.decorationStyle || '').slice(0, 100),
        entertainment: String(eventData.preferences?.entertainment || '').slice(0, 500),
        photography: String(eventData.preferences?.photography || '').slice(0, 100),
        culturalPreferences: String(eventData.preferences?.culturalPreferences || '').slice(0, 500),
        dietaryRequirements: String(eventData.preferences?.dietaryRequirements || '').slice(0, 500),
        specialRequests: String(eventData.preferences?.specialRequests || '').slice(0, 1000),
      },
    }

    const plan = await callGeminiWithFallback(sanitized)
    res.json(plan)
  } catch (err) {
    console.error('[planEvent]', err.message)
    res.status(500).json({ error: 'Failed to generate plan. Please try again.' })
  }
})
