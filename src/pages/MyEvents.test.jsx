import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import MyEvents from './MyEvents.jsx'
import * as storage from '../services/storage.js'

describe('MyEvents Component', () => {
  const sampleEvents = [
    {
      id: 'e1',
      name: 'Diwali Party',
      type: 'Festival',
      date: '2026-11-15',
      location: 'Ahmedabad',
      guestCount: 60,
      budget: 50000,
      currency: 'INR',
      completedTasks: [],
      checklist: [{ id: 'c1', completed: false }],
    },
    {
      id: 'e2',
      name: 'Corporate Annual Summit',
      type: 'Corporate Event',
      date: '2026-12-10',
      location: 'Mumbai',
      guestCount: 200,
      budget: 500000,
      currency: 'INR',
      completedTasks: [],
      checklist: [{ id: 'c2', completed: true }],
    },
  ]

  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  function renderMyEvents() {
    return render(
      <BrowserRouter>
        <MyEvents />
      </BrowserRouter>
    )
  }

  it('renders empty state when there are no events', () => {
    renderMyEvents()
    expect(screen.getByRole('heading', { name: /no events yet/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create event/i })).toBeInTheDocument()
  })

  it('renders list of events when events exist in storage', () => {
    sampleEvents.forEach((e) => storage.saveEvent(e))
    renderMyEvents()

    expect(screen.getByRole('heading', { name: 'My Events', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Diwali Party')).toBeInTheDocument()
    expect(screen.getByText('Corporate Annual Summit')).toBeInTheDocument()
  })

  it('filters events by search query', async () => {
    sampleEvents.forEach((e) => storage.saveEvent(e))
    const user = userEvent.setup()
    renderMyEvents()

    const searchInput = screen.getByRole('searchbox')
    await user.type(searchInput, 'Mumbai')

    expect(screen.getByText('Corporate Annual Summit')).toBeInTheDocument()
    expect(screen.queryByText('Diwali Party')).not.toBeInTheDocument()
  })

  it('filters events by event type', async () => {
    sampleEvents.forEach((e) => storage.saveEvent(e))
    const user = userEvent.setup()
    renderMyEvents()

    const corporateFilter = screen.getByRole('button', { name: 'Corporate Event' })
    await user.click(corporateFilter)

    expect(screen.getByText('Corporate Annual Summit')).toBeInTheDocument()
    expect(screen.queryByText('Diwali Party')).not.toBeInTheDocument()
  })

  it('duplicates an event on duplicate button click', async () => {
    sampleEvents.forEach((e) => storage.saveEvent(e))
    const user = userEvent.setup()
    renderMyEvents()

    const dupBtn = screen.getByRole('button', { name: /duplicate diwali party/i })
    await user.click(dupBtn)

    await waitFor(() => {
      expect(screen.getByText('Diwali Party (Copy)')).toBeInTheDocument()
    })
  })

  it('deletes an event after confirming in delete modal dialog', async () => {
    sampleEvents.forEach((e) => storage.saveEvent(e))
    const user = userEvent.setup()
    renderMyEvents()

    const deleteBtn = screen.getByRole('button', { name: /delete diwali party/i })
    await user.click(deleteBtn)

    // Modal dialog appears
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(screen.getByText(/delete event\?/i)).toBeInTheDocument()

    // Click confirm in dialog
    const confirmDeleteBtn = screen.getByRole('button', { name: 'Delete Event' })
    await user.click(confirmDeleteBtn)

    await waitFor(() => {
      expect(screen.queryByText('Diwali Party')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Corporate Annual Summit')).toBeInTheDocument()
  })
})

