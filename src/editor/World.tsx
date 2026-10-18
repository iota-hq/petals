import { memo, useMemo } from 'react'
import { childrenSorted } from '@/model/geometry'
import type { Shape } from '@/model/types'
import { useDoc } from '@/store/docStore'
import { ShapeNode } from './NodeView'

/**
 * Renders the whole node tree. Re-renders only when the document changes —
 * never on camera moves or gestures (those sync transforms via refs).
 */
export const World = memo(function World() {
  const nodes = useDoc((s) => s.nodes)
  const activePage = useDoc((s) => s.activePage)
  const group = useMemo(() => childrenSorted(nodes), [nodes])
  // paints roots plus any orphan whose parent frame is missing (defensive) — active page only
  const roots = useMemo(() => {
    const onPage = (s: Shape) => !s.pageId || s.pageId === activePage
    const base = (group.get(null) ?? []).filter(onPage)
    const orphans = Object.values(nodes).filter((s) => s.parentId && !nodes[s.parentId] && onPage(s))
    return orphans.length ? [...base, ...orphans] : base
  }, [group, nodes, activePage])
  return (
    <>
      {roots.map((s) => (
        <ShapeNode key={s.id} s={s} group={group} />
      ))}
    </>
  )
})
