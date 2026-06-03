import type { Graph, GraphNode, GraphEdge } from '@/types';

export function detectCycle(graph: Graph): { hasCycle: boolean; cycle?: string[] } {
  const nodes = graph.getNodes();
  const edges = graph.getEdges();

  const adjacencyList: Record<string, string[]> = {};
  nodes.forEach((node: GraphNode) => {
    adjacencyList[node.id] = [];
  });

  edges.forEach((edge: GraphEdge) => {
    const source = edge.getSourceCellId();
    const target = edge.getTargetCellId();
    if (source && target) {
      adjacencyList[source].push(target);
    }
  });

  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];

  const dfs = (nodeId: string): string[] | null => {
    visited.add(nodeId);
    recStack.add(nodeId);
    path.push(nodeId);

    for (const neighbor of adjacencyList[nodeId]) {
      if (!visited.has(neighbor)) {
        const result = dfs(neighbor);
        if (result !== null) {
          return result;
        }
      } else if (recStack.has(neighbor)) {
        const cycleStartIndex = path.indexOf(neighbor);
        const cyclePath = path.slice(cycleStartIndex);
        // 添加起始节点到末尾，形成完整循环
        return [...cyclePath, neighbor];
      }
    }

    path.pop();
    recStack.delete(nodeId);
    return null;
  };

  for (const nodeId of Object.keys(adjacencyList)) {
    if (!visited.has(nodeId)) {
      const cycle = dfs(nodeId);
      if (cycle !== null) {
        return { hasCycle: true, cycle };
      }
    }
  }

  return { hasCycle: false };
}

export interface ValidationError {
  message: string;
  nodeIds?: string[];
  type:
    | 'cycle'
    | 'empty'
    | 'missing_start'
    | 'multiple_starts'
    | 'missing_end'
    | 'isolated_node'
    | 'invalid_connection';
}

export function validateWorkflow(graph: Graph): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const nodes = graph.getNodes();
  const edges = graph.getEdges();

  const { hasCycle, cycle } = detectCycle(graph);
  if (hasCycle) {
    errors.push({
      message: `检测到循环依赖: ${cycle?.join(' → ') || '未知路径'}`,
      nodeIds: cycle,
      type: 'cycle',
    });
  }

  if (nodes.length === 0) {
    errors.push({
      message: '工作流为空',
      type: 'empty',
    });
  }

  const startNodes = nodes.filter((node: GraphNode) => node.data?.type === 'INPUT');
  if (startNodes.length === 0) {
    errors.push({
      message: '缺少开始节点',
      type: 'missing_start',
    });
  } else if (startNodes.length > 1) {
    errors.push({
      message: '只能有一个开始节点',
      nodeIds: startNodes.map((node) => node.id),
      type: 'multiple_starts',
    });
  }

  const endNodes = nodes.filter((node: GraphNode) => node.data?.type === 'OUTPUT');
  if (endNodes.length === 0) {
    errors.push({
      message: '缺少结束节点',
      type: 'missing_end',
    });
  }

  // 检查孤立节点
  if (nodes.length > 0) {
    const connectedNodeIds = new Set<string>();
    edges.forEach((edge) => {
      const source = edge.getSourceCellId();
      const target = edge.getTargetCellId();
      if (source) connectedNodeIds.add(source);
      if (target) connectedNodeIds.add(target);
    });

    const isolatedNodes = nodes.filter((node) => !connectedNodeIds.has(node.id));
    if (isolatedNodes.length > 0) {
      errors.push({
        message: `存在 ${isolatedNodes.length} 个孤立节点，请检查连接`,
        nodeIds: isolatedNodes.map((node) => node.id),
        type: 'isolated_node',
      });
    }
  }

  return { valid: errors.length === 0, errors };
}
