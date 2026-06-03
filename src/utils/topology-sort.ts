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

interface CacheEntry {
  value: string[];
  timestamp: number;
}

const TOPOLOGY_CACHE_MAX_AGE = 5000; // 5秒过期
const TOPOLOGY_CACHE_SIZE = 100; // 最多缓存100个条目
const topologyCache = new Map<string, CacheEntry>();

function generateCacheKey(nodes: TopoGraphNode[], edges: TopoGraphEdge[]): string {
  const nodeIds = nodes
    .map((node) => node.id)
    .sort()
    .join('|');
  const edgeStrings = edges
    .map((edge) => {
      const source = edge.getSourceCellId();
      const target = edge.getTargetCellId();
      return `${source}-${target}`;
    })
    .sort()
    .join('|');
  return `${nodeIds}||${edgeStrings}`;
}

function cleanupCache(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  // 清理过期条目
  for (const [key, entry] of topologyCache.entries()) {
    if (now - entry.timestamp > TOPOLOGY_CACHE_MAX_AGE) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach((key) => topologyCache.delete(key));

  // 清理超出最大容量的条目（LRU 策略）
  if (topologyCache.size > TOPOLOGY_CACHE_SIZE) {
    const entries = Array.from(topologyCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    const excess = topologyCache.size - TOPOLOGY_CACHE_SIZE;
    for (let i = 0; i < excess; i++) {
      topologyCache.delete(entries[i][0]);
    }
  }
}

function getCachedResult(key: string): string[] | undefined {
  const entry = topologyCache.get(key);
  if (entry && Date.now() - entry.timestamp <= TOPOLOGY_CACHE_MAX_AGE) {
    return entry.value;
  }
  return undefined;
}

function setCacheResult(key: string, value: string[]): void {
  cleanupCache();
  topologyCache.set(key, {
    value,
    timestamp: Date.now(),
  });
}

export function topologySort(graph: TopoGraph): string[] {
  const nodes = graph.getNodes();
  const edges = graph.getEdges();

  const cacheKey = generateCacheKey(nodes, edges);
  const cachedResult = getCachedResult(cacheKey);

  if (cachedResult) {
    return cachedResult;
  }

  const inDegree: Record<string, number> = {};
  const adjacencyList: Record<string, string[]> = {};

  nodes.forEach((node: TopoGraphNode) => {
    inDegree[node.id] = 0;
    adjacencyList[node.id] = [];
  });

  edges.forEach((edge: TopoGraphEdge) => {
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

  setCacheResult(cacheKey, result);
  return result;
}

export function getExecutionOrder(graph: TopoGraph): string[] {
  try {
    return topologySort(graph);
  } catch {
    return [];
  }
}

export function getNodeDependencies(graph: TopoGraph, nodeId: string): string[] {
  const edges = graph.getEdges();
  const dependencies: string[] = [];

  edges.forEach((edge: TopoGraphEdge) => {
    if (edge.getTargetCellId() === nodeId) {
      const source = edge.getSourceCellId();
      if (source && !dependencies.includes(source)) {
        dependencies.push(source);
      }
    }
  });

  return dependencies;
}

export function getNodeDependents(graph: TopoGraph, nodeId: string): string[] {
  const edges = graph.getEdges();
  const dependents: string[] = [];

  edges.forEach((edge: TopoGraphEdge) => {
    if (edge.getSourceCellId() === nodeId) {
      const target = edge.getTargetCellId();
      if (target && !dependents.includes(target)) {
        dependents.push(target);
      }
    }
  });

  return dependents;
}
