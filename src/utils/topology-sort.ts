export function topologySort(graph: any): string[] {
  const nodes = graph.getNodes();
  const edges = graph.getEdges();

  const inDegree: Record<string, number> = {};
  const adjacencyList: Record<string, string[]> = {};

  nodes.forEach((node: any) => {
    inDegree[node.id] = 0;
    adjacencyList[node.id] = [];
  });

  edges.forEach((edge: any) => {
    const source = edge.getSourceCellId();
    const target = edge.getTargetCellId();
    if (source && target) {
      adjacencyList[source].push(target);
      inDegree[target]++;
    }
  });

  const queue: string[] = [];
  Object.keys(inDegree).forEach((nodeId) => {
    if (inDegree[nodeId] === 0) {
      queue.push(nodeId);
    }
  });

  const result: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    for (const neighbor of adjacencyList[current]) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (result.length !== nodes.length) {
    throw new Error('图中存在环，无法进行拓扑排序');
  }

  return result;
}

export function getExecutionOrder(graph: any): string[] {
  try {
    return topologySort(graph);
  } catch {
    return [];
  }
}

export function getNodeDependencies(graph: any, nodeId: string): string[] {
  const edges = graph.getEdges();
  const dependencies: string[] = [];

  edges.forEach((edge: any) => {
    if (edge.getTargetCellId() === nodeId) {
      const source = edge.getSourceCellId();
      if (source && !dependencies.includes(source)) {
        dependencies.push(source);
      }
    }
  });

  return dependencies;
}

export function getNodeDependents(graph: any, nodeId: string): string[] {
  const edges = graph.getEdges();
  const dependents: string[] = [];

  edges.forEach((edge: any) => {
    if (edge.getSourceCellId() === nodeId) {
      const target = edge.getTargetCellId();
      if (target && !dependents.includes(target)) {
        dependents.push(target);
      }
    }
  });

  return dependents;
}
