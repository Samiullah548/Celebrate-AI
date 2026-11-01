import React, { useState, useEffect } from 'react'
import { getSettings, saveSettings, clearAllData, exportData, CURRENCIES } from '../services/storage.js'
import { Toast, ConfirmDialog } from '../components/UI.jsx'
import { Settings as SettingsIcon, Download, Trash2, Globe, Wallet, Users, Info } from 'lucide-react'

export default function Settings() {
  const [settings, setSettings] = useState(getSettings())
  const [toast, setToast] = useState(null)
  const [clearOpen, setClearOpen] = useState(false)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleChange = (key, value) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    saveSettings(updated)
    showToast('Settings saved.')
  }

  const handleClear = () => {
    clearAllData()
    setClearOpen(false)
    showToast('All data cleared.', 'warning')
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto animate-fade-in">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}

      <ConfirmDialog
        open={clearOpen}
        title="Clear All Data?"
        description="This will permanently delete all your events and settings from this device. This action cannot be undone."
        confirmText="Clear All Data"
        danger
        onConfirm={handleClear}
        onCancel={() => setClearOpen(false)}
      />

      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <SettingsIcon size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="section-heading">Settings</h1>
          <p className="text-subText text-sm">Your preferences are saved locally</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Preferences */}
        <div className="glass-card p-6 space-y-5">
          <h2 className="font-semibold text-text flex items-center gap-2"><Globe size={16} className="text-primary" />Preferences</h2>

          <div>
            <label className="label">Default Currency</label>
            <select className="input-field" value={settings.currency} onChange={e => handleChange('currency', e.target.value)}>
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
            </select>
          </div>

          <div>
            <label className="label">Language</label>
            <select className="input-field" value={settings.language} onChange={e => handleChange('language', e.target.value)}>
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
            <p className="text-subText text-xs mt-1">Language affects display labels. Full localization coming soon.</p>
          </div>
        </div>

        {/* Defaults */}
        <div className="glass-card p-6 space-y-5">
          <h2 className="font-semibold text-text flex items-center gap-2"><Wallet size={16} className="text-primary" />Defaults for New Events</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Default Budget ({settings.currency})</label>
              <input
                type="number"
                className="input-field"
                value={settings.defaultBudget}
                onChange={e => handleChange('defaultBudget', Number(e.target.value))}
                min={0}
              />
            </div>
            <div>
              <label className="label">Default Guest Count</label>
              <input
                type="number"
                className="input-field"
                value={settings.defaultGuestCount}
                onChange={e => handleChange('defaultGuestCount', Number(e.target.value))}
                min={1}
              />
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-semibold text-text flex items-center gap-2"><Download size={16} className="text-primary" />Data Management</h2>
          <p className="text-subText text-sm">All your events and settings are stored locally on this device. No data is sent to any server except during AI plan generation.</p>
          <div className="flex flex-wrap gap-3">
            <button onClick={exportData} className="btn-secondary flex items-center gap-2 text-sm">
              <Download size={14} /> Export All Data (JSON)
            </button>
            <button onClick={() => setClearOpen(true)} className="flex items-center gap-2 text-sm px-5 py-2 rounded-xl bg-error/10 text-error hover:bg-error/20 transition-colors">
              <Trash2 size={14} /> Clear All Data
            </button>
          </div>
        </div>

        {/* About */}
        <div className="glass-card p-6">
          <h2 className="font-semibold text-text flex items-center gap-2 mb-3"><Info size={16} className="text-primary" />About CelebrateAI</h2>
          <div className="space-y-1.5 text-sm text-subText">
            <p>Version: 1.0.0</p>
            <p>Built for PromptWars Challenge 05 — Celebration & Event Planner</p>
            <p>AI powered by Google Gemini API</p>
            <p>Data stored locally · No account required · No tracking</p>
          </div>
        </div>
      </div>
    </div>
  )
}
