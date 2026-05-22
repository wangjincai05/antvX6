<template>
  <div
    ref="containerRef"
    class="w-full h-full bg-gray-50"
    @drop="handleDrop"
    @dragover.prevent
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useCanvas } from '@/composables/useCanvas'

const emit = defineEmits<{
  (e: 'nodeSelected', node: unknown): void
  (e: 'edgeSelected', edge: unknown): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const { initGraph, addNode, graphRef } = useCanvas()

onMounted(() => {
  if (containerRef.value) {
    initGraph(containerRef.value)
  }
})

onUnmounted(() => {
  graphRef.value?.dispose()
})

const handleDrop = (event: DragEvent) => {
  if (!containerRef.value || !graphRef.value) return

  const nodeType = event.dataTransfer?.getData('node-type')
  if (!nodeType) return

  const rect = containerRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  const localPoint = graphRef.value.clientToLocal(x, y)
  addNode(nodeType, localPoint.x, localPoint.y)
}
</script>