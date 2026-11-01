import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, ChevronLeft, Check, Loader, AlertCircle,
  Calendar, MapPin, Users, Wallet, Sparkles, Eye
} from 'lucide-react'
import { generateId, saveEvent, getSettings, formatCurrency } from '../services/storage.js'
import { generateAIPlan } from '../services/aiService.js'

const EVENT_TYPES = [
  'Wedding', 'Birthday', 'Anniversary', 'Engagement',
  'Graduation Party', 'Corporate Event', 'Community Event', 'Festival', 'Other'
]
const VENUE_PREFS = ['Indoor', 'Outdoor', 'Home', 'Hotel/Banquet', 'Flexible']
const SPENDING_STYLES = ['Budget-Friendly', 'Balanced', 'Premium']
const FOOD_PREFS = ['Vegetarian', 'Non-Vegetarian', 'Mixed', 'Custom']
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AUD']
const DECO_STYLES = ['Minimalist', 'Traditional', 'Modern', 'Bohemian', 'Rustic', 'Floral', 'Royal/Grand', 'Themed']
const PHOTO_PREFS = ['Professional Photographer', 'Professional Videographer', 'Both', 'Candid Only', 'Self/Guests', 'None']

const STEPS = [
  { id: 1, label: 'Event Details', icon: Calendar },
  { id: 2, label: 'Guests & Budget', icon: Wallet },
  { id: 3, label: 'Style & Preferences', icon: Sparkles },
  { id: 4, label: 'Review & Generate', icon: Eye },
]

