interface GraphNode {
  id: string;
  data?: { type?: string };
}

interface GraphEdge {
  getSourceCellId: () => string | undefined;
  getTargetCellId: () => string | undefined;
}

interface Graph {
  getNodes: () => GraphNode[];
  getEdges: () => GraphEdge[];
}

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
  const cyclePath: string[] = [];

  const dfs = (nodeId: string): boolean => {
    if (!visited.has(nodeId)) {
      visited.add(nodeId);
      recStack.add(nodeId);

      for (const neighbor of adjacencyList[nodeId]) {
        if (!visited.has(neighbor) && dfs(neighbor)) {
          cyclePath.push(nodeId);
          return true;
        } else if (recStack.has(neighbor)) {
          cyclePath.push(neighbor, nodeId);
          return true;
        }
      }
    }

    recStack.delete(nodeId);
    return false;
  };

  for (const nodeId of Object.keys(adjacencyList)) {
    if (dfs(nodeId)) {
      return { hasCycle: true, cycle: cyclePath.reverse() };
    }
  }

  return { hasCycle: false };
}

export function validateWorkflow(graph: Graph): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const { hasCycle, cycle } = detectCycle(graph);
  if (hasCycle) {
    errors.push(`检测到循环依赖: ${cycle?.join(' → ') || '未知路径'}`);
  }

  const nodes = graph.getNodes();
  if (nodes.length === 0) {
    errors.push('工作流为空');
  }

  const startNodes = nodes.filter((node: GraphNode) => node.data?.type === 'INPUT');
  if (startNodes.length === 0) {
    errors.push('缺少开始节点');
  } else if (startNodes.length > 1) {
    errors.push('只能有一个开始节点');
  }

  const endNodes = nodes.filter((node: GraphNode) => node.data?.type === 'OUTPUT');
  if (endNodes.length === 0) {
    errors.push('缺少结束节点');
  }

  return { valid: errors.length === 0, errors };
}
