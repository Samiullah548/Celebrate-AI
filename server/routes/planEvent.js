import express from 'express'
import { callGeminiWithFallback, callGemini, sanitizeErrorMessage } from '../services/gemini.js'

export const planEventRoute = express.Router()

export function validateEventData(data) {
  const errors = []
  if (!data) return ['Request body is empty']
  if (!data.name || typeof data.name !== 'string') errors.push('Event name is required')
  if (!data.type) errors.push('Event type is required')
  if (!data.date) errors.push('Event date is required')
  if (!data.location) errors.push('Location is required')
  if (!data.guestCount || Number(data.guestCount) < 1) errors.push('Valid guest count is required')
  if (!data.budget || Number(data.budget) < 1) errors.push('Valid budget is required')
  return errors
}

export function sanitizeEventData(eventData) {
  return {
    name: String(eventData.name || '').slice(0, 200),
    type: String(eventData.type || '').slice(0, 100),
    date: String(eventData.date || ''),
    location: String(eventData.location || '').slice(0, 200),
    guestCount: Math.min(Math.max(Number(eventData.guestCount) || 1, 1), 10000),
    budget: Math.min(Math.max(Number(eventData.budget) || 1, 1), 100000000),
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
}

export async function processPlanRequest(eventData) {
  const errors = validateEventData(eventData)
  if (errors.length > 0) {
    const err = new Error(errors.join(', '))
    err.status = 400
    throw err
  }

  const sanitized = sanitizeEventData(eventData)
  return await callGeminiWithFallback(sanitized)
}

planEventRoute.post('/', async (req, res) => {
  try {
    const plan = await processPlanRequest(req.body)
    res.json(plan)
  } catch (err) {
    console.error('[planEvent error]', err.message)
    const statusCode = err.status || 500
    res.status(statusCode).json({ error: sanitizeErrorMessage(err.message) })
  }
})
