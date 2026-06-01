import type { Graph, Node } from '@antv/x6';
import type { NodeData, EdgeData } from '@/types';
import { addNode } from './node-operations';

export interface ImportNodeData {
  type: string;
  properties?: { position?: { x: number; y: number } };
  label?: string;
}

export interface ImportWorkflowData {
  nodes?: ImportNodeData[];
  edges?: { source: string; target: string; sourcePort?: string; targetPort?: string }[];
}

export function exportWorkflow(graphRef: { value: Graph | null }): string {
  if (!graphRef.value) return '{}';

  const nodes: NodeData[] = graphRef.value.getNodes().map((node) => ({
    id: node.id,
    type: (node as { data?: { type?: string } }).data?.type || 'task',
    label: (node as { label?: string }).label || '',
    properties: { position: { x: node.position().x, y: node.position().y } },
  }));

  const edges: EdgeData[] = graphRef.value.getEdges().map((edge) => ({
    id: edge.id,
    source: edge.getSourceCellId()!,
    target: edge.getTargetCellId()!,
    sourcePort: edge.getSourcePortId?.(),
    targetPort: edge.getTargetPortId?.(),
  }));

  return JSON.stringify({ nodes, edges }, null, 2);
}

export function importWorkflow(
  graphRef: { value: Graph | null },
  addNodeFn: (type: string, x: number, y: number, label?: string) => Node | null,
  jsonString: string
): void {
  if (!graphRef.value) return;

  try {
    const data = JSON.parse(jsonString) as ImportWorkflowData;
    const graph = graphRef.value;

    const hasInput = data.nodes?.some((n) => n.type === 'INPUT');

    graph.getCells().forEach((cell) => {
      const cellData = (cell as { data?: { type?: string } }).data;
      if (cellData?.type !== 'INPUT' || hasInput) {
        (cell as { remove?: () => void }).remove?.();
      }
    });

    data.nodes?.forEach((node) => {
      const pos = node.properties?.position || { x: 0, y: 0 };
      addNodeFn(node.type, pos.x, pos.y, node.label);
    });

    if (!hasInput) {
      const existingInput = graph
        .getNodes()
        .find((n) => (n as { data?: { type?: string } }).data?.type === 'INPUT');

      if (existingInput) {
        const graphWithSize = graph as unknown as {
          getWidth?: () => number;
          getHeight?: () => number;
          options?: { width?: number; height?: number };
        };

        const width = graphWithSize.getWidth?.() || graphWithSize.options?.width || 800;
        const height = graphWithSize.getHeight?.() || graphWithSize.options?.height || 600;

        (existingInput as { position: (x: number, y: number) => void }).position(
          width / 2 - 100,
          height / 2 - 40
        );
      }
    }

    data.edges?.forEach((edge) => {
      graph.addEdge({
        source: { cell: edge.source, port: edge.sourcePort },
        target: { cell: edge.target, port: edge.targetPort },
      });
    });
  } catch {
    // Invalid workflow JSON
  }
}
