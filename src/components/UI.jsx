import React, { useEffect, useRef } from 'react'
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react'

export function Toast({ message, type = 'info', onClose }) {
  const styles = {
    success: { bg: 'bg-success/15 border-success/30', icon: <CheckCircle size={16} className="text-success shrink-0" aria-hidden="true" />, text: 'text-success' },
    error: { bg: 'bg-error/15 border-error/30', icon: <AlertCircle size={16} className="text-error shrink-0" aria-hidden="true" />, text: 'text-error' },
    info: { bg: 'bg-primary/15 border-primary/30', icon: <Info size={16} className="text-primary shrink-0" aria-hidden="true" />, text: 'text-primary' },
    warning: { bg: 'bg-warning/15 border-warning/30', icon: <AlertCircle size={16} className="text-warning shrink-0" aria-hidden="true" />, text: 'text-warning' },
  }
  const s = styles[type] || styles.info
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${s.bg} animate-slide-up shadow-lg`}
    >
      {s.icon}
      <span className="text-sm text-text flex-1">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close notification"
          className="text-subText hover:text-text transition-colors p-0.5 rounded focus-visible:ring-1 focus-visible:ring-primary"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

export function LoadingSpinner({ size = 'md', text }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
      <div
        className={`${sizes[size]} border-2 border-white/10 border-t-primary rounded-full animate-spin`}
        aria-hidden="true"
      />
      <span className={text ? 'text-subText text-sm' : 'sr-only'}>
        {text || 'Loading...'}
      </span>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4" aria-hidden="true">
          <Icon size={28} className="text-primary" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
      {description && <p className="text-subText text-sm max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  )
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  danger = false,
}) {
  const dialogRef = useRef(null)
  const confirmBtnRef = useRef(null)

  useEffect(() => {
    if (!open) return

    // Focus confirm button when dialog opens
    const timer = setTimeout(() => {
      confirmBtnRef.current?.focus()
    }, 50)

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      } else if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        className="relative glass-card p-6 max-w-sm w-full animate-fade-in shadow-2xl"
      >
        <h3 id="confirm-dialog-title" className="text-lg font-semibold text-text mb-2">
          {title}
        </h3>
        <p id="confirm-dialog-desc" className="text-subText text-sm mb-6">
          {description}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className={`font-semibold px-5 py-2 rounded-xl text-sm transition-all duration-200 ${
              danger
                ? 'bg-error hover:bg-error/80 text-white focus-visible:ring-error'
                : 'btn-primary'
            }`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Badge({ label, priority }) {
  const cls = {
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
  }
  return (
    <span className={cls[priority] || 'badge bg-subText/20 text-subText'}>
      {label || priority}
    </span>
  )
}

export function ProgressBar({ value, max = 100, color = 'bg-primary', label = 'Progress' }) {
  const pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100))
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden"
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function StatCard({ icon: Icon, label, value, sub, color = 'text-primary' }) {
  return (
    <div className="card-stat">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center" aria-hidden="true">
          <Icon size={20} className={color} />
        </div>
      </div>
      <p className="text-subText text-xs font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-subText text-xs mt-1">{sub}</p>}
    </div>
  )
}
