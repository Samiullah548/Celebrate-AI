import { describe, it, expect, beforeEach } from 'vitest'
import {
  getEvents,
  getEventById,
  saveEvent,
  deleteEvent,
  duplicateEvent,
  getSettings,
  saveSettings,
  getDashboardStats,
  clearAllData,
  formatCurrency,
  generateId,
  CURRENCIES,
} from './storage.js'

describe('storage.js - Data Persistence and Event Management', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('generateId', () => {
    it('generates unique event IDs with prefix', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).toMatch(/^evt_\d+_[a-z0-9]+$/)
      expect(id2).toMatch(/^evt_\d+_[a-z0-9]+$/)
      expect(id1).not.toBe(id2)
    })
  })

  describe('Event CRUD Operations', () => {
    it('returns empty array when no events exist', () => {
      expect(getEvents()).toEqual([])
    })

    it('handles corrupted localStorage data gracefully', () => {
      localStorage.setItem('celebrateai_events_v1', 'invalid-json{{{')
      expect(getEvents()).toEqual([])
    })

    it('saves a new event and retrieves it by id', () => {
      const newEvent = {
        id: 'evt_1',
        name: 'Sarah Birthday',
        type: 'Birthday',
        date: '2026-12-25',
        location: 'Mumbai',
        guestCount: 50,
        budget: 60000,
        currency: 'INR',
      }

      saveEvent(newEvent)
      const events = getEvents()
      expect(events).toHaveLength(1)
      expect(events[0].name).toBe('Sarah Birthday')
      expect(events[0].createdAt).toBeDefined()
      expect(events[0].updatedAt).toBeDefined()

      const retrieved = getEventById('evt_1')
      expect(retrieved).not.toBeNull()
      expect(retrieved.name).toBe('Sarah Birthday')
    })

    it('updates an existing event without creating duplicate', () => {
      const event = {
        id: 'evt_100',
        name: 'Initial Name',
        type: 'Anniversary',
        date: '2026-11-20',
        budget: 40000,
      }
      saveEvent(event)

      const updated = {
        ...event,
        name: 'Updated Anniversary Name',
        budget: 45000,
      }
      saveEvent(updated)

      const events = getEvents()
      expect(events).toHaveLength(1)
      expect(events[0].name).toBe('Updated Anniversary Name')
      expect(events[0].budget).toBe(45000)
    })

    it('returns null when event ID does not exist', () => {
      expect(getEventById('non-existent-id')).toBeNull()
    })

    it('deletes an event by ID', () => {
      saveEvent({ id: 'evt_del_1', name: 'Event to Delete' })
      saveEvent({ id: 'evt_keep_2', name: 'Event to Keep' })

      expect(getEvents()).toHaveLength(2)

      deleteEvent('evt_del_1')
      const remaining = getEvents()
      expect(remaining).toHaveLength(1)
      expect(remaining[0].id).toBe('evt_keep_2')
    })

    it('duplicates an event with a new ID, reset checklist status, and suffix', () => {
      const original = {
        id: 'evt_orig',
        name: 'Annual Gala',
        type: 'Corporate Event',
        date: '2026-12-10',
        budget: 200000,
        completedTasks: ['task_1'],
        checklist: [
          { id: 'c1', action: 'Book Hall', completed: true },
          { id: 'c2', action: 'Hire Caterer', completed: true },
        ],
      }
      saveEvent(original)

      const duplicated = duplicateEvent('evt_orig')
      expect(duplicated).not.toBeNull()
      expect(duplicated.id).not.toBe('evt_orig')
      expect(duplicated.name).toBe('Annual Gala (Copy)')
      expect(duplicated.completedTasks).toEqual([])
      expect(duplicated.checklist.every((item) => item.completed === false)).toBe(true)

      const events = getEvents()
      expect(events).toHaveLength(2)
    })

    it('returns null when duplicating non-existent event', () => {
      expect(duplicateEvent('missing_evt')).toBeNull()
    })

    it('clears all data including events and settings', () => {
      saveEvent({ id: 'evt_1', name: 'Event' })
      saveSettings({ currency: 'USD' })

      clearAllData()
      expect(getEvents()).toEqual([])
      expect(localStorage.getItem('celebrateai_events_v1')).toBeNull()
      expect(localStorage.getItem('celebrateai_settings_v1')).toBeNull()
    })
  })

  describe('Settings Management', () => {
    it('returns default settings when none are saved', () => {
      const settings = getSettings()
      expect(settings).toEqual({
        currency: 'INR',
        language: 'en',
        theme: 'dark',
        defaultBudget: 50000,
        defaultGuestCount: 50,
      })
    })

    it('persists and merges custom settings', () => {
      saveSettings({ currency: 'USD', defaultBudget: 75000 })
      const retrieved = getSettings()
      expect(retrieved.currency).toBe('USD')
      expect(retrieved.defaultBudget).toBe(75000)
      expect(retrieved.language).toBe('en') // default retained
    })
  })

  describe('getDashboardStats', () => {
    it('calculates correct stats with no events', () => {
      const stats = getDashboardStats()
      expect(stats.totalEvents).toBe(0)
      expect(stats.upcomingEvents).toBe(0)
      expect(stats.totalBudget).toBe(0)
      expect(stats.completionPct).toBe(0)
      expect(stats.recentEvents).toEqual([])
    })

    it('calculates aggregate budget and task completion accurately', () => {
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      saveEvent({
        id: 'e1',
        name: 'Future Event',
        date: futureDate,
        budget: 50000,
        plan: { timeline: [{ id: 't1' }, { id: 't2' }] },
        checklist: [{ id: 'c1', completed: true }],
        completedTasks: ['t1'],
      })

      saveEvent({
        id: 'e2',
        name: 'Past Event',
        date: pastDate,
        budget: 30000,
        plan: { timeline: [{ id: 't3' }] },
        checklist: [
          { id: 'c2', completed: true },
          { id: 'c3', completed: false },
        ],
        completedTasks: [],
      })

      const stats = getDashboardStats()
      expect(stats.totalEvents).toBe(2)
      expect(stats.upcomingEvents).toBe(1)
      expect(stats.totalBudget).toBe(80000)
      // Total tasks: (2+1) in e1 + (1+2) in e2 = 6 total tasks.
      // Completed: e1 has 1 (timeline) + 1 (checklist) = 2. e2 has 0 (timeline) + 1 (checklist) = 1. Total = 3 completed.
      // 3/6 = 50%
      expect(stats.completionPct).toBe(50)
      expect(stats.recentEvents).toHaveLength(2)
    })
  })

  describe('formatCurrency', () => {
    it('formats INR correctly without decimal places', () => {
      const formatted = formatCurrency(50000, 'INR')
      expect(formatted).toContain('50,000')
      expect(formatted).toMatch(/[₹\s]/)
    })

    it('formats USD correctly', () => {
      const formatted = formatCurrency(1200, 'USD')
      expect(formatted).toBe('$1,200')
    })

    it('falls back gracefully to INR for unknown currency code', () => {
      const formatted = formatCurrency(1000, 'UNKNOWN')
      expect(formatted).toContain('1,000')
    })

    it('handles 0 and falsy values without error', () => {
      expect(formatCurrency(0, 'USD')).toBe('$0')
      expect(formatCurrency(null, 'USD')).toBe('$0')
    })
  })

  describe('CURRENCIES list', () => {
    it('exports supported currency configurations', () => {
      expect(CURRENCIES).toBeInstanceOf(Array)
      expect(CURRENCIES.length).toBeGreaterThan(0)
      expect(CURRENCIES.find((c) => c.code === 'INR')).toBeDefined()
      expect(CURRENCIES.find((c) => c.code === 'USD')).toBeDefined()
    })
  })
})

