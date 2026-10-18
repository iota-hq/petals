import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import Landing from '@/pages/Landing'
import Dashboard from '@/pages/Dashboard'
import EditorPage from '@/editor/EditorPage'

type Route =
  | { kind: 'landing' }
  | { kind: 'dashboard' }
  | { kind: 'board'; id: string }

function parsePath(): Route {
  const p = window.location.pathname
  if (p === '/') return { kind: 'landing' }
  const m = /^\/board\/([A-Za-z0-9_-]+)/.exec(p)
  if (m) return { kind: 'board', id: m[1] }
  if (p.startsWith('/projects')) return { kind: 'dashboard' }
  return { kind: 'landing' }
}

/** Promote old '#/...' bookmarks to clean paths (one-time, no history entry). */
function migrateHash() {
  const h = window.location.hash
  if (!h.startsWith('#/') || h === '#/' ) return
  const path = h.slice(1)
  if (path.startsWith('/projects') || /^\/board\//.test(path)) window.history.replaceState({}, '', path)
}

export function go(to: string) {
  if (window.location.pathname === to) return
  window.history.pushState({}, '', to)
  window.dispatchEvent(new CustomEvent('petal:navigate', { detail: { to } }))
}

/** Petals bloom that spins (at the logo's own 6.67s pace) while a board opens (shown ~1s). */
function BoardLoader() {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <img
        src="/petal-flower.svg"
        alt="Petals"
        className="size-12"
      />
    </motion.div>
  )
}

function App() {
  const [route, setRoute] = useState<Route>(parsePath)
  const [loader, setLoader] = useState(false)
  const routeRef = useRef(route)
  routeRef.current = route
  useEffect(() => {
    migrateHash()
    setRoute(parsePath())
    const on = () => {
      migrateHash()
      const next = parsePath()
      setRoute(next)
      // entering a board from the dashboard shows the petals loader for ~2s
      if (routeRef.current.kind === 'dashboard' && next.kind === 'board') {
        setLoader(true)
        window.setTimeout(() => setLoader(false), 1000)
      }
    }
    window.addEventListener('popstate', on)
    window.addEventListener('petal:navigate', on)
    // fragment-only navigations (e.g. /#/board/…) fire hashchange without reload
    window.addEventListener('hashchange', on)
    return () => {
      window.removeEventListener('popstate', on)
      window.removeEventListener('petal:navigate', on)
      window.removeEventListener('hashchange', on)
    }
  }, [])

  const key = route.kind === 'board' ? `board:${route.id}` : route.kind
  const page =
    route.kind === 'dashboard' ? (
      <Dashboard />
    ) : route.kind === 'board' ? (
      <EditorPage key={route.id} projectId={route.id} />
    ) : (
      <Landing />
    )

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          className="h-dvh"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {page}
        </motion.div>
      </AnimatePresence>
      <AnimatePresence>{loader && <BoardLoader key="board-loader" />}</AnimatePresence>
    </>
  )
}

export default App
