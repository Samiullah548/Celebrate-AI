import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sanitizeErrorMessage, callGeminiWithFallback } from './gemini.js'

describe('server/services/gemini.js - Gemini AI Integration & Error Handling', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  describe('sanitizeErrorMessage', () => {
    it('redacts Google Gemini API keys matching AIza pattern', () => {
      const leakedKey = 'AIzaSyD1234567890abcdefghijklmnopqrstuv'
      const errorMsg = `Request failed: invalid key ${leakedKey} for project`
      const sanitized = sanitizeErrorMessage(errorMsg)

      expect(sanitized).not.toContain(leakedKey)
      expect(sanitized).toContain('[REDACTED_KEY]')
    })

    it('returns generic error message when input is undefined or null', () => {
      expect(sanitizeErrorMessage(null)).toBe('An error occurred during AI plan generation.')
      expect(sanitizeErrorMessage(undefined)).toBe('An error occurred during AI plan generation.')
    })

    it('preserves safe user-facing error text', () => {
      const safe = 'Event date is required'
      expect(sanitizeErrorMessage(safe)).toBe(safe)
    })
  })

  describe('callGeminiWithFallback', () => {
    const testData = {
      name: 'Silver Jubilee',
      type: 'Anniversary',
      date: '2026-12-15',
      location: 'Hyderabad',
      guestCount: 100,
      budget: 150000,
      currency: 'INR',
    }

    it('returns a fallback plan when GEMINI_API_KEY is not set', async () => {
      delete process.env.GEMINI_API_KEY

      const plan = await callGeminiWithFallback(testData)
      expect(plan).toBeDefined()
      expect(plan.isFallback).toBe(true)
      expect(plan.eventSummary).toBeDefined()
      expect(plan.budgetBreakdown.length).toBeGreaterThan(0)
      expect(plan.timeline.length).toBeGreaterThan(0)
      expect(plan.warning).toContain('GEMINI_API_KEY')
    })
  })
})

