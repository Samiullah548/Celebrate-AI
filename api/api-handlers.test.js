import { describe, it, expect } from 'vitest'
import healthHandler from './health.js'
import planEventHandler from './plan-event.js'

function createMockReqRes({ method = 'GET', body = null, headers = {} } = {}) {
  const req = {
    method,
    body,
    headers,
  }

  const res = {
    statusCode: 200,
    headers: {},
    ended: false,
    body: null,
    setHeader(key, value) {
      this.headers[key] = value
      return this
    },
    status(code) {
      this.statusCode = code
      return this
    },
    json(data) {
      this.body = data
      this.ended = true
      return this
    },
    end() {
      this.ended = true
      return this
    },
  }

  return { req, res }
}

describe('Vercel Serverless Function Handlers', () => {
  describe('api/health.js', () => {
    it('sets CORS headers and handles OPTIONS preflight', async () => {
      const { req, res } = createMockReqRes({ method: 'OPTIONS' })
      await healthHandler(req, res)

      expect(res.headers['Access-Control-Allow-Origin']).toBe('*')
      expect(res.headers['Access-Control-Allow-Methods']).toContain('GET')
      expect(res.statusCode).toBe(200)
      expect(res.ended).toBe(true)
    })

    it('returns 200 JSON with health status on GET', async () => {
      const { req, res } = createMockReqRes({ method: 'GET' })
      await healthHandler(req, res)

      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveProperty('status', 'ok')
      expect(res.body).toHaveProperty('geminiConfigured')
      expect(res.body).toHaveProperty('timestamp')
    })
  })

  describe('api/plan-event.js', () => {
    it('returns 405 Method Not Allowed when method is not POST', async () => {
      const { req, res } = createMockReqRes({ method: 'GET' })
      await planEventHandler(req, res)

      expect(res.statusCode).toBe(405)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error).toContain('Only POST is supported')
    })

    it('returns 400 when request body contains invalid JSON string', async () => {
      const { req, res } = createMockReqRes({
        method: 'POST',
        body: 'invalid-json{{{',
      })
      await planEventHandler(req, res)

      expect(res.statusCode).toBe(400)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error).toContain('Invalid JSON')
    })

    it('returns 400 when required fields are missing in body', async () => {
      const { req, res } = createMockReqRes({
        method: 'POST',
        body: { name: 'Only Name' },
      })
      await planEventHandler(req, res)

      expect(res.statusCode).toBe(400)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error).toContain('Event type is required')
    })

    it('returns 200 with generated plan for valid payload', async () => {
      const validPayload = {
        name: 'Product Launch',
        type: 'Corporate Event',
        date: '2026-12-05',
        location: 'Mumbai',
        guestCount: 120,
        budget: 250000,
        currency: 'INR',
      }

      const { req, res } = createMockReqRes({
        method: 'POST',
        body: validPayload,
      })
      await planEventHandler(req, res)

      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveProperty('eventSummary')
      expect(res.body).toHaveProperty('budgetBreakdown')
      expect(res.body).toHaveProperty('timeline')
    })
  })
})