const INITIAL_FORM = {
  name: '',
  type: '',
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  venuePreference: '',
  duration: '',
  guestCount: '',
  budget: '',
  currency: 'INR',
  budgetFlexibility: '',
  spendingStyle: '',
  foodPreference: '',
  dietaryRequirements: '',
  theme: '',
  colorPalette: '',
  decorationStyle: '',
  entertainment: '',
  photography: '',
  accessibilityRequirements: '',
  specialRequests: '',
  culturalPreferences: '',
}

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center mb-8 overflow-x-auto pb-2">
      {STEPS.map((step, idx) => {
        const done = currentStep > step.id
        const active = currentStep === step.id
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                done ? 'bg-success border-success' : active ? 'bg-primary border-primary' : 'bg-transparent border-white/20'
              }`}>
                {done ? <Check size={16} className="text-white" /> : <step.icon size={15} className={active ? 'text-white' : 'text-subText'} />}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${active ? 'text-primary' : done ? 'text-success' : 'text-subText'}`}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`h-px flex-1 mx-2 transition-colors duration-300 ${done ? 'bg-success/50' : 'bg-white/10'}`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function FieldError({ msg }) {
  if (!msg) return null
  return <p className="text-error text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{msg}</p>
}

function SelectGrid({ options, value, onChange, label }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
              value === opt
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-white/5 border-white/10 text-subText hover:text-text hover:border-white/20'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Step 1: Basic Details ────────────────────────────────────────────────────

function Step1({ form, setField, errors }) {
  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className="label">Event Name *</label>
          <input
            className="input-field"
            placeholder="e.g. Priya's 30th Birthday Bash"
            value={form.name}
            onChange={e => setField('name', e.target.value)}
          />
          <FieldError msg={errors.name} />
        </div>
        <div>
          <label className="label">Event Date *</label>
          <input
            type="date"
            className="input-field"
            value={form.date}
            onChange={e => setField('date', e.target.value)}
          />
          <FieldError msg={errors.date} />
        </div>
      </div>

      <SelectGrid
        label="Event Type *"
        options={EVENT_TYPES}
        value={form.type}
        onChange={v => setField('type', v)}
      />
      <FieldError msg={errors.type} />

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className="label">Start Time</label>
          <input type="time" className="input-field" value={form.startTime} onChange={e => setField('startTime', e.target.value)} />
        </div>
        <div>
          <label className="label">End Time</label>
          <input type="time" className="input-field" value={form.endTime} onChange={e => setField('endTime', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">City / Event Location *</label>
        <input
          className="input-field"
          placeholder="e.g. Mumbai, Maharashtra"
          value={form.location}
          onChange={e => setField('location', e.target.value)}
        />
        <FieldError msg={errors.location} />
      </div>

      <SelectGrid
        label="Venue Preference"
        options={VENUE_PREFS}
        value={form.venuePreference}
        onChange={v => setField('venuePreference', v)}
      />
    </div>
  )
}

// ─── Step 2: Guests & Budget ──────────────────────────────────────────────────

function Step2({ form, setField, errors }) {
  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className="label">Estimated Guest Count *</label>
          <input
            type="number"
            min="1"
            className="input-field"
            placeholder="e.g. 100"
            value={form.guestCount}
            onChange={e => setField('guestCount', e.target.value)}
          />
          <FieldError msg={errors.guestCount} />
        </div>
        <div>
          <label className="label">Currency</label>
          <select className="input-field" value={form.currency} onChange={e => setField('currency', e.target.value)}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Total Budget * ({form.currency})</label>
        <input
          type="number"
          min="1"
          className="input-field"
          placeholder="e.g. 50000"
          value={form.budget}
          onChange={e => setField('budget', e.target.value)}
        />
        <FieldError msg={errors.budget} />
        {form.budget && form.guestCount && (
          <p className="text-xs text-subText mt-1.5">
            ≈ {formatCurrency(form.budget / form.guestCount, form.currency)} per guest
          </p>
        )}
      </div>

      <div>
        <label className="label">Budget Flexibility (optional)</label>
        <input
          className="input-field"
          placeholder="e.g. Can stretch by ₹10,000 for the right venue"
          value={form.budgetFlexibility}
          onChange={e => setField('budgetFlexibility', e.target.value)}
        />
      </div>

      <SelectGrid
        label="Preferred Spending Style"
        options={SPENDING_STYLES}
        value={form.spendingStyle}
        onChange={v => setField('spendingStyle', v)}
      />

      <SelectGrid
        label="Food Preference"
        options={FOOD_PREFS}
        value={form.foodPreference}
        onChange={v => setField('foodPreference', v)}
      />

      <div>
        <label className="label">Dietary Requirements (optional)</label>
        <input
          className="input-field"
          placeholder="e.g. Jain food, Gluten-free options"
          value={form.dietaryRequirements}
          onChange={e => setField('dietaryRequirements', e.target.value)}
        />
      </div>
    </div>
  )
}

// ─── Step 3: Style & Preferences ─────────────────────────────────────────────

function Step3({ form, setField }) {
  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className="label">Event Theme</label>
          <input
            className="input-field"
            placeholder="e.g. Bollywood Night, Garden Party"
            value={form.theme}
            onChange={e => setField('theme', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Preferred Color Palette</label>
          <input
            className="input-field"
            placeholder="e.g. Gold and Black, Pastel Pink"
            value={form.colorPalette}
            onChange={e => setField('colorPalette', e.target.value)}
          />
        </div>
      </div>

      <SelectGrid
        label="Decoration Style"
        options={DECO_STYLES}
        value={form.decorationStyle}
        onChange={v => setField('decorationStyle', v)}
      />

      <SelectGrid
        label="Photography Preference"
        options={PHOTO_PREFS}
        value={form.photography}
        onChange={v => setField('photography', v)}
      />

      <div>
        <label className="label">Entertainment Preferences</label>
        <input
          className="input-field"
          placeholder="e.g. Live band, DJ, Magician, Dance performance"
          value={form.entertainment}
          onChange={e => setField('entertainment', e.target.value)}
        />
      </div>

      <div>
        <label className="label">Cultural / Regional Preferences</label>
        <input
          className="input-field"
          placeholder="e.g. South Indian traditions, Punjabi customs"
          value={form.culturalPreferences}
          onChange={e => setField('culturalPreferences', e.target.value)}
        />
      </div>

      <div>
        <label className="label">Accessibility Requirements</label>
        <input
          className="input-field"
          placeholder="e.g. Wheelchair access, Sign language interpreter"
          value={form.accessibilityRequirements}
          onChange={e => setField('accessibilityRequirements', e.target.value)}
        />
      </div>

      <div>
        <label className="label">Special Requests</label>
        <textarea
          className="input-field resize-none"
          rows={3}
          placeholder="Any other details you'd like the AI to consider..."
          value={form.specialRequests}
          onChange={e => setField('specialRequests', e.target.value)}
        />
      </div>
    </div>
  )
}

// ─── Step 4: Review ───────────────────────────────────────────────────────────

function ReviewRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-subText text-sm">{label}</span>
      <span className="text-text text-sm font-medium text-right max-w-xs">{value}</span>
    </div>
  )
}

function Step4({ form }) {
  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <h3 className="font-semibold text-text mb-3 flex items-center gap-2"><Calendar size={16} className="text-primary" />Event Details</h3>
        <ReviewRow label="Event Name" value={form.name} />
        <ReviewRow label="Type" value={form.type} />
        <ReviewRow label="Date" value={form.date ? new Date(form.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''} />
        <ReviewRow label="Location" value={form.location} />
        <ReviewRow label="Venue Preference" value={form.venuePreference} />
        {form.startTime && <ReviewRow label="Time" value={`${form.startTime}${form.endTime ? ` – ${form.endTime}` : ''}`} />}
      </div>
      <div className="glass-card p-5">
        <h3 className="font-semibold text-text mb-3 flex items-center gap-2"><Users size={16} className="text-primary" />Guests & Budget</h3>
        <ReviewRow label="Guest Count" value={form.guestCount} />
        <ReviewRow label="Total Budget" value={form.budget ? `${form.currency} ${Number(form.budget).toLocaleString()}` : ''} />
        <ReviewRow label="Spending Style" value={form.spendingStyle} />
        <ReviewRow label="Food Preference" value={form.foodPreference} />
        {form.dietaryRequirements && <ReviewRow label="Dietary" value={form.dietaryRequirements} />}
      </div>
      <div className="glass-card p-5">
        <h3 className="font-semibold text-text mb-3 flex items-center gap-2"><Sparkles size={16} className="text-primary" />Style & Preferences</h3>
        {form.theme && <ReviewRow label="Theme" value={form.theme} />}
        {form.colorPalette && <ReviewRow label="Colors" value={form.colorPalette} />}
        {form.decorationStyle && <ReviewRow label="Decoration" value={form.decorationStyle} />}
        {form.photography && <ReviewRow label="Photography" value={form.photography} />}
        {form.entertainment && <ReviewRow label="Entertainment" value={form.entertainment} />}
        {form.culturalPreferences && <ReviewRow label="Cultural Preferences" value={form.culturalPreferences} />}
        {form.specialRequests && <ReviewRow label="Special Requests" value={form.specialRequests} />}
      </div>
    </div>
  )
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateStep(step, form) {
  const errs = {}
  if (step === 1) {
    if (!form.name.trim()) errs.name = 'Event name is required'
    if (!form.type) errs.type = 'Please select an event type'
    if (!form.date) errs.date = 'Event date is required'
    if (!form.location.trim()) errs.location = 'Location is required'
  }
  if (step === 2) {
    if (!form.guestCount || Number(form.guestCount) < 1) errs.guestCount = 'Enter a valid guest count'
    if (!form.budget || Number(form.budget) < 1) errs.budget = 'Enter a valid budget'
  }
  return errs
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export default function CreateEvent() {
  const navigate = useNavigate()
  const settings = getSettings()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ ...INITIAL_FORM, currency: settings.currency || 'INR' })
  const [errors, setErrors] = useState({})
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')

  const setField = useCallback((key, value) => {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: '' }))
  }, [])

  const goNext = () => {
    const errs = validateStep(step, form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setStep(s => Math.min(s + 1, 4))
  }

  const goBack = () => setStep(s => Math.max(s - 1, 1))

  const handleGenerate = async () => {
    setGenerating(true)
    setGenError('')

    const newEvent = {
      id: generateId(),
      name: form.name,
      type: form.type,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      location: form.location,
      venuePreference: form.venuePreference,
      guestCount: Number(form.guestCount),
      budget: Number(form.budget),
      currency: form.currency,
      preferences: {
        spendingStyle: form.spendingStyle,
        foodPreference: form.foodPreference,
        dietaryRequirements: form.dietaryRequirements,
        theme: form.theme,
        colorPalette: form.colorPalette,
        decorationStyle: form.decorationStyle,
        entertainment: form.entertainment,
        photography: form.photography,
        accessibilityRequirements: form.accessibilityRequirements,
        specialRequests: form.specialRequests,
        culturalPreferences: form.culturalPreferences,
        budgetFlexibility: form.budgetFlexibility,
      },
      plan: null,
      completedTasks: [],
      checklist: [],
      actualExpenses: [],
    }

    try {
      const plan = await generateAIPlan(newEvent)
      newEvent.plan = plan
      // Initialize checklist from vendor checklist
      newEvent.checklist = (plan.vendorChecklist || []).map((item, idx) => ({
        id: `vc_${idx}`,
        category: item.category,
        action: item.suggestedAction,
        priority: item.priority,
        estimatedCost: item.estimatedCost,
        completed: false,
        notes: '',
      }))
      saveEvent(newEvent)
      navigate(`/event/${newEvent.id}`)
    } catch (err) {
      setGenError(err.message || 'Failed to generate plan. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="section-heading">Create New Event</h1>
        <p className="text-subText text-sm mt-1">Fill in the details and let AI plan your perfect celebration</p>
      </div>

      <StepIndicator currentStep={step} />

      <div className="glass-card p-6 md:p-8">
        <h2 className="text-lg font-semibold text-text mb-6">
          Step {step}: {STEPS[step - 1].label}
        </h2>

        {step === 1 && <Step1 form={form} setField={setField} errors={errors} />}
        {step === 2 && <Step2 form={form} setField={setField} errors={errors} />}
        {step === 3 && <Step3 form={form} setField={setField} />}
        {step === 4 && <Step4 form={form} />}

        {genError && (
          <div className="mt-4 p-3 rounded-xl bg-error/10 border border-error/20 flex items-start gap-2">
            <AlertCircle size={16} className="text-error mt-0.5 shrink-0" />
            <p className="text-error text-sm">{genError}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
          <button
            onClick={goBack}
            disabled={step === 1}
            className="btn-secondary flex items-center gap-2 disabled:opacity-30"
          >
            <ChevronLeft size={16} /> Back
          </button>

          {step < 4 ? (
            <button onClick={goNext} className="btn-primary flex items-center gap-2">
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-primary flex items-center gap-2 px-8"
            >
              {generating ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Generating Plan...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate AI Plan
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {step === 4 && !generating && (
        <p className="text-center text-subText text-xs mt-4">
          Generation takes up to 30 seconds. A rule-based plan will be used if AI is unavailable.
        </p>
      )}
    </div>
  )
}
