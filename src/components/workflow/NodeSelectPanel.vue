<template>
  <div
    ref="panelRef"
    class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
    :style="{ maxHeight: maxHeight }"
  >
    <div class="p-3 border-b border-gray-100">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索节点..."
        class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      />
    </div>

    <div class="max-h-[50vh] overflow-y-auto">
      <div
        v-for="category in filteredCategories"
        :key="category.name"
        class="border-b border-gray-50"
      >
        <div class="px-4 py-2 bg-gray-50">
          <span class="text-sm font-medium text-gray-700">{{ category.name }}</span>
        </div>

        <div class="px-2 pb-2 space-y-1">
          <div
            v-for="node in category.nodes"
            :key="node.type"
            class="w-full px-3 py-2 flex items-center gap-3 hover:bg-blue-50 rounded-lg transition-colors cursor-grab active:cursor-grabbing"
            :draggable="true"
            @dragstart="(e) => handleDragStart(e, node.type)"
            @dragover="handleDragOver"
            @click="handleSelect(node.type)"
          >
            <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <img
                v-if="node.iconType === 'image'"
                :src="getIconPath(node.icon)"
                :alt="node.name"
                class="w-5 h-5"
              />
              <span v-else class="text-lg">{{ node.icon }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-800 truncate">{{ node.name }}</div>
              <div class="text-xs text-gray-500 truncate">{{ node.description }}</div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="filteredCategories.length === 0" class="p-8 text-center">
        <svg
          class="w-12 h-12 text-gray-300 mx-auto mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p class="text-sm text-gray-500">未找到匹配的节点</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { nodeRegistry, type NodeConfig } from '@/config/workflow/node-registry';
import { useUiStore } from '@/stores/uiStore';

defineProps<{
  anchor?: HTMLElement | null;
}>();

const emit = defineEmits<{
  (e: 'select', type: string): void;
  (e: 'close'): void;
}>();

const panelRef = ref<HTMLElement | null>(null);
const searchQuery = ref('');

const uiStore = useUiStore();
const { handleDragStart: dndHandleDragStart, handleDragOver } = uiStore;

interface Category {
  name: string;
  nodes: NodeConfig[];
}

const nodeCategories: Category[] = [
  {
    name: '大模型',
    nodes: [nodeRegistry.LLM, nodeRegistry.KNOWLEDGE_BASE, nodeRegistry.AGENT],
  },
  {
    name: '业务逻辑',
    nodes: [
      nodeRegistry.PYTHON_CODE,
      nodeRegistry.BRANCH,
      nodeRegistry.LOOP,
      nodeRegistry.LOOP_BREAK,
      nodeRegistry.VAR_ASSIGN,
      nodeRegistry.VAR_AGGREGATE,
      nodeRegistry.PLUGIN,
      nodeRegistry.WORKFLOW,
    ],
  },
  {
    name: '输入&输出',
    nodes: [nodeRegistry.INPUT, nodeRegistry.OUTPUT],
  },
  {
    name: '数据库',
    nodes: [nodeRegistry.FILE_EXTRACT],
  },
  {
    name: '知识库&数据',
    nodes: [nodeRegistry.KNOWLEDGE_BASE, nodeRegistry.HTTP],
  },
];

const filteredCategories = computed(() => {
  if (!searchQuery.value) {
    return nodeCategories;
  }
  const query = searchQuery.value.toLowerCase();
  return nodeCategories
    .map((category) => ({
      ...category,
      nodes: category.nodes.filter(
        (node) =>
          node.name.toLowerCase().includes(query) ||
          node.description.toLowerCase().includes(query) ||
          node.type.toLowerCase().includes(query)
      ),
    }))
    .filter((category) => category.nodes.length > 0);
});

const maxHeight = computed(() => {
  const canvasHeight = window.innerHeight;
  return `${Math.floor(canvasHeight * 0.6)}px`;
});

const getIconPath = (iconName: string) => {
  return `/src/assets/images/${iconName}.png`;
};

const handleDragStart = (event: DragEvent, nodeType: string) => {
  dndHandleDragStart(event, nodeType);
  emit('close');
};

const handleSelect = (type: string) => {
  emit('select', type);
};

const handleClickOutside = (event: MouseEvent) => {
  if (panelRef.value && !panelRef.value.contains(event.target as Node)) {
    emit('close');
  }
};

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});
</script>

<style scoped>
.max-h-\[50vh\] {
  max-height: 50vh;
}

.overflow-y-auto {
  overflow-y: auto;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>
