import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Plus, List, Settings, Sparkles, Menu, X, ChevronRight
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/events', icon: List, label: 'My Events' },
  { to: '/create', icon: Plus, label: 'Create Event', highlight: true },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30"
        aria-hidden="true"
      >
        <Sparkles size={16} className="text-white" />
      </div>
      <div>
        <span className="font-bold text-text text-base tracking-tight">CelebrateAI</span>
        <div className="text-xs text-subText -mt-0.5">Plan Smarter.</div>
      </div>
    </div>
  )
}

function NavItem({ to, icon: Icon, label, highlight, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        isActive
          ? `nav-link-active ${highlight ? 'bg-primary/30 text-white' : ''}`
          : `nav-link ${highlight ? 'text-primary hover:bg-primary/10' : ''}`
      }
    >
      <Icon size={18} aria-hidden="true" className="shrink-0" />
      <span>{label}</span>
      {highlight && <ChevronRight size={14} className="ml-auto opacity-50" aria-hidden="true" />}
    </NavLink>
  )
}

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  // Close sidebar on Escape key
  useEffect(() => {
    if (!sidebarOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [sidebarOpen])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Skip to Main Content Link for Keyboard and Screen Reader Users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-xl focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-56 shrink-0 bg-secondaryBg border-r border-white/5 p-4 gap-1"
        aria-label="Desktop Sidebar Navigation"
      >
        <div className="mb-6 mt-2 px-1">
          <Logo />
        </div>
        <nav className="flex flex-col gap-1 flex-1" aria-label="Main Navigation">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>
        <div className="pt-4 border-t border-white/5">
          <p className="text-xs text-subText/70 text-center">v1.0 · AI-Powered</p>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Drawer"
          id="mobile-sidebar"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-64 bg-secondaryBg border-r border-white/5 p-4 flex flex-col gap-1 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between mb-6 mt-2 px-1">
              <Logo />
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="text-subText hover:text-text p-1 rounded-lg focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Close navigation menu"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 flex-1" aria-label="Mobile Navigation Links">
              {NAV_ITEMS.map((item) => (
                <NavItem
                  key={item.to}
                  {...item}
                  onClick={() => setSidebarOpen(false)}
                />
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile Top Bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-secondaryBg border-b border-white/5 shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="text-subText hover:text-text p-1 rounded-lg focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
            aria-controls="mobile-sidebar"
          >
            <Menu size={22} aria-hidden="true" />
          </button>
          <Logo />
          <button
            type="button"
            onClick={() => navigate('/create')}
            className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Create new event"
          >
            <Plus size={16} className="text-white" aria-hidden="true" />
          </button>
        </header>

        {/* Page Content with Main Landmark */}
        <main id="main-content" tabIndex="-1" className="flex-1 overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  )
}
