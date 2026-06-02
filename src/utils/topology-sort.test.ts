import { describe, it, expect } from 'vitest';
import {
  topologySort,
  getExecutionOrder,
  getNodeDependencies,
  getNodeDependents,
} from '@/utils/topology-sort';

interface TopoGraphNode {
  id: string;
}

interface TopoGraphEdge {
  getSourceCellId: () => string | undefined;
  getTargetCellId: () => string | undefined;
}

interface TopoGraph {
  getNodes: () => TopoGraphNode[];
  getEdges: () => TopoGraphEdge[];
}

const createMockNode = (id: string): TopoGraphNode => ({ id });

const createMockEdge = (source: string, target: string): TopoGraphEdge => ({
  getSourceCellId: () => source,
  getTargetCellId: () => target,
});

const createMockGraph = (nodes: TopoGraphNode[], edges: TopoGraphEdge[]): TopoGraph => ({
  getNodes: () => nodes,
  getEdges: () => edges,
});

describe('topology-sort', () => {
  describe('topologySort', () => {
    it('should return correct order for a simple chain', () => {
      const nodes = [createMockNode('A'), createMockNode('B'), createMockNode('C')];
      const edges = [createMockEdge('A', 'B'), createMockEdge('B', 'C')];
      const graph = createMockGraph(nodes, edges);

      const result = topologySort(graph);
      expect(result).toHaveLength(3);
      expect(result.indexOf('A')).toBeLessThan(result.indexOf('B'));
      expect(result.indexOf('B')).toBeLessThan(result.indexOf('C'));
    });

    it('should handle parallel branches', () => {
      const nodes = [
        createMockNode('A'),
        createMockNode('B'),
        createMockNode('C'),
        createMockNode('D'),
      ];
      const edges = [
        createMockEdge('A', 'B'),
        createMockEdge('A', 'C'),
        createMockEdge('B', 'D'),
        createMockEdge('C', 'D'),
      ];
      const graph = createMockGraph(nodes, edges);

      const result = topologySort(graph);
      expect(result).toHaveLength(4);
      expect(result.indexOf('A')).toBe(0);
      expect(result.indexOf('D')).toBe(3);
    });

    it('should throw error when there is a cycle', () => {
      const nodes = [createMockNode('A'), createMockNode('B'), createMockNode('C')];
      const edges = [createMockEdge('A', 'B'), createMockEdge('B', 'C'), createMockEdge('C', 'A')];
      const graph = createMockGraph(nodes, edges);

      expect(() => topologySort(graph)).toThrow('图中存在环，无法进行拓扑排序');
    });

    it('should handle single node', () => {
      const nodes = [createMockNode('A')];
      const edges: TopoGraphEdge[] = [];
      const graph = createMockGraph(nodes, edges);

      const result = topologySort(graph);
      expect(result).toEqual(['A']);
    });

    it('should handle empty graph', () => {
      const nodes: TopoGraphNode[] = [];
      const edges: TopoGraphEdge[] = [];
      const graph = createMockGraph(nodes, edges);

      const result = topologySort(graph);
      expect(result).toEqual([]);
    });
  });

  describe('getExecutionOrder', () => {
    it('should return correct order for valid graph', () => {
      const nodes = [createMockNode('A'), createMockNode('B'), createMockNode('C')];
      const edges = [createMockEdge('A', 'B'), createMockEdge('B', 'C')];
      const graph = createMockGraph(nodes, edges);

      const result = getExecutionOrder(graph);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when there is a cycle', () => {
      const nodes = [createMockNode('A'), createMockNode('B')];
      const edges = [createMockEdge('A', 'B'), createMockEdge('B', 'A')];
      const graph = createMockGraph(nodes, edges);

      const result = getExecutionOrder(graph);
      expect(result).toEqual([]);
    });
  });

  describe('getNodeDependencies', () => {
    it('should return correct dependencies', () => {
      const nodes = [createMockNode('A'), createMockNode('B'), createMockNode('C')];
      const edges = [createMockEdge('A', 'B'), createMockEdge('C', 'B')];
      const graph = createMockGraph(nodes, edges);

      const result = getNodeDependencies(graph, 'B');
      expect(result).toHaveLength(2);
      expect(result).toContain('A');
      expect(result).toContain('C');
    });

    it('should return empty array for node with no dependencies', () => {
      const nodes = [createMockNode('A'), createMockNode('B')];
      const edges = [createMockEdge('A', 'B')];
      const graph = createMockGraph(nodes, edges);

      const result = getNodeDependencies(graph, 'A');
      expect(result).toEqual([]);
    });
  });

  describe('getNodeDependents', () => {
    it('should return correct dependents', () => {
      const nodes = [createMockNode('A'), createMockNode('B'), createMockNode('C')];
      const edges = [createMockEdge('A', 'B'), createMockEdge('A', 'C')];
      const graph = createMockGraph(nodes, edges);

      const result = getNodeDependents(graph, 'A');
      expect(result).toHaveLength(2);
      expect(result).toContain('B');
      expect(result).toContain('C');
    });

    it('should return empty array for node with no dependents', () => {
      const nodes = [createMockNode('A'), createMockNode('B')];
      const edges = [createMockEdge('A', 'B')];
      const graph = createMockGraph(nodes, edges);

      const result = getNodeDependents(graph, 'B');
      expect(result).toEqual([]);
    });
  });
});
