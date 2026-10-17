import { memo, useMemo } from 'react'
import { childrenSorted } from '@/model/geometry'
import { useDoc } from '@/store/docStore'
import { ShapeNode } from './NodeView'

/**
 * Renders the whole node tree. Re-renders only when the document changes —
 * never on camera moves or gestures (those sync transforms via refs).
 */
export const World = memo(function World() {
  const nodes = useDoc((s) => s.nodes)
  const group = useMemo(() => childrenSorted(nodes), [nodes])
  // paints roots plus any orphan whose parent frame is missing (defensive)
  const roots = useMemo(() => {
    const base = group.get(null) ?? []
    const orphans = Object.values(nodes).filter((s) => s.parentId && !nodes[s.parentId])
    return orphans.length ? [...base, ...orphans] : base
  }, [group, nodes])
  return (
    <>
      {roots.map((s) => (
        <ShapeNode key={s.id} s={s} group={group} />
      ))}
    </>
  )
})
