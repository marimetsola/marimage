import { useEffect, useRef } from 'react'
import './ConfirmDialog.css'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  busy?: boolean
  error?: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  busy = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) {
      cancelButtonRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, busy, onCancel])

  if (!open) {
    return null
  }

  return (
    <div
      className="confirm-dialog-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onCancel()
        }
      }}
    >
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <h2 id="confirm-dialog-title">{title}</h2>

        <p id="confirm-dialog-message">{message}</p>

        {error && (
          <p className="confirm-dialog-error" role="alert">
            {error}
          </p>
        )}

        <div className="confirm-dialog-actions">
          <button
            ref={cancelButtonRef}
            className="button button-secondary"
            type="button"
            disabled={busy}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>

          <button
            className="button button-danger"
            type="button"
            disabled={busy}
            onClick={() => {
              void onConfirm()
            }}
          >
            {busy ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
