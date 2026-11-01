import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import CreateEvent from './CreateEvent.jsx'
import * as aiService from '../services/aiService.js'
import * as storage from '../services/storage.js'

describe('CreateEvent Component', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  function renderCreateEvent() {
    return render(
      <BrowserRouter>
        <CreateEvent />
      </BrowserRouter>
    )
  }

  it('renders Step 1 form with accessible inputs and labels', () => {
    renderCreateEvent()

    expect(screen.getByRole('heading', { name: /create new event/i, level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /step 1: event details/i, level: 2 })).toBeInTheDocument()

    // Form inputs should have associated labels
    expect(screen.getByLabelText(/event name \*/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/event date \*/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/city \/ event location \*/i)).toBeInTheDocument()
  })

  it('validates required fields on Step 1 and blocks navigation until filled', async () => {
    renderCreateEvent()

    const continueBtn = screen.getByRole('button', { name: /continue/i })
    fireEvent.click(continueBtn)

    // Should stay on Step 1 and show field errors
    expect(screen.getByRole('heading', { name: /step 1: event details/i, level: 2 })).toBeInTheDocument()
    expect(screen.getByText(/event name is required/i)).toBeInTheDocument()
    expect(screen.getByText(/please select an event type/i)).toBeInTheDocument()
    expect(screen.getByText(/event date is required/i)).toBeInTheDocument()
    expect(screen.getByText(/location is required/i)).toBeInTheDocument()
  })

  it('advances to Step 2 when Step 1 is valid, and computes per-guest budget', async () => {
    renderCreateEvent()

    // Fill Step 1
    fireEvent.change(screen.getByLabelText(/event name \*/i), { target: { value: 'Annual Family Reunion' } })
    fireEvent.click(screen.getByRole('button', { name: 'Anniversary' }))
    fireEvent.change(screen.getByLabelText(/event date \*/i), { target: { value: '2026-12-25' } })
    fireEvent.change(screen.getByLabelText(/city \/ event location \*/i), { target: { value: 'Jaipur' } })

    // Click continue
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Now in Step 2: Guests & Budget
    expect(screen.getByRole('heading', { name: /step 2: guests & budget/i, level: 2 })).toBeInTheDocument()

    // Fill Guest Count and Budget
    fireEvent.change(screen.getByLabelText(/estimated guest count \*/i), { target: { value: '50' } })
    fireEvent.change(screen.getByLabelText(/total budget \*/i), { target: { value: '100000' } })

    // Expect per-guest budget calculation: 100000 / 50 = 2000
    expect(screen.getByText(/per guest/i)).toBeInTheDocument()
    expect(screen.getByText(/2,000/)).toBeInTheDocument()
  })

  it('allows navigation back and forth through steps', async () => {
    renderCreateEvent()

    // Step 1
    fireEvent.change(screen.getByLabelText(/event name \*/i), { target: { value: 'Office Party' } })
    fireEvent.click(screen.getByRole('button', { name: 'Corporate Event' }))
    fireEvent.change(screen.getByLabelText(/event date \*/i), { target: { value: '2026-11-20' } })
    fireEvent.change(screen.getByLabelText(/city \/ event location \*/i), { target: { value: 'Bengaluru' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Step 2
    expect(screen.getByRole('heading', { name: /step 2/i })).toBeInTheDocument()
    const backBtn = screen.getByRole('button', { name: /go to previous step/i })
    fireEvent.click(backBtn)

    // Back to Step 1 with preserved value
    expect(screen.getByRole('heading', { name: /step 1/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/event name \*/i)).toHaveValue('Office Party')
  })

  it('navigates to Review & triggers AI generation on submission', async () => {
    const mockPlan = {
      eventSummary: 'A wonderful anniversary celebration',
      themeName: 'Silver Bliss',
      budgetBreakdown: [{ category: 'Venue', estimatedCost: 50000 }],
      timeline: [{ task: 'Book Venue', daysBeforeEvent: 30, priority: 'high' }],
      vendorChecklist: [{ category: 'Venue', suggestedAction: 'Book Hall', priority: 'high', estimatedCost: 50000 }],
    }

    vi.spyOn(aiService, 'generateAIPlan').mockResolvedValue(mockPlan)
    const saveSpy = vi.spyOn(storage, 'saveEvent')

    renderCreateEvent()

    // Step 1
    fireEvent.change(screen.getByLabelText(/event name \*/i), { target: { value: 'Silver Jubilee' } })
    fireEvent.click(screen.getByRole('button', { name: 'Anniversary' }))
    fireEvent.change(screen.getByLabelText(/event date \*/i), { target: { value: '2026-12-10' } })
    fireEvent.change(screen.getByLabelText(/city \/ event location \*/i), { target: { value: 'Goa' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Step 2
    fireEvent.change(screen.getByLabelText(/estimated guest count \*/i), { target: { value: '40' } })
    fireEvent.change(screen.getByLabelText(/total budget \*/i), { target: { value: '80000' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Step 3
    expect(screen.getByRole('heading', { name: /step 3: style & preferences/i, level: 2 })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Step 4: Review & Generate
    expect(screen.getByRole('heading', { name: /step 4: review & generate/i, level: 2 })).toBeInTheDocument()
    expect(screen.getByText('Silver Jubilee')).toBeInTheDocument()

    // Click Generate AI Plan
    const generateBtn = screen.getByRole('button', { name: /generate ai plan/i })
    fireEvent.click(generateBtn)

    await waitFor(() => {
      expect(aiService.generateAIPlan).toHaveBeenCalledTimes(1)
      expect(saveSpy).toHaveBeenCalledTimes(1)
    })
  })

  it('displays error alert when AI plan generation fails', async () => {
    vi.spyOn(aiService, 'generateAIPlan').mockRejectedValue(new Error('AI service overloaded'))

    renderCreateEvent()

    // Step 1
    fireEvent.change(screen.getByLabelText(/event name \*/i), { target: { value: 'Fail Test Event' } })
    fireEvent.click(screen.getByRole('button', { name: 'Birthday' }))
    fireEvent.change(screen.getByLabelText(/event date \*/i), { target: { value: '2026-11-30' } })
    fireEvent.change(screen.getByLabelText(/city \/ event location \*/i), { target: { value: 'Delhi' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Step 2
    fireEvent.change(screen.getByLabelText(/estimated guest count \*/i), { target: { value: '20' } })
    fireEvent.change(screen.getByLabelText(/total budget \*/i), { target: { value: '30000' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Step 3 -> Step 4
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Step 4
    fireEvent.click(screen.getByRole('button', { name: /generate ai plan/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/ai service overloaded/i)
    })
  })
})
