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

/* ---------- random stub names: "Sleepy-Walrus-3902"-style ---------- */

export const NAME_FIRST_PARTS = [
  'Sleepy', 'Cosmic', 'Hungry', 'Grumpy', 'Fluffy', 'Silent', 'Crispy', 'Wandering', 'Lazy', 'Electric',
  'Soggy', 'Brave', 'Mellow', 'Rusty', 'Salty', 'Dizzy', 'Frosty', 'Gentle', 'Chaotic', 'Humble',
  'Sneaky', 'Velvet', 'Wild', 'Quirky', 'Midnight',
] as const

export const NAME_SECOND_PARTS = [
  'Waffle', 'Pumpkin', 'Penguin', 'Noodle', 'Badger', 'Pickle', 'Walrus', 'Muffin', 'Otter', 'Toaster',
  'Raccoon', 'Biscuit', 'Llama', 'Potato', 'Falcon', 'Cactus', 'Sparrow', 'Banana', 'Gecko', 'Turnip',
  'Moose', 'Pretzel', 'Lemur', 'Mango', 'Beetle',
] as const

/**
 * Random "Salty-Gecko-9031" name from 25 adjectives × 25 nouns (625 combos).
 * A newly created project never reuses a combo while unused ones remain; the numeric
 * suffix is a random 2–4 digit number.
 */
export function randomProjectName(used: readonly string[]): string {
  const usedSet = new Set(used)
  const combos: Array<[string, string]> = []
  for (const a of NAME_FIRST_PARTS) for (const n of NAME_SECOND_PARTS) combos.push([a, n])
  const fresh = combos.filter(([a, n]) => !Array.from(usedSet).some((u) => u.startsWith(`${a}-${n}-`)))
  const pool = fresh.length ? fresh : combos
  const [a, n] = pool[Math.floor(Math.random() * pool.length)]
  const digits = [2, 3, 4][Math.floor(Math.random() * 3)]
  const num = 1 + Math.floor(Math.random() * (10 ** digits - 1))
  return `${a}-${n}-${num}`
}

interface ProjectsState {
  projects: ProjectMeta[]
  add: (name: string) => ProjectMeta
  /** New project with an auto-generated random name. */
  addRandom: () => ProjectMeta
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
  addRandom() {
    return get().add(randomProjectName(get().projects.map((p) => p.name)))
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