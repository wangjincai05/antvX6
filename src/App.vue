<template>
  <div class="w-full h-full flex flex-col bg-gray-100">
    <Toolbar
      :can-undo="canUndo"
      :can-redo="canRedo"
      @undo="handleUndo"
      @redo="handleRedo"
      @clear="handleClear"
      @export="handleExport"
      @import="handleImport"
    />
    <div class="flex-1 flex overflow-hidden">
      <NodePanel />
      <WorkflowCanvas />
      <PropertyPanel
        :selected-node="selectedNode"
        :selected-edge="selectedEdge"
        @update-label="handleUpdateLabel"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Toolbar from '@/components/Toolbar.vue'
import NodePanel from '@/components/NodePanel.vue'
import WorkflowCanvas from '@/components/WorkflowCanvas.vue'
import PropertyPanel from '@/components/PropertyPanel.vue'
import { useCanvas } from '@/composables/useCanvas'

const { selectedNode, selectedEdge, graphRef, exportWorkflow, importWorkflow, clearCanvas } = useCanvas()

const canUndo = ref(false)
const canRedo = ref(false)

watch(graphRef, (graph) => {
  if (graph) {
    const updateHistory = () => {
      canUndo.value = graph.canUndo()
      canRedo.value = graph.canRedo()
    }
    graph.on('history:change', updateHistory)
    updateHistory()
  }
})

const handleUndo = () => {
  graphRef.value?.undo()
}

const handleRedo = () => {
  graphRef.value?.redo()
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

const handleImport = (content: string) => {
  importWorkflow(content)
}

const handleUpdateLabel = (_label: string) => {
}
</script>