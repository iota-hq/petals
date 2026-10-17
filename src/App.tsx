import React, { useEffect, useState } from 'react'
import Landing from '@/pages/Landing'
import Dashboard from '@/pages/Dashboard'
import EditorPage from '@/editor/EditorPage'

type Route =
  | { kind: 'landing' }
  | { kind: 'dashboard' }
  | { kind: 'board'; id: string }

function parseHash(): Route {
  const h = window.location.hash
  if (h.startsWith('#/projects')) return { kind: 'dashboard' }
  const m = /^#\/board\/([A-Za-z0-9_-]+)/.exec(h)
  if (m) return { kind: 'board', id: m[1] }
  return { kind: 'landing' }
}

export function go(to: string) {
  window.location.hash = to
}

function App() {
  const [route, setRoute] = useState<Route>(parseHash)
  useEffect(() => {
    const on = () => setRoute(parseHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
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
