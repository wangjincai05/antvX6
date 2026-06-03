import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  DryRunRecord,
  DryRunState,
  ExecutionState,
  ExecutionLog,
  ExecutionStatus,
} from '@/types/workflow';
import { useGraphStore } from './graph/index';
import { validateWorkflow } from '@/utils/dag-validator';
import { createDefaultExecutors, type NodeExecutor } from '@/executor/workflow-executor';

export const useDryRunStore = defineStore('dryRun', () => {
  const dryRunState = ref<DryRunState>({
    isRunning: false,
    currentRecord: null,
    history: [],
    maxHistoryCount: 10,
  });

  const executionStatus = ref<ExecutionStatus>('idle');

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
        await new Promise((resolve) => setTimeout(resolve, 1500));
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
        await new Promise((resolve) => setTimeout(resolve, 1200));
        return { nodeId: node.id, type: 'DATABASE', records: 100 };
      },
    },
    KNOWLEDGE_BASE: {
      execute: async (node) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { nodeId: node.id, type: 'KNOWLEDGE_BASE', retrieved: true };
      },
    },
  };

  const history = computed(() => dryRunState.value.history);

  const startDryRun = async () => {
    const graphStore = useGraphStore();
    if (!graphStore.graphRef) {
      return { success: false, errors: ['图形实例不存在'] };
    }

    const validationResult = validateWorkflow(graphStore.graphRef);
    if (!validationResult.valid) {
      return { success: false, errors: validationResult.errors.map((e) => e.message) };
    }

    const nodes = graphStore.graphRef.getNodes();
    const initialLogs: ExecutionLog[] = [
      {
        timestamp: Date.now(),
        level: 'info',
        message: '开始试运行工作流',
        data: { totalNodes: nodes.length },
      },
    ];

    const initialStates: Record<string, ExecutionState> = {};
    nodes.forEach((node) => {
      initialStates[node.id] = {
        nodeId: node.id,
        status: 'pending',
        retryCount: 0,
        maxRetries: 3,
        logs: [],
      };
    });

    dryRunState.value.currentRecord = {
      id: `dryrun-${Date.now()}`,
      workflowId: `workflow-${Date.now()}`,
      startTime: Date.now(),
      status: 'completed',
      progress: 0,
      totalNodes: nodes.length,
      completedNodes: 0,
      failedNodes: 0,
      logs: initialLogs,
      executionStates: initialStates,
    };

    dryRunState.value.isRunning = true;
    executionStatus.value = 'running';

    try {
      const result = await executeWithRealtimeUpdate();

      const completedCount = Object.values(result.workflowState.executionStates).filter(
        (s) => s.status === 'completed'
      ).length;
      const failedCount = Object.values(result.workflowState.executionStates).filter(
        (s) => s.status === 'error'
      ).length;

      dryRunState.value.currentRecord = {
        ...dryRunState.value.currentRecord!,
        endTime: Date.now(),
        status: result.success ? 'completed' : 'failed',
        progress: result.workflowState.progress || 0,
        logs: [...dryRunState.value.currentRecord!.logs, ...result.workflowState.logs],
        executionStates: result.workflowState.executionStates,
        completedNodes: completedCount,
        failedNodes: failedCount,
      };

      addToHistory(dryRunState.value.currentRecord);

      if (!result.success) {
        return { success: false, errors: [result.error || '试运行失败'] };
      }

      return { success: true, errors: [] };
    } catch (error) {
      dryRunState.value.currentRecord = {
        ...dryRunState.value.currentRecord!,
        endTime: Date.now(),
        status: 'failed',
        logs: [
          ...dryRunState.value.currentRecord!.logs,
          {
            timestamp: Date.now(),
            level: 'error',
            message: error instanceof Error ? error.message : '未知错误',
          },
        ],
      };
      addToHistory(dryRunState.value.currentRecord);
      return { success: false, errors: [error instanceof Error ? error.message : '未知错误'] };
    } finally {
      dryRunState.value.isRunning = false;
      executionStatus.value =
        dryRunState.value.currentRecord?.status === 'completed' ? 'completed' : 'idle';
    }
  };

  const executeWithRealtimeUpdate = async (): Promise<{
    success: boolean;
    workflowState: {
      executionStates: Record<string, ExecutionState>;
      logs: ExecutionLog[];
      progress?: number;
      status: string;
      error?: string;
    };
    error?: string;
  }> => {
    const graphStore = useGraphStore();
    if (!graphStore.graphRef) {
      return {
        success: false,
        workflowState: { executionStates: {}, logs: [], status: 'failed' },
        error: '图形实例不存在',
      };
    }

    const nodes = graphStore.graphRef.getNodes();
    const executionOrder = nodes.map((node) => node.id);

    let progress = 0;
    const executionStates: Record<string, ExecutionState> = {
      ...dryRunState.value.currentRecord?.executionStates,
    };
    const logs: ExecutionLog[] = [...(dryRunState.value.currentRecord?.logs || [])];

    for (let i = 0; i < executionOrder.length; i++) {
      const nodeId = executionOrder[i];
      const node = graphStore.graphRef.getNodes().find((n) => n.id === nodeId);
      if (!node) continue;

      while (executionStatus.value === 'paused') {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (executionStatus.value === 'idle') {
        logs.push({
          timestamp: Date.now(),
          level: 'warn',
          message: '试运行已取消',
        });
        dryRunState.value.currentRecord = {
          ...dryRunState.value.currentRecord!,
          executionStates,
          logs,
          progress: Math.round(progress),
          status: 'cancelled',
        };
        return {
          success: false,
          workflowState: {
            executionStates,
            logs,
            progress: Math.round(progress),
            status: 'cancelled',
            error: '已取消',
          },
          error: '已取消',
        };
      }

      await new Promise((resolve) => setTimeout(resolve, 0));

      executionStates[nodeId] = {
        ...executionStates[nodeId],
        status: 'running',
        startTime: Date.now(),
        retryCount: 0,
      };

      logs.push({
        timestamp: Date.now(),
        level: 'info',
        message: `开始执行节点: ${nodeId}`,
        data: { nodeId, nodeType: node.data?.type },
      });

      dryRunState.value.currentRecord = {
        ...dryRunState.value.currentRecord!,
        executionStates,
        logs,
        progress: Math.round((i / executionOrder.length) * 100),
      };

      try {
        const executorResult = await executeNode(node, i);

        executionStates[nodeId] = {
          ...executionStates[nodeId],
          status: 'completed',
          endTime: Date.now(),
          output: executorResult,
        };

        logs.push({
          timestamp: Date.now(),
          level: 'info',
          message: `节点 ${nodeId} 执行成功`,
          data: { nodeId, result: executorResult },
        });

        progress = ((i + 1) / executionOrder.length) * 100;
      } catch (error) {
        executionStates[nodeId] = {
          ...executionStates[nodeId],
          status: 'error',
          endTime: Date.now(),
          error: error instanceof Error ? error.message : String(error),
        };

        logs.push({
          timestamp: Date.now(),
          level: 'error',
          message: `节点 ${nodeId} 执行失败: ${error instanceof Error ? error.message : String(error)}`,
          data: { nodeId, error: error instanceof Error ? error.message : String(error) },
        });

        dryRunState.value.currentRecord = {
          ...dryRunState.value.currentRecord!,
          executionStates,
          logs,
          progress: Math.round(progress),
          status: 'failed',
        };

        return {
          success: false,
          workflowState: {
            executionStates,
            logs,
            progress: Math.round(progress),
            status: 'failed',
            error: executionStates[nodeId].error,
          },
          error: executionStates[nodeId].error,
        };
      }

      dryRunState.value.currentRecord = {
        ...dryRunState.value.currentRecord!,
        executionStates,
        logs,
        progress: Math.round(progress),
      };
    }

    logs.push({
      timestamp: Date.now(),
      level: 'info',
      message: '工作流执行完成',
    });

    dryRunState.value.currentRecord = {
      ...dryRunState.value.currentRecord!,
      executionStates,
      logs,
      progress: 100,
      status: 'completed',
    };

    return {
      success: true,
      workflowState: { executionStates, logs, progress: 100, status: 'completed' },
    };
  };

  const executeNode = async (
    node: { id: string; data?: { type?: string } },
    index: number
  ): Promise<unknown> => {
    await new Promise((resolve) => setTimeout(resolve, 500 + index * 200));

    const executor = customExecutors[node.data?.type || 'default'];
    if (!executor) {
      throw new Error(`No executor found for node type: ${node.data?.type}`);
    }

    const result = await executor.execute(node, {
      workflowState: {
        isRunning: true,
        executionStates: {},
        workflowId: '',
        logs: [],
        status: 'running',
        progress: 0,
      },
      nodeStates: {},
      getInput: () => null,
      setOutput: () => {},
    });

    return result;
  };

  const stopDryRun = () => {
    dryRunState.value.isRunning = false;
    executionStatus.value = 'idle';
    if (dryRunState.value.currentRecord) {
      dryRunState.value.currentRecord = {
        ...dryRunState.value.currentRecord,
        endTime: Date.now(),
        status: 'cancelled',
        logs: [
          ...dryRunState.value.currentRecord.logs,
          {
            timestamp: Date.now(),
            level: 'warn',
            message: '试运行已取消',
          },
        ],
      };
      addToHistory(dryRunState.value.currentRecord);
    }
  };

  const pauseDryRun = () => {
    dryRunState.value.isRunning = false;
    executionStatus.value = 'paused';
    if (dryRunState.value.currentRecord) {
      dryRunState.value.currentRecord = {
        ...dryRunState.value.currentRecord,
        logs: [
          ...dryRunState.value.currentRecord.logs,
          {
            timestamp: Date.now(),
            level: 'info',
            message: '试运行已暂停',
          },
        ],
      };
    }
  };

  const resumeDryRun = () => {
    dryRunState.value.isRunning = true;
    executionStatus.value = 'running';
    if (dryRunState.value.currentRecord) {
      dryRunState.value.currentRecord = {
        ...dryRunState.value.currentRecord,
        logs: [
          ...dryRunState.value.currentRecord.logs,
          {
            timestamp: Date.now(),
            level: 'info',
            message: '试运行已恢复',
          },
        ],
      };
    }
  };

  const restartDryRun = async () => {
    stopDryRun();
    await new Promise((resolve) => setTimeout(resolve, 100));
    return startDryRun();
  };

  const addToHistory = (record: DryRunRecord) => {
    dryRunState.value.history.unshift(record);
    if (dryRunState.value.history.length > dryRunState.value.maxHistoryCount) {
      dryRunState.value.history = dryRunState.value.history.slice(
        0,
        dryRunState.value.maxHistoryCount
      );
    }
  };

  const getHistoryRecords = () => {
    return dryRunState.value.history;
  };

  const getCurrentRecord = () => {
    return dryRunState.value.currentRecord;
  };

  const clearHistory = () => {
    dryRunState.value.history = [];
  };

  const getNodeExecutionState = (nodeId: string): ExecutionState | undefined => {
    return dryRunState.value.currentRecord?.executionStates[nodeId];
  };

  const getExecutionProgress = (): number => {
    return dryRunState.value.currentRecord?.progress || 0;
  };

  return {
    dryRunState,
    history,
    executionStatus,
    startDryRun,
    stopDryRun,
    pauseDryRun,
    resumeDryRun,
    restartDryRun,
    getHistoryRecords,
    getCurrentRecord,
    clearHistory,
    getNodeExecutionState,
    getExecutionProgress,
  };
});
