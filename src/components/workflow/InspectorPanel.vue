<template>
  <div class="w-72 bg-white border-l border-gray-200 flex flex-col">
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
          <div class="flex items-center justify-between mb-2">
            <label class="block text-xs text-gray-500">联动属性</label>
            <button class="text-xs text-blue-500 hover:text-blue-600" @click="addProperty">
              + 添加
            </button>
          </div>
          <div class="space-y-2">
            <div
              v-for="(property, key) in linkedProperties"
              :key="key"
              class="flex items-center gap-2 p-2 bg-blue-50 rounded"
            >
              <input
                :value="key"
                type="text"
                class="flex-1 px-2 py-1 text-sm border border-transparent bg-transparent focus:outline-none focus:border-blue-300 rounded"
                @blur="updatePropertyKey($event, key)"
              />
              <input
                :value="property"
                type="text"
                class="flex-1 px-2 py-1 text-sm border border-transparent bg-transparent focus:outline-none focus:border-blue-300 rounded"
                @blur="updatePropertyValue(key, $event)"
              />
              <button
                class="text-gray-400 hover:text-red-500 transition-colors"
                @click="removeProperty(key)"
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
          </div>
        </div>
      </div>
    </div>
    <div class="p-4 border-t border-gray-200">
      <button
        class="w-full px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
        @click="saveProperties"
      >
        保存属性
      </button>
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
  (e: 'updateProperties', properties: Record<string, string>): void;
}>();

const nodeLabel = ref('');

const linkedProperties = ref<Record<string, string>>({
  executionTimeout: '30秒',
  retryCount: '3次',
  errorHandling: '继续执行',
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
      if (nodeData.properties) {
        linkedProperties.value = Object.fromEntries(
          Object.entries(nodeData.properties).map(([k, v]) => [k, String(v)])
        );
      }
    }
  }
);

const updateNodeLabel = () => {
  if (props.selectedNode) {
    props.selectedNode.setLabel?.(nodeLabel.value);
    emit('updateLabel', nodeLabel.value);
  }
};

const addProperty = () => {
  const newKey = `property_${Date.now()}`;
  linkedProperties.value[newKey] = '';
};

const removeProperty = (key: string) => {
  delete linkedProperties.value[key];
};

const updatePropertyKey = (event: Event, oldKey: string) => {
  const target = event.target as HTMLInputElement;
  const newKey = target.value.trim();
  if (newKey && newKey !== oldKey) {
    const value = linkedProperties.value[oldKey];
    delete linkedProperties.value[oldKey];
    linkedProperties.value[newKey] = value;
  }
};

const updatePropertyValue = (key: string, event: Event) => {
  const target = event.target as HTMLInputElement;
  linkedProperties.value[key] = target.value;
};

const saveProperties = () => {
  emit('updateProperties', { ...linkedProperties.value });
};
</script>
