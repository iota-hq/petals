import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BringToFront,
  ChevronRight,
  ClipboardPaste,
  Code,
  Component,
  Copy,
  CopyPlus,
  Eye,
  EyeOff,
  FileImage,
  FileCode,
  Group,
  LayoutGrid,
  Lock,
  LockOpen,
  MoveHorizontal,
  MoveVertical,
  Pencil,
  SendToBack,
  Shapes,
  Sparkles,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { useDoc } from '@/store/docStore'
import { useUi } from '@/store/uiStore'
import { selectionRoots } from '@/model/geometry'
import type { LibrarySource } from '@/store/uiStore'
import type { Shape } from '@/model/types'
import {
  bringToFront,
  copySelection,
  deleteSelection,
  duplicateSelection,
  flipSelection,
  groupSelection,
  pasteClipboard,
  requestRenameSelection,
  sendToBack,
  setSelectionLocked,
  setSelectionVisible,
} from './commands'
import { copySelectionCode, copySelectionPNG, copySelectionSVG } from './exporters'

interface Row {
  kind?: 'sep'
  label?: string
  Icon?: LucideIcon
  shortcut?: string
  danger?: boolean
  disabled?: boolean
  run?: () => void
  /** opens the second pane; `label` names it so more than one row can carry one */
  submenu?: Row[]
}

/**
 * Right-click menu on the canvas: layer order, flips, copy/paste (+ copy as code/PNG/SVG),
 * the asset library, group, duplicate, lock, rename, visibility. Selection follows the
 * right-clicked shape.
 */
