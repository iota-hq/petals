import { useEffect, useRef } from 'react'
import { ChevronLeft, PanelLeft, PanelRight } from 'lucide-react'
import { useDoc } from '@/store/docStore'
import { useUi } from '@/store/uiStore'
import { afterLoadCamera } from './commands'
import { go } from '@/App'
import { useKeyboard } from './useKeyboard'
import { Toolbar } from './Toolbar'
import { LeftPanel } from './LeftPanel'
import { PropertiesPanel, ZoomCluster } from './PropertiesPanel'
import { CanvasRoot } from './CanvasRoot'
import { UndoRedoButtons } from './UndoRedoButtons'
import { CanvasContextMenu } from './ContextMenu'
import { Hint } from '@/components/ui/tooltip'

export default function EditorPage({ projectId }: { projectId: string }) {
  useKeyboard()
  const mainRef = useRef<HTMLElement | null>(null)
  const showLeft = useUi((s) => s.showLeft)
  const showRight = useUi((s) => s.showRight)

  useEffect(() => {
    useDoc.getState().loadDoc(projectId)
    useUi.setState({ selection: [], tool: 'select', editingText: null, gesture: null, dropTarget: null, hoverId: null })
    // small screens start with both sidebars collapsed (they open as overlays)
    if (window.innerWidth < 1024) useUi.setState({ showLeft: false, showRight: false })
    afterLoadCamera()
  }, [projectId])

  return (
    <div className="flex h-full min-h-0">
      {showLeft && <LeftPanel projectId={projectId} />}
      <main ref={mainRef} className="relative min-w-0 flex-1">
        <CanvasRoot />
        <Toolbar />
        <CanvasContextMenu onClose={() => undefined} />
        {/* zoom sits top-center on its own on small screens (the panels' top bar is not shown) */}
        {!showRight && (
          <div className="absolute left-1/2 top-3 z-30 flex -translate-x-1/2 items-center gap-0.5 rounded-xl border border-border bg-popover/95 p-1 shadow-lg backdrop-blur lg:hidden">
            <ZoomCluster />
          </div>
        )}
        {!showLeft && (
          <div className="absolute left-3 top-3 z-30 flex items-center gap-0.5 rounded-lg border border-border bg-popover/95 p-0.5 shadow-lg backdrop-blur">
            <Hint label="Back to projects">
              <button
                className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={() => go('/projects')}
              >
                <ChevronLeft size={15} />
              </button>
            </Hint>
            <Hint label="Show layers panel">
              <button
                className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={() => useUi.getState().togglePanel('left')}
              >
                <PanelLeft size={15} />
              </button>
            </Hint>
          </div>
        )}
        {!showRight && (
          <div className="absolute right-3 top-3 z-30 flex items-center gap-0.5 rounded-lg border border-border bg-popover/95 p-0.5 shadow-lg backdrop-blur">
            <UndoRedoButtons />
            <div className="mx-0.5 h-4 w-px bg-border" />
            <Hint label="Show properties panel">
              <button
                className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={() => useUi.getState().togglePanel('right')}
              >
                <PanelRight size={15} />
              </button>
            </Hint>
          </div>
        )}
      </main>
      {showRight && <PropertiesPanel />}
    </div>
  )
}
