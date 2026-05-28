<template>
  <div class="inspector-panel flex flex-col h-full bg-white border-l border-gray-200">
    <div class="header-section flex items-center justify-between px-4 pt-3">
      <div class="flex items-center gap-3 cursor-pointer" @dblclick="startLabelEdit">
        <img :src="nodeIconPath" :alt="nodeLabel" class="w-6 h-6 object-contain" />
        <div class="node-label-container flex-1 min-w-0">
          <div
            v-if="!isEditingLabel"
            class="label-text text-base font-semibold text-gray-800 truncate hover:text-blue-600 transition-all duration-200"
          >
            {{ nodeLabel || '(未命名)' }}
          </div>
          <input
            v-else
            ref="labelInputRef"
            v-model="editLabelValue"
            type="text"
            class="edit-input w-full px-1 py-1 text-base font-semibold border-1 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all duration-200"
            @blur="saveLabelEdit"
            @keyup.enter="saveLabelEdit"
            @keyup.escape="cancelLabelEdit"
          />
        </div>
      </div>
      <button
        class="close-btn w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
        @click="$emit('close')"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <Transition name="slide-fade">
      <div v-if="showError" class="error-section px-4 py-2 bg-red-50 border-b border-red-200">
        <div class="flex items-center gap-2 text-red-600 text-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          {{ errorMessage }}
        </div>
      </div>
    </Transition>

    <div
      class="description-section px-3 py-2 cursor-pointer transition-all duration-200 border-b border-gray-200"
      :class="{ 'edit-active': isEditingDescription }"
      @dblclick="startDescriptionEdit"
    >
      <div
        v-if="!isEditingDescription"
        class="description-text text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
      >
        {{ nodeDescription || '(暂无描述)' }}
      </div>
      <textarea
        v-else
        ref="descriptionInputRef"
        v-model="editDescriptionValue"
        rows="2"
        class="edit-textarea w-full px-1 py-1 text-sm text-gray-700 border-1 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all duration-200 resize-none"
        @blur="saveDescriptionEdit"
        @keyup.enter.ctrl="saveDescriptionEdit"
        @keyup.escape="cancelDescriptionEdit"
      />
    </div>

    <div class="expandable-section px-4 py-3 border-t border-gray-100">
      <div class="text-xs text-gray-400 text-center">预留扩展区域</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { nodeRegistry } from '@/config/workflow/node-registry';
import { getIconPath } from '@/utils/node-utils';
import type { InspectorNode } from '@/types/inspector';

const props = defineProps<{
  selectedNode: InspectorNode | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updateLabel', label: string): void;
  (e: 'updateDescription', description: string): void;
}>();

const nodeLabel = ref('');
const nodeDescription = ref('');
const nodeIconPath = ref('');

const isEditingLabel = ref(false);
const isEditingDescription = ref(false);
const editLabelValue = ref('');
const editDescriptionValue = ref('');
const labelInputRef = ref<HTMLInputElement | null>(null);
const descriptionInputRef = ref<HTMLTextAreaElement | null>(null);
const errorMessage = ref('');
const showError = ref(false);
const originalLabelValue = ref('');
const originalDescriptionValue = ref('');

watch(
  () => props.selectedNode,
  (node) => {
    if (node) {
      const nodeData = node.getData?.() || {};
      const config = nodeRegistry[nodeData.type || ''];
      nodeLabel.value = node.label || nodeData.label || config?.name || '';
      nodeDescription.value = nodeData.description || config?.description || '';
      nodeIconPath.value = getIconPath(config?.icon);
    }
  },
  { immediate: true }
);

const showErrorMessage = (message: string) => {
  errorMessage.value = message;
  showError.value = true;
  setTimeout(() => {
    showError.value = false;
  }, 3000);
};

const startLabelEdit = () => {
  if (isEditingDescription.value) return;
  isEditingLabel.value = true;
  editLabelValue.value = nodeLabel.value;
  originalLabelValue.value = nodeLabel.value;
  nextTick(() => {
    labelInputRef.value?.focus();
    labelInputRef.value?.select();
  });
};

const saveLabelEdit = () => {
  const trimmedValue = editLabelValue.value.trim();
  if (trimmedValue !== nodeLabel.value) {
    try {
      nodeLabel.value = trimmedValue;
      emit('updateLabel', nodeLabel.value);
    } catch (error) {
      nodeLabel.value = originalLabelValue.value;
      showErrorMessage('更新节点名称失败，请重试');
    }
  }
  isEditingLabel.value = false;
};

const cancelLabelEdit = () => {
  nodeLabel.value = originalLabelValue.value;
  isEditingLabel.value = false;
};

const startDescriptionEdit = () => {
  if (isEditingLabel.value) return;
  isEditingDescription.value = true;
  editDescriptionValue.value = nodeDescription.value;
  originalDescriptionValue.value = nodeDescription.value;
  nextTick(() => {
    descriptionInputRef.value?.focus();
  });
};

const saveDescriptionEdit = () => {
  const trimmedValue = editDescriptionValue.value.trim();
  if (trimmedValue !== nodeDescription.value) {
    try {
      nodeDescription.value = trimmedValue;
      emit('updateDescription', nodeDescription.value);
    } catch (error) {
      nodeDescription.value = originalDescriptionValue.value;
      showErrorMessage('更新节点描述失败，请重试');
    }
  }
  isEditingDescription.value = false;
};

const cancelDescriptionEdit = () => {
  nodeDescription.value = originalDescriptionValue.value;
  isEditingDescription.value = false;
};
</script>

<style scoped>
.inspector-panel {
  width: 288px;
  min-width: 240px;
  max-width: 360px;
}

@media (max-width: 640px) {
  .inspector-panel {
    width: 100%;
    min-width: 100%;
    max-width: 100%;
  }
}

.description-section.edit-active {
  border-radius: 4px;
  padding: 8px 16px;
}

.edit-input,
.edit-textarea {
  animation: editFocusIn 0.2s ease-out;
}

@keyframes editFocusIn {
  from {
    opacity: 0.8;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.label-text {
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.description-text {
  transition: color 0.2s ease;
}

.close-btn {
  transition: all 0.2s ease;
}

.close-btn:hover {
  transform: rotate(90deg);
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
