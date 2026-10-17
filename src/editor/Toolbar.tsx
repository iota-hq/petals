import { useEffect, useRef, useState } from 'react'
import {
  Circle,
  Frame,
  Hand,
  Image as ImageIcon,
  Minus,
  MousePointer2,
  Square,
  Type,
  SquareDashed,
  Undo2,
  Redo2,
} from 'lucide-react'
import { useUi, type Tool } from '@/store/uiStore'
import { useDoc } from '@/store/docStore'
import { Hint, TooltipProvider } from '@/components/ui/tooltip'
import { FRAME_PRESETS, addFramePreset, redo, undo } from './commands'

const tools: Array<{ id: Tool; icon: typeof Square; label: string; key: string; dividerAfter?: boolean }> = [
  { id: 'select', icon: MousePointer2, label: 'Move', key: 'V' },
  { id: 'hand', icon: Hand, label: 'Hand', key: 'H', dividerAfter: true },
  { id: 'frame', icon: Frame, label: 'Frame', key: 'F' },
  { id: 'rect', icon: Square, label: 'Rectangle', key: 'R' },
  { id: 'ellipse', icon: Circle, label: 'Ellipse', key: 'O' },
  { id: 'line', icon: Minus, label: 'Line', key: 'L', dividerAfter: true },
  { id: 'text', icon: Type, label: 'Text', key: 'T' },
  { id: 'image', icon: ImageIcon, label: 'Image', key: 'I' },
]

export function Toolbar() {
  const tool = useUi((s) => s.tool)
  const gesture = useUi((s) => s.gesture?.kind)
  const canUndo = useDoc((s) => s.past.length > 0)
  const canRedo = useDoc((s) => s.future.length > 0)
  const [frameMenu, setFrameMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // close the frame menu on any outside interaction
  useEffect(() => {
    if (!frameMenu) return
    const close = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setFrameMenu(false)
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFrameMenu(false)
    }
    document.addEventListener('pointerdown', close, true)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', close, true)
      document.removeEventListener('keydown', esc)
    }
  }, [frameMenu])

  const clickFrame = () => {
    if (tool !== 'frame') setFrameMenu((m) => !m)
    else setFrameMenu((m) => !m)
  }

  return (
    <TooltipProvider>
      <div className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2">
        {/* frame preset menu */}
        {frameMenu && (
          <div
            ref={menuRef}
            className="absolute bottom-full left-1/2 mb-2 w-64 -translate-x-1/2 rounded-xl border border-border bg-popover/95 p-1.5 shadow-2xl backdrop-blur"
          >
            <button
              onClick={() => {
                useUi.getState().setTool('frame')
                setFrameMenu(false)
              }}
              className="mb-1 flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] text-foreground hover:bg-accent"
            >
              <SquareDashed size={14} className="text-muted-foreground" />
              <span className="flex-1">Frame</span>
              <span className="text-[11px] text-muted-foreground">drag to draw</span>
            </button>
            <div className="my-1 h-px bg-border" />
            <div className="max-h-72 overflow-y-auto scrollbar-thin">
              {FRAME_PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => {
                    addFramePreset(p.name, p.w, p.h)
                    setFrameMenu(false)
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[13px] text-foreground hover:bg-accent"
                >
                  <span>{p.name}</span>
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {p.w} × {p.h}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* toolbar pill */}
        <div className="flex items-center gap-0.5 rounded-2xl border border-border bg-popover/95 p-1.5 shadow-2xl backdrop-blur">
          {tools.map((t, i) => {
            const active = tool === t.id
            const Icon = t.icon
            const click = () => {
              if (t.id === 'frame') clickFrame()
              else useUi.getState().setTool(t.id)
            }
            return (
              <div key={t.id} className="flex items-center">
                <Hint label={`${t.label} (${t.key})`} side="top">
                  <button
                    disabled={gesture != null}
                    onClick={click}
                    className={
                      'flex size-8 items-center justify-center rounded-lg transition-colors ' +
                      (active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground') +
                      (t.id === 'frame' ? ' pr-3' : '')
                    }
                  >
                    <Icon size={15} />
                  </button>
                </Hint>
                {t.id === 'frame' && (
                  <button
                    disabled={gesture != null}
                    onClick={clickFrame}
                    className="-ml-2 mr-0.5 flex h-8 w-3 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label="Frame presets"
                  >
                    <svg width="8" height="8" viewBox="0 0 8 8" className="opacity-70">
                      <path d="M1 3 L4 6 L7 3" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
                {t.dividerAfter && <div className="mx-1 h-5 w-px shrink-0 bg-border" />}
              </div>
            )
          })}
          <div className="mx-1 h-5 w-px shrink-0 bg-border" />
          <Hint label="Undo (⌘Z)" side="top">
            <button
              disabled={!canUndo || gesture != null}
              onClick={undo}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30"
            >
              <Undo2 size={15} />
            </button>
          </Hint>
          <Hint label="Redo (⇧⌘Z)" side="top">
            <button
              disabled={!canRedo || gesture != null}
              onClick={redo}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30"
            >
              <Redo2 size={15} />
            </button>
          </Hint>
        </div>
      </div>
    </TooltipProvider>
  )
}
