import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Graph, Node, Edge } from '@antv/x6';
import { register } from '@antv/x6-vue-shape';
import { defaultGraphOptions, nodeStyle, edgeStyle } from '@/config/workflow/graph-options';
import { nodeRegistry, portGroups, portInteractionStyles } from '@/config/workflow/node-registry';
import type { NodeData, EdgeData } from '@/types/workflow';
import WorkflowNode from '@/components/workflow/WorkflowNode.vue';

export const useGraphStore = defineStore('graph', () => {
  const graphRef = ref<Graph | null>(null);
  const selectedNode = ref<Node | null>(null);
  const selectedEdge = ref<Edge | null>(null);

  interface CellData {
    type?: string;
  }

  interface CellWithData {
    data?: CellData;
    remove?: () => void;
  }

  const initGraph = (container: HTMLElement) => {
    register({
      shape: 'workflow-node',
      width: nodeStyle.width,
      height: nodeStyle.height,
      component: WorkflowNode,
    });

    interface ValidateConnectionParams {
      sourceCell: unknown;
      targetCell: unknown;
      sourceMagnet: unknown;
      targetMagnet: unknown;
    }

    interface GraphOptions {
      container: HTMLElement;
      width: number;
      height: number;
      connecting: {
        createEdge?: () => Edge;
        validateConnection?: (params: ValidateConnectionParams) => boolean;
      } & Record<string, unknown>;
    }

    const options: GraphOptions = {
      ...(defaultGraphOptions as Record<string, unknown>),
      container,
      width: container.offsetWidth,
      height: container.offsetHeight,
      connecting: {
        ...(defaultGraphOptions.connecting as Record<string, unknown>),
        createEdge() {
          return graphRef.value!.createEdge({
            ...edgeStyle,
          });
        },
        validateConnection({
          sourceCell,
          targetCell,
          sourceMagnet,
          targetMagnet,
        }: ValidateConnectionParams) {
          if (!sourceMagnet) return false;
          if (!targetMagnet) return false;
          if (sourceCell === targetCell) return false;
          return true;
        },
      },
    };

    graphRef.value = new Graph(options as unknown as ConstructorParameters<typeof Graph>[0]);

    graphRef.value.on('node:click', ({ node }: { node: Node }) => {
      selectedNode.value = node;
      selectedEdge.value = null;
    });

    graphRef.value.on('edge:click', ({ edge }: { edge: Edge }) => {
      selectedEdge.value = edge;
      selectedNode.value = null;
    });

    graphRef.value.on('node:mouseover', ({ node }: { node: Node }) => {
      handleNodeMouseOver(node);
    });

    graphRef.value.on('node:mouseout', ({ node }: { node: Node }) => {
      handleNodeMouseOut(node);
    });

    graphRef.value.on('blank:click', () => {
      selectedNode.value = null;
      selectedEdge.value = null;
    });

    const width =
      (graphRef.value as unknown as { getWidth?: () => number }).getWidth?.() ||
      container.offsetWidth;
    const height =
      (graphRef.value as unknown as { getHeight?: () => number }).getHeight?.() ||
      container.offsetHeight;
    addNode('INPUT', width / 2 - nodeStyle.width / 2, height / 2 - nodeStyle.height / 2);

    graphRef.value.bindKey('del', () => {
      const selected = graphRef.value!.getSelectedCells();
      const toRemove = selected.filter((cell: CellWithData) => cell.data?.type !== 'INPUT');
      if (toRemove.length > 0) {
        graphRef.value!.removeCells(
          toRemove as unknown as Parameters<typeof graphRef.value.removeCells>[0]
        );
      }
    });

    graphRef.value.bindKey('backspace', () => {
      const selected = graphRef.value!.getSelectedCells();
      const toRemove = selected.filter((cell: CellWithData) => cell.data?.type !== 'INPUT');
      if (toRemove.length > 0) {
        graphRef.value!.removeCells(
          toRemove as unknown as Parameters<typeof graphRef.value.removeCells>[0]
        );
      }
    });

    return graphRef.value;
  };

  const addNode = (type: string, x: number, y: number, label?: string) => {
    if (!graphRef.value) return null;

    const config = nodeRegistry[type];
    if (!config) return null;

    const node = graphRef.value.addNode({
      shape: 'workflow-node',
      x,
      y,
      label: label || config.name,
      attrs: {
        body: {
          stroke: '#5f95ff',
        },
      },
      ports: {
        groups: portGroups,
        items: config.ports,
      },
      data: {
        type,
        icon: config.icon,
      },
    });

    return node;
  };

  const clearCanvas = () => {
    if (!graphRef.value) return;
    graphRef.value.getCells().forEach((cell: CellWithData) => {
      if (cell.data?.type !== 'INPUT') {
        cell.remove?.();
      }
    });
    selectedNode.value = null;
    selectedEdge.value = null;
  };

  const zoomIn = () => {
    if (!graphRef.value) return;
    const currentScale = (graphRef.value as unknown as { getScale: () => number }).getScale();
    const zoomGraph = graphRef.value as unknown as { zoomTo: (scale: number) => void };
    zoomGraph.zoomTo(Math.min(currentScale * 1.2, 2));
  };

  const zoomOut = () => {
    if (!graphRef.value) return;
    const currentScale = (graphRef.value as unknown as { getScale: () => number }).getScale();
    const zoomGraph = graphRef.value as unknown as { zoomTo: (scale: number) => void };
    zoomGraph.zoomTo(Math.max(currentScale * 0.8, 0.2));
  };

  const resetZoom = () => {
    if (!graphRef.value) return;
    const zoomGraph = graphRef.value as unknown as {
      zoomTo: (scale: number) => void;
      centerContent: () => void;
    };
    zoomGraph.zoomTo(1);
    zoomGraph.centerContent();
  };

  interface ExportNode {
    id: string;
    data: { type?: string };
    label?: string;
    position: () => { x: number; y: number };
  }

  interface ExportEdge {
    id: string;
    getSourceCellId: () => string | undefined;
    getTargetCellId: () => string | undefined;
    getSourcePortId: () => string | undefined;
    getTargetPortId: () => string | undefined;
  }

  const exportWorkflow = (): string => {
    if (!graphRef.value) return '{}';

    const nodes: NodeData[] = graphRef.value.getNodes().map((node: ExportNode) => ({
      id: node.id,
      type: node.data.type || 'task',
      label: node.label || '',
      properties: {
        position: { x: node.position().x, y: node.position().y },
      },
    }));

    const edges: EdgeData[] = graphRef.value.getEdges().map((edge: ExportEdge) => ({
      id: edge.id,
      source: edge.getSourceCellId()!,
      target: edge.getTargetCellId()!,
      sourcePort: edge.getSourcePortId(),
      targetPort: edge.getTargetPortId(),
    }));

    return JSON.stringify({ nodes, edges }, null, 2);
  };

  interface ImportNodeData {
    type: string;
    properties?: { position?: { x: number; y: number } };
    label?: string;
  }

  interface ImportEdgeData {
    source: string;
    target: string;
    sourcePort?: string;
    targetPort?: string;
  }

  interface ImportWorkflowData {
    nodes?: ImportNodeData[];
    edges?: ImportEdgeData[];
  }

  interface GraphNodeWithData {
    data?: { type?: string };
    position: (x: number, y: number) => void;
  }

  const importWorkflow = (jsonString: string) => {
    if (!graphRef.value) return;

    try {
      const data = JSON.parse(jsonString) as ImportWorkflowData;
      const graph = graphRef.value;

      const hasInput = data.nodes?.some((n: ImportNodeData) => n.type === 'INPUT');

      graph.getCells().forEach((cell: CellWithData) => {
        if (cell.data?.type !== 'INPUT' || hasInput) {
          cell.remove?.();
        }
      });

      data.nodes?.forEach((node: ImportNodeData) => {
        const pos = node.properties?.position || { x: 0, y: 0 };
        addNode(node.type, pos.x, pos.y, node.label);
      });

      if (!hasInput) {
        const existingInput = graph
          .getNodes()
          .find((n: GraphNodeWithData) => n.data?.type === 'INPUT');
        if (existingInput) {
          const graphWithSize = graph as unknown as {
            getWidth?: () => number;
            getHeight?: () => number;
            options?: { width?: number; height?: number };
          };
          const width = graphWithSize.getWidth?.() || graphWithSize.options?.width || 800;
          const height = graphWithSize.getHeight?.() || graphWithSize.options?.height || 600;
          existingInput.position(
            width / 2 - nodeStyle.width / 2,
            height / 2 - nodeStyle.height / 2
          );
        }
      }

      data.edges?.forEach((edge: ImportEdgeData) => {
        graph.addEdge({
          source: { cell: edge.source, port: edge.sourcePort },
          target: { cell: edge.target, port: edge.targetPort },
        });
      });
    } catch {
      console.error('Invalid workflow JSON');
    }
  };

  interface NodePort {
    id?: string;
  }

  interface NodeWithPorts {
    getPorts: () => NodePort[];
    portProp: (portId: string, path: string, value: number) => void;
  }

  const handleNodeMouseOver = (node: unknown) => {
    const nodeWithPorts = node as NodeWithPorts;
    const ports = nodeWithPorts.getPorts();
    ports.forEach((port: NodePort) => {
      nodeWithPorts.portProp(port.id || '', 'attrs/circle/r', portInteractionStyles.nodeHover.r);
    });
  };

  const handleNodeMouseOut = (node: unknown) => {
    const nodeWithPorts = node as NodeWithPorts;
    const ports = nodeWithPorts.getPorts();
    ports.forEach((port: NodePort) => {
      nodeWithPorts.portProp(port.id || '', 'attrs/circle/r', portInteractionStyles.default.r);
    });
  };

  return {
    graphRef,
    selectedNode,
    selectedEdge,
    initGraph,
    addNode,
    clearCanvas,
    zoomIn,
    zoomOut,
    resetZoom,
    exportWorkflow,
    importWorkflow,
  };
});
