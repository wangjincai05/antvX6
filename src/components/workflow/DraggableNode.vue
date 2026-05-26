<template>
  <div
    class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-grab hover:bg-gray-100 transition-colors border border-gray-200 hover:border-blue-300"
    :title="node.description"
    :draggable="true"
    @dragstart="onDragStart"
    @dragover="handleDragOver"
  >
    <img
      v-if="node.iconType === 'image'"
      :src="getIconPath(node.icon)"
      :alt="node.name"
      class="w-10 h-10 rounded-lg flex items-center justify-center"
    />
    <div
      v-else
      class="w-10 h-10 rounded-lg flex items-center justify-center"
      :style="{ backgroundColor: '#5f95ff20' }"
    >
      <span class="text-white font-bold text-lg">{{ node.icon }}</span>
    </div>
    <div class="min-w-0 flex-1">
      <div class="text-sm font-medium text-gray-800">{{ node.name }}</div>
      <div class="text-xs text-gray-500 truncate">{{ node.description }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDnd } from '@/composables/workflow/useDnd'
import type { NodeConfig } from '@/config/workflow/node-registry'
import { getIconPath } from '@/utils/node-utils'

const props = defineProps<{
  node: NodeConfig
}>()

const { handleDragStart: dndHandleDragStart, handleDragOver } = useDnd()

const onDragStart = (event: DragEvent) => {
  dndHandleDragStart(event, props.node.type)
}
</script>