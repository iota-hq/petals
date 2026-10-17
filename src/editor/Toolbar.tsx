import { Frame, Hand, Image as ImageIcon, Minus, MousePointer2, Square, Circle, Type } from 'lucide-react'
import { useUi, type Tool } from '@/store/uiStore'
import { Hint } from '@/components/ui/tooltip'

const tools: Array<{ id: Tool; icon: typeof Square; label: string; key: string }> = [
  { id: 'select', icon: MousePointer2, label: 'Move', key: 'V' },
  { id: 'hand', icon: Hand, label: 'Pan', key: 'H' },
  { id: 'frame', icon: Frame, label: 'Frame', key: 'F' },
  { id: 'rect', icon: Square, label: 'Rectangle', key: 'R' },
  { id: 'ellipse', icon: Circle, label: 'Ellipse', key: 'O' },
  { id: 'line', icon: Minus, label: 'Line', key: 'L' },
  { id: 'text', icon: Type, label: 'Text', key: 'T' },
  { id: 'image', icon: ImageIcon, label: 'Image', key: 'I' },
]

export function Toolbar() {
  const tool = useUi((s) => s.tool)
  const gesture = useUi((s) => s.gesture?.kind)
  return (
    <div className="absolute left-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-0.5 rounded-xl border border-border bg-popover/95 p-1 shadow-lg backdrop-blur">
      {tools.map((t, i) => {
        const active = tool === t.id
        const Icon = t.icon
        return (
          <div key={t.id}>
            {t.id === 'frame' && <div className="mx-2 my-1 h-px bg-border" />}
            <Hint label={`${t.label} (${t.key})`} side="right">
              <button
                disabled={gesture != null}
                onClick={() => useUi.getState().setTool(t.id)}
                className={
                  'flex size-8 items-center justify-center rounded-lg transition-colors ' +
                  (active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground')
                }
              >
                <Icon size={15} />
              </button>
            </Hint>
          </div>
        )
      })}
    </div>
  )
}
