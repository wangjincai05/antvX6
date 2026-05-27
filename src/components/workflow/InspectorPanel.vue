<template>
  <div class="w-72 bg-white border-l border-gray-200 flex flex-col" v-if="selectedNode">
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
        <h2 class="font-semibold text-gray-800">属性面板</h2>
      </div>
    </div>
    <div class="flex-1 overflow-y-auto p-4">
      <div class="space-y-4">
        <div class="p-3 bg-gray-50 rounded-lg">
          <div class="text-xs text-gray-500 mb-1">节点类型</div>
          <div class="text-sm font-medium text-gray-800">
            {{ getNodeTypeName(selectedNode?.data?.type || '') }}
          </div>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">节点名称</label>
          <input
            v-model="nodeLabel"
            type="text"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @change="updateNodeLabel"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">位置</label>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <div class="text-xs text-gray-400">X</div>
              <input
                :value="Math.round(selectedNode?.position().x || 0)"
                type="number"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                readonly
              />
            </div>
            <div>
              <div class="text-xs text-gray-400">Y</div>
              <input
                :value="Math.round(selectedNode?.position().y || 0)"
                type="number"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                readonly
              />
            </div>
          </div>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-2">联动属性</label>
          <div class="space-y-2">
            <div
              v-for="(property, key) in linkedProperties"
              :key="key"
              class="flex items-center justify-between p-2 bg-blue-50 rounded"
            >
              <span class="text-sm text-gray-600">{{ key }}</span>
              <span class="text-xs text-blue-600">{{ property }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { nodeRegistry } from '@/config/workflow/node-registry';
import type { InspectorNode } from '@/types/inspector';

const props = defineProps<{
  selectedNode: InspectorNode | null;
}>();

const emit = defineEmits<{
  (e: 'updateLabel', label: string): void;
}>();

const nodeLabel = ref('');

const linkedProperties = ref<Record<string, string>>({
  执行超时: '30秒',
  重试次数: '3次',
  错误处理: '继续执行',
});

const nodeTypes = computed(() => Object.values(nodeRegistry));

const getNodeTypeName = (type: string): string => {
  const node = nodeTypes.value.find((n) => n.type === type);
  return node?.name || type;
};

watch(
  () => props.selectedNode,
  (node) => {
    if (node) {
      const nodeData = node.getData?.() || {};
      nodeLabel.value = node.label || nodeData.label || '';
    }
  }
);

const updateNodeLabel = () => {
  if (props.selectedNode) {
    props.selectedNode.setLabel?.(nodeLabel.value);
    emit('updateLabel', nodeLabel.value);
  }
};
</script>
