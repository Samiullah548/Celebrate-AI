import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import EventPlan from './EventPlan.jsx'
import * as storage from '../services/storage.js'
import * as aiService from '../services/aiService.js'

describe('EventPlan Component', () => {
  const mockPlan = {
    eventSummary: 'A personalized wedding plan in Goa.',
    themeName: 'Coastal Elegance',
    themeDescription: 'Soft blues and warm neutrals with natural floral elements.',
    budgetAdvice: 'Prioritize beachfront venue and seafood catering.',
    assumptions: ['Weather is clear in December', 'Vendor availability confirmed'],
    personalizedIdeas: [
      { title: 'Sunset Cocktails', description: 'Beachside drinks at dusk', estimatedCost: 20000, priority: 'high' },
      { title: 'Custom Favors', description: 'Artisan spice boxes', estimatedCost: 5000, priority: 'low' },
    ],
    budgetBreakdown: [
      { category: 'Venue', estimatedCost: 100000, reason: 'Beach resort lawn' },
      { category: 'Catering', estimatedCost: 80000, reason: 'Dinner buffet for 100 guests' },
      { category: 'Decoration', estimatedCost: 40000, reason: 'Floral and lighting setup' },
    ],
    timeline: [
      { task: 'Book Venue', daysBeforeEvent: 60, category: 'Venue', priority: 'high' },
      { task: 'Send Invitations', daysBeforeEvent: 30, category: 'Invitations', priority: 'medium' },
      { task: 'Final Tasting', daysBeforeEvent: 10, category: 'Catering', priority: 'high' },
    ],
    vendorChecklist: [
      { category: 'Venue', suggestedAction: 'Confirm hall deposit', priority: 'high', estimatedCost: 100000 },
      { category: 'Catering', suggestedAction: 'Finalize menu options', priority: 'high', estimatedCost: 80000 },
    ],
    dayOfSchedule: [
      { time: '10:00 AM', activity: 'Decor setup begins', durationMinutes: 120 },
      { time: '05:00 PM', activity: 'Guest arrival', durationMinutes: 60 },
    ],
    riskChecklist: [
      { risk: 'High tide or rain', prevention: 'Arrange indoor banquet hall backup' },
    ],
  }

  const mockEvent = {
    id: 'evt_plan_test',
    name: 'Rohan & Maya Wedding',
    type: 'Wedding',
    date: '2026-12-15',
    location: 'Goa',
    guestCount: 100,
    budget: 250000,
    currency: 'INR',
    completedTasks: [],
    checklist: [
      { id: 'vc_0', category: 'Venue', action: 'Confirm hall deposit', priority: 'high', estimatedCost: 100000, completed: false, notes: '' },
      { id: 'vc_1', category: 'Catering', action: 'Finalize menu options', priority: 'high', estimatedCost: 80000, completed: true, notes: '' },
    ],
    plan: mockPlan,
  }

  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    storage.saveEvent(mockEvent)
  })

  function renderEventPlan(eventId = 'evt_plan_test') {
    return render(
      <MemoryRouter initialEntries={[`/event/${eventId}`]}>
        <Routes>
          <Route path="/event/:id" element={<EventPlan />} />
          <Route path="/events" element={<div>Events List Page</div>} />
        </Routes>
      </MemoryRouter>
    )
  }

  it('renders event details and Overview tab content properly', () => {
    renderEventPlan()

    expect(screen.getByRole('heading', { name: 'Rohan & Maya Wedding', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('A personalized wedding plan in Goa.')).toBeInTheDocument()
    expect(screen.getByText('Coastal Elegance')).toBeInTheDocument()
    expect(screen.getByText(/Prioritize beachfront venue/i)).toBeInTheDocument()
  })

  it('navigates to Budget tab and displays correct calculations and breakdown', async () => {
    const user = userEvent.setup()
    renderEventPlan()

    const budgetTab = screen.getByRole('tab', { name: /budget/i })
    await user.click(budgetTab)

    expect(budgetTab).toHaveAttribute('aria-selected', 'true')
    // Total: 250,000, Planned: 100k + 80k + 40k = 220,000, Remaining = 30,000
    expect(screen.getByText('Total Planned')).toBeInTheDocument()
    expect(screen.getByText('Contingency / Remaining')).toBeInTheDocument()

    // Categories in breakdown
    expect(screen.getByText('Venue')).toBeInTheDocument()
    expect(screen.getByText('Catering')).toBeInTheDocument()
    expect(screen.getByText('Decoration')).toBeInTheDocument()
  })

  it('navigates to Timeline tab and toggles task completion', async () => {
    const user = userEvent.setup()
    const saveSpy = vi.spyOn(storage, 'saveEvent')

    renderEventPlan()

    const timelineTab = screen.getByRole('tab', { name: /timeline/i })
    await user.click(timelineTab)

    expect(screen.getByText('Book Venue')).toBeInTheDocument()
    expect(screen.getByText('Send Invitations')).toBeInTheDocument()

    // Find the checkbox button for 'Book Venue'
    const checkbox = screen.getByRole('checkbox', { name: /mark task as completed: book venue/i })
    expect(checkbox).toHaveAttribute('aria-checked', 'false')

    await user.click(checkbox)

    expect(checkbox).toHaveAttribute('aria-checked', 'true')
    expect(saveSpy).toHaveBeenCalled()
  })

  it('supports filtering timeline tasks by status', async () => {
    const user = userEvent.setup()
    renderEventPlan()

    await user.click(screen.getByRole('tab', { name: /timeline/i }))

    // Filter by high priority
    const highFilterBtn = screen.getByRole('button', { name: 'High Priority' })
    await user.click(highFilterBtn)

    expect(screen.getByText('Book Venue')).toBeInTheDocument()
    expect(screen.queryByText('Send Invitations')).not.toBeInTheDocument() // medium priority, should be hidden
  })

  it('interacts with Vendor Checklist: toggles item, adds new item, and deletes item', async () => {
    const user = userEvent.setup()
    renderEventPlan()

    await user.click(screen.getByRole('tab', { name: /checklist/i }))

    // Checklist item status check
    const checkboxVenue = screen.getByRole('checkbox', { name: /mark task as complete: confirm hall deposit/i })
    expect(checkboxVenue).toHaveAttribute('aria-checked', 'false')

    await user.click(checkboxVenue)
    expect(checkboxVenue).toHaveAttribute('aria-checked', 'true')

    // Add custom item
    const addBtn = screen.getByRole('button', { name: /\+ add item/i })
    await user.click(addBtn)

    const inputAction = screen.getByLabelText(/task description \*/i)
    await user.type(inputAction, 'Book Drone Videographer')
    await user.click(screen.getByRole('button', { name: /add task/i }))

    expect(screen.getByText('Book Drone Videographer')).toBeInTheDocument()

    // Delete item
    const deleteBtn = screen.getByRole('button', { name: /delete checklist item: book drone videographer/i })
    await user.click(deleteBtn)

    expect(screen.queryByText('Book Drone Videographer')).not.toBeInTheDocument()
  })

  it('handles plan regeneration successfully', async () => {
    const user = userEvent.setup()
    const updatedPlan = {
      ...mockPlan,
      eventSummary: 'A newly regenerated wedding experience.',
    }
    vi.spyOn(aiService, 'generateAIPlan').mockResolvedValue(updatedPlan)

    renderEventPlan()

    const regenBtn = screen.getByRole('button', { name: /regenerate plan with ai/i })
    await user.click(regenBtn)

    await waitFor(() => {
      expect(screen.getByText('A newly regenerated wedding experience.')).toBeInTheDocument()
    })
  })
})

