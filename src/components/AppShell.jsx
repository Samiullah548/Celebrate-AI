import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, Plus, Wallet, Clock,
  CheckSquare, List, Settings, Sparkles, Menu, X, ChevronRight
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
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
        <Sparkles size={16} className="text-white" />
      </div>
      <div>
        <span className="font-bold text-text text-base">CelebrateAI</span>
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
          ? `nav-link-active ${highlight ? 'bg-primary/30 text-primary' : ''}`
          : `nav-link ${highlight ? 'text-primary hover:bg-primary/10' : ''}`
      }
    >
      <Icon size={18} />
      <span>{label}</span>
      {highlight && <ChevronRight size={14} className="ml-auto opacity-50" />}
    </NavLink>
  )
}

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-secondaryBg border-r border-white/5 p-4 gap-1">
        <div className="mb-6 mt-2 px-1">
          <Logo />
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map(item => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>
        <div className="pt-4 border-t border-white/5">
          <p className="text-xs text-subText/50 text-center">v1.0 · AI-Powered</p>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 bg-secondaryBg border-r border-white/5 p-4 flex flex-col gap-1 animate-fade-in">
            <div className="flex items-center justify-between mb-6 mt-2 px-1">
              <Logo />
              <button onClick={() => setSidebarOpen(false)} className="text-subText hover:text-text">
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-col gap-1 flex-1">
              {NAV_ITEMS.map(item => (
                <NavItem key={item.to} {...item} onClick={() => setSidebarOpen(false)} />
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile Top Bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-secondaryBg border-b border-white/5 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-subText hover:text-text">
            <Menu size={22} />
          </button>
          <Logo />
          <button
            onClick={() => navigate('/create')}
            className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"
          >
            <Plus size={16} className="text-white" />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
