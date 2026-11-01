import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, RefreshCw, Save, Printer, Download, AlertTriangle,
  Lightbulb, Clock, CheckSquare, Wallet, Calendar, Users,
  MapPin, Sparkles, Shield, Loader, Check, Info, Trash2
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { getEventById, saveEvent, formatCurrency } from '../services/storage.js'
import { generateAIPlan } from '../services/aiService.js'
import { Badge, ProgressBar, Toast } from '../components/UI.jsx'

const TABS = [
  { id: 'overview', label: 'Overview', icon: Sparkles },
  { id: 'budget', label: 'Budget', icon: Wallet },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'checklist', label: 'Checklist', icon: CheckSquare },
  { id: 'ideas', label: 'Ideas', icon: Lightbulb },
  { id: 'schedule', label: 'Day Schedule', icon: Calendar },
  { id: 'risks', label: 'Risks', icon: Shield },
]

const CHART_COLORS = [
  '#8B5CF6', '#6366F1', '#22D3EE', '#34D399', '#FBBF24',
  '#F87171', '#A78BFA', '#67E8F9', '#6EE7B7', '#FCD34D',
]

// ─── Tab: Overview ────────────────────────────────────────────────────────────
function OverviewTab({ plan, event }) {
  const topPriorities = (plan.personalizedIdeas || [])
    .filter((i) => i.priority === 'high')
    .slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Summary */}
      <section className="glass-card p-6" aria-labelledby="summary-heading">
        <h3 id="summary-heading" className="font-semibold text-text mb-3 flex items-center gap-2">
          <Sparkles size={16} className="text-primary" aria-hidden="true" /> Event Summary
        </h3>
        <p className="text-subText text-sm leading-relaxed">{plan.eventSummary}</p>
      </section>

      {/* Theme */}
      <section className="glass-card p-6 relative overflow-hidden" aria-labelledby="theme-heading">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <h3 id="theme-heading" className="font-semibold text-text mb-1">Recommended Theme</h3>
        <p className="text-xl font-bold text-gradient mb-2">{plan.themeName}</p>
        <p className="text-subText text-sm leading-relaxed">{plan.themeDescription}</p>
      </section>

      {/* Budget Advice */}
      {plan.budgetAdvice && (
        <section className="glass-card p-5 flex gap-3 items-start" aria-labelledby="advice-heading">
          <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center shrink-0" aria-hidden="true">
            <Info size={16} className="text-warning" />
          </div>
          <div>
            <h4 id="advice-heading" className="font-semibold text-text text-sm mb-1">Budget Advice</h4>
            <p className="text-subText text-sm leading-relaxed">{plan.budgetAdvice}</p>
          </div>
        </section>
      )}

      {/* Top Priorities */}
      {topPriorities.length > 0 && (
        <section aria-labelledby="priorities-heading">
          <h3 id="priorities-heading" className="font-semibold text-text mb-3">Top Planning Priorities</h3>
          <div className="space-y-3">
            {topPriorities.map((idea, i) => (
              <div key={i} className="glass-card p-4 flex gap-4">
                <div
                  className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0"
                  aria-hidden="true"
                >
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-medium text-text text-sm">{idea.title}</h4>
                  <p className="text-subText text-xs mt-0.5">{idea.description}</p>
                  {idea.estimatedCost > 0 && (
                    <p className="text-primary text-xs mt-1 font-medium">
                      Est. {formatCurrency(idea.estimatedCost, event.currency)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Assumptions */}
      {plan.assumptions?.length > 0 && (
        <section className="glass-card p-4 border-warning/20" aria-labelledby="assumptions-heading">
          <h4 id="assumptions-heading" className="text-sm font-medium text-warning mb-2 flex items-center gap-1.5">
            <AlertTriangle size={14} aria-hidden="true" /> Planning Assumptions
          </h4>
          <ul className="space-y-1">
            {plan.assumptions.map((a, i) => (
              <li key={i} className="text-xs text-subText flex items-start gap-2">
                <span className="text-warning mt-0.5" aria-hidden="true">·</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

// ─── Tab: Budget ──────────────────────────────────────────────────────────────
function BudgetTab({ plan, event }) {
  const breakdown = plan.budgetBreakdown || []
  const total = Number(event.budget) || 0
  const planned = breakdown.reduce((s, c) => s + (Number(c.estimatedCost) || 0), 0)
  const remaining = total - planned

  const chartData = breakdown.map((item) => ({
    name: item.category,
    value: Number(item.estimatedCost) || 0,
  }))

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <section aria-label="Budget Overview" className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'Total Budget', value: formatCurrency(total, event.currency), color: 'text-text' },
          { label: 'Total Planned', value: formatCurrency(planned, event.currency), color: 'text-primary' },
          {
            label: 'Contingency / Remaining',
            value: formatCurrency(remaining, event.currency),
            color: remaining < 0 ? 'text-error' : 'text-success',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card p-4 text-center">
            <p className="text-subText text-xs mb-1 font-medium">{label}</p>
            <p className={`font-bold ${color} text-lg`}>{value}</p>
          </div>
        ))}
      </section>

      {/* Chart */}
      {chartData.length > 0 && (
        <section className="glass-card p-6" aria-labelledby="chart-heading">
          <h3 id="chart-heading" className="font-semibold text-text mb-4">Budget Allocation Chart</h3>
          <div className="h-64" aria-label="Visual breakdown of budget by category">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => formatCurrency(val, event.currency)}
                  contentStyle={{ background: '#151D32', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#F8FAFC' }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(val) => <span style={{ color: '#A7B2C8', fontSize: '12px' }}>{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Category Breakdown */}
      <section className="space-y-3" aria-labelledby="categories-heading">
        <h3 id="categories-heading" className="font-semibold text-text">Category Breakdown</h3>
        <div className="space-y-3">
          {breakdown.map((item, idx) => {
            const cost = Number(item.estimatedCost) || 0
            const pct = total > 0 ? Math.round((cost / total) * 100) : 0
            return (
              <div key={idx} className="glass-card p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-text text-sm">{item.category}</h4>
                    <p className="text-subText text-xs mt-0.5">{item.reason}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="font-semibold text-primary text-sm">
                      {formatCurrency(cost, event.currency)}
                    </p>
                    <p className="text-subText text-xs">{pct}% of budget</p>
                  </div>
                </div>
                <ProgressBar
                  value={cost}
                  max={total}
                  label={`${item.category} allocation: ${pct}%`}
                />
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

// ─── Tab: Timeline ────────────────────────────────────────────────────────────
function TimelineTab({ plan, event, onUpdateCompleted }) {
  const [completed, setCompleted] = useState(() => new Set(event.completedTasks || []))
  const [filter, setFilter] = useState('all')
  const timeline = plan.timeline || []
  const eventDate = new Date(event.date)
  const now = new Date()

  const tasks = timeline
    .map((t, idx) => {
      const dueDate = new Date(eventDate)
      dueDate.setDate(dueDate.getDate() - (t.daysBeforeEvent || 0))
      const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24))
      const isOverdue = daysLeft < 0 && !completed.has(idx.toString())
      return { ...t, id: idx.toString(), dueDate, daysLeft, isOverdue }
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)

  const filtered = tasks.filter((t) => {
    if (filter === 'pending') return !completed.has(t.id)
    if (filter === 'completed') return completed.has(t.id)
    if (filter === 'overdue') return t.isOverdue
    if (filter === 'high') return t.priority === 'high' && !completed.has(t.id)
    return true
  })

  const toggleTask = (id) => {
    const next = new Set(completed)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setCompleted(next)
    onUpdateCompleted([...next])
  }

  const completedCount = tasks.filter((t) => completed.has(t.id)).length

  return (
    <div className="space-y-4">
      {/* Progress */}
      <section className="glass-card p-4" aria-label="Timeline Task Progress">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-subText">Timeline Progress</span>
          <span className="text-text font-medium">
            {completedCount} / {tasks.length} tasks completed
          </span>
        </div>
        <ProgressBar
          value={completedCount}
          max={tasks.length}
          label={`Timeline progress: ${completedCount} of ${tasks.length} tasks completed`}
        />
      </section>

      {/* Filters */}
      <div
        role="group"
        aria-label="Filter timeline tasks"
        className="flex gap-2 overflow-x-auto pb-1"
      >
        {['all', 'pending', 'completed', 'overdue', 'high'].map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={filter === f ? 'tab-btn-active' : 'tab-btn-inactive'}
          >
            {f === 'high' ? 'High Priority' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-2" role="feed" aria-label="Timeline Tasks">
        {filtered.length === 0 && (
          <div className="glass-card p-8 text-center text-subText text-sm">
            No tasks match the selected filter.
          </div>
        )}
        {filtered.map((task) => {
          const done = completed.has(task.id)
          return (
            <article
              key={task.id}
              className={`glass-card p-4 flex gap-3 transition-all duration-200 ${
                done ? 'opacity-60' : ''
              } ${task.isOverdue ? 'border-error/30' : ''}`}
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={done}
                aria-label={`Mark task as ${done ? 'pending' : 'completed'}: ${task.task}`}
                onClick={() => toggleTask(task.id)}
                className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all focus-visible:ring-2 focus-visible:ring-primary ${
                  done ? 'bg-success border-success' : 'border-white/20 hover:border-primary'
                }`}
              >
                {done && <Check size={12} className="text-white" aria-hidden="true" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <p className={`text-sm font-medium ${done ? 'line-through text-subText' : 'text-text'}`}>
                    {task.task}
                  </p>
                  <Badge label={task.priority} priority={task.priority} />
                  {task.isOverdue && <span className="badge bg-error/20 text-[#FCA5A5]">Overdue</span>}
                </div>
                <div className="flex gap-3 text-xs text-subText">
                  <span>{task.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {task.daysLeft === 0
                      ? 'Today'
                      : task.daysLeft < 0
                      ? `${Math.abs(task.daysLeft)}d ago`
                      : `${task.daysLeft}d before event`}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{task.dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

// ─── Tab: Vendor Checklist ────────────────────────────────────────────────────
function ChecklistTab({ event, onUpdateChecklist }) {
  const [items, setItems] = useState(event.checklist || [])
  const [filter, setFilter] = useState('all')
  const [newItem, setNewItem] = useState({ action: '', category: 'Miscellaneous', priority: 'medium' })
  const [showAdd, setShowAdd] = useState(false)

  const categories = [...new Set(items.map((i) => i.category))]

  const save = (updated) => {
    setItems(updated)
    onUpdateChecklist(updated)
  }

  const toggle = (id) => {
    const updated = items.map((it) => (it.id === id ? { ...it, completed: !it.completed } : it))
    save(updated)
  }

  const deleteItem = (id) => {
    save(items.filter((it) => it.id !== id))
  }

  const addItem = () => {
    if (!newItem.action.trim()) return
    const item = {
      id: `custom_${Date.now()}`,
      action: newItem.action.trim(),
      category: newItem.category,
      priority: newItem.priority,
      completed: false,
      estimatedCost: 0,
      notes: '',
    }
    save([...items, item])
    setNewItem({ action: '', category: 'Miscellaneous', priority: 'medium' })
    setShowAdd(false)
  }

  const filtered = items.filter((it) => {
    if (filter === 'done') return it.completed
    if (filter === 'pending') return !it.completed
    if (filter !== 'all') return it.category === filter
    return true
  })

  const completedCount = items.filter((i) => i.completed).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="glass-card px-4 py-2 text-sm">
          <span className="text-subText">Checklist Progress: </span>
          <span className="text-text font-medium">{completedCount}/{items.length}</span>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          aria-expanded={showAdd}
          aria-controls="add-item-form"
          className="btn-primary text-sm flex items-center gap-1.5"
        >
          {showAdd ? 'Cancel' : '+ Add Item'}
        </button>
      </div>

      {showAdd && (
        <form
          id="add-item-form"
          onSubmit={(e) => {
            e.preventDefault()
            addItem()
          }}
          className="glass-card p-4 space-y-3"
        >
          <h4 className="text-sm font-semibold text-text">Add Custom Checklist Item</h4>
          <div>
            <label htmlFor="custom-item-action" className="label text-xs">
              Task Description *
            </label>
            <input
              id="custom-item-action"
              required
              className="input-field text-sm"
              placeholder="What needs to be done? e.g. Book DJ for sound check"
              value={newItem.action}
              onChange={(e) => setNewItem((n) => ({ ...n, action: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="custom-item-category" className="label text-xs">
                Category
              </label>
              <select
                id="custom-item-category"
                className="input-field text-sm"
                value={newItem.category}
                onChange={(e) => setNewItem((n) => ({ ...n, category: e.target.value }))}
              >
                {[
                  'Venue',
                  'Catering',
                  'Decoration',
                  'Photography & Videography',
                  'Entertainment',
                  'Invitations',
                  'Transportation',
                  'Equipment & AV',
                  'Miscellaneous',
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="custom-item-priority" className="label text-xs">
                Priority
              </label>
              <select
                id="custom-item-priority"
                className="input-field text-sm"
                value={newItem.priority}
                onChange={(e) => setNewItem((n) => ({ ...n, priority: e.target.value }))}
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-sm">
              Add Task
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div
        role="group"
        aria-label="Filter checklist items"
        className="flex gap-2 overflow-x-auto pb-1"
      >
        {['all', 'pending', 'done', ...categories].map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={filter === f ? 'tab-btn-active' : 'tab-btn-inactive'}
          >
            {f === 'done' ? 'Completed' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="space-y-2" role="feed" aria-label="Checklist items list">
        {filtered.length === 0 && (
          <div className="glass-card p-6 text-center text-subText text-sm">
            No checklist items match the current filter.
          </div>
        )}
        {filtered.map((item) => (
          <article
            key={item.id}
            className={`glass-card p-4 transition-all duration-200 ${
              item.completed ? 'opacity-60' : ''
            }`}
          >
            <div className="flex gap-3 items-start">
              <button
                type="button"
                role="checkbox"
                aria-checked={item.completed}
                aria-label={`Mark task as ${item.completed ? 'incomplete' : 'complete'}: ${item.action}`}
                onClick={() => toggle(item.id)}
                className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all focus-visible:ring-2 focus-visible:ring-primary ${
                  item.completed ? 'bg-success border-success' : 'border-white/20 hover:border-primary'
                }`}
              >
                {item.completed && <Check size={12} className="text-white" aria-hidden="true" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <p className={`text-sm ${item.completed ? 'line-through text-subText' : 'text-text'}`}>
                    {item.action}
                  </p>
                  <Badge label={item.priority} priority={item.priority} />
                </div>
                <div className="flex items-center gap-3 text-xs text-subText">
                  <span>{item.category}</span>
                  {item.estimatedCost > 0 && (
                    <span>· Est. {formatCurrency(item.estimatedCost, event.currency || 'INR')}</span>
                  )}
                </div>
                {item.notes && <p className="text-xs text-subText mt-1 italic">"{item.notes}"</p>}
              </div>
              <button
                type="button"
                onClick={() => deleteItem(item.id)}
                aria-label={`Delete checklist item: ${item.action}`}
                className="text-subText hover:text-error transition-colors text-xs p-1 rounded focus-visible:ring-1 focus-visible:ring-error"
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

// ─── Tab: Creative Ideas ──────────────────────────────────────────────────────
function IdeasTab({ plan, event }) {
  const ideas = plan.personalizedIdeas || []
  return (
    <div className="space-y-4" role="feed" aria-label="Creative Ideas">
      {ideas.map((idea, i) => (
        <article key={i} className="glass-card p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0" aria-hidden="true">
              <Lightbulb size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="font-semibold text-text text-sm">{idea.title}</h3>
                <Badge label={idea.priority} priority={idea.priority} />
              </div>
              <p className="text-subText text-sm leading-relaxed">{idea.description}</p>
              {idea.estimatedCost > 0 && (
                <p className="text-primary text-sm font-medium mt-2">
                  Estimated Cost: {formatCurrency(idea.estimatedCost, event.currency)}
                </p>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

// ─── Tab: Day Schedule ────────────────────────────────────────────────────────
function ScheduleTab({ plan }) {
  const schedule = plan.dayOfSchedule || []
  return (
    <div className="space-y-3" role="feed" aria-label="Day-of Event Schedule">
      {schedule.map((item, i) => (
        <article key={i} className="glass-card p-4 flex gap-4">
          <div className="text-center shrink-0 w-16">
            <p className="text-primary font-bold text-sm">{item.time}</p>
            {item.durationMinutes && (
              <p className="text-subText text-xs">{item.durationMinutes}m</p>
            )}
          </div>
          <div className="flex-1 border-l border-white/10 pl-4">
            <p className="text-text text-sm">{item.activity}</p>
          </div>
        </article>
      ))}
    </div>
  )
}

// ─── Tab: Risks ───────────────────────────────────────────────────────────────
function RisksTab({ plan }) {
  const risks = plan.riskChecklist || []
  return (
    <div className="space-y-3" role="feed" aria-label="Risk Management Checklist">
      {risks.map((r, i) => (
        <article key={i} className="glass-card p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center shrink-0" aria-hidden="true">
              <AlertTriangle size={16} className="text-error" />
            </div>
            <div>
              <h3 className="font-medium text-text text-sm mb-1">{r.risk}</h3>
              <p className="text-subText text-sm">
                <span className="text-success font-medium">Prevention: </span>
                {r.prevention}
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

// ─── Main Event Plan Page ─────────────────────────────────────────────────────
export default function EventPlan() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [regenerating, setRegenerating] = useState(false)
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)

  useEffect(() => {
    const ev = getEventById(id)
    if (!ev) {
      navigate('/events')
      return
    }
    setEvent(ev)
  }, [id, navigate])

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

  const handleSave = () => {
    if (event) {
      saveEvent(event)
      showToast('Event saved successfully!')
    }
  }

  const updateCompleted = (completedTasks) => {
    const updated = { ...event, completedTasks }
    setEvent(updated)
    saveEvent(updated)
  }

  const updateChecklist = (checklist) => {
    const updated = { ...event, checklist }
    setEvent(updated)
    saveEvent(updated)
  }

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      const plan = await generateAIPlan(event)
      const updated = { ...event, plan }
      setEvent(updated)
      saveEvent(updated)
      showToast('Plan regenerated successfully!')
    } catch (err) {
      showToast(err.message || 'Failed to regenerate plan.', 'error')
    } finally {
      setRegenerating(false)
    }
  }

  const handlePrint = () => window.print()

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(event, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${event.name.replace(/\s+/g, '_')}_plan.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
        <div
          className="w-8 h-8 border-2 border-white/10 border-t-primary rounded-full animate-spin"
          aria-hidden="true"
        />
        <span className="sr-only">Loading event details...</span>
      </div>
    )
  }

  const plan = event.plan
  const daysUntil = Math.ceil((new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24))

  if (!plan) {
    return (
      <section className="p-6 max-w-2xl mx-auto text-center" aria-labelledby="no-plan-heading">
        <div className="glass-card p-10">
          <AlertTriangle size={36} className="text-warning mx-auto mb-4" aria-hidden="true" />
          <h2 id="no-plan-heading" className="text-xl font-bold text-text mb-2">
            No Plan Generated
          </h2>
          <p className="text-subText mb-6">This event doesn't have an AI plan yet.</p>
          <button
            type="button"
            onClick={() => navigate('/create')}
            className="btn-primary"
          >
            Create New Event
          </button>
        </div>
      </section>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-fade-in">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}

      {/* Header Landmark */}
      <header className="mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back to previous page"
          className="btn-ghost text-sm flex items-center gap-1 mb-4"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Back
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-text">{event.name}</h1>
              {plan.isFallback && (
                <span className="badge bg-warning/20 text-[#FDE047] text-xs">Demo Mode</span>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-subText">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} aria-hidden="true" />
                {new Date(event.date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={13} aria-hidden="true" />
                {event.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={13} aria-hidden="true" />
                {event.guestCount} guests
              </span>
              <span className="flex items-center gap-1.5">
                <Wallet size={13} aria-hidden="true" />
                {formatCurrency(event.budget, event.currency)}
              </span>
            </div>
            {daysUntil > 0 && (
              <p className="text-primary text-sm font-medium mt-1">{daysUntil} days until the event</p>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={regenerating}
              aria-label="Regenerate plan with AI"
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              {regenerating ? (
                <Loader size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw size={14} aria-hidden="true" />
              )}
              Regenerate
            </button>
            <button
              type="button"
              onClick={handleSave}
              aria-label="Save event changes"
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <Save size={14} aria-hidden="true" /> Save
            </button>
            <button
              type="button"
              onClick={handleExport}
              aria-label="Export plan as JSON"
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <Download size={14} aria-hidden="true" /> Export
            </button>
            <button
              type="button"
              onClick={handlePrint}
              aria-label="Print event plan"
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <Printer size={14} aria-hidden="true" /> Print
            </button>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav
        role="tablist"
        aria-label="Event Plan Views"
        className="flex gap-1 overflow-x-auto pb-2 mb-6"
      >
        {TABS.map((tab) => {
          const isSelected = activeTab === tab.id
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              type="button"
              aria-selected={isSelected}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                isSelected ? 'tab-btn-active' : 'tab-btn-inactive'
              } flex items-center gap-1.5 shrink-0`}
            >
              <tab.icon size={14} aria-hidden="true" /> {tab.label}
            </button>
          )
        })}
      </nav>

      {/* Tab Panel Content */}
      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="animate-fade-in focus:outline-none"
      >
        <h2 className="sr-only">{TABS.find((t) => t.id === activeTab)?.label} Details</h2>
        {activeTab === 'overview' && <OverviewTab plan={plan} event={event} />}
        {activeTab === 'budget' && <BudgetTab plan={plan} event={event} />}
        {activeTab === 'timeline' && (
          <TimelineTab plan={plan} event={event} onUpdateCompleted={updateCompleted} />
        )}
        {activeTab === 'checklist' && (
          <ChecklistTab event={event} onUpdateChecklist={updateChecklist} />
        )}
        {activeTab === 'ideas' && <IdeasTab plan={plan} event={event} />}
        {activeTab === 'schedule' && <ScheduleTab plan={plan} />}
        {activeTab === 'risks' && <RisksTab plan={plan} />}
      </div>
    </div>
  )
}
