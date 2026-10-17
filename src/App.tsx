import React, { useEffect, useState } from 'react'
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
  window.dispatchEvent(new Event('petal:navigate'))
}

function App() {
  const [route, setRoute] = useState<Route>(parsePath)
  useEffect(() => {
    migrateHash()
    setRoute(parsePath())
    const on = () => {
      migrateHash()
      setRoute(parsePath())
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

  switch (route.kind) {
    case 'dashboard':
      return <Dashboard />
    case 'board':
      return <EditorPage key={route.id} projectId={route.id} />
    default:
      return <Landing />
  }
}

export default App
