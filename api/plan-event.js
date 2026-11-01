import { processPlanRequest } from '../server/routes/planEvent.js'
import { sanitizeErrorMessage } from '../server/services/gemini.js'

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Only POST is supported.' })
  }

  try {
    let body = req.body
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch {
        return res.status(400).json({ error: 'Invalid JSON in request body' })
      }
    }

    const plan = await processPlanRequest(body)
    return res.status(200).json(plan)
  } catch (err) {
    console.error('[Vercel Serverless api/plan-event]', err.message)
    const statusCode = err.status || 500
    return res.status(statusCode).json({ error: sanitizeErrorMessage(err.message) })
  }
}
