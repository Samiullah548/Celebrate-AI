import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from './server.js'

describe('server/server.js - Express API Endpoints', () => {
  describe('GET /api/health', () => {
    it('returns 200 with server status and environment details', async () => {
      const response = await request(app).get('/api/health')
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('status', 'ok')
      expect(response.body).toHaveProperty('geminiConfigured')
      expect(response.body).toHaveProperty('model')
      expect(response.body).toHaveProperty('timestamp')
    })
  })

  describe('POST /api/plan-event', () => {
    const validPayload = {
      name: 'Tech Meetup 2026',
      type: 'Corporate Event',
      date: '2026-11-25',
      location: 'Pune',
      guestCount: 80,
      budget: 100000,
      currency: 'INR',
      venuePreference: 'Hotel/Banquet',
      preferences: {
        spendingStyle: 'Balanced',
      },
    }

    it('returns 200 and a complete structured event plan for valid request', async () => {
      const response = await request(app)
        .post('/api/plan-event')
        .send(validPayload)
        .set('Content-Type', 'application/json')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('eventSummary')
      expect(response.body).toHaveProperty('budgetBreakdown')
      expect(Array.isArray(response.body.budgetBreakdown)).toBe(true)
      expect(response.body).toHaveProperty('timeline')
      expect(Array.isArray(response.body.timeline)).toBe(true)
      expect(response.body).toHaveProperty('vendorChecklist')
    })

    it('returns 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/plan-event')
        .send({ name: 'Incomplete Event' })
        .set('Content-Type', 'application/json')

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('Event type is required')
    })

    it('returns 400 for empty body', async () => {
      const response = await request(app)
        .post('/api/plan-event')
        .send({})
        .set('Content-Type', 'application/json')

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('404 Route Handling', () => {
    it('returns 404 for undefined routes', async () => {
      const response = await request(app).get('/api/does-not-exist')
      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error', 'Route not found')
    })
  })
})

