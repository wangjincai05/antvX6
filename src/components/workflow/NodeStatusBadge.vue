<template>
  <div
    v-if="statusConfig"
    class="node-status-badge absolute -top-1.5 -right-1.5 w-[14px] h-[14px] rounded-full border cursor-pointer transition-all duration-300 z-10 flex items-center justify-center"
    :class="badgeClasses"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
  >
    <div class="status-icon w-full h-full flex items-center justify-center">
      <svg
        v-if="status === 'completed'"
        class="icon-check w-[8px] h-[8px] text-emerald-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <svg
        v-else-if="status === 'error'"
        class="icon-cross w-[8px] h-[8px] text-red-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
      >
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
      <svg
        v-else-if="status === 'running'"
        class="icon-spinner w-[9px] h-[9px]"
        viewBox="0 0 24 24"
      >
        <circle
          class="spinner-track"
          cx="12"
          cy="12"
          r="5"
          stroke-width="1.25"
          stroke-linecap="round"
          fill="none"
        ></circle>
        <circle
          class="spinner-progress"
          cx="12"
          cy="12"
          r="5"
          stroke-width="1.25"
          stroke-linecap="round"
          fill="none"
          stroke-dasharray="31.4"
          stroke-dashoffset="15.7"
        ></circle>
        <circle
          class="spinner-glow"
          cx="12"
          cy="12"
          r="4"
          stroke-width="0.75"
          stroke-linecap="round"
          fill="none"
          opacity="0.6"
        ></circle>
      </svg>
      <div
        v-else-if="status === 'pending'"
        class="status-pending-container flex items-center gap-[1px]"
      >
        <div class="pending-dot-1 w-[2px] h-[2px] rounded-full bg-gray-400"></div>
        <div class="pending-dot-2 w-[2px] h-[2px] rounded-full bg-gray-400"></div>
        <div class="pending-dot-3 w-[2px] h-[2px] rounded-full bg-gray-400"></div>
      </div>
      <div v-else class="status-dot w-[5px] h-[5px] rounded-full bg-gray-400"></div>
    </div>
    <Transition name="tooltip-fade">
      <div
        v-if="showTooltip"
        class="status-tooltip absolute top-[calc(100%+12px)] right-0 min-w-[150px] p-[12px_16px] rounded-xl text-xs z-50 pointer-events-none"
      >
        <div class="tooltip-title font-semibold mb-1.5 text-sm tracking-tight">
          {{ statusConfig.label }}
        </div>
        <div
          v-if="errorMessage"
          class="tooltip-error text-red-300 text-[11px] break-words leading-relaxed"
        >
          {{ errorMessage }}
        </div>
        <div
          v-if="durationText"
          class="tooltip-duration text-gray-400 text-[11px] mt-1 flex items-center gap-1"
        >
          {{ durationText }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { NODE_STATUS_CONFIG, type NodeStatus } from '@/types/workflow';

const props = defineProps<{
  status?: NodeStatus;
  error?: string;
  startTime?: number;
  endTime?: number;
}>();

const showTooltip = ref(false);

const statusConfig = computed(() => {
  if (!props.status || props.status === 'idle') {
    return null;
  }
  return NODE_STATUS_CONFIG[props.status] || null;
});

const badgeClasses = computed(() => {
  const base = 'backdrop-blur-sm';
  switch (props.status) {
    case 'running':
      return `${base} border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-[0_0_0_0_rgba(59,130,246,0.4)] animate-running-glow hover:scale-110 hover:shadow-[0_2px_6px_rgba(0,0,0,0.18)]`;
    case 'pending':
      return `${base} border-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.12)] hover:scale-110 hover:shadow-[0_2px_6px_rgba(0,0,0,0.18)]`;
    case 'warning':
      return `${base} border-amber-500 bg-gradient-to-br from-amber-50 to-amber-100 shadow-[0_1px_4px_rgba(0,0,0,0.12)] hover:scale-110 hover:shadow-[0_2px_6px_rgba(0,0,0,0.18)]`;
    case 'completed':
      return `${base} border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-[0_1px_4px_rgba(0,0,0,0.12)] hover:scale-110 hover:shadow-[0_2px_6px_rgba(0,0,0,0.18)]`;
    case 'error':
      return `${base} border-red-500 bg-gradient-to-br from-red-50 to-red-100 shadow-[0_1px_4px_rgba(0,0,0,0.12)] hover:scale-110 hover:shadow-[0_2px_6px_rgba(0,0,0,0.18)]`;
    default:
      return `${base} border-gray-400 bg-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.12)]`;
  }
});

const errorMessage = computed(() => {
  return props.error || null;
});

const durationText = computed(() => {
  if (props.startTime && props.endTime) {
    const duration = props.endTime - props.startTime;
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `耗时: ${minutes}分${remainingSeconds}秒`;
    }
    return `耗时: ${remainingSeconds}秒`;
  }
  return null;
});
</script>

<style scoped>
@keyframes running-glow {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0);
  }
}

.animate-running-glow {
  animation: running-glow 2s ease-in-out infinite;
}

.pending-dot-1,
.pending-dot-2,
.pending-dot-3 {
  animation: pending-bounce 1.4s ease-in-out infinite both;
}

.pending-dot-1 {
  animation-delay: -0.32s;
}

.pending-dot-2 {
  animation-delay: -0.16s;
}

@keyframes pending-bounce {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.icon-check {
  animation: check-appear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  filter: drop-shadow(0 0.5px 1px rgba(16, 185, 129, 0.3));
}

.icon-cross {
  animation: cross-appear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  filter: drop-shadow(0 0.5px 1px rgba(239, 68, 68, 0.3));
}

.spinner-track {
  stroke: #e0e7ff;
  stroke-dasharray: 31.4;
  stroke-dashoffset: 0;
  stroke-linecap: round;
}

.spinner-progress {
  stroke: #3b82f6;
  stroke-linecap: round;
  animation:
    spinner-rotate 1.5s linear infinite,
    spinner-progress 2s ease-in-out infinite;
  filter: drop-shadow(0 0 1.5px rgba(59, 130, 246, 0.5));
}

.spinner-glow {
  stroke: #60a5fa;
  animation: spinner-pulse 2s ease-in-out infinite;
}

@keyframes spinner-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes spinner-progress {
  0%,
  100% {
    stroke-dashoffset: 23.55;
  }
  50% {
    stroke-dashoffset: 7.85;
  }
}

@keyframes spinner-pulse {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}

@keyframes check-appear {
  0% {
    transform: scale(0) rotate(-30deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.15) rotate(10deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes cross-appear {
  0% {
    transform: scale(0) rotate(45deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.15) rotate(-10deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.status-tooltip {
  background: linear-gradient(145deg, #1f2937 0%, #111827 100%);
  color: white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.status-tooltip::before {
  content: '';
  position: absolute;
  top: -8px;
  right: 12px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid #1f2937;
}

.status-tooltip::after {
  content: '';
  position: absolute;
  top: -7px;
  right: 12px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid rgba(255, 255, 255, 0.08);
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition:
    opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.96);
}
</style>
