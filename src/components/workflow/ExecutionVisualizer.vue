<template>
  <div class="execution-visualizer flex flex-col gap-4 p-3">
    <div
      class="status-header flex justify-between items-center px-3 py-2.5 rounded-lg border transition-all"
      :class="headerClasses"
    >
      <div class="status-indicator flex items-center gap-2">
        <div
          class="status-dot w-[10px] h-[10px] rounded-full"
          :class="dotClasses"
          :style="dotStyle"
        />
        <span class="status-text text-sm font-medium">{{ statusConfig.label }}</span>
      </div>
      <div class="status-time text-xs text-gray-500 font-mono" v-if="currentRecord">
        <span v-if="executionStatus === 'running'">{{
          formatDuration(Date.now() - currentRecord.startTime)
        }}</span>
        <span v-else-if="currentRecord.endTime">{{
          formatDuration(currentRecord.endTime - currentRecord.startTime)
        }}</span>
      </div>
    </div>

    <div class="progress-section bg-gray-50 rounded-lg p-3">
      <div class="progress-header flex justify-between items-center mb-2">
        <span class="progress-label text-xs text-gray-500">执行进度</span>
        <span class="progress-value text-sm font-semibold text-blue-500"
          >{{ Math.round(progress) }}%</span
        >
      </div>
      <div class="progress-bar-container relative h-6">
        <div class="progress-bar-track h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            class="progress-bar-fill h-full rounded-full transition-all duration-300"
            :class="progressFillClasses"
            :style="{ width: `${progress}%` }"
          />
        </div>
        <div class="progress-steps absolute top-2.5 left-0 right-0">
          <div
            v-for="(step, index) in executionSteps"
            :key="step.id"
            class="progress-step absolute -translate-x-1/2 flex flex-col items-center gap-1"
            :style="{ left: `${(index / (executionSteps.length - 1)) * 100}%` }"
          >
            <div class="step-dot w-2 h-2 rounded-full" :class="getStepDotClass(step.status)" />
            <div
              class="step-label text-[9px] text-gray-400 max-w-[60px] truncate"
              :title="step.label"
            >
              {{ step.label }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="steps-section bg-gray-50 rounded-lg p-3">
      <div class="section-header flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <span>执行步骤</span>
        <span class="steps-count ml-auto text-xs text-gray-500"
          >{{ completedSteps }}/{{ executionSteps.length }}</span
        >
      </div>
      <div class="steps-list flex flex-col gap-2">
        <TransitionGroup name="step-list">
          <div
            v-for="(step, index) in executionSteps"
            :key="step.id"
            class="step-item flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 transition-all duration-300"
            :class="getStepItemClass(step.status)"
          >
            <div
              class="step-index w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold flex-shrink-0"
              :class="getStepIndexClass(step.status)"
            >
              {{ index + 1 }}
            </div>
            <div class="step-content flex-1 min-w-0">
              <div class="step-header flex items-center gap-2 flex-wrap">
                <span
                  class="step-name text-sm font-medium text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis"
                  >{{ step.label }}</span
                >
                <span
                  class="step-status text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0"
                  :class="getStepStatusClass(step.status)"
                >
                  {{ getStepStatusText(step.status) }}
                </span>
              </div>
              <div
                class="step-details text-xs mt-1"
                :class="step.status === 'error' ? 'text-red-500' : 'text-gray-500'"
              >
                <span v-if="step.status === 'running'">执行中...</span>
                <span v-else-if="step.status === 'completed' && step.duration"
                  >耗时: {{ formatDuration(step.duration) }}</span
                >
                <span v-else-if="step.status === 'error' && step.error">{{ step.error }}</span>
              </div>
            </div>
            <div class="step-indicator w-5 h-5 flex items-center justify-center flex-shrink-0">
              <svg
                v-if="step.status === 'running'"
                class="w-5 h-5 text-blue-500 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <svg
                v-else-if="step.status === 'completed'"
                class="w-4 h-4 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <svg
                v-else-if="step.status === 'error'"
                class="w-4 h-4 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <div v-else class="w-2 h-2 rounded-full bg-gray-300"></div>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>

    <div class="controls-section bg-gray-50 rounded-lg p-2.5">
      <div class="control-buttons flex gap-2 justify-center">
        <button
          v-if="executionStatus === 'running'"
          class="control-btn flex items-center gap-1 px-3.5 py-2 rounded-md text-sm font-medium border-none cursor-pointer transition-all duration-200 bg-amber-500 text-white hover:bg-amber-600"
          @click="$emit('pause')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          暂停
        </button>
        <button
          v-if="executionStatus === 'paused'"
          class="control-btn flex items-center gap-1 px-3.5 py-2 rounded-md text-sm font-medium border-none cursor-pointer transition-all duration-200 bg-green-500 text-white hover:bg-green-600"
          @click="$emit('resume')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          继续
        </button>
        <button
          v-if="executionStatus !== 'idle'"
          class="control-btn flex items-center gap-1 px-3.5 py-2 rounded-md text-sm font-medium border-none cursor-pointer transition-all duration-200 bg-red-500 text-white hover:bg-red-600"
          @click="$emit('stop')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          停止
        </button>
        <button
          v-if="executionStatus === 'completed' || executionStatus === 'failed'"
          class="control-btn flex items-center gap-1 px-3.5 py-2 rounded-md text-sm font-medium border-none cursor-pointer transition-all duration-200 bg-blue-500 text-white hover:bg-blue-600"
          @click="$emit('restart')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          重新执行
        </button>
      </div>
    </div>

    <div
      class="logs-section bg-gray-50 rounded-lg p-3"
      v-if="currentRecord && currentRecord.logs.length > 0"
    >
      <div class="section-header flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span>执行日志</span>
      </div>
      <div
        class="logs-container max-h-[150px] overflow-y-auto bg-gray-800 rounded-md p-2"
        ref="logsContainer"
      >
        <div
          v-for="(log, index) in currentRecord.logs.slice(-20)"
          :key="index"
          class="log-item flex gap-2 py-1 text-[11px] border-b border-gray-700 last:border-0"
        >
          <span class="log-time text-gray-400 font-mono flex-shrink-0">{{
            formatTimestamp(log.timestamp)
          }}</span>
          <span
            class="log-level w-9 text-center px-1 py-0.5 rounded text-[10px] font-semibold flex-shrink-0"
            :class="getLogLevelClass(log.level)"
          >
            {{ log.level.toUpperCase() }}
          </span>
          <span class="log-message text-gray-200 break-words">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { EXECUTION_STATUS_CONFIG, type ExecutionStatus } from '@/types/workflow';
import type { DryRunRecord } from '@/types/workflow';

const props = defineProps<{
  executionStatus: ExecutionStatus;
  currentRecord: DryRunRecord | null;
}>();

defineEmits<{
  (e: 'pause'): void;
  (e: 'resume'): void;
  (e: 'stop'): void;
  (e: 'restart'): void;
}>();

const logsContainer = ref<HTMLElement | null>(null);

const statusConfig = computed(() => EXECUTION_STATUS_CONFIG[props.executionStatus]);

const headerClasses = computed(() => {
  switch (props.executionStatus) {
    case 'running':
      return 'bg-blue-50 border-blue-200 text-blue-700';
    case 'paused':
      return 'bg-amber-50 border-amber-200 text-amber-700';
    case 'completed':
      return 'bg-green-50 border-green-200 text-green-700';
    case 'failed':
      return 'bg-red-50 border-red-200 text-red-700';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-700';
  }
});

const dotClasses = computed(() => {
  if (props.executionStatus === 'running') {
    return 'animate-pulse';
  }
  return '';
});

const dotStyle = computed(() => ({
  backgroundColor: statusConfig.value.color,
}));

const progress = computed(() => {
  if (!props.currentRecord) return 0;
  return props.currentRecord.progress || 0;
});

const progressFillClasses = computed(() => {
  if (props.executionStatus === 'running') {
    return 'bg-gradient-to-r from-blue-500 to-blue-400 animate-progress-shine';
  }
  return 'bg-blue-500';
});

interface ExecutionStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  duration?: number;
  error?: string;
}

