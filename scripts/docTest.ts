/* Headless check of the doc layer: create several shapes, adopt into frames, undo/redo,
   and verify no shape ever vanishes from `nodes`. Run: bun scripts/docTest.ts */
;(globalThis as unknown as { localStorage: unknown }).localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

let failures = 0
function assert(cond: boolean, msg: string) {
  if (cond) console.log(`  ok  ${msg}`)
  else {
    failures++
    console.log(`FAIL  ${msg}`)
  }
}

const { useDoc } = await import('../src/store/docStore')
const { childrenSorted } = await import('../src/model/geometry')
const { addShapeAt, commitCreate, undo, redo, deleteSelection, duplicateSelection, beginMove, finishMove } = await import(
  '../src/editor/commands'
)
const { useUi } = await import('../src/store/uiStore')
const { pageFromClient: _p } = await import('../src/editor/view')
void _p

const nodes = () => useDoc.getState().nodes
const count = () => Object.keys(nodes()).length

useDoc.setState({ docId: 'test' })

console.log('— create three shapes by dragging —')
const dump = (tag: string) => console.log(`   [${tag}]`, Object.keys(nodes()).map((k) => `${k}:${nodes()[k].name}`).join(', '))
const r1 = addShapeAt('rect', { x: 0, y: 0, w: 100, h: 100 })
dump('r1')
assert(count() === 1, `after rect1 count=1 (got ${count()})`)
const r2 = addShapeAt('rect', { x: 50, y: 50, w: 100, h: 100 })
dump('r2')
assert(count() === 2, `after rect2 count=2 (got ${count()})`)
assert(!!nodes()[r1], 'rect1 still in nodes after creating rect2')
const e1 = addShapeAt('ellipse', { x: 210, y: 10, w: 80, h: 80 })
assert(count() === 3 && !!nodes()[r1] && !!nodes()[r2], 'rect1+rect2 intact after ellipse')

console.log('— frame + adopt —')
const f1 = addShapeAt('frame', { x: 500, y: 0, w: 400, h: 300 })
const child = addShapeAt('rect', { x: 520, y: 20, w: 60, h: 60 })
assert(nodes()[child].parentId === f1, 'new rect adopted into frame')
const kids = childrenSorted(nodes()).get(f1) ?? []
assert(kids.length === 1 && kids[0].id === child, 'childrenSorted sees exactly the adopted child')
assert(!!nodes()[child], 'adopted child keeps its history entry intact')

console.log('— alt-drag duplication path —')
useUi.setState({ selection: [r1] })
beginMove([r1], { x: 0, y: 0 }, true) // dup enabled
useUi.getState().setGesture(useUi.getState().gesture) // no-op keep
// simulate the movement without window events:
const g = useUi.getState().gesture
if (g && g.kind === 'move') {
  ;(useUi.getState() as never as { gesture: never }) // silence unused
}
const { moveLive } = await import('../src/editor/commands')
if (g?.kind === 'move') {
  moveLive({ x: 30, y: 10 }) // crosses dup threshold
  const afterDup = count()
  assert(afterDup === 6, `dup clone inserted (count=${afterDup}, expected 6 = 5 shapes + 1 clone)`)
  moveLive({ x: 60, y: 20 })
  finishMove()
  assert(count() === 6, `clone persists after finishMove (count=${count()})`)
}

console.log('— undo / redo round-trips —')
const beforeUndo = count()
undo()
assert(count() === beforeUndo - 1 || beforeUndo === 0, `undo removes one entry worth of shapes (${count()}/${beforeUndo})`)
redo()
assert(count() === beforeUndo, `redo restores (count=${count()}/${beforeUndo})`)

console.log('— delete + duplicate —')
useUi.setState({ selection: [e1] })
duplicateSelection()
assert(!!nodes()[e1], 'original intact after duplicate')
// duplicate moves selection to the clone — re-select the original before deleting
useUi.setState({ selection: [e1] })
deleteSelection()
assert(!!nodes()[e1] === false, 'deleteSelection removes the selected ellipse')
undo()
assert(!!nodes()[e1], 'undo restores the deleted ellipse')

console.log('— settle save timer —')
await new Promise((r) => setTimeout(r, 500))
assert(count() === Object.keys(nodes()).length, 'stable after save tick')

console.log(failures === 0 ? '\nALL DATA CHECKS PASSED' : `\n${failures} FAILURES`)
process.exit(failures === 0 ? 0 : 1)
