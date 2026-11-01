import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Wallet, CheckSquare, TrendingUp, Plus, ArrowRight, Sparkles } from 'lucide-react'
import { getEvents, getDashboardStats, formatCurrency, generateId, saveEvent } from '../services/storage.js'
import { StatCard, EmptyState, ProgressBar } from '../components/UI.jsx'

const SAMPLE_EVENT = {
  id: 'sample_demo_event',
  name: "Demo: Priya's Birthday Bash",
  type: 'Birthday',
  date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  location: 'Bangalore',
  guestCount: 80,
  budget: 75000,
  currency: 'INR',
  venuePreference: 'Hotel/Banquet',
  preferences: {
    spendingStyle: 'Balanced',
    foodPreference: 'Mixed',
    theme: 'Bollywood Night',
    colorPalette: 'Gold and Black',
  },
  plan: null,
  completedTasks: [],
  checklist: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

function EventCard({ event, onClick }) {
  const daysUntil = Math.ceil((new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24))
  const isPast = daysUntil < 0
  const totalTasks = (event.plan?.timeline?.length || 0) + (event.checklist?.length || 0)
  const doneTasks = (event.completedTasks?.length || 0) + (event.checklist?.filter((c) => c.completed)?.length || 0)
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <article
      tabIndex={0}
      role="button"
      aria-label={`View plan for ${event.name}, ${event.type} in ${event.location}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className="glass-card p-5 text-left hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300 w-full group cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-text group-hover:text-primary transition-colors">{event.name}</h3>
          <p className="text-xs text-subText mt-0.5">{event.type} · {event.location}</p>
        </div>
        <span className={`badge ${isPast ? 'bg-subText/20 text-subText' : 'bg-primary/20 text-[#A78BFA]'}`}>
          {isPast ? 'Past' : `${daysUntil}d`}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-subText mb-3">
        <span className="flex items-center gap-1.5">
          <Calendar size={12} aria-hidden="true" />
          {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <span className="flex items-center gap-1.5">
          <Wallet size={12} aria-hidden="true" />
          {formatCurrency(event.budget, event.currency)}
        </span>
      </div>
      {totalTasks > 0 && (
        <div>
          <div className="flex justify-between text-xs text-subText mb-1.5">
            <span>Planning Progress</span>
            <span>{progress}%</span>
          </div>
          <ProgressBar value={doneTasks} max={totalTasks} label={`${event.name} progress`} />
        </div>
      )}
      <div className="flex items-center gap-1 text-primary text-xs mt-3 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
        View Plan <ArrowRight size={12} aria-hidden="true" />
      </div>
    </article>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [events, setEvents] = useState([])

  useEffect(() => {
    const evts = getEvents()
    setEvents(evts)
    setStats(getDashboardStats())
  }, [])

  const loadSample = () => {
    const sample = { ...SAMPLE_EVENT, id: generateId() }
    saveEvent(sample)
    const evts = getEvents()
    setEvents(evts)
    setStats(getDashboardStats())
  }

  const isEmpty = events.length === 0

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-heading">Dashboard</h1>
          <p className="text-subText text-sm mt-1">Your event planning overview</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/create')}
          aria-label="Create a new event"
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={16} aria-hidden="true" />
          <span className="hidden sm:inline">New Event</span>
        </button>
      </header>

      {isEmpty ? (
        /* Empty State */
        <section aria-label="Welcome and Getting Started">
          <EmptyState
            icon={Sparkles}
            title="Welcome to CelebrateAI!"
            description="You haven't created any events yet. Start by planning your first celebration — or load a sample event to explore the app."
            action={
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/create')}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus size={16} aria-hidden="true" /> Plan My First Event
                </button>
                <button
                  type="button"
                  onClick={loadSample}
                  className="btn-secondary text-sm"
                >
                  Load Sample Event
                </button>
              </div>
            }
          />
        </section>
      ) : (
        <>
          {/* Stats Overview */}
          <section aria-label="Event Statistics" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Calendar} label="Total Events" value={stats?.totalEvents || 0} color="text-primary" />
            <StatCard icon={TrendingUp} label="Upcoming" value={stats?.upcomingEvents || 0} color="text-highlight" />
            <StatCard
              icon={Wallet}
              label="Total Budget"
              value={formatCurrency(stats?.totalBudget || 0, 'INR')}
              color="text-success"
            />
            <StatCard
              icon={CheckSquare}
              label="Completion"
              value={`${stats?.completionPct || 0}%`}
              sub="across all events"
              color="text-warning"
            />
          </section>

          {/* Recent Events */}
          <section aria-label="Your Events List">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text">Your Events</h2>
              <button
                type="button"
                onClick={() => navigate('/events')}
                aria-label="View all events"
                className="btn-ghost text-sm flex items-center gap-1"
              >
                View All <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.slice(0, 6).map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => navigate(`/event/${event.id}`)}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
