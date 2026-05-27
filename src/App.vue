<template>
  <div class="w-full h-screen">
    <WorkflowEditor />
    <Toast ref="toastRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import WorkflowEditor from '@/components/workflow/WorkflowEditor.vue';
import Toast from '@/components/common/Toast.vue';

const toastRef = ref<InstanceType<typeof Toast> | null>(null);

onMounted(() => {
  if (toastRef.value) {
    (window as unknown as { $toast: typeof toastRef.value.addToast }).$toast =
      toastRef.value.addToast.bind(toastRef.value);
  }
});
</script>
