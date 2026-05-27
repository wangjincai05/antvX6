<template>
  <div
    class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
    :class="{ 'opacity-100': isHovered, 'opacity-50': !isHovered }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div class="bg-white rounded-lg shadow-md border border-gray-200 px-3 py-2 flex items-center gap-4 transition-all duration-300 hover:shadow-lg">
      <div class="flex items-center gap-1.5">
        <button
          class="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="zoom <= (minZoom || 0.2)"
          @click="$emit('zoom-out')"
          title="缩小"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
        </button>
        <div class="w-12 text-center text-xs font-medium text-gray-700 bg-gray-50 rounded-md py-0.5">
          {{ Math.round(zoom * 100) }}%
        </div>
        <button
          class="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="zoom >= (maxZoom || 2)"
          @click="$emit('zoom-in')"
          title="放大"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </button>
      </div>

      <div class="h-4 w-px bg-gray-200" />

      <div class="relative" ref="nodePanelAnchor">
        <button
          class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md transition-all duration-200 hover:shadow-sm"
          @click="toggleNodePanel"
          title="添加节点"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          添加节点
        </button>

        <NodeSelectPanel
          v-if="showNodePanel"
          :anchor="nodePanelAnchor"
          @select="handleNodeSelect"
          @close="showNodePanel = false"
        />
      </div>

      <div class="h-4 w-px bg-gray-200" />

      <button
        v-if="!isRunning"
        class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-md transition-all duration-200 hover:shadow-sm"
        @click="$emit('run')"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        试运行
      </button>
      <button
        v-else
        class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-all duration-200 hover:shadow-sm"
        @click="$emit('stop')"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        停止
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import NodeSelectPanel from './NodeSelectPanel.vue'
import { useExecutor } from '@/composables/workflow/useExecutor'

const props = defineProps<{
  zoom: number
  minZoom?: number
  maxZoom?: number
}>()

const emit = defineEmits<{
  (e: 'zoom-in'): void
  (e: 'zoom-out'): void
  (e: 'run'): void
  (e: 'stop'): void
  (e: 'add-node', type: string): void
}>()

const nodePanelAnchor = ref<HTMLElement | null>(null)
const isHovered = ref(false)
const showNodePanel = ref(false)

const { workflowState } = useExecutor()
const isRunning = workflowState.value.isRunning

watch(() => props.zoom, () => {})

const toggleNodePanel = () => {
  showNodePanel.value = !showNodePanel.value
}

const handleNodeSelect = (nodeType: string) => {
  emit('add-node', nodeType)
  showNodePanel.value = false
}
</script>

<style scoped>
.fixed {
  position: fixed;
}

.bottom-6 {
  bottom: 1.5rem;
}

.left-1\/2 {
  left: 50%;
}

.-translate-x-1\/2 {
  transform: translateX(-50%);
}

.z-50 {
  z-index: 50;
}

.opacity-100 {
  opacity: 1;
}

.opacity-50 {
  opacity: 0.5;
}

.transition-all {
  transition-property: all;
}

.duration-300 {
  transition-duration: 300ms;
}
</style>