export function CanvasContextMenu({ onClose }: { onClose: () => void }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  /** Label of the row whose second pane is showing, or null for the first pane. */
  const [sub, setSub] = useState<string | null>(null)
  const nodes = useDoc((s) => s.nodes)
  const selection = useUi((s) => s.selection)
  const clipboard = useUi((s) => s.clipboard)

  const open = pos !== null

  // right-click anywhere on the canvas opens the menu; outside interactions close it.
  // document-level + filtered, so it works no matter when the canvas mounts.
  useEffect(() => {
    const onCtx = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest?.('[data-canvas-root]')) return
      if (target.closest('input, textarea, [contenteditable="true"]')) return
      e.preventDefault()
      // selecting the right-clicked shape (locked shapes stay unselectable, like hit-testing)
      const hit = target.closest('[data-node-id]')?.getAttribute('data-node-id')
      const shape: Shape | undefined = hit ? useDoc.getState().nodes[hit] : undefined
      if (shape && shape.visible && !shape.locked) {
        const sel = useUi.getState().selection
        if (!sel.includes(shape.id)) useUi.getState().setSelection([shape.id])
      }
      setSub(null)
      setPos(clamp({ x: e.clientX, y: e.clientY }))
    }
    const close = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('[data-context-menu]')) return
      setPos(null)
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPos(null)
    }
    const onWheel = () => setPos(null)
    document.addEventListener('contextmenu', onCtx)
    document.addEventListener('pointerdown', close, true)
    document.addEventListener('wheel', onWheel, { passive: true })
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('contextmenu', onCtx)
      document.removeEventListener('pointerdown', close, true)
      document.removeEventListener('wheel', onWheel)
      document.removeEventListener('keydown', onEsc)
    }
  }, [])

  const act = (fn: () => void) => () => {
    fn()
    onClose()
  }

  /**
   * Ask the toolbar's asset panel to open on a tab. The menu closes here, unlike the plain
   * actions above: the panel takes over the screen edge, and leaving the menu up would hide
   * the very thing that was just asked for.
   */
  const openLibrary = (source: LibrarySource) => () => {
    useUi.getState().requestLibrary(source)
    setPos(null)
  }

  /** rows depend on the live selection (root heads, not children) */
  const rows: Row[] = useMemo(() => {
    const roots = selectionRoots(useDoc.getState().nodes, useUi.getState().selection)
    const has = roots.length > 0
    const first = has ? useDoc.getState().nodes[roots[0]] : undefined
    return [
      { label: 'Bring to front', Icon: BringToFront, disabled: !has, run: act(bringToFront) },
      { label: 'Send to back', Icon: SendToBack, disabled: !has, run: act(sendToBack) },
      { kind: 'sep' },
      { label: 'Flip horizontal', Icon: MoveHorizontal, disabled: !has, run: act(() => flipSelection('x')) },
      { label: 'Flip vertical', Icon: MoveVertical, disabled: !has, run: act(() => flipSelection('y')) },
      { kind: 'sep' },
      { label: 'Copy', Icon: Copy, shortcut: 'Ctrl C', disabled: !has || !!useUi.getState().editingText, run: act(() => copySelection()) },
      {
        label: 'Copy as',
        Icon: ChevronRight,
        disabled: !has,
        run: () => setSub((v) => (v === 'Copy as' ? null : 'Copy as')),
        submenu: [
          { label: 'Code · React + Tailwind', Icon: FileCode, run: act(() => void copySelectionCode()) },
          { label: 'PNG', Icon: FileImage, run: act(() => void copySelectionPNG()) },
          { label: 'SVG', Icon: Code, run: act(() => void copySelectionSVG()) },
        ],
      },
      { label: 'Paste', Icon: ClipboardPaste, shortcut: 'Ctrl V', disabled: !clipboard, run: act(pasteClipboard) },
      { kind: 'sep' },
      {
        label: 'Library',
        Icon: Shapes,
        run: () => setSub((v) => (v === 'Library' ? null : 'Library')),
        submenu: [
          { label: 'Patterns', Icon: LayoutGrid, run: openLibrary('patterns') },
          { label: 'Logos', Icon: Component, run: openLibrary('logos') },
          { label: 'Icons', Icon: Sparkles, run: openLibrary('icons') },
        ],
      },
      { kind: 'sep' },
      { label: 'Group selection', Icon: Group, disabled: roots.length < 2, run: act(groupSelection) },
      { label: 'Duplicate', Icon: CopyPlus, shortcut: 'Ctrl D', disabled: !has, run: act(duplicateSelection) },
      { kind: 'sep' },
      { label: first?.locked ? 'Unlock' : 'Lock', Icon: first?.locked ? LockOpen : Lock, disabled: !has, run: act(() => setSelectionLocked(!first?.locked)) },
      { label: first?.visible ? 'Hide' : 'Show', Icon: first?.visible ? EyeOff : Eye, disabled: !has, run: act(() => setSelectionVisible(!first?.visible)) },
      { label: 'Rename', Icon: Pencil, disabled: !has, run: act(requestRenameSelection) },
      { kind: 'sep' },
      { label: 'Delete', Icon: Trash2, shortcut: 'Del', danger: true, disabled: !has, run: act(deleteSelection) },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection, clipboard, nodes, sub])

  if (!open) return null
  const pane = sub ? rows.find((r) => r.label === sub)?.submenu : null
  return (
    <div
      data-context-menu
      style={{ top: pos!.y, left: pos!.x, maxHeight: `calc(100vh - ${pos!.y + 12}px)` }}
      className="fixed z-50 w-[208px] overflow-y-auto overscroll-contain rounded-md border border-border bg-popover/95 py-1 shadow-2xl backdrop-blur scrollbar-thin"
    >
      {pane ? (
        <>
          <button
            onClick={() => setSub(null)}
            className="flex w-full cursor-pointer items-center gap-2 px-2.5 py-1.5 text-left text-[12px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ChevronRight size={13} className="rotate-180" />
            Back
          </button>
          <div className="my-1 h-px bg-border" />
          {pane.map((r) => (
            <MenuRow key={r.label} row={r} />
          ))}
        </>
      ) : (
        rows.map((r, i) => (r.kind === 'sep' ? <div key={i} className="my-1 h-px bg-border" /> : <MenuRow key={r.label} row={r} />))
      )}
    </div>
  )
}

function MenuRow({ row }: { row: Row }) {
  if (row.kind === 'sep') return <div className="my-1 h-px bg-border" />
  if (!row.label) return null
  return (
    <button
      disabled={row.disabled}
      onClick={row.disabled ? undefined : row.run}
      className={
        'flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12px] font-medium hover:bg-accent ' +
        (row.disabled ? 'cursor-default text-muted-foreground/40' : 'cursor-pointer text-foreground/90 hover:text-foreground') +
        (row.danger && !row.disabled ? ' hover:text-red-400' : '')
      }
    >
      {row.Icon && <row.Icon size={13} className="shrink-0" />}
      <span className="flex-1 truncate">{row.label}</span>
      {row.shortcut && <span className="text-[10px] text-muted-foreground/60">{row.shortcut}</span>}
    </button>
  )
}

/** Tallest this menu gets once every section is on (measured, with room to spare). */
const MENU_H = 480

/** Keep the popup on screen: flip it up from the bottom edge rather than let rows fall off. */
function clamp(p: { x: number; y: number }) {
  return {
    x: Math.max(8, Math.min(p.x, window.innerWidth - 220)),
    y: Math.max(8, Math.min(p.y, window.innerHeight - MENU_H - 12)),
  }
}
