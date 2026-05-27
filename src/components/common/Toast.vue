<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[280px] max-w-[400px]"
          :class="getToastClass(toast.type)"
        >
          <svg
            v-if="toast.type === 'success'"
            class="w-5 h-5 text-white flex-shrink-0"
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
            v-else-if="toast.type === 'error'"
            class="w-5 h-5 text-white flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <svg
            v-else-if="toast.type === 'warning'"
            class="w-5 h-5 text-white flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <svg
            v-else
            class="w-5 h-5 text-white flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span class="text-white text-sm flex-1">{{ toast.message }}</span>
          <button
            class="text-white/80 hover:text-white transition-colors"
            @click="removeToast(toast.id)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';

export interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ToastMessage {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

const toasts = ref<ToastItem[]>([]);
let toastId = 0;
let removeTimers: Map<number, ReturnType<typeof setTimeout>> = new Map();

const addToast = (toast: ToastMessage) => {
  const id = ++toastId;
  toasts.value.push({
    id,
    message: toast.message,
    type: toast.type || 'info',
  });

  const duration = toast.duration || 3000;
  const timer = setTimeout(() => {
    removeToast(id);
  }, duration);
  removeTimers.set(id, timer);
};

const removeToast = (id: number) => {
  const index = toasts.value.findIndex((t) => t.id === id);
  if (index !== -1) {
    toasts.value.splice(index, 1);
  }
  const timer = removeTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    removeTimers.delete(id);
  }
};

const getToastClass = (type: string) => {
  switch (type) {
    case 'success':
      return 'bg-green-500';
    case 'error':
      return 'bg-red-500';
    case 'warning':
      return 'bg-yellow-500';
    default:
      return 'bg-blue-500';
  }
};

defineExpose({
  addToast,
  removeToast,
});

onUnmounted(() => {
  removeTimers.forEach((timer) => clearTimeout(timer));
});
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
