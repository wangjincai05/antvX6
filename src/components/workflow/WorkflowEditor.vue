<template>
  <div class="w-full h-full flex flex-col bg-gray-100 relative">
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
    <div class="flex-1 flex flex-col relative">
      <div ref="containerRef" class="flex-1 bg-gray-50" />
      <RunPanel v-if="showRunPanel" class="border-t border-gray-200" />

      <Transition name="slide">
        <InspectorPanel
          v-if="inspectorSelectedNode"
          :selected-node="inspectorSelectedNode"
          @update-label="handleUpdateLabel"
          @update-properties="handleUpdateProperties"
          class="absolute right-0 top-0 h-full z-40 shadow-xl"
        />
      </Transition>
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

    <Transition name="fade">
      <div
        v-if="statusMessage"
        class="absolute top-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg text-sm z-50"
      >
        {{ statusMessage }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useGraphStore } from '@/stores/graphStore';
import { useWorkflowStore } from '@/stores/workflowStore';
import { useToast } from '@/composables/useToast';
import type { InspectorNode } from '@/types/inspector';
import Toolbar from './Toolbar.vue';
import BottomToolbar from './BottomToolbar.vue';
import InspectorPanel from './InspectorPanel.vue';
import RunPanel from './RunPanel.vue';

const toast = useToast();

const showRunPanel = ref(false);
const containerRef = ref<HTMLElement | null>(null);
const currentZoom = ref(1);

const graphStore = useGraphStore();
const workflowStore = useWorkflowStore();

const inspectorSelectedNode = computed(
  () => graphStore.selectionStore.selectedNode as InspectorNode | null
);

const {
  initGraph,
  graphRef,
  exportWorkflow,
  importWorkflow,
  clearCanvas,
  zoomIn,
  zoomOut,
  resetZoom,
  addNode,
  statusMessage,
  updateNodeLabel,
  updateNodeProperty,
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

interface History {
  undo?: () => void;
  redo?: () => void;
}

const handleUndo = () => {
  const history = (graphRef as unknown as { history?: History })?.history;
  history?.undo?.();
};

const handleRedo = () => {
  const history = (graphRef as unknown as { history?: History })?.history;
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
    toast.error(result.errors.join('\n'));
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

const handleUpdateLabel = (label: string) => {
  if (graphStore.selectionStore.selectedNode) {
    updateNodeLabel(graphStore.selectionStore.selectedNode.id, label);
  }
};

const handleUpdateProperties = (properties: Record<string, string>) => {
  if (graphStore.selectionStore.selectedNode) {
    Object.entries(properties).forEach(([key, value]) => {
      updateNodeProperty(graphStore.selectionStore.selectedNode!.id, key, value);
    });
  }
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}

.slide-enter-active,
.slide-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
