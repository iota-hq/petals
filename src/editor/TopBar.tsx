import { useEffect, useState } from 'react'
import { ChevronLeft, Redo2, Share2, Undo2 } from 'lucide-react'
import PetalMark from '@/components/PetalMark'
import { useProjects } from '@/store/projectsStore'
import { useDoc } from '@/store/docStore'
import { redo, undo } from './commands'
import { Hint } from '@/components/ui/tooltip'

export function TopBar({ projectId }: { projectId: string }) {
  const project = useProjects((s) => s.projects.find((p) => p.id === projectId))
  const name = project?.name ?? 'Untitled'
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  useEffect(() => setDraft(name), [name])

  const canUndo = useDoc((s) => s.past.length > 0)
  const canRedo = useDoc((s) => s.future.length > 0)

  const commit = () => {
    setEditing(false)
    const v = draft.trim()
    if (v && v !== name) useProjects.getState().rename(projectId, v)
  }

  return (
    <header className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-card px-2">
      <div className="flex min-w-0 items-center gap-1.5">
        <Hint label="Back to projects">
          <button
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={() => {
              window.location.hash = '/projects'
            }}
          >
            <ChevronLeft size={16} />
          </button>
        </Hint>
        <PetalMark size={18} />
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') setEditing(false)
            }}
            className="w-48 rounded border border-input bg-transparent px-1.5 py-0.5 text-sm outline-none focus:border-ring"
          />
        ) : (
          <button className="truncate px-1.5 py-0.5 text-sm font-medium hover:bg-accent rounded-md" onClick={() => setEditing(true)}>
            {name}
          </button>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Hint label="Undo (⌘Z)">
          <button
            disabled={!canUndo}
            onClick={undo}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
          >
            <Undo2 size={15} />
          </button>
        </Hint>
        <Hint label="Redo (⇧⌘Z)">
          <button
            disabled={!canRedo}
            onClick={redo}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
          >
            <Redo2 size={15} />
          </button>
        </Hint>
        <div className="mx-1 h-4 w-px bg-border" />
        <Hint label="Coming soon">
          <button className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
            <Share2 size={12} />
            Share
          </button>
        </Hint>
      </div>
    </header>
  )
}
