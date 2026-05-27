<template>
  <div class="h-32 bg-white p-4">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        <h3 class="font-medium text-gray-800">执行状态</h3>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">进度: {{ progress }}%</span>
        <div class="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            class="h-full bg-blue-500 transition-all duration-300"
            :style="{ width: `${progress}%` }"
          />
        </div>
      </div>
    </div>

    <div class="flex items-center gap-4 overflow-x-auto">
      <div
        v-for="(state, nodeId) in executionStates"
        :key="nodeId"
        class="flex items-center gap-2 px-3 py-2 rounded-lg min-w-[120px]"
        :class="getStateClass(state.status)"
      >
        <div class="w-3 h-3 rounded-full" :class="getStateDotClass(state.status)" />
        <div>
          <div class="text-sm font-medium text-gray-800">{{ getNodeLabel(nodeId) }}</div>
          <div class="text-xs text-gray-500">{{ getStatusText(state.status) }}</div>
        </div>
      </div>
      <div v-if="Object.keys(executionStates).length === 0" class="text-gray-400 text-sm">
        暂无执行记录
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useWorkflowStore } from '@/stores/workflowStore';
import { useGraphStore } from '@/stores/graphStore';

const workflowStore = useWorkflowStore();
const graphStore = useGraphStore();

const { workflowState, getExecutionProgress } = workflowStore;
const { graphRef } = graphStore;

const executionStates = computed(() => workflowState.executionStates);
const progress = computed(() => getExecutionProgress());

const getNodeLabel = (nodeId: string): string => {
  const node = graphRef?.getCellById(nodeId);
  return (node as any)?.label || nodeId;
};

const getStateClass = (status: string): string => {
  switch (status) {
    case 'running':
      return 'bg-blue-50';
    case 'completed':
      return 'bg-green-50';
    case 'error':
      return 'bg-red-50';
    default:
      return 'bg-gray-50';
  }
};

const getStateDotClass = (status: string): string => {
  switch (status) {
    case 'running':
      return 'bg-blue-500 animate-pulse';
    case 'completed':
      return 'bg-green-500';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'running':
      return '执行中...';
    case 'completed':
      return '已完成';
    case 'error':
      return '执行失败';
    default:
      return '等待中';
  }
};
</script>
