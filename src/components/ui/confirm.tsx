import { useEffect } from 'react'
import { create } from 'zustand'
import { AnimatePresence, motion } from 'motion/react'

/**
 * Design-system confirm dialog — replaces window.confirm everywhere.
 * `const ok = await confirmDialog({ title: 'Delete page?' })`
 */
interface ConfirmOpts {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  /** destructive action (red confirm button) */
  danger?: boolean
}

interface ConfirmState {
  opts: ConfirmOpts | null
  resolve: ((v: boolean) => void) | null
  ask: (opts: ConfirmOpts) => Promise<boolean>
  close: (v: boolean) => void
}

export const useConfirm = create<ConfirmState>((set, get) => ({
  opts: null,
  resolve: null,
  ask: (opts) =>
    new Promise<boolean>((resolve) => {
      get().resolve?.(false) // a pending dialog resolves as dismissed
      set({ opts, resolve })
    }),
  close: (v) => {
    get().resolve?.(v)
    set({ opts: null, resolve: null })
  },
}))

/** promise-style entry point, usable outside React */
export const confirmDialog = (opts: ConfirmOpts) => useConfirm.getState().ask(opts)

/** Renders the dialog; mount once near the app root. */
export function ConfirmHost() {
  const opts = useConfirm((s) => s.opts)
  const close = useConfirm((s) => s.close)

  useEffect(() => {
    if (!opts) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false)
      if (e.key === 'Enter') close(true)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [opts, close])

  return (
    <AnimatePresence>
      {opts && (
        <motion.div
          key="confirm-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] bg-black/50"
          onPointerDown={() => close(false)}
        >
          <div className="flex h-full w-full items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="w-[280px] rounded-md border border-border bg-popover/95 p-4 shadow-2xl backdrop-blur"
              onPointerDown={(e) => e.stopPropagation()}
              role="alertdialog"
              aria-label={opts.title}
            >
              <div className="text-[13px] font-semibold tracking-[0.01em] text-foreground/95">{opts.title}</div>
              {opts.message && <div className="mt-1.5 text-[12px] leading-snug text-muted-foreground">{opts.message}</div>}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  autoFocus
                  onClick={() => close(false)}
                  className="flex h-8 cursor-pointer items-center rounded-md bg-[#2b2b2b] px-3 text-[12px] font-medium text-foreground/90 hover:bg-[#333333]"
                >
                  {opts.cancelLabel ?? 'Cancel'}
                </button>
                <button
                  onClick={() => close(true)}
                  className={
                    'flex h-8 cursor-pointer items-center rounded-md px-3 text-[12px] font-medium text-white ' +
                    (opts.danger ? 'bg-[#dc2626] hover:bg-[#ef4444]' : 'bg-white text-neutral-950 hover:bg-white/90')
                  }
                >
                  {opts.confirmLabel ?? 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
