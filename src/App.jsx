import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppShell from './components/AppShell.jsx'
import LandingPage from './pages/Landing.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CreateEvent from './pages/CreateEvent.jsx'
import EventPlan from './pages/EventPlan.jsx'
import MyEvents from './pages/MyEvents.jsx'
import Settings from './pages/Settings.jsx'

// Simple error boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="glass-card p-8 max-w-md text-center">
            <h2 className="text-xl font-bold text-text mb-2">Something went wrong</h2>
            <p className="text-subText text-sm mb-4">{this.state.error?.message || 'An unexpected error occurred.'}</p>
            <button onClick={() => window.location.reload()} className="btn-primary">
              Reload App
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// Pages that use the app shell (sidebar navigation)
function AppLayout({ children }) {
  return <AppShell>{children}</AppShell>
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Landing page — full screen, no sidebar */}
          <Route path="/landing" element={<LandingPage />} />

          {/* App routes — with sidebar */}
          <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/create" element={<AppLayout><CreateEvent /></AppLayout>} />
          <Route path="/event/:id" element={<AppLayout><EventPlan /></AppLayout>} />
          <Route path="/events" element={<AppLayout><MyEvents /></AppLayout>} />
          <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />

          {/* 404 */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center p-6">
              <div className="glass-card p-8 max-w-md text-center">
                <h2 className="text-4xl font-black text-gradient mb-3">404</h2>
                <p className="text-text font-semibold mb-2">Page not found</p>
                <p className="text-subText text-sm mb-6">The page you're looking for doesn't exist.</p>
                <a href="/" className="btn-primary inline-block">Go to Dashboard</a>
              </div>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
