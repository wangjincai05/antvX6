import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { WorkflowState } from '@/types/workflow';
import { useGraphStore } from './graphStore';
import { validateWorkflow } from '@/utils/dag-validator';
import { getExecutionOrder } from '@/utils/topology-sort';

export const useWorkflowStore = defineStore('workflow', () => {
  const workflowState = ref<WorkflowState>({
    isRunning: false,
    executionStates: {},
  });

  const startExecution = async () => {
    const graphStore = useGraphStore();
    if (!graphStore.graphRef) {
      return { success: false, errors: ['图形实例不存在'] };
    }

    const { valid, errors } = validateWorkflow(graphStore.graphRef);
    if (!valid) {
      console.error('工作流验证失败:', errors);
      return { success: false, errors };
    }

    const executionOrder = getExecutionOrder(graphStore.graphRef);
    if (executionOrder.length === 0) {
      return { success: false, errors: ['无法确定执行顺序'] };
    }

    workflowState.value = {
      isRunning: true,
      currentNodeId: executionOrder[0],
      executionStates: {},
      startTime: Date.now(),
    };

    executionOrder.forEach((nodeId) => {
      workflowState.value.executionStates[nodeId] = {
        nodeId,
        status: 'pending',
      };
    });

    for (const nodeId of executionOrder) {
      await executeNode(nodeId);
      if (!workflowState.value.isRunning) break;
    }

    workflowState.value.isRunning = false;
    workflowState.value.endTime = Date.now();

    return { success: true, errors: [] };
  };

  const executeNode = async (nodeId: string) => {
    const state = workflowState.value.executionStates[nodeId];
    if (!state) return;

    state.status = 'running';
    state.startTime = Date.now();
    workflowState.value.currentNodeId = nodeId;

    const graphStore = useGraphStore();
    const node = graphStore.graphRef?.getCellById(nodeId);
    const nodeType = node?.data?.type;

    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      switch (nodeType) {
        case 'INPUT':
        case 'OUTPUT':
          state.status = 'completed';
          break;
        case 'LLM':
        case 'KNOWLEDGE_BASE':
        case 'PYTHON_CODE':
        case 'HTTP':
        case 'BRANCH':
        case 'LOOP':
        case 'LOOP_BREAK':
        case 'VAR_ASSIGN':
        case 'VAR_AGGREGATE':
        case 'PLUGIN':
        case 'AGENT':
        case 'WORKFLOW':
        case 'FILE_EXTRACT':
          state.status = 'completed';
          break;
        default:
          state.status = 'completed';
      }
    } catch (error) {
      state.status = 'error';
      state.error = error instanceof Error ? error.message : '未知错误';
      workflowState.value.isRunning = false;
    }

    state.endTime = Date.now();
  };

  const stopExecution = () => {
    workflowState.value.isRunning = false;
  };

  const resetExecution = () => {
    workflowState.value = {
      isRunning: false,
      executionStates: {},
    };
  };

  const getExecutionProgress = (): number => {
    const states = Object.values(workflowState.value.executionStates);
    if (states.length === 0) return 0;

    const completedCount = states.filter((s) => s.status === 'completed').length;
    return Math.round((completedCount / states.length) * 100);
  };

  return {
    workflowState,
    startExecution,
    stopExecution,
    resetExecution,
    getExecutionProgress,
  };
});
