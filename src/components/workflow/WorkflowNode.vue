<template>
  <div
    class="flex items-center gap-3 p-3 bg-white rounded-lg border-2 cursor-default"
    :title="config?.description || ''"
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
      <div class="text-sm font-medium text-gray-800">{{ config?.name }}</div>
      <div class="text-xs text-gray-500 truncate">{{ config?.description }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, onMounted, onUnmounted } from 'vue';
import { nodeRegistry } from '@/config/workflow/node-registry';
import { getIconPath } from '@/utils/node-utils';
import type { Graph } from '@antv/x6';

interface GetNodeFn {
  (): { getData: () => { type?: string }; id: string } | undefined;
}

interface GetGraphFn {
  (): Graph | undefined;
}

const getNode = inject<GetNodeFn>('getNode');
const getGraph = inject<GetGraphFn>('getGraph');
const node = getNode?.();
const graph = getGraph?.();
const nodeData = node?.getData?.() || {};
const nodeId = node?.id || '';
const config = computed(() => nodeRegistry[nodeData.type || '']);

const isSelected = ref(false);

const updateSelectedStatus = () => {
  if (graph && nodeId) {
    isSelected.value = graph.isSelected(nodeId);
  }
};

const containerStyle = computed(() => ({
  borderColor: isSelected.value ? '#5a57ff' : '#e5e5e5',
}));

onMounted(() => {
  updateSelectedStatus();
  graph?.on('selection:changed', updateSelectedStatus);
});

onUnmounted(() => {
  graph?.off('selection:changed', updateSelectedStatus);
});
</script>

<style scoped></style>
