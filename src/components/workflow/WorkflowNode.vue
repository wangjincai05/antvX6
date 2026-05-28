<template>
  <div
    class="flex items-center gap-3 p-3 bg-white rounded-lg border-2 cursor-default"
    :title="customDescription || config?.description || ''"
    :style="containerStyle"
  >
    <img
      v-if="config?.iconType === 'image'"
      :src="getIconPath(config?.icon)"
      :alt="config?.name"
      class="w-10 h-10 rounded-lg flex items-center justify-center"
    />
    <div
      v-else
      class="w-10 h-10 rounded-lg flex items-center justify-center"
      :style="{ backgroundColor: '#5f95ff20' }"
    >
      <span class="text-white font-bold text-lg">{{ config?.icon }}</span>
    </div>
    <div class="min-w-0 flex-1">
      <div class="text-sm font-medium text-gray-800">{{ displayLabel }}</div>
      <div class="text-xs text-gray-500 truncate">{{ displayDescription }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, onMounted, onUnmounted } from 'vue';
import { nodeRegistry } from '@/config/workflow/node-registry';
import { getIconPath } from '@/utils/node-utils';
import type { Graph } from '@antv/x6';

interface GetNodeFn {
  ():
    | { getData: () => { type?: string; label?: string; description?: string }; id: string }
    | undefined;
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

const config = computed(() => nodeRegistry[nodeData.value.type || '']);

const displayLabel = computed(() => {
  if (nodeData.value.label) {
    return nodeData.value.label;
  }
  return config.value?.name || '';
});

const displayDescription = computed(() => {
  if (nodeData.value.description) {
    return nodeData.value.description;
  }
  return config.value?.description || '';
});

const customDescription = computed(() => nodeData.value.description);

const isSelected = ref(false);

const updateSelectedStatus = () => {
  if (graph && nodeId) {
    isSelected.value = graph.isSelected(nodeId);
  }
};

const updateNodeData = () => {
  const currentNode = getNode?.();
  if (currentNode) {
    nodeData.value = currentNode.getData?.() || {};
  }
};

const containerStyle = computed(() => ({
  borderColor: isSelected.value ? '#5a57ff' : '#e5e5e5',
}));

onMounted(() => {
  updateSelectedStatus();
  updateNodeData();
  graph?.on('selection:changed', updateSelectedStatus);
  graph?.on('node:change:data', updateNodeData);
});

onUnmounted(() => {
  graph?.off('selection:changed', updateSelectedStatus);
  graph?.off('node:change:data', updateNodeData);
});
</script>

<style scoped></style>
