<template>
  <div v-if="visible" class="dry-run-panel flex flex-col h-full bg-white border-l border-gray-200">
    <div
      class="header-section flex items-center justify-between px-4 py-3 border-b border-gray-200"
    >
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        <h3 class="font-medium text-gray-800">试运行</h3>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="!isRunning"
          class="px-3 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
          @click="$emit('start')"
        >
          开始
        </button>
        <button
          v-else
          class="px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
          @click="$emit('stop')"
        >
          停止
        </button>
        <button class="p-1 hover:bg-gray-100 rounded-md transition-colors" @click="$emit('close')">
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <div class="flex border-b border-gray-200">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="flex-1 px-3 py-2 text-xs font-medium transition-colors"
        :class="
          activeTab === tab.id
            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        "
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
        <span
          v-if="tab.id === 'history' && history.length > 0"
          class="ml-1 px-1 text-xs bg-blue-100 text-blue-600 rounded"
        >
          {{ history.length }}
        </span>
      </button>
    </div>

    <div class="flex-1 overflow-auto p-3">
      <div v-if="activeTab === 'result'">
        <ExecutionVisualizer
          v-if="currentRecord"
          :execution-status="dryRunStore.executionStatus"
          :current-record="currentRecord"
          @pause="$emit('pause')"
          @resume="$emit('resume')"
          @stop="$emit('stop')"
          @restart="$emit('restart')"
        />

        <div v-else class="text-center py-8 text-gray-400">
          <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p class="text-xs">暂无执行结果</p>
        </div>
      </div>

      <div v-else-if="activeTab === 'history'" class="space-y-2">
        <div v-if="history.length > 0">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-gray-500">最近10条记录</span>
            <button class="text-xs text-gray-400 hover:text-red-500" @click="handleClearHistory">
              清空
            </button>
          </div>
          <div
            v-for="record in history"
            :key="record.id"
            class="p-2 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
            @click="selectHistoryRecord(record)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div
                  class="w-6 h-6 rounded-full flex items-center justify-center"
                  :class="getStatusBgClass(record.status)"
                >
                  <svg
                    class="w-3 h-3"
                    :class="getStatusIconClass(record.status)"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      v-if="record.status === 'completed'"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                    <path
                      v-else-if="record.status === 'failed'"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                    <path
                      v-else
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <div class="text-xs font-medium text-gray-800">
                    {{ getStatusText(record.status) }}
                  </div>
                  <div class="text-xs text-gray-500">{{ formatTime(record.startTime) }}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-xs text-gray-500">
                  {{ record.completedNodes }}/{{ record.totalNodes }}
                </div>
                <div class="text-xs font-medium text-blue-600">{{ record.progress }}%</div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-gray-400">
          <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p class="text-xs">暂无历史记录</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDryRunStore } from '@/stores/dryRunStore';
import type { DryRunRecord } from '@/types/workflow';
import ExecutionVisualizer from './ExecutionVisualizer.vue';

defineProps<{
  visible: boolean;
}>();

defineEmits<{
  (e: 'close'): void;
  (e: 'start'): void;
  (e: 'stop'): void;
  (e: 'pause'): void;
  (e: 'resume'): void;
  (e: 'restart'): void;
}>();

const dryRunStore = useDryRunStore();
const activeTab = ref<'result' | 'history'>('result');
const selectedRecord = ref<DryRunRecord | null>(null);

const tabs: { id: 'result' | 'history'; label: string }[] = [
  { id: 'result', label: '当前结果' },
  { id: 'history', label: '历史记录' },
];

const currentRecord = computed(() => {
  if (activeTab.value === 'history' && selectedRecord.value) {
    return selectedRecord.value;
  }
  return dryRunStore.getCurrentRecord();
});

const history = computed(() => dryRunStore.history);
const isRunning = computed(() => dryRunStore.dryRunState.isRunning);

const selectHistoryRecord = (record: DryRunRecord) => {
  selectedRecord.value = record;
  activeTab.value = 'result';
};

const handleClearHistory = () => {
  if (confirm('确定要清空所有历史记录吗？')) {
    dryRunStore.clearHistory();
    selectedRecord.value = null;
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'completed':
      return '执行完成';
    case 'failed':
      return '执行失败';
    case 'cancelled':
      return '已取消';
    default:
      return '未知状态';
  }
};

const getStatusBgClass = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'bg-green-100';
    case 'failed':
      return 'bg-red-100';
    case 'cancelled':
      return 'bg-gray-100';
    default:
      return 'bg-gray-100';
  }
};

const getStatusIconClass = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'text-green-600';
    case 'failed':
      return 'text-red-600';
    case 'cancelled':
      return 'text-gray-600';
    default:
      return 'text-gray-600';
  }
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
</script>

<style scoped>
.dry-run-panel {
  width: 320px;
}
</style>
