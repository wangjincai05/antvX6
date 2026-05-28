import { defineStore } from 'pinia';
import { ref, type Ref } from 'vue';
import { Graph, Edge, Node, Selection } from '@antv/x6';
import { register } from '@antv/x6-vue-shape';
import { defaultGraphOptions, nodeStyle, edgeStyle } from '@/config/workflow/graph-options';
import { nodeRegistry, portGroups, portInteractionStyles } from '@/config/workflow/node-registry';
import { useSelectionStore } from './selectionStore';
import { useHistoryStore } from './historyStore';
import { useKeyboardStore } from './keyboardStore';
import { validateConnection } from '@/utils/connection';
import type { NodeData, EdgeData, CellWithData, GraphNode } from '@/types';
import WorkflowNode from '@/components/workflow/WorkflowNode.vue';
import { COLORS } from '@/config/constants';

export const useGraphStore = defineStore('graph', () => {
  const graphRef: Ref<Graph | null> = ref(null);
  const statusMessage: Ref<string | null> = ref(null);

  const selectionStore = useSelectionStore();
  const historyStore = useHistoryStore();
  const keyboardStore = useKeyboardStore();

  const showStatusMessage = (message: string, duration: number = 2000) => {
    statusMessage.value = message;
    setTimeout(() => {
      if (statusMessage.value === message) {
        statusMessage.value = null;
      }
    }, duration);
  };

  const initGraph = (container: HTMLElement) => {
    register({
      shape: 'workflow-node',
      width: nodeStyle.width,
      height: nodeStyle.height,
      component: WorkflowNode,
    });

    interface GraphOptions {
      container: HTMLElement;
      width: number;
      height: number;
      panning: boolean;
      connecting: {
        createEdge?: () => Edge;
        validateConnection?: (params: {
          sourceCell: unknown;
          targetCell: unknown;
          sourceMagnet: unknown;
          targetMagnet: unknown;
        }) => boolean;
      } & Record<string, unknown>;
    }

    const options: GraphOptions = {
      ...(defaultGraphOptions as Record<string, unknown>),
      container,
      width: container.offsetWidth,
      height: container.offsetHeight,
      panning: true,
      connecting: {
        ...(defaultGraphOptions.connecting as Record<string, unknown>),
        createEdge() {
          return graphRef.value!.createEdge({
            ...edgeStyle,
          });
        },
        validateMagnet(
          this: Graph,
          { magnet }: { magnet: { getAttribute: (name: string) => string | null } }
        ) {
          const portGroup = magnet.getAttribute('port-group');
          return !['left', 'top'].includes(portGroup || '');
        },
        validateConnection({ sourceCell, targetCell, sourceMagnet, targetMagnet }) {
          const result = validateConnection(
            sourceCell,
            targetCell,
            sourceMagnet,
            targetMagnet,
            graphRef.value!
          );
          return result.valid;
        },
      },
    };

    graphRef.value = new Graph(options as unknown as ConstructorParameters<typeof Graph>[0]);

    graphRef.value.use(
      new Selection({
        enabled: true,
        multiple: true,
        rubberband: true,
        rubberNode: true,
        rubberEdge: false,
        modifiers: 'shift',
        strict: false,
        movable: true,
        showNodeSelectionBox: true,
      })
    );

    keyboardStore.bindKeyboardPlugin(graphRef.value);
    historyStore.bindHistoryPlugin(graphRef.value);
    selectionStore.bindSelectionEvents(graphRef.value);

    graphRef.value.on('edge:mouseenter', ({ edge }: { edge: Edge }) => {
      highlightEdge(edge, true);
    });

    graphRef.value.on('edge:mouseleave', ({ edge }: { edge: Edge }) => {
      highlightEdge(edge, false);
    });

    graphRef.value.on('node:mouseover', ({ node }: { node: Node }) => {
      handleNodeMouseOver(node);
    });

    graphRef.value.on('node:mouseout', ({ node }: { node: Node }) => {
      handleNodeMouseOut(node);
    });

    graphRef.value.on('connecting:start', () => {
      showStatusMessage('从输出桩（绿色）拖动到输入桩（蓝色）', 3000);
    });

    graphRef.value.on('edge:connected', () => {
      showStatusMessage('连线创建成功');
    });

    const width =
      (graphRef.value as unknown as { getWidth?: () => number }).getWidth?.() ||
      container.offsetWidth;
    const height =
      (graphRef.value as unknown as { getHeight?: () => number }).getHeight?.() ||
      container.offsetHeight;
    addNode('INPUT', width / 2 - nodeStyle.width / 2, height / 2 - nodeStyle.height / 2);

    keyboardStore.bindAllShortcuts(graphRef.value, showStatusMessage);
    historyStore.bindHistoryShortcuts(graphRef.value, showStatusMessage);

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
          stroke: COLORS.primary,
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
    selectionStore.clearSelection();
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

    const edges: EdgeData[] = graphRef.value.getEdges().map((edge) => ({
      id: edge.id,
      source: edge.getSourceCellId()!,
      target: edge.getTargetCellId()!,
      sourcePort: edge.getSourcePortId?.(),
      targetPort: edge.getTargetPortId?.(),
    }));

    return JSON.stringify({ nodes, edges }, null, 2);
  };

  interface ImportNodeData {
    type: string;
    properties?: { position?: { x: number; y: number } };
    label?: string;
  }

  interface ImportWorkflowData {
    nodes?: ImportNodeData[];
    edges?: { source: string; target: string; sourcePort?: string; targetPort?: string }[];
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
        const existingInput = graph.getNodes().find((n: GraphNode) => n.data?.type === 'INPUT');
        if (existingInput) {
          const graphWithSize = graph as unknown as {
            getWidth?: () => number;
            getHeight?: () => number;
            options?: { width?: number; height?: number };
          };
          const width = graphWithSize.getWidth?.() || graphWithSize.options?.width || 800;
          const height = graphWithSize.getHeight?.() || graphWithSize.options?.height || 600;
          (existingInput as unknown as { position: (x: number, y: number) => void }).position(
            width / 2 - nodeStyle.width / 2,
            height / 2 - nodeStyle.height / 2
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
      console.error('Invalid workflow JSON');
    }
  };

  interface NodePort {
    id?: string;
    group?: string;
  }

  const handleNodeMouseOver = (node: unknown) => {
    const nodeWithPorts = node as {
      getPorts: () => NodePort[];
      setPortProp: (portId: string, path: string, value: number) => void;
    };
    const ports = nodeWithPorts.getPorts();
    ports.forEach((port: NodePort) => {
      if (port.group === 'right' || port.group === 'bottom') {
        nodeWithPorts.setPortProp(
          port.id || '',
          'attrs/circle/r',
          portInteractionStyles.nodeHover.r
        );
      }
    });
  };

  const handleNodeMouseOut = (node: unknown) => {
    const nodeWithPorts = node as {
      getPorts: () => NodePort[];
      setPortProp: (portId: string, path: string, value: number) => void;
    };
    const ports = nodeWithPorts.getPorts();
    ports.forEach((port: NodePort) => {
      if (port.group === 'right' || port.group === 'bottom') {
        nodeWithPorts.setPortProp(port.id || '', 'attrs/circle/r', portInteractionStyles.default.r);
      }
    });
  };

  const highlightEdge = (edge: Edge, highlight: boolean) => {
    const edgeWithAttrs = edge as unknown as {
      setAttrs: (attrs: Record<string, unknown>) => void;
      attr: (path: string, value?: unknown) => unknown;
      remove: () => void;
      addTools: (tools: unknown[]) => void;
      removeTools: () => void;
    };

    if (highlight) {
      edgeWithAttrs.attr('line/stroke', COLORS.error);
      edgeWithAttrs.attr('line/strokeWidth', 3);

      edgeWithAttrs.addTools([
        {
          name: 'target-arrowhead',
          args: {
            attrs: {
              fill: COLORS.error,
            },
          },
        },
        {
          name: 'button-remove',
          args: {
            attrs: {
              body: {
                fill: COLORS.error,
                stroke: COLORS.nodeFill,
                strokeWidth: 2,
              },
              label: {
                fill: COLORS.nodeFill,
              },
            },
            distance: -40,
            onClick: () => {
              edge.remove();
              showStatusMessage('连线已删除');
            },
          },
        },
      ]);
    } else {
      edgeWithAttrs.attr('line/stroke', COLORS.primary);
      edgeWithAttrs.attr('line/strokeWidth', 2);
      edgeWithAttrs.removeTools();
    }
  };

  const updateNodeLabel = (nodeId: string, label: string) => {
    if (!graphRef.value) return;
    const node = graphRef.value.getCellById(nodeId);
    if (node) {
      node.attr('label/text', label);
      showStatusMessage('节点名称已更新');
    }
  };

  const updateNodeProperty = (nodeId: string, key: string, value: unknown) => {
    if (!graphRef.value) return;
    const node = graphRef.value.getCellById(nodeId);
    if (node) {
      const currentData = node.getData?.() || {};
      const newData = {
        ...currentData,
        properties: {
          ...currentData.properties,
          [key]: value,
        },
      };
      node.setData(newData);
      showStatusMessage(`属性 "${key}" 已更新`);
    }
  };

  const getNodeProperties = (nodeId: string): Record<string, unknown> => {
    if (!graphRef.value) return {};
    const node = graphRef.value.getCellById(nodeId);
    return node?.getData?.()?.properties || {};
  };

  return {
    graphRef,
    statusMessage,
    selectionStore,
    historyStore,
    keyboardStore,
    initGraph,
    addNode,
    clearCanvas,
    zoomIn,
    zoomOut,
    resetZoom,
    exportWorkflow,
    importWorkflow,
    showStatusMessage,
    updateNodeLabel,
    updateNodeProperty,
    getNodeProperties,
    handleNodeMouseOver,
    handleNodeMouseOut,
  };
});
