/* Narrow probe of the zustand+immer pattern used in docStore. Run: bun scripts/immerProbe.ts */
;(globalThis as unknown as { localStorage: unknown }).localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}
process.on('uncaughtException', (e) => {
  console.log('CRASH:', (e as Error).message)
  process.exit(9)
})

const { create } = await import('zustand')
const { produce } = await import('immer')

interface Shape {
  id: string
  n: number
}
interface S {
  nodes: Record<string, Shape>
  past: unknown[]
}

const useStore = create<S>(() => ({ nodes: {}, past: [] }))
const st = () => useStore.getState()

const applyMut = (fn: (n: Record<string, Shape>) => void) => {
  useStore.setState(produce((s: S) => { fn(s.nodes) }))
}

console.log('— add A —')
applyMut((n) => { n['a'] = { id: 'a', n: 1 } })
console.log('after A:', Object.keys(st().nodes))

console.log('— add B —')
applyMut((n) => { n['b'] = { id: 'b', n: 2 } })
console.log('after B:', Object.keys(st().nodes))

console.log('— add C with nested mutation —')
applyMut((n) => {
  n['c'] = { id: 'c', n: 3 }
  if (n['c']) (n['c'] as unknown as Record<string, number>).x = 1
})
console.log('after C:', Object.keys(st().nodes))

console.log('— capture a DRAFT outside produce (docStore deleteShapes pattern) —')
let leakedDraft: unknown = null
applyMut((n) => {
  leakedDraft = n['c']
  delete n['c']
})
console.log('after delete:', Object.keys(st().nodes), '| leaked draft typeof:', typeof leakedDraft)

useStore.setState(produce((s: S) => { s.past.push({ item: leakedDraft }); s.future = [] }))
console.log('history push with leaked draft: ok')

console.log('— subsequent mutation after poisoned history —')
applyMut((n) => { n['d'] = { id: 'd', n: 4 } })
console.log('after D:', Object.keys(st().nodes))

console.log('— undo-style read of poisoned entry —')
const e0 = st().past[0] as { item: unknown }
console.log('entry item id:', (e0.item as Shape | undefined)?.id)
