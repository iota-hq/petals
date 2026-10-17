import { Redo2, Undo2 } from 'lucide-react'
import { useDoc } from '@/store/docStore'
import { redo, undo } from './commands'
import { Hint } from '@/components/ui/tooltip'

/** Shared undo/redo pair used by the toolbar, panels and floating toggles. */
export function UndoRedoButtons() {
  const canUndo = useDoc((s) => s.past.length > 0)
  const canRedo = useDoc((s) => s.future.length > 0)
  return (
    <>
      <Hint label="Undo (⌘Z)">
        <button
          disabled={!canUndo}
          onClick={undo}
          className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
        >
          <Undo2 size={14} />
        </button>
      </Hint>
      <Hint label="Redo (⇧⌘Z)">
        <button
          disabled={!canRedo}
          onClick={redo}
          className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
        >
          <Redo2 size={14} />
        </button>
      </Hint>
    </>
  )
}
