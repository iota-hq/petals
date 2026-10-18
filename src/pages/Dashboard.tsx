import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { MoreHorizontal, Plus } from 'lucide-react'
import { go } from '@/App'
import { buttonVariants } from '@/components/ui/button'
import { useProjects } from '@/store/projectsStore'
import type { ProjectMeta } from '@/store/projectsStore'
import { cn } from '@/lib/utils'
import { PageMenu, pillDark, pillLight, FlowerLogo, LoginPill } from '@/components/PageMenu'

/** ease used by every entrance in the app — quick start, soft landing */
const easeOut = [0.22, 1, 0.36, 1] as const

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function Dashboard() {
  const projects = useProjects((s) => s.projects)
  const sorted = [...projects.filter((p) => !!p)].sort((a, b) => b.updatedAt - a.updatedAt)

  const newProject = () => {
    const p = useProjects.getState().addRandom()
    go(`/board/${p.id}`)
  }

  return (
    <div className="flex h-dvh flex-col">
      <motion.header
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="relative flex h-14 shrink-0 items-center justify-end border-b border-white/10 bg-background px-5 md:px-7"
      >
        <PageMenu />
        {/* wordmark dead-center, back to the landing page */}
        <button
          onClick={() => go('/')}
          className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center"
        >
          <FlowerLogo size={28} />
        </button>
        <div className="flex items-center gap-3">
          <LoginPill />
          <button onClick={newProject} className={sorted.length === 0 ? pillDark : pillLight}>
            <Plus size={14} />
            New project
          </button>
        </div>
      </motion.header>

      <main className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-6xl px-6 pb-10 pt-14 md:pt-20">
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOut, delay: 0.15 }}
            className="text-[34px] font-medium leading-none tracking-[-0.015em] md:text-[38px]"
          >
            Projects
          </motion.h1>

          {sorted.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easeOut, delay: 0.3 }}
              className="mt-8 flex flex-col items-center gap-4 rounded-xl border border-dashed border-white/15 py-24 text-center"
            >
              <FlowerLogo size={56} className="opacity-80" />
              <div>
                <p className="text-[14px] font-medium">Your petals bloom here</p>
              </div>
              <button onClick={newProject} className={pillLight}>
                <Plus size={14} />
                Create your first project
              </button>
            </motion.div>
          ) : (
            <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
              {sorted.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: easeOut, delay: 0.25 + Math.min(i, 8) * 0.06 }}
                >
                  <ProjectCard project={p} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function ProjectCard({ project }: { project: ProjectMeta }) {
  const [editing, setEditing] = useState(false)
  const [menu, setMenu] = useState<{ open: boolean; pos: { top: number; left: number } }>({ open: false, pos: { top: 0, left: 0 } })
  const menuRef = useRef<HTMLDivElement | null>(null)

  const rename = () => {
    setMenu((m) => ({ ...m, open: false }))
    setEditing(true)
  }
  const remove = () => {
    setMenu((m) => ({ ...m, open: false }))
    useProjects.getState().remove(project.id)
  }

  useEffect(() => {
    if (!menu.open) return
    const onDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu((m) => ({ ...m, open: false }))
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu((m) => ({ ...m, open: false }))
    }
    window.addEventListener('pointerdown', onDown, true)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [menu.open])

  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (menu.open) {
      setMenu((m) => ({ ...m, open: false }))
      return
    }
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setMenu({ open: true, pos: { top: r.bottom + 6, left: Math.max(8, r.right - 160) } })
  }

  return (
    <div
      onClick={() => {
        if (!editing) go(`/board/${project.id}`)
      }}
      className="cursor-pointer overflow-hidden rounded-xl border border-white/8 bg-[#161616] text-left"
    >
      {/* quiet thumbnail: dim bloom on dark, no hover motion */}
      <div className="relative flex h-32 items-center justify-center bg-[#1b1b1b]">
        <FlowerLogo size={44} className="opacity-25" />
      </div>
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-between gap-1">
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
                className="w-full rounded bg-[#262626] px-1 text-[14px] font-semibold outline-none"
              />
            ) : (
              <p className="truncate text-[14px] font-semibold text-foreground">{project.name}</p>
            )}
          </div>
          <button
            aria-label="Project menu"
            onClick={openMenu}
            className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <div className="flex size-4 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-fuchsia-500 text-[7px] font-bold text-white">
            u
          </div>
          user · {fmtDate(project.updatedAt)}
        </div>
      </div>
      {menu.open && (
        <div
          ref={menuRef}
          style={{ top: menu.pos.top, left: menu.pos.left }}
          className="fixed z-50 w-[160px] rounded-xl border border-border bg-popover/95 py-1 shadow-2xl backdrop-blur"
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              rename()
            }}
            className="block w-full cursor-pointer px-2.5 py-1.5 text-left text-[12px] font-medium text-foreground/90 hover:bg-accent"
          >
            Rename
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              remove()
            }}
            className="block w-full cursor-pointer px-2.5 py-1.5 text-left text-[12px] font-medium text-foreground/90 hover:bg-accent"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

// re-export for future landing-page links
export { buttonVariants }
