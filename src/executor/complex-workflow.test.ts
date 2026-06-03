import { describe, it, expect } from 'vitest';
import { WorkflowExecutor, type NodeExecutor } from './workflow-executor';
import type { Graph, GraphNode, GraphEdge } from '@/types';

const createMockNode = (id: string, type: string = 'default'): GraphNode => ({
  id,
  data: { type },
});

const createMockEdge = (source: string, target: string): GraphEdge => ({
  getSourceCellId: () => source,
  getTargetCellId: () => target,
});

const createMockGraph = (nodes: GraphNode[], edges: GraphEdge[]): Graph => ({
  getNodes: () => nodes,
  getEdges: () => edges,
});

describe('Complex Workflow Scenarios', () => {
  describe('workflow with loop and condition', () => {
    it('should execute a workflow with conditional branching', async () => {
      const nodes = [
        createMockNode('start', 'INPUT'),
        createMockNode('checkCondition', 'CONDITION'),
        createMockNode('pathA', 'default'),
        createMockNode('pathB', 'default'),
        createMockNode('merge', 'default'),
        createMockNode('end', 'OUTPUT'),
      ];
      const edges = [
        createMockEdge('start', 'checkCondition'),
        createMockEdge('checkCondition', 'pathA'),
        createMockEdge('checkCondition', 'pathB'),
        createMockEdge('pathA', 'merge'),
        createMockEdge('pathB', 'merge'),
        createMockEdge('merge', 'end'),
      ];
      const graph = createMockGraph(nodes, edges);

      let conditionResult = true;
      const executors: Record<string, NodeExecutor> = {
        INPUT: {
          execute: async (node) => {
            return { nodeId: node.id, type: 'INPUT', data: { value: 42 } };
          },
        },
        CONDITION: {
          execute: async (node, context) => {
            const input = context.getInput('start') as { data?: { value?: number } };
            const shouldGoA = input?.data?.value ? input.data.value > 10 : false;
            conditionResult = shouldGoA;
            return { nodeId: node.id, result: shouldGoA ? 'A' : 'B' };
          },
        },
        default: {
          execute: async (node) => {
            await new Promise((resolve) => setTimeout(resolve, 200));
            return { nodeId: node.id, result: 'success' };
          },
        },
        OUTPUT: {
          execute: async (node, context) => {
            const input = context.getInput('merge');
            return { nodeId: node.id, type: 'OUTPUT', data: input };
          },
        },
      };

      const executor = new WorkflowExecutor(graph, executors);
      const result = await executor.execute();

      expect(result.success).toBe(true);
      expect(result.workflowState.status).toBe('completed');
      expect(conditionResult).toBe(true);
    });

    it('should execute a workflow with loop simulation', async () => {
      const nodes = [
        createMockNode('start', 'INPUT'),
        createMockNode('loopNode', 'LOOP'),
        createMockNode('end', 'OUTPUT'),
      ];
      const edges = [createMockEdge('start', 'loopNode'), createMockEdge('loopNode', 'end')];
      const graph = createMockGraph(nodes, edges);

      let loopCount = 0;
      const executors: Record<string, NodeExecutor> = {
        INPUT: {
          execute: async (node) => {
            return { nodeId: node.id, type: 'INPUT', iterations: 3 };
          },
        },
        LOOP: {
          execute: async (node, context) => {
            const input = context.getInput('start') as { iterations?: number };
            const maxIterations = input?.iterations ?? 3;

            for (let i = 0; i < maxIterations; i++) {
              loopCount++;
              await new Promise((resolve) => setTimeout(resolve, 50));
            }

            return { nodeId: node.id, iterations: loopCount };
          },
        },
        default: {
          execute: async (node) => {
            await new Promise((resolve) => setTimeout(resolve, 100));
            return { nodeId: node.id, result: 'processed' };
          },
        },
        OUTPUT: {
          execute: async (node, context) => {
            const loopResult = context.getInput('loopNode') as { iterations?: number };
            return { nodeId: node.id, type: 'OUTPUT', iterations: loopResult?.iterations };
          },
        },
      };

      const executor = new WorkflowExecutor(graph, executors);
      const result = await executor.execute();

      expect(result.success).toBe(true);
      expect(loopCount).toBe(3);
    });
  });

  describe('retry mechanism with complex scenarios', () => {
    it('should retry failed node in conditional path', async () => {
      const nodes = [
        createMockNode('start', 'INPUT'),
        createMockNode('task1', 'default'),
        createMockNode('task2', 'default'),
        createMockNode('end', 'OUTPUT'),
      ];
      const edges = [
        createMockEdge('start', 'task1'),
        createMockEdge('task1', 'task2'),
        createMockEdge('task2', 'end'),
      ];
      const graph = createMockGraph(nodes, edges);

      let task1Attempts = 0;
      let task2Attempts = 0;
      const executors: Record<string, NodeExecutor> = {
        INPUT: {
          execute: async (node) => {
            return { nodeId: node.id, type: 'INPUT' };
          },
        },
        default: {
          execute: async (node) => {
            if (node.id === 'task1') {
              task1Attempts++;
              if (task1Attempts < 2) {
                throw new Error('Temporary failure in task1');
              }
            } else if (node.id === 'task2') {
              task2Attempts++;
              if (task2Attempts < 3) {
                throw new Error('Temporary failure in task2');
              }
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
            return { nodeId: node.id, result: 'success' };
          },
          canRetry: (error) => {
            return error instanceof Error && error.message.includes('Temporary');
          },
        },
        OUTPUT: {
          execute: async (node, context) => {
            return { nodeId: node.id, type: 'OUTPUT', data: context.getInput('task2') };
          },
        },
      };

      const executor = new WorkflowExecutor(graph, executors, { maxRetries: 3 });
      const result = await executor.execute();

      expect(result.success).toBe(true);
      expect(task1Attempts).toBe(2);
      expect(task2Attempts).toBe(3);

      const task1State = executor.getNodeState('task1');
      const task2State = executor.getNodeState('task2');
      expect(task1State?.retryCount).toBe(1);
      expect(task2State?.retryCount).toBe(2);
    });

    it('should track execution state with detailed logs', async () => {
      const nodes = [
        createMockNode('start', 'INPUT'),
        createMockNode('processor', 'default'),
        createMockNode('end', 'OUTPUT'),
      ];
      const edges = [createMockEdge('start', 'processor'), createMockEdge('processor', 'end')];
      const graph = createMockGraph(nodes, edges);

      const executors: Record<string, NodeExecutor> = {
        INPUT: {
          execute: async (node) => ({ nodeId: node.id, type: 'INPUT', value: 'test' }),
        },
        default: {
          execute: async (node) => {
            await new Promise((resolve) => setTimeout(resolve, 150));
            return { nodeId: node.id, processed: true };
          },
        },
        OUTPUT: {
          execute: async (node, context) => ({
            nodeId: node.id,
            type: 'OUTPUT',
            data: context.getInput('processor'),
          }),
        },
      };

      const executor = new WorkflowExecutor(graph, executors);
      const result = await executor.execute();

      expect(result.success).toBe(true);

      const workflowState = executor.getWorkflowState();
      expect(workflowState.logs.length).toBeGreaterThan(0);

      const startLog = workflowState.logs.find((log) => log.message.includes('Starting'));
      const processorLog = workflowState.logs.find((log) => log.message.includes('processor'));
      const completedLog = workflowState.logs.find((log) =>
        log.message.includes('completed successfully')
      );

      expect(startLog).toBeDefined();
      expect(processorLog).toBeDefined();
      expect(completedLog).toBeDefined();

      const processorState = executor.getNodeState('processor');
      expect(processorState?.status).toBe('completed');
      expect(processorState?.startTime).toBeDefined();
      expect(processorState?.endTime).toBeDefined();
      expect(processorState?.logs.length).toBeGreaterThan(0);
    });
  });

  describe('error handling in complex workflows', () => {
    it('should fail workflow when non-retryable error occurs', async () => {
      const nodes = [
        createMockNode('start', 'INPUT'),
        createMockNode('criticalTask', 'default'),
        createMockNode('end', 'OUTPUT'),
      ];
      const edges = [
        createMockEdge('start', 'criticalTask'),
        createMockEdge('criticalTask', 'end'),
      ];
      const graph = createMockGraph(nodes, edges);

      const executors: Record<string, NodeExecutor> = {
        INPUT: {
          execute: async (node) => ({ nodeId: node.id, type: 'INPUT' }),
        },
        default: {
          execute: async () => {
            throw new Error('Fatal error - cannot retry');
          },
          canRetry: () => false,
        },
        OUTPUT: {
          execute: async (node) => ({ nodeId: node.id, type: 'OUTPUT' }),
        },
      };

      const executor = new WorkflowExecutor(graph, executors, { maxRetries: 3 });
      const result = await executor.execute();

      expect(result.success).toBe(false);
      expect(result.workflowState.status).toBe('failed');
      expect(result.workflowState.error).toBe('Fatal error - cannot retry');

      const taskState = executor.getNodeState('criticalTask');
      expect(taskState?.status).toBe('error');
      expect(taskState?.retryCount).toBe(0);
    });

    it('should track partial execution when workflow fails', async () => {
      const nodes = [
        createMockNode('start', 'INPUT'),
        createMockNode('task1', 'default'),
        createMockNode('task2', 'default'),
        createMockNode('task3', 'default'),
        createMockNode('end', 'OUTPUT'),
      ];
      const edges = [
        createMockEdge('start', 'task1'),
        createMockEdge('task1', 'task2'),
        createMockEdge('task2', 'task3'),
        createMockEdge('task3', 'end'),
      ];
      const graph = createMockGraph(nodes, edges);

      const executors: Record<string, NodeExecutor> = {
        INPUT: {
          execute: async (node) => ({ nodeId: node.id, type: 'INPUT' }),
        },
        default: {
          execute: async (node) => {
            if (node.id === 'task2') {
              throw new Error('Task 2 failed');
            }
            await new Promise((resolve) => setTimeout(resolve, 50));
            return { nodeId: node.id, result: 'success' };
          },
        },
        OUTPUT: {
          execute: async (node) => ({ nodeId: node.id, type: 'OUTPUT' }),
        },
      };

      const executor = new WorkflowExecutor(graph, executors, { maxRetries: 2 });
      const result = await executor.execute();

      expect(result.success).toBe(false);

      const task1State = executor.getNodeState('task1');
      const task2State = executor.getNodeState('task2');
      const task3State = executor.getNodeState('task3');

      expect(task1State?.status).toBe('completed');
      expect(task2State?.status).toBe('error');
      expect(task3State?.status).toBe('pending');
    });
  });

  describe('data flow in complex workflows', () => {
    it('should pass data through conditional branches', async () => {
      const nodes = [
        createMockNode('start', 'INPUT'),
        createMockNode('transform', 'default'),
        createMockNode('branch', 'CONDITION'),
        createMockNode('processA', 'default'),
        createMockNode('processB', 'default'),
        createMockNode('aggregate', 'default'),
        createMockNode('end', 'OUTPUT'),
      ];
      const edges = [
        createMockEdge('start', 'transform'),
        createMockEdge('transform', 'branch'),
        createMockEdge('branch', 'processA'),
        createMockEdge('branch', 'processB'),
        createMockEdge('processA', 'aggregate'),
        createMockEdge('processB', 'aggregate'),
        createMockEdge('aggregate', 'end'),
      ];
      const graph = createMockGraph(nodes, edges);

      const executors: Record<string, NodeExecutor> = {
        INPUT: {
          execute: async (node) => ({ nodeId: node.id, value: 100 }),
        },
        default: {
          execute: async (node, context) => {
            const inputKey =
              node.id === 'transform'
                ? 'start'
                : node.id === 'aggregate'
                  ? 'processA'
                  : 'transform';
            const input = context.getInput(inputKey) as { value?: number; transformed?: number };
            if (node.id === 'transform') {
              return { nodeId: node.id, transformed: (input?.value ?? 0) * 2 };
            } else if (node.id === 'processA') {
              return { nodeId: node.id, result: `Path A: ${input?.transformed}` };
            } else if (node.id === 'processB') {
              return { nodeId: node.id, result: `Path B: ${input?.transformed}` };
            } else if (node.id === 'aggregate') {
              const aResult = context.getInput('processA');
              const bResult = context.getInput('processB');
              return { nodeId: node.id, combined: [aResult, bResult] };
            }
            return { nodeId: node.id };
          },
        },
        CONDITION: {
          execute: async () => ({ nodeId: 'branch', result: true }),
        },
        OUTPUT: {
          execute: async (node, context) => {
            return { nodeId: node.id, final: context.getInput('aggregate') };
          },
        },
      };

      const executor = new WorkflowExecutor(graph, executors);
      const result = await executor.execute();

      expect(result.success).toBe(true);
      const endState = executor.getNodeState('end');
      expect(endState?.output).toBeDefined();
    });
  });
});
