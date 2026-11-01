import { describe, it, expect } from 'vitest'
import { validateEventData, sanitizeEventData, processPlanRequest } from './planEvent.js'

describe('server/routes/planEvent.js - Validation and Sanitization', () => {
  const validEvent = {
    name: 'Diwali Corporate Gathering',
    type: 'Corporate Event',
    date: '2026-11-15',
    location: 'Bengaluru',
    guestCount: 150,
    budget: 300000,
    currency: 'INR',
    venuePreference: 'Hotel/Banquet',
    preferences: {
      spendingStyle: 'Balanced',
      foodPreference: 'Vegetarian',
      theme: 'Traditional Lighting',
    },
  }

  describe('validateEventData', () => {
    it('returns no errors for valid complete event data', () => {
      const errors = validateEventData(validEvent)
      expect(errors).toEqual([])
    })

    it('returns error when data is null or empty', () => {
      expect(validateEventData(null)).toContain('Request body is empty')
      expect(validateEventData(undefined)).toContain('Request body is empty')
    })

    it('validates required fields: name, type, date, location, guestCount, budget', () => {
      const errors = validateEventData({})
      expect(errors).toContain('Event name is required')
      expect(errors).toContain('Event type is required')
      expect(errors).toContain('Event date is required')
      expect(errors).toContain('Location is required')
      expect(errors).toContain('Valid guest count is required')
      expect(errors).toContain('Valid budget is required')
    })

    it('rejects non-positive guest count and budget', () => {
      const errors = validateEventData({
        ...validEvent,
        guestCount: 0,
        budget: -500,
      })
      expect(errors).toContain('Valid guest count is required')
      expect(errors).toContain('Valid budget is required')
    })
  })

  describe('sanitizeEventData', () => {
    it('sanitizes and clamps numbers and trims oversized strings', () => {
      const oversized = {
        name: 'A'.repeat(300),
        type: 'Custom Type',
        date: '2026-12-01',
        location: 'City'.repeat(100),
        guestCount: 50000, // exceeds max 10000
        budget: 999999999999, // exceeds max 100000000
        currency: 'INR_EXTRA_LONG',
        preferences: {
          theme: 'T'.repeat(500),
          specialRequests: 'S'.repeat(2000),
        },
      }

      const sanitized = sanitizeEventData(oversized)
      expect(sanitized.name.length).toBeLessThanOrEqual(200)
      expect(sanitized.location.length).toBeLessThanOrEqual(200)
      expect(sanitized.guestCount).toBe(10000)
      expect(sanitized.budget).toBe(100000000)
      expect(sanitized.currency.length).toBeLessThanOrEqual(5)
      expect(sanitized.preferences.theme.length).toBeLessThanOrEqual(200)
      expect(sanitized.preferences.specialRequests.length).toBeLessThanOrEqual(1000)
    })

    it('handles missing preferences gracefully', () => {
      const minimal = {
        name: 'Minimal Event',
        type: 'Birthday',
        date: '2026-11-20',
        location: 'Goa',
        guestCount: '15',
        budget: '25000',
      }

      const sanitized = sanitizeEventData(minimal)
      expect(sanitized.guestCount).toBe(15)
      expect(sanitized.budget).toBe(25000)
      expect(sanitized.preferences.spendingStyle).toBe('')
      expect(sanitized.currency).toBe('INR')
    })
  })

  describe('processPlanRequest', () => {
    it('throws a 400 error when validation fails', async () => {
      await expect(processPlanRequest({})).rejects.toMatchObject({
        status: 400,
      })
    })

    it('processes a valid event request and returns fallback or generated plan', async () => {
      const result = await processPlanRequest(validEvent)
      expect(result).toBeDefined()
      expect(result.eventSummary).toBeDefined()
      expect(result.budgetBreakdown).toBeInstanceOf(Array)
      expect(result.timeline).toBeInstanceOf(Array)
    })
  })
})

