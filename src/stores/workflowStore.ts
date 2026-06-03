import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { WorkflowState, ExecutionState } from '@/types/workflow';
import { useGraphStore } from './graph/index';
import { validateWorkflow } from '@/utils/dag-validator';
import {
  WorkflowExecutor,
  createDefaultExecutors,
  type NodeExecutor,
} from '@/executor/workflow-executor';

export const useWorkflowStore = defineStore('workflow', () => {
  const workflowState = ref<WorkflowState>({
    isRunning: false,
    executionStates: {},
    workflowId: '',
    logs: [],
    status: 'idle',
    progress: 0,
  });

  let executor: WorkflowExecutor | null = null;

  const customExecutors: Record<string, NodeExecutor> = {
    ...createDefaultExecutors(),
    CONDITION: {
      execute: async (node) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return { nodeId: node.id, type: 'CONDITION', result: true };
      },
    },
    LOOP: {
      execute: async (node) => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        return { nodeId: node.id, type: 'LOOP', iterations: 1 };
      },
    },
    LLM: {
      execute: async (node) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return { nodeId: node.id, type: 'LLM', response: '模拟LLM响应' };
      },
    },
    CODE: {
      execute: async (node) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { nodeId: node.id, type: 'CODE', output: '执行完成' };
      },
    },
    DATABASE: {
      execute: async (node) => {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return { nodeId: node.id, type: 'DATABASE', records: 100 };
      },
    },
    KNOWLEDGE_BASE: {
      execute: async (node) => {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        return { nodeId: node.id, type: 'KNOWLEDGE_BASE', retrieved: true };
      },
    },
  };

  const startExecution = async () => {
    const graphStore = useGraphStore();
    if (!graphStore.graphRef) {
      return { success: false, errors: ['图形实例不存在'] };
    }

    const validationResult = validateWorkflow(graphStore.graphRef);
    if (!validationResult.valid) {
      return { success: false, errors: validationResult.errors.map((e) => e.message) };
    }

    executor = new WorkflowExecutor(graphStore.graphRef, customExecutors, {
      maxRetries: 3,
      retryDelay: 1000,
    });

    const result = await executor.execute();

    workflowState.value = result.workflowState;

    if (!result.success) {
      return { success: false, errors: [result.error || '执行失败'] };
    }

    return { success: true, errors: [] };
  };

  const stopExecution = () => {
    executor?.abort();
    workflowState.value.isRunning = false;
    workflowState.value.status = 'failed';
  };

  const resetExecution = () => {
    executor = null;
    workflowState.value = {
      isRunning: false,
      executionStates: {},
      workflowId: '',
      logs: [],
      status: 'idle',
      progress: 0,
    };
  };

  const getExecutionProgress = (): number => {
    return workflowState.value.progress || 0;
  };

  const getNodeExecutionState = (nodeId: string): ExecutionState | undefined => {
    return workflowState.value.executionStates[nodeId];
  };

  return {
    workflowState,
    startExecution,
    stopExecution,
    resetExecution,
    getExecutionProgress,
    getNodeExecutionState,
  };
});
