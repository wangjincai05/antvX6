<template>
  <div class="w-full h-full flex flex-col bg-gray-100">
    <Toolbar
      @zoom-in="handleZoomIn"
      @zoom-out="handleZoomOut"
      @reset-zoom="handleResetZoom"
      @undo="handleUndo"
      @redo="handleRedo"
      @clear="handleClear"
      @export="handleExport"
      @import="handleImport"
      @run="handleRun"
      @stop="handleStop"
    />
    <div class="flex-1 flex overflow-hidden">
      <NodePanel />
      <div class="flex-1 flex flex-col">
        <div
          ref="containerRef"
          class="flex-1 bg-gray-50"
        />
        <RunPanel
          v-if="showRunPanel"
          class="border-t border-gray-200"
        />
      </div>
      <InspectorPanel
        :selected-node="selectedNode"
        :selected-edge="selectedEdge"
        @update-label="handleUpdateLabel"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Toolbar from './Toolbar.vue'
import NodePanel from './NodePanel.vue'
import InspectorPanel from './InspectorPanel.vue'
import RunPanel from './RunPanel.vue'
import { useGraph } from '@/composables/workflow/useGraph'
import { useExecutor } from '@/composables/workflow/useExecutor'

const showRunPanel = ref(false)
const containerRef = ref<HTMLElement | null>(null)

const {
  initGraph,
  graphRef,
  selectedNode,
  selectedEdge,
  exportWorkflow,
  importWorkflow,
  clearCanvas,
  zoomIn,
  zoomOut,
  resetZoom
} = useGraph()

const { startExecution, stopExecution, workflowState } = useExecutor()

onMounted(() => {
  if (containerRef.value) {
    initGraph(containerRef.value)
  }
})

onUnmounted(() => {
  graphRef.value?.dispose()
})

watch(workflowState, (state) => {
  showRunPanel.value = state.isRunning || Object.keys(state.executionStates).length > 0
})

const handleZoomIn = () => zoomIn()
const handleZoomOut = () => zoomOut()
const handleResetZoom = () => resetZoom()

const handleUndo = () => {
  const history = (graphRef.value as any)?.history
  history?.undo?.()
}
const handleRedo = () => {
  const history = (graphRef.value as any)?.history
  history?.redo?.()
}

const handleClear = () => {
  if (confirm('确定要清空画布吗？')) {
    clearCanvas()
  }
}

const handleExport = () => {
  const json = exportWorkflow()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'workflow.json'
  a.click()
  URL.revokeObjectURL(url)
}

const handleImport = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        importWorkflow(event.target?.result as string)
      }
      reader.readAsText(file)
    }
  }
  input.click()
}

const handleRun = async () => {
  const result = await startExecution()
  if (!result.success) {
    alert(result.errors.join('\n'))
  }
}

const handleStop = () => {
  stopExecution()
}

const handleUpdateLabel = (_label: string) => {}
</script>