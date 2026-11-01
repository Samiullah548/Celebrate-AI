import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateAIPlan, generateFallbackPlan } from './aiService.js'

describe('aiService.js - AI Plan Generation & Fallback Planner', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('generateAIPlan API requests', () => {
    const mockEvent = {
      id: 'test_evt_1',
      name: 'Rohan & Ananya Wedding',
      type: 'Wedding',
      date: '2026-12-30',
      location: 'Delhi',
      guestCount: 200,
      budget: 500000,
      currency: 'INR',
    }

    it('successfully calls API and returns plan with isFallback false when AI succeeds', async () => {
      const mockPlan = {
        eventSummary: 'A grand wedding celebration in Delhi',
        themeName: 'Royal Elegance',
        budgetBreakdown: [{ category: 'Venue', estimatedCost: 150000 }],
        timeline: [{ task: 'Book Venue', daysBeforeEvent: 60 }],
        vendorChecklist: [{ category: 'Venue', suggestedAction: 'Book venue', priority: 'high' }],
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockPlan,
      })

      const result = await generateAIPlan(mockEvent)
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(result.eventSummary).toBe('A grand wedding celebration in Delhi')
      expect(result.isFallback).toBe(false)
    })

    it('sets isFallback true when API response specifies fallback', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          eventSummary: 'Fallback wedding plan',
          isFallback: true,
          budgetBreakdown: [],
        }),
      })

      const result = await generateAIPlan(mockEvent)
      expect(result.isFallback).toBe(true)
    })

    it('handles 400 Bad Request with server error message', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Valid budget is required' }),
      })

      await expect(generateAIPlan(mockEvent)).rejects.toThrow('Valid budget is required')
    })

    it('handles 405 Method Not Allowed error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 405,
        json: async () => {
          throw new Error('Not JSON')
        },
        text: async () => '<!doctype html><html>405 Method Not Allowed</html>',
      })

      await expect(generateAIPlan(mockEvent)).rejects.toThrow(/405/i)
    })

    it('handles 504 Gateway Timeout error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 504,
        json: async () => {
          throw new Error('Not JSON')
        },
        text: async () => 'Gateway timeout',
      })

      await expect(generateAIPlan(mockEvent)).rejects.toThrow(/timeout/i)
    })

    it('handles AbortError timeout properly', async () => {
      const abortError = new Error('The operation was aborted')
      abortError.name = 'AbortError'
      global.fetch = vi.fn().mockRejectedValue(abortError)

      await expect(generateAIPlan(mockEvent)).rejects.toThrow(/timed out/i)
    })
  })

  describe('generateFallbackPlan - Rule-based Budget & Timeline Calculations', () => {
    const baseEvent = {
      name: 'Arjun 18th Birthday',
      type: 'Birthday',
      budget: 80000,
      guestCount: 60,
      location: 'Pune',
      date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: 'INR',
      preferences: {
        spendingStyle: 'Balanced',
        theme: 'Neon Carnival',
      },
    }

    it('creates a complete fallback plan structure with all required fields', () => {
      const plan = generateFallbackPlan(baseEvent)

      expect(plan.isFallback).toBe(true)
      expect(plan.eventSummary).toBeDefined()
      expect(plan.themeName).toBe('Neon Carnival')
      expect(plan.budgetBreakdown).toBeInstanceOf(Array)
      expect(plan.timeline).toBeInstanceOf(Array)
      expect(plan.vendorChecklist).toBeInstanceOf(Array)
      expect(plan.dayOfSchedule).toBeInstanceOf(Array)
      expect(plan.riskChecklist).toBeInstanceOf(Array)
      expect(plan.budgetAdvice).toBeDefined()
      expect(plan.assumptions).toBeInstanceOf(Array)
    })

    it('ensures sum of budget breakdown does not exceed the total budget', () => {
      const plan = generateFallbackPlan(baseEvent)
      const totalAllocated = plan.budgetBreakdown.reduce((sum, item) => sum + item.estimatedCost, 0)
      expect(totalAllocated).toBeLessThanOrEqual(baseEvent.budget)
      // Should be very close (within 1% rounding)
      expect(totalAllocated).toBeGreaterThanOrEqual(baseEvent.budget * 0.98)
    })

    it('allocates realistic categories in budget breakdown', () => {
      const plan = generateFallbackPlan(baseEvent)
      const categories = plan.budgetBreakdown.map((b) => b.category)

      expect(categories).toContain('Venue')
      expect(categories).toContain('Catering')
      expect(categories).toContain('Decoration')
      expect(categories.some((c) => c.toLowerCase().includes('photography'))).toBe(true)
    })

    it('generates chronological timeline with non-negative daysBeforeEvent', () => {
      const plan = generateFallbackPlan(baseEvent)
      expect(plan.timeline.length).toBeGreaterThan(0)
      plan.timeline.forEach((task) => {
        expect(task.daysBeforeEvent).toBeGreaterThanOrEqual(0)
        expect(typeof task.task).toBe('string')
        expect(['high', 'medium', 'low']).toContain(task.priority)
      })
    })

    it('generates vendor checklist items with estimated costs proportional to budget', () => {
      const plan = generateFallbackPlan(baseEvent)
      expect(plan.vendorChecklist.length).toBeGreaterThan(0)
      plan.vendorChecklist.forEach((item) => {
        expect(item.category).toBeDefined()
        expect(item.suggestedAction).toBeDefined()
        expect(item.estimatedCost).toBeGreaterThan(0)
      })
    })

    it('handles missing or zero inputs gracefully using sensible defaults', () => {
      const plan = generateFallbackPlan({})
      expect(plan.isFallback).toBe(true)
      expect(plan.budgetBreakdown.length).toBeGreaterThan(0)
      expect(plan.timeline.length).toBeGreaterThan(0)
    })
  })
})

