<template>
  <div class="w-64 bg-white border-r border-gray-200 flex flex-col">
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center gap-2 mb-4">
        <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h2 class="font-semibold text-gray-800">节点库</h2>
      </div>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索节点..."
        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
    <div class="flex-1 overflow-y-auto p-4">
      <div class="space-y-2">
        <DraggableNode
          v-for="node in filteredNodes"
          :key="node.type"
          :node="node"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { nodeRegistry } from '@/config/workflow/node-registry'
import DraggableNode from './DraggableNode.vue'

const searchQuery = ref('')

const nodeTypes = computed(() => Object.values(nodeRegistry))

const filteredNodes = computed(() => {
  const filtered = nodeTypes.value.filter(n => n.type !== 'INPUT')
  if (!searchQuery.value) return filtered
  const query = searchQuery.value.toLowerCase()
  return filtered.filter(
    (node) =>
      node.name.toLowerCase().includes(query) ||
      node.description.toLowerCase().includes(query)
  )
})
</script>