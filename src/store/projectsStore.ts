import { create } from 'zustand'
import { nanoid } from 'nanoid'

export interface ProjectMeta {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

const KEY = 'petal.projects.v1'

function load(): ProjectMeta[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const arr = JSON.parse(raw) as ProjectMeta[]
      if (Array.isArray(arr)) return arr
    }
  } catch {
    /* ignore */
  }
  return []
}

function save(projects: ProjectMeta[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(projects))
  } catch {
    /* ignore */
  }
}

interface ProjectsState {
  projects: ProjectMeta[]
  add: (name: string) => ProjectMeta
  rename: (id: string, name: string) => void
  remove: (id: string) => void
  stamp: (id: string) => void
}

export const useProjects = create<ProjectsState>((set, get) => ({
  projects: load(),
  add(name) {
    const now = Date.now()
    const p: ProjectMeta = { id: nanoid(10), name, createdAt: now, updatedAt: now }
    set((s) => ({ projects: [p, ...s.projects] }))
    save(get().projects)
    return p
  },
  rename(id, name) {
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, name } : p)) }))
    save(get().projects)
  },
  remove(id) {
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }))
    save(get().projects)
    try {
      localStorage.removeItem(`petal.doc.v1.${id}`)
    } catch {
      /* ignore */
    }
  },
  stamp(id) {
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, updatedAt: Date.now() } : p)) }))
    save(get().projects)
  },
}))
