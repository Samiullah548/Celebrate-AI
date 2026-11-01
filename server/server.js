import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import { planEventRoute } from './routes/planEvent.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// ─── CORS ─────────────────────────────────────────────────────────────────────
// CLIENT_URL can be a single URL or comma-separated list for multiple origins
// e.g. CLIENT_URL=https://celebrateai.vercel.app,https://www.celebrateai.com
const rawOrigins = process.env.CLIENT_URL || 'http://localhost:5173'
const allowedOrigins = rawOrigins
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

// In dev, also allow common Vite ports
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5174', 'http://localhost:5175')
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (no Origin header) and allowed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`))
      }
    },
    credentials: false,
  })
)

app.use(express.json({ limit: '50kb' }))

// ─── Rate limiting for AI endpoint ────────────────────────────────────────────
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many requests. Please wait before generating another plan.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/plan-event', aiLimiter, planEventRoute)

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
    timestamp: new Date().toISOString(),
  })
})

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message)
  if (err.message?.startsWith('CORS:')) {
    return res.status(403).json({ error: err.message })
  }
  res.status(500).json({ error: 'Internal server error' })
})

// ─── Export app for testing and serverless usage ────────────────────────────
export { app }

// ─── Start ────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`✅ CelebrateAI server running on port ${PORT}`)
    console.log(`   Allowed origins: ${allowedOrigins.join(', ')}`)
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️  GEMINI_API_KEY not set — AI generation will use fallback mode')
    }
  })
}
