import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Graph, Node, Edge, Selection, History, Keyboard } from '@antv/x6';
import { register } from '@antv/x6-vue-shape';
import { defaultGraphOptions, nodeStyle, edgeStyle } from '@/config/workflow/graph-options';
import { nodeRegistry, portGroups, portInteractionStyles } from '@/config/workflow/node-registry';
import type { NodeData, EdgeData } from '@/types/workflow';
import WorkflowNode from '@/components/workflow/WorkflowNode.vue';
import { validateConnection } from '@/utils/connection';

export const useGraphStore = defineStore('graph', () => {
  const graphRef = ref<Graph | null>(null);
  const selectedNode = ref<Node | null>(null);
  const selectedEdge = ref<Edge | null>(null);
  const statusMessage = ref<string | null>(null);
  const keyboardEnabled = ref(true);

  interface CellData {
    type?: string;
  }

  interface CellWithData {
    data?: CellData;
    remove?: () => void;
  }

  const showStatusMessage = (message: string, duration: number = 2000) => {
    statusMessage.value = message;
    setTimeout(() => {
      if (statusMessage.value === message) {
        statusMessage.value = null;
      }
    }, duration);
  };

  const enableKeyboard = () => {
    keyboardEnabled.value = true;
    graphRef.value?.enableKeyboard();
  };

  const disableKeyboard = () => {
    keyboardEnabled.value = false;
    graphRef.value?.disableKeyboard();
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
          // 返回值来判断是否新增边,true 新增，false 否
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

    graphRef.value.use(
      new Keyboard({
        enabled: true,
        guard(this: Graph, e: KeyboardEvent) {
          const target = e.target as HTMLElement;
          const isInput =
            target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
          return !isInput && keyboardEnabled.value;
        },
      })
    );

    graphRef.value.use(
      new History({
        enabled: true,
        beforeAddCommand(event, args) {
          if (!args) return true;
          const arg = args as { key?: string };
          if (arg.key && ['tools', 'attrs', 'ports', 'labels', 'zIndex'].includes(arg.key)) {
            return false;
          }
          return true;
        },
      })
    );

    graphRef.value.on('node:click', ({ node }: { node: Node }) => {
      node.toFront();
      selectedNode.value = node;
      selectedEdge.value = null;
    });

    graphRef.value.on('edge:click', ({ edge }: { edge: Edge }) => {
      selectedEdge.value = edge;
      selectedNode.value = null;
    });

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

    graphRef.value.on('blank:click', () => {
      selectedNode.value = null;
      selectedEdge.value = null;
    });

    graphRef.value.on('connecting:start', () => {
      showStatusMessage('从输出桩（绿色）拖动到输入桩（蓝色）', 3000);
    });

    graphRef.value.on('edge:connected', ({ edge }) => {
      showStatusMessage('连线创建成功');
    });

    const width =
      (graphRef.value as unknown as { getWidth?: () => number }).getWidth?.() ||
      container.offsetWidth;
    const height =
      (graphRef.value as unknown as { getHeight?: () => number }).getHeight?.() ||
      container.offsetHeight;
    addNode('INPUT', width / 2 - nodeStyle.width / 2, height / 2 - nodeStyle.height / 2);

    graphRef.value.bindKey('del', (e) => {
      e.preventDefault();
      const selected = graphRef.value!.getSelectedCells();
      const toRemove = selected.filter((cell: CellWithData) => cell.data?.type !== 'INPUT');
      if (toRemove.length > 0) {
        graphRef.value!.removeCells(
          toRemove as unknown as Parameters<typeof graphRef.value.removeCells>[0]
        );
        showStatusMessage(`已删除 ${toRemove.length} 个节点`);
      } else {
        showStatusMessage('未选择任何节点');
      }
    });

    graphRef.value.bindKey('backspace', (e) => {
      e.preventDefault();
      const selected = graphRef.value!.getSelectedCells();
      const toRemove = selected.filter((cell: CellWithData) => cell.data?.type !== 'INPUT');
      if (toRemove.length > 0) {
        graphRef.value!.removeCells(
          toRemove as unknown as Parameters<typeof graphRef.value.removeCells>[0]
        );
        showStatusMessage(`已删除 ${toRemove.length} 个节点`);
      } else {
        showStatusMessage('未选择任何节点');
      }
    });

    graphRef.value.bindKey(['ctrl+z', 'meta+z'], (e) => {
      e.preventDefault();
      const graph = graphRef.value!;
      const history = graph as unknown as { canUndo: () => boolean; undo: () => void };
      if (history.canUndo()) {
        history.undo();
        showStatusMessage('已撤销');
      } else {
        showStatusMessage('无可撤销操作');
      }
    });

    graphRef.value.bindKey(['ctrl+shift+z', 'ctrl+y', 'meta+shift+z', 'meta+y'], (e) => {
      e.preventDefault();
      const graph = graphRef.value!;
      const history = graph as unknown as { canRedo: () => boolean; redo: () => void };
      if (history.canRedo()) {
        history.redo();
        showStatusMessage('已恢复');
      } else {
        showStatusMessage('无可恢复操作');
      }
    });

    graphRef.value.bindKey(['ctrl++', 'ctrl+='], (e) => {
      e.preventDefault();
      const graph = graphRef.value!;
      const currentScale = (graph as unknown as { getScale: () => number }).getScale();
      const zoomGraph = graph as unknown as { zoomTo: (scale: number) => void };
      if (currentScale < 2) {
        const newScale = Math.min(currentScale * 1.2, 2);
        zoomGraph.zoomTo(newScale);
        showStatusMessage(`缩放: ${Math.round(newScale * 100)}%`);
      } else {
        showStatusMessage('已达到最大缩放比例');
      }
    });

    graphRef.value.bindKey(['ctrl+-'], (e) => {
      e.preventDefault();
      const graph = graphRef.value!;
      const currentScale = (graph as unknown as { getScale: () => number }).getScale();
      const zoomGraph = graph as unknown as { zoomTo: (scale: number) => void };
      if (currentScale > 0.2) {
        const newScale = Math.max(currentScale * 0.8, 0.2);
        zoomGraph.zoomTo(newScale);
        showStatusMessage(`缩放: ${Math.round(newScale * 100)}%`);
      } else {
        showStatusMessage('已达到最小缩放比例');
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

  interface NodeWithPorts {
    getPorts: () => NodePort[];
    setPortProp: (portId: string, path: string, value: number) => void;
  }

  interface NodePort {
    id?: string;
    group?: string;
  }

  const handleNodeMouseOver = (node: unknown) => {
    const nodeWithPorts = node as NodeWithPorts;
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
    const nodeWithPorts = node as NodeWithPorts;
    const ports = nodeWithPorts.getPorts();
    ports.forEach((port: NodePort) => {
      if (port.group === 'right' || port.group === 'bottom') {
        nodeWithPorts.setPortProp(port.id || '', 'attrs/circle/r', portInteractionStyles.default.r);
      }
    });
  };

  interface EdgeWithAttrs {
    setAttrs: (attrs: Record<string, unknown>) => void;
    attr: (path: string, value?: unknown) => unknown;
    remove: () => void;
    isHighlighted?: boolean;
    addTools: (tools: unknown[]) => void;
    removeTools: () => void;
  }

  const highlightEdge = (edge: Edge, highlight: boolean) => {
    const edgeWithAttrs = edge as unknown as EdgeWithAttrs;

    if (highlight) {
      edgeWithAttrs.attr('line/stroke', '#ff4d4f');
      edgeWithAttrs.attr('line/strokeWidth', 3);

      edgeWithAttrs.addTools([
        {
          name: 'target-arrowhead',
          args: {
            attrs: {
              fill: '#ff4d4f',
            },
          },
        },
        {
          name: 'button-remove',
          args: {
            attrs: {
              body: {
                fill: '#ff4d4f',
                stroke: '#fff',
                strokeWidth: 2,
              },
              label: {
                fill: '#fff',
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
      edgeWithAttrs.attr('line/stroke', '#5f95ff');
      edgeWithAttrs.attr('line/strokeWidth', 2);
      edgeWithAttrs.removeTools();
    }
  };

  return {
    graphRef,
    selectedNode,
    selectedEdge,
    statusMessage,
    keyboardEnabled,
    initGraph,
    addNode,
    clearCanvas,
    zoomIn,
    zoomOut,
    resetZoom,
    exportWorkflow,
    importWorkflow,
    showStatusMessage,
    enableKeyboard,
    disableKeyboard,
  };
});
