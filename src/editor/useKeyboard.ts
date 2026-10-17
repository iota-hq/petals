import { useEffect } from 'react'
import { useDoc } from '@/store/docStore'
import { useUi, zoomAt } from '@/store/uiStore'
import { canvasEl } from './view'
import {
  cancelGesture,
  deleteSelection,
  duplicateSelection,
  fitAll,
  nudge,
  redo,
  resetZoom100,
  selectAllTop,
  undo,
} from './commands'

const TOOL_KEYS: Record<string, 'select' | 'hand' | 'frame' | 'rect' | 'ellipse' | 'line' | 'text' | 'image'> = {
  v: 'select',
  h: 'hand',
  f: 'frame',
  a: 'frame', // sketch-style alias: A for artboard
  r: 'rect',
  o: 'ellipse',
  l: 'line',
  t: 'text',
  i: 'image',
}

function zoomStep(factor: number) {
  const el = canvasEl.current
  if (!el) return
  const r = el.getBoundingClientRect()
  zoomAt({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, factor, r)
}

export function useKeyboard() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || t.closest('input, textarea, select, [contenteditable="true"]'))) return
      const ui = useUi.getState()
      const mod = e.metaKey || e.ctrlKey

      if (e.code === 'Space') {
        ui.setSpace(true)
        e.preventDefault()
        return
      }

      if (mod) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault()
            if (e.shiftKey) redo()
            else undo()
            return
          case 'y':
            e.preventDefault()
            redo()
            return
          case 'd':
            e.preventDefault()
            duplicateSelection()
            return
          case 'a': {
            e.preventDefault()
            selectAllTop()
            return
          }
          case '0':
            e.preventDefault()
            resetZoom100()
            return
          case '=':
          case '+':
            e.preventDefault()
            zoomStep(1.2)
            return
          case '-':
            e.preventDefault()
            zoomStep(1 / 1.2)
            return
          default:
            return
        }
      }

      // Escape cancels an active gesture / clears selection
      if (e.key === 'Escape') {
        if (ui.gesture) {
          cancelGesture()
          e.preventDefault()
          return
        }
        ui.clearSelection()
        return
      }

      if (ui.gesture) return // no tool/shortcut churn mid-gesture

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          e.preventDefault()
          deleteSelection()
          return
        case 'ArrowLeft':
          nudge(e.shiftKey ? -10 : -1, 0)
          e.preventDefault()
          return
        case 'ArrowRight':
          nudge(e.shiftKey ? 10 : 1, 0)
          e.preventDefault()
          return
        case 'ArrowUp':
          nudge(0, e.shiftKey ? -10 : -1)
          e.preventDefault()
          return
        case 'ArrowDown':
          nudge(0, e.shiftKey ? 10 : 1)
          e.preventDefault()
          return
        case '?':
          return
        default:
          break
      }

      if (e.key.length === 1) {
        const tool = TOOL_KEYS[e.key.toLowerCase()]
        if (tool) ui.setTool(tool)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') useUi.getState().setSpace(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  // zoom to fit once data exists (startup nicety)
  useEffect(() => {
    const t = setTimeout(() => fitAll(), 50)
    return () => clearTimeout(t)
  }, [])
}
