import { describe, it, expect } from 'vitest';
import { detectCycle, validateWorkflow } from '@/utils/dag-validator';

const createMockNode = (id: string, type: string = 'task') => ({
  id,
  data: { type },
});

const createMockEdge = (source: string, target: string) => ({
  getSourceCellId: () => source,
  getTargetCellId: () => target,
});

const createMockGraph = (nodes: unknown[], edges: unknown[]) => ({
  getNodes: () => nodes,
  getEdges: () => edges,
});

describe('dag-validator', () => {
  describe('detectCycle', () => {
    it('should return no cycle for a simple DAG', () => {
      const nodes = [createMockNode('A'), createMockNode('B'), createMockNode('C')];
      const edges = [createMockEdge('A', 'B'), createMockEdge('B', 'C')];
      const graph = createMockGraph(nodes, edges);

      const result = detectCycle(graph);
      expect(result.hasCycle).toBe(false);
      expect(result.cycle).toBeUndefined();
    });

    it('should detect a simple cycle', () => {
      const nodes = [createMockNode('A'), createMockNode('B'), createMockNode('C')];
      const edges = [createMockEdge('A', 'B'), createMockEdge('B', 'C'), createMockEdge('C', 'A')];
      const graph = createMockGraph(nodes, edges);

      const result = detectCycle(graph);
      expect(result.hasCycle).toBe(true);
      expect(result.cycle).toBeDefined();
    });

    it('should detect a self-loop', () => {
      const nodes = [createMockNode('A'), createMockNode('B')];
      const edges = [createMockEdge('A', 'A'), createMockEdge('A', 'B')];
      const graph = createMockGraph(nodes, edges);

      const result = detectCycle(graph);
      expect(result.hasCycle).toBe(true);
    });

    it('should handle empty graph', () => {
      const nodes: unknown[] = [];
      const edges: unknown[] = [];
      const graph = createMockGraph(nodes, edges);

      const result = detectCycle(graph);
      expect(result.hasCycle).toBe(false);
    });

    it('should handle single node with no edges', () => {
      const nodes = [createMockNode('A')];
      const edges: unknown[] = [];
      const graph = createMockGraph(nodes, edges);

      const result = detectCycle(graph);
      expect(result.hasCycle).toBe(false);
    });
  });

  describe('validateWorkflow', () => {
    it('should pass validation for a valid workflow', () => {
      const nodes = [
        createMockNode('start', 'INPUT'),
        createMockNode('task1'),
        createMockNode('end', 'OUTPUT'),
      ];
      const edges = [createMockEdge('start', 'task1'), createMockEdge('task1', 'end')];
      const graph = createMockGraph(nodes, edges);

      const result = validateWorkflow(graph);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should fail validation when there is a cycle', () => {
      const nodes = [
        createMockNode('start', 'INPUT'),
        createMockNode('task1'),
        createMockNode('task2'),
        createMockNode('end', 'OUTPUT'),
      ];
      const edges = [
        createMockEdge('start', 'task1'),
        createMockEdge('task1', 'task2'),
        createMockEdge('task2', 'task1'),
        createMockEdge('task2', 'end'),
      ];
      const graph = createMockGraph(nodes, edges);

      const result = validateWorkflow(graph);
      expect(result.valid).toBe(false);
      expect(result.errors.some((error) => error.includes('检测到循环依赖'))).toBe(true);
    });

    it('should fail validation when there is no INPUT node', () => {
      const nodes = [createMockNode('task1'), createMockNode('end', 'OUTPUT')];
      const edges = [createMockEdge('task1', 'end')];
      const graph = createMockGraph(nodes, edges);

      const result = validateWorkflow(graph);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('缺少开始节点');
    });

    it('should fail validation when there is no OUTPUT node', () => {
      const nodes = [createMockNode('start', 'INPUT'), createMockNode('task1')];
      const edges = [createMockEdge('start', 'task1')];
      const graph = createMockGraph(nodes, edges);

      const result = validateWorkflow(graph);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('缺少结束节点');
    });

    it('should fail validation when there are multiple INPUT nodes', () => {
      const nodes = [
        createMockNode('start1', 'INPUT'),
        createMockNode('start2', 'INPUT'),
        createMockNode('end', 'OUTPUT'),
      ];
      const edges = [createMockEdge('start1', 'end'), createMockEdge('start2', 'end')];
      const graph = createMockGraph(nodes, edges);

      const result = validateWorkflow(graph);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('只能有一个开始节点');
    });

    it('should fail validation for empty workflow', () => {
      const nodes: unknown[] = [];
      const edges: unknown[] = [];
      const graph = createMockGraph(nodes, edges);

      const result = validateWorkflow(graph);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('工作流为空');
    });
  });
});
