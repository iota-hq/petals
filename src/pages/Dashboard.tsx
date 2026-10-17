import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { go } from '@/App'
import PetalMark from '@/components/PetalMark'
import { Button, buttonVariants } from '@/components/ui/button'
import { useProjects } from '@/store/projectsStore'
import type { ProjectMeta } from '@/store/projectsStore'
import { cn } from '@/lib/utils'

const gradients = [
  'from-pink-500/25 via-fuchsia-500/10 to-transparent',
  'from-rose-400/20 via-pink-500/10 to-transparent',
  'from-fuchsia-500/20 via-violet-500/10 to-transparent',
  'from-pink-600/20 via-rose-500/10 to-transparent',
]

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function Dashboard() {
  const projects = useProjects((s) => s.projects)
  const [editingId, setEditingId] = useState<string | null>(null)
  const sorted = [...projects.filter((p) => !!p)].sort((a, b) => b.updatedAt - a.updatedAt)

  const newProject = () => {
    const p = useProjects.getState().add(`Untitled ${sorted.length ? '' : ''}`.trim() || 'Untitled')
    go(`/board/${p.id}`)
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-5">
        <button className="flex items-center gap-2" onClick={() => go('/')}>
          <PetalMark size={22} />
          <span className="text-sm font-semibold tracking-tight">Petal</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-fuchsia-500 text-[10px] font-bold text-white">
              u
            </div>
            user
          </div>
          <Button size="sm" onClick={newProject}>
            <Plus size={14} />
            New project
          </Button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Files</h2>

          {sorted.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-24 text-center">
              <PetalMark size={56} />
              <div>
                <p className="text-sm font-medium">Your petals bloom here</p>
                <p className="mt-1 text-xs text-muted-foreground">Create a project and start drawing — everything stays on this device.</p>
              </div>
              <Button onClick={newProject}>
                <Plus size={14} />
                Create your first project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
              {/* new project tile */}
              <button
                onClick={newProject}
                className="flex h-full min-h-[180px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                <span className="flex size-9 items-center justify-center rounded-full border border-border">
                  <Plus size={16} />
                </span>
                <span className="text-sm">New project</span>
              </button>

              {sorted.map((p, i) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  tint={i % gradients.length}
                  editing={editingId === p.id}
                  setEditing={(v) => setEditingId(v ? p.id : null)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function ProjectCard({
  project,
  tint,
  editing,
  setEditing,
}: {
  project: ProjectMeta
  tint: number
  editing: boolean
  setEditing: (v: boolean) => void
}) {
  return (
    <div
      onClick={() => go(`/board/${project.id}`)}
      className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card text-left transition-all hover:border-primary/40 hover:shadow-lg"
    >
      <div className={cn('relative flex h-32 items-center justify-center bg-gradient-to-br', gradients[tint])}>
        <PetalMark size={44} className="opacity-90 transition-transform group-hover:scale-110" />
      </div>
      <div className="flex items-center justify-between gap-1 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              autoFocus
              defaultValue={project.name}
              onClick={(e) => e.stopPropagation()}
              onBlur={(e) => {
                const v = e.target.value.trim()
                if (v) useProjects.getState().rename(project.id, v)
                setEditing(false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                if (e.key === 'Escape') setEditing(false)
              }}
              className="w-full rounded bg-transparent text-[13px] outline-none"
            />
          ) : (
            <p className="truncate text-[13px] font-medium">{project.name}</p>
          )}
          <p className="text-[11px] text-muted-foreground">
            user · {fmtDate(project.updatedAt)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation()
              setEditing(true)
            }}
          >
            <Pencil size={12} />
          </button>
          <button
            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              useProjects.getState().remove(project.id)
            }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

// re-export for future landing-page links
export { buttonVariants }
void Button
