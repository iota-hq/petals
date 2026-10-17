import { useEffect } from 'react'
import { useDoc } from '@/store/docStore'
import { useUi } from '@/store/uiStore'
import { afterLoadCamera } from './commands'
import { useKeyboard } from './useKeyboard'
import { TopBar } from './TopBar'
import { Toolbar } from './Toolbar'
import { LeftPanel } from './LeftPanel'
import { PropertiesPanel } from './PropertiesPanel'
import { CanvasRoot } from './CanvasRoot'

export default function EditorPage({ projectId }: { projectId: string }) {
  useKeyboard()

  useEffect(() => {
    useDoc.getState().loadDoc(projectId)
    useUi.setState({ selection: [], tool: 'select', editingText: null, gesture: null, dropTarget: null, hoverId: null })
    afterLoadCamera()
  }, [projectId])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TopBar projectId={projectId} />
      <div className="flex min-h-0 flex-1">
        <LeftPanel />
        <main className="relative min-w-0 flex-1">
          <CanvasRoot />
          <Toolbar />
        </main>
        <PropertiesPanel />
      </div>
    </div>
  )
}
