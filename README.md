# CelebrateAI 🎉

**Plan Smarter. Celebrate Better.**

CelebrateAI is an AI-powered celebration and event-planning assistant that helps you organize weddings, birthdays, anniversaries, corporate events, and more. Powered by Google Gemini AI.

---

## Problem Statement

Planning an event is stressful, time-consuming, and often goes over budget. Most people lack access to professional event planners. CelebrateAI solves this by turning your event details into a complete, actionable plan in minutes.

## Solution Overview

- Fill in a 4-step event creation wizard with your event details, budget, and preferences.
- The AI generates a personalized plan including budget breakdown, planning timeline, vendor checklist, creative ideas, day-of schedule, and risk assessment.
- If the AI service is unavailable, a smart rule-based fallback plan is used instead.
- All data is saved to your browser's localStorage — no account required.

---

## Core Features

- **AI-Powered Event Plans** — Google Gemini generates personalized plans
- **Smart Budget Allocation** — Category-wise breakdown with Recharts visualization
- **Automated Planning Timeline** — Tasks with countdown to event date
- **Vendor Checklist** — Interactive checklist with custom items
- **Creative Ideas** — Personalized theme, décor, and entertainment suggestions
- **Day-of Schedule** — Chronological agenda
- **Risk & Backup Plan** — Common risks with prevention strategies
- **Dashboard** — Stats across all saved events
- **My Events** — Search, filter, duplicate, delete events
- **Settings** — Currency, language, defaults, data export
- **Demo Mode** — Works without an API key

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5 |
| Styling | Tailwind CSS 3 |
| Routing | React Router 6 |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Node.js, Express.js |
| AI | Google Gemini API (@google/genai) |
| Storage | Browser localStorage |

---

## Application Architecture

```
CelebrateAI/
├── src/                    # Frontend (React)
│   ├── components/
│   │   ├── AppShell.jsx    # Sidebar navigation layout
│   │   └── UI.jsx          # Shared UI components
│   ├── pages/
│   │   ├── Landing.jsx     # Landing page
│   │   ├── Dashboard.jsx   # Stats dashboard
│   │   ├── CreateEvent.jsx # 4-step event wizard
│   │   ├── EventPlan.jsx   # AI plan results (7 tabs)
│   │   ├── MyEvents.jsx    # Event list with search/filter
│   │   └── Settings.jsx    # User preferences
│   ├── services/
│   │   ├── storage.js      # localStorage data layer
│   │   └── aiService.js    # AI API calls + client fallback
│   ├── App.jsx             # React Router + Error Boundary
│   ├── main.jsx            # Entry point
│   └── index.css           # Tailwind + design system
├── server/                 # Backend (Express)
│   ├── routes/
│   │   └── planEvent.js    # POST /api/plan-event
│   ├── services/
│   │   ├── gemini.js       # Gemini API integration
│   │   └── fallback.js     # Rule-based fallback planner
│   └── server.js           # Express app
├── .env.example
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd CelebrateAI

# Install all dependencies
npm install
```

---

## Local Development

### Option A: Frontend only (Demo Mode — no AI key needed)

```bash
npm run dev
# Open http://localhost:5173
```

The app works in Demo Mode without a server. The fallback planner generates complete rule-based plans.

### Option B: Full stack (with live Gemini AI)

```bash
# Terminal 1 — Start the backend
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
npm run dev:server

# Terminal 2 — Start the frontend
npm run dev
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Backend
GEMINI_API_KEY=your_google_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
PORT=5000
CLIENT_URL=http://localhost:5173   # comma-separated in production

# Frontend (leave empty in dev — Vite proxy handles /api)
VITE_API_URL=
```

> **Never commit your `.env` file. It is in `.gitignore`.**

---

## Gemini API Configuration

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Create an API key
3. Add it to your `.env` as `GEMINI_API_KEY`
4. The model defaults to `gemini-1.5-flash` — change via `GEMINI_MODEL`

---

## AI Fallback Behavior

If the Gemini API is:
- Not configured (`GEMINI_API_KEY` is empty)
- Unavailable due to network issues
- Returning invalid responses

The app will automatically use a **rule-based fallback planner** that generates a complete, functional plan from your event inputs. The plan will be clearly labeled as **"Demo Mode"**. Users can regenerate with live AI once the API is configured.

---

## Testing

### Recommended Test Workflows

1. Open the app → click "Plan My Event" → verify navigation
2. Create a birthday event (₹50,000 budget, 100 guests) → generate plan
3. Check budget pie chart renders correctly
4. Mark a timeline task complete → refresh → verify it persists
5. Add a custom vendor checklist item → mark complete → verify
6. Create two events → verify data stays separate
7. Delete an event → confirm dialog → verify removal
8. Check dashboard stats update after creating/deleting events
9. Export event as JSON → verify file downloads

---

## Deployment

### Architecture

```
Vercel (Frontend SPA)  ←→  Railway/Render (Express API)
```

### Frontend → Vercel

```bash
# 1. Build locally to verify
npm run build

# 2. Push to GitHub (see GitHub section below)

# 3. Import repo in vercel.com → Framework: Vite → Root: ./
# 4. Set environment variable:
#      VITE_API_URL = https://your-backend.railway.app
# 5. Deploy
```

`vercel.json` is already configured for SPA routing.

### Backend → Railway

```bash
# 1. Push to GitHub
# 2. New Project on railway.app → Deploy from GitHub → select repo
# 3. Set Root Directory: /  (uses root package.json start script)
# 4. Set environment variables:
#      GEMINI_API_KEY  = your_key
#      GEMINI_MODEL    = gemini-1.5-flash
#      CLIENT_URL      = https://your-app.vercel.app
#      PORT            = (Railway sets this automatically)
# 5. Deploy — start script: npm start
```

### Backend → Render

```
Build Command:  npm install
Start Command:  npm start
Environment:    Node
Env vars:       GEMINI_API_KEY, CLIENT_URL
```

---

## Limitations

- LocalStorage has a ~5 MB limit; very large plans may approach this limit
- The AI prompt is optimized for Gemini but may need adjustment for other models
- No real vendor booking, price verification, or availability checking
- No user authentication (all data is local)
- The server must be separately deployed for live AI generation

---

## Future Improvements

- User accounts and cloud sync
- Real vendor directory integrations
- WhatsApp/email plan sharing
- Multi-language support (Hindi, Tamil, etc.)
- Budget tracking with real expense logging
- Calendar integrations
- Mobile app (React Native)
