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
  const roots = group.get(null) ?? []
  return (
    <>
      {roots.map((s) => (
        <ShapeNode key={s.id} s={s} group={group} />
      ))}
    </>
  )
})
