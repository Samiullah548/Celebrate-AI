import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Calendar, Wallet, Users, Trash2, Copy, Eye, Plus, List
} from 'lucide-react'
import { getEvents, deleteEvent, duplicateEvent, formatCurrency } from '../services/storage.js'
import { EmptyState, ConfirmDialog, ProgressBar, Toast } from '../components/UI.jsx'

const EVENT_TYPE_FILTERS = ['All', 'Wedding', 'Birthday', 'Anniversary', 'Engagement', 'Graduation Party', 'Corporate Event', 'Community Event', 'Festival', 'Other']

function EventCard({ event, onView, onDuplicate, onDelete }) {
  const daysUntil = Math.ceil((new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24))
  const isPast = daysUntil < 0
  const totalTasks = (event.plan?.timeline?.length || 0) + (event.checklist?.length || 0)
  const doneTasks = (event.completedTasks?.length || 0) + (event.checklist?.filter((c) => c.completed)?.length || 0)
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  return (
    <article className="glass-card p-5 hover:border-white/10 transition-all duration-300 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-text truncate">{event.name}</h3>
            <p className="text-xs text-subText mt-0.5">{event.type}</p>
          </div>
          <span
            className={`badge shrink-0 ${
              isPast ? 'bg-subText/20 text-subText' : 'bg-primary/20 text-[#A78BFA]'
            }`}
          >
            {isPast ? 'Past' : `${daysUntil}d`}
          </span>
        </div>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-subText">
            <Calendar size={12} aria-hidden="true" />
            <span>
              {new Date(event.date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-subText">
            <Users size={12} aria-hidden="true" />
            <span>{event.guestCount} guests</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-subText">
            <Wallet size={12} aria-hidden="true" />
            <span>{formatCurrency(event.budget, event.currency)}</span>
          </div>
        </div>

        {totalTasks > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-subText mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <ProgressBar value={doneTasks} max={totalTasks} label={`${event.name} progress`} />
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap pt-2 border-t border-white/5">
        <button
          type="button"
          onClick={onView}
          aria-label={`View plan for ${event.name}`}
          className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
        >
          <Eye size={13} aria-hidden="true" /> View Plan
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          aria-label={`Duplicate ${event.name}`}
          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
        >
          <Copy size={13} aria-hidden="true" /> Duplicate
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${event.name}`}
          className="text-xs px-3 py-1.5 rounded-xl bg-error/15 text-[#FCA5A5] hover:bg-error/25 transition-colors flex items-center gap-1.5 focus-visible:ring-1 focus-visible:ring-error"
        >
          <Trash2 size={13} aria-hidden="true" /> Delete
        </button>
      </div>
    </article>
  )
}

export default function MyEvents() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [timeFilter, setTimeFilter] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)

  useEffect(() => {
    setEvents(getEvents())
  }, [])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  const showToast = (message, type = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ message, type })
    toastTimerRef.current = setTimeout(() => setToast(null), 3000)
  }

  const handleDelete = () => {
    deleteEvent(deleteTarget)
    setEvents(getEvents())
    setDeleteTarget(null)
    showToast('Event deleted.')
  }

  const handleDuplicate = (id) => {
    duplicateEvent(id)
    setEvents(getEvents())
    showToast('Event duplicated!')
  }

  const filtered = events.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.location?.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'All' || e.type === typeFilter
    const now = new Date()
    const matchTime =
      timeFilter === 'all' ||
      (timeFilter === 'upcoming' && new Date(e.date) >= now) ||
      (timeFilter === 'past' && new Date(e.date) < now)
    return matchSearch && matchType && matchTime
  })

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Event?"
        description="This will permanently remove the event and all its planning data. This action cannot be undone."
        confirmText="Delete Event"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-heading">My Events</h1>
          <p className="text-subText text-sm mt-1">
            {events.length} event{events.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/create')}
          aria-label="Create a new event"
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={16} aria-hidden="true" /> New Event
        </button>
      </header>

      {events.length === 0 ? (
        <EmptyState
          icon={List}
          title="No Events Yet"
          description="Create your first event to get started."
          action={
            <button
              type="button"
              onClick={() => navigate('/create')}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} aria-hidden="true" /> Create Event
            </button>
          }
        />
      ) : (
        <>
          {/* Search & Filters */}
          <section aria-label="Filter and Search Events" className="space-y-3 mb-6">
            <div className="relative">
              <label htmlFor="event-search" className="sr-only">
                Search events by name or location
              </label>
              <Search
                size={16}
                aria-hidden="true"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subText pointer-events-none"
              />
              <input
                id="event-search"
                type="search"
                className="input-field pl-10 text-sm"
                placeholder="Search events by name or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div
              role="group"
              aria-label="Filter events by date"
              className="flex gap-2 overflow-x-auto pb-1"
            >
              {['all', 'upcoming', 'past'].map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={timeFilter === f}
                  onClick={() => setTimeFilter(f)}
                  className={timeFilter === f ? 'tab-btn-active' : 'tab-btn-inactive'}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div
              role="group"
              aria-label="Filter events by type"
              className="flex gap-2 overflow-x-auto pb-1"
            >
              {EVENT_TYPE_FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={typeFilter === f}
                  onClick={() => setTypeFilter(f)}
                  className={typeFilter === f ? 'tab-btn-active' : 'tab-btn-inactive'}
                >
                  {f}
                </button>
              ))}
            </div>
          </section>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="glass-card p-8 text-center text-subText">
              No events match your search criteria.
            </div>
          ) : (
            <section aria-label="Events List" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onView={() => navigate(`/event/${event.id}`)}
                  onDuplicate={() => handleDuplicate(event.id)}
                  onDelete={() => setDeleteTarget(event.id)}
                />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}