const executionSteps = computed<ExecutionStep[]>(() => {
  if (!props.currentRecord) return [];
  const states = props.currentRecord.executionStates;
  return Object.entries(states).map(([nodeId, state]) => ({
    id: nodeId,
    label: nodeId,
    status: state.status as ExecutionStep['status'],
    duration: state.startTime && state.endTime ? state.endTime - state.startTime : undefined,
    error: state.error,
  }));
});

const completedSteps = computed(() => {
  return executionSteps.value.filter((s) => s.status === 'completed').length;
});

const getStepDotClass = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-500';
    case 'running':
      return 'bg-blue-500 animate-pulse';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-gray-300';
  }
};

const getStepItemClass = (status: string) => {
  switch (status) {
    case 'running':
      return 'border-blue-400 bg-blue-50 animate-highlight';
    case 'error':
      return 'border-red-400 bg-red-50';
    default:
      return 'border-gray-200';
  }
};

const getStepIndexClass = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-500 text-white';
    case 'running':
      return 'bg-blue-500 text-white animate-pulse';
    case 'error':
      return 'bg-red-500 text-white';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const getStepStatusClass = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700';
    case 'running':
      return 'bg-blue-100 text-blue-700';
    case 'error':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const getStepStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return '已完成';
    case 'running':
      return '执行中';
    case 'error':
      return '失败';
    default:
      return '等待中';
  }
};

const getLogLevelClass = (level: string) => {
  switch (level) {
    case 'warn':
      return 'bg-amber-100 text-amber-700';
    case 'error':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-blue-100 text-blue-700';
  }
};

const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes > 0) {
    return `${minutes}分${remainingSeconds}秒`;
  }
  return `${remainingSeconds}秒`;
};

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

watch(
  () => props.currentRecord?.logs.length,
  async () => {
    await nextTick();
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight;
    }
  }
);
</script>

<style scoped>
@keyframes progress-shine {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.animate-progress-shine {
  animation: progress-shine 1s ease-in-out infinite;
}

@keyframes highlight {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
  50% {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
}

.animate-highlight {
  animation: highlight 1s ease-in-out infinite;
}

.step-list-enter-active,
.step-list-leave-active {
  transition: all 0.3s ease;
}

.step-list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.step-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.step-list-move {
  transition: transform 0.3s ease;
}
</style>
