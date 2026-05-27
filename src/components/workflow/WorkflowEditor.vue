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
    />
    <div class="flex-1 flex overflow-hidden">
      <div class="flex-1 flex flex-col relative">
        <div ref="containerRef" class="flex-1 bg-gray-50" />
        <RunPanel v-if="showRunPanel" class="border-t border-gray-200" />
      </div>
      <InspectorPanel
        :selected-node="selectedNode"
        :selected-edge="selectedEdge"
        @update-label="handleUpdateLabel"
      />
    </div>

    <BottomToolbar
      :zoom="currentZoom"
      :min-zoom="0.2"
      :max-zoom="2"
      @zoom-in="handleZoomIn"
      @zoom-out="handleZoomOut"
      @run="handleRun"
      @stop="handleStop"
      @add-node="handleAddNode"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useGraphStore } from '@/stores/graphStore';
import { useWorkflowStore } from '@/stores/workflowStore';
import Toolbar from './Toolbar.vue';
import BottomToolbar from './BottomToolbar.vue';
import InspectorPanel from './InspectorPanel.vue';
import RunPanel from './RunPanel.vue';

const showRunPanel = ref(false);
const containerRef = ref<HTMLElement | null>(null);
const currentZoom = ref(1);

const graphStore = useGraphStore();
const workflowStore = useWorkflowStore();

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
  resetZoom,
  addNode,
} = graphStore;

const { startExecution, stopExecution, workflowState } = workflowStore;

onMounted(() => {
  if (containerRef.value) {
    initGraph(containerRef.value);
  }
});

onUnmounted(() => {
  graphRef?.dispose();
});

watch(workflowState, (state) => {
  showRunPanel.value = state.isRunning || Object.keys(state.executionStates).length > 0;
});

const handleZoomIn = () => {
  zoomIn();
  updateZoom();
};

const handleZoomOut = () => {
  zoomOut();
  updateZoom();
};

const handleResetZoom = () => {
  resetZoom();
  currentZoom.value = 1;
};

const updateZoom = () => {
  const scale = (graphRef as unknown as { getScale: () => number })?.getScale?.();
  if (scale) {
    currentZoom.value = scale;
  }
};

const handleUndo = () => {
  const history = (graphRef as any)?.history;
  history?.undo?.();
};

const handleRedo = () => {
  const history = (graphRef as any)?.history;
  history?.redo?.();
};

const handleClear = () => {
  if (confirm('确定要清空画布吗？')) {
    clearCanvas();
  }
};

const handleExport = () => {
  const json = exportWorkflow();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'workflow.json';
  a.click();
  URL.revokeObjectURL(url);
};

const handleImport = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        importWorkflow(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };
  input.click();
};

const handleRun = async () => {
  const result = await startExecution();
  if (!result.success) {
    alert(result.errors.join('\n'));
  }
};

const handleStop = () => {
  stopExecution();
};

const handleAddNode = (type: string) => {
  if (!containerRef.value) return;

  const rect = containerRef.value.getBoundingClientRect();
  const x = rect.width / 2 - 60;
  const y = rect.height / 2 - 40;
  addNode(type, x, y);
};

const handleUpdateLabel = (_label: string) => {};
</script>
