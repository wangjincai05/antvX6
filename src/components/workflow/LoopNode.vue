<template>
  <div
    class="loop-node-container bg-white rounded-lg border-2 transition-all duration-300 h-full flex flex-col"
    :class="{ collapsed: isCollapsed }"
  >
    <div
      class="node-header flex items-center gap-2 p-3 cursor-pointer select-none flex-shrink-0"
      :class="{ 'hover:bg-gray-50': !isEditing }"
    >
      <img :src="getIconPath('icon-loop')" alt="循环" class="w-6 h-6 flex-shrink-0" />
      <div class="flex-1 min-w-0">
        <div
          class="text-sm font-medium text-gray-800 truncate"
          :style="{ fontFamily: 'Microsoft YaHei' }"
        >
          {{ displayLabel }}
        </div>
      </div>
      <button
        class="collapse-btn w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
        @click.stop.prevent="toggleCollapse()"
      >
        <svg
          class="w-4 h-4 transition-transform duration-200"
          :class="{ 'rotate-180': isCollapsed }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
    </div>

    <div
      class="collapsed-drop-hint p-2 border-t border-gray-100 bg-gray-50 flex-1 flex items-center justify-center"
      v-show="!isCollapsed"
    >
      <div class="flex items-center justify-center gap-2 py-2 text-gray-400">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        <span class="text-xs">拖拽节点到此处</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, watch } from 'vue';
import { nodeRegistry } from '@/config/workflow/node-registry';
import { getIconPath } from '@/utils/node-utils';
import type { Graph, Node } from '@antv/x6';

interface LoopNode extends Node {
  isCollapsed?: () => boolean;
  toggleCollapse?: (collapsed?: boolean) => void;
}

interface GetNodeFn {
  (): LoopNode | undefined;
}

interface GetGraphFn {
  (): Graph | undefined;
}

const getNode = inject<GetNodeFn>('getNode');
const getGraph = inject<GetGraphFn>('getGraph');
const node = getNode?.();
const graph = getGraph?.();
const nodeId = node?.id || '';

const nodeData = ref(node?.getData?.() || {});
const isCollapsed = ref(false);
const isEditing = ref(false);
const expandSize = ref<{ width: number; height: number } | null>(null);
const COLLAPSED_WIDTH = 200;
const COLLAPSED_HEIGHT = 55;

const config = computed(() => nodeRegistry[nodeData.value.type || '']);

const displayLabel = computed(() => {
  if (nodeData.value.label) {
    return nodeData.value.label;
  }
  return config.value?.name || '循环';
});

const toggleCollapse = () => {
  const target = !isCollapsed.value;
  if (target) {
    expandSize.value = node?.getSize?.() || null;
    node?.resize?.(COLLAPSED_WIDTH, COLLAPSED_HEIGHT);
  } else {
    if (expandSize.value) {
      node?.resize?.(expandSize.value.width, expandSize.value.height);
    }
  }

  isCollapsed.value = target;
  updateChildrenVisibility(target);
};

const updateChildrenVisibility = (collapsed: boolean) => {
  const cells = node?.getChildren?.() || [];
  cells.forEach((cell) => {
    if (collapsed) {
      cell.hide();
    } else {
      cell.show();
    }
  });
};

watch(isCollapsed, (val) => {
  if (graph) {
    const loopNode = graph.getCellById(nodeId);
    if (loopNode) {
      loopNode.setData({ ...loopNode.getData(), collapsed: val });
    }
  }
});
</script>

<style scoped>
.loop-node-container {
  transition: all 0.3s ease;
}

.loop-node-container.collapsed {
  min-height: 55px;
  max-height: 55px;
  min-width: 200px;
  max-width: 200px;
}
</style>
