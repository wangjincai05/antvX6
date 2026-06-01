import { defineStore } from 'pinia';
import { ref, type Ref } from 'vue';
import {
  Graph,
  Edge,
  Node,
  Selection,
  ValidateConnectionArgs,
  Clipboard,
  Cell,
  NodeView,
  CellView,
} from '@antv/x6';
import { register } from '@antv/x6-vue-shape';
import { defaultGraphOptions, nodeStyle, edgeStyle } from '@/config/workflow/graph-options';
import { nodeRegistry, portGroups, portInteractionStyles } from '@/config/workflow/node-registry';
import { useSelectionStore } from './selectionStore';
import { useHistoryStore } from './historyStore';
import { useKeyboardStore } from './keyboardStore';
import { useUiStore } from './uiStore';
import { validateConnection, isOutputPort, getInputPortId } from '@/utils/connection';
import type { NodeData, EdgeData, CellWithData, GraphNode } from '@/types';
import WorkflowNode from '@/components/workflow/WorkflowNode.vue';
import LoopNode from '@/components/workflow/LoopNode.vue';
import { COLORS } from '@/config/constants';
import { useToast } from '@/composables/useToast';

interface EmbeddingValidateArgs {
  child: Node;
  parent: Node;
  childView: CellView;
  parentView: CellView;
}

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
    allowBlank?: (this: Graph, args: ValidateConnectionArgs) => boolean;
  } & Record<string, unknown>;
  embedding: {
    validate?: (this: Graph, args: EmbeddingValidateArgs) => boolean;
  } & Record<string, unknown>;
}

export const useGraphStore = defineStore('graph', () => {
  const graphRef: Ref<Graph | null> = ref(null);

  const selectionStore = useSelectionStore();
  const historyStore = useHistoryStore();
  const keyboardStore = useKeyboardStore();
  const uiStore = useUiStore();
  const toast = useToast();

  const showStatusMessage = (message: string, duration: number = 2000) => {
    if (!message || typeof message !== 'string') {
      console.warn('showStatusMessage: invalid message parameter');
      return;
    }

    if (typeof duration !== 'number' || duration < 0) {
      console.warn('showStatusMessage: invalid duration parameter, using default 2000ms');
      duration = 2000;
    }

    toast.info(message, { duration });
  };

  const initGraph = (container: HTMLElement) => {
    register({
      shape: 'workflow-node',
      width: nodeStyle.width,
      height: nodeStyle.height,
      component: WorkflowNode,
    });

    register({
      shape: 'loop-node',
      width: 200,
      height: 120,
      component: LoopNode,
      isGroup: true,
    });

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
        allowBlank(this: Graph, args: ValidateConnectionArgs) {
          const { edge, edgeView } = args;
          if (!edge) return false;
          handleConnectingEnd(edgeView?.targetPoint || { x: 0, y: 0 }, edge);
          return true;
        },
      },
      embedding: {
        enabled: true,
        findParent(this: Graph, args: { node: Node; view: NodeView }): Cell[] {
          const { node } = args;
          const bbox = node.getBBox();
          return this.getNodes().filter((node) => {
            const data = node.getData();
            if (data && data.type === 'LOOP') {
              const targetBBox = node.getBBox();
              return bbox.isIntersectWithRect(targetBBox);
            }
            return false;
          });
        },
        validate(this: Graph, args: EmbeddingValidateArgs) {
          const { child } = args;
          const data = child.getData();
          // 1. 首先检查节点类型限制
          const forbiddenComponents = ['LOOP', 'INPUT'];
          if (forbiddenComponents.includes(data.type || '')) {
            return false;
          }

          // 2. 获取当前画布中的顶层节点
          const topLevelNodes = this.getNodes().filter((item) => !item.parent);

          // 3. 检查节点是否已存在于画布中
          const isExistingNode = topLevelNodes.some((item) => item.id === child.id);

          // 4. 如果是新节点(不存在于画布中)，直接允许嵌入
          if (!isExistingNode) {
            return true;
          }

          // 5. 对于已存在的节点，需要满足：
          // - 节点当前不在其他父节点中
          // - 按住了ctrl键
          // - 没有连接的边
          if (!child.parent) {
            const hasNoConnectedEdges = this.getConnectedEdges(child).length === 0;
            return hasNoConnectedEdges && ctrlPressed;
          }

          return false;
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
      new Clipboard({
        enabled: true,
      })
    );

    keyboardStore.bindKeyboardPlugin(graphRef.value);
    historyStore.bindHistoryPlugin(graphRef.value);
    selectionStore.bindSelectionEvents(graphRef.value);

    let ctrlPressed = false;
    const embedPadding = 5;

    graphRef.value.on('node:embedding', ({ e }: { e: unknown }) => {
      const mouseEvent = e as MouseEvent;
      ctrlPressed = mouseEvent.metaKey || mouseEvent.ctrlKey;
    });

    graphRef.value.on('node:embedded', ({ node, parent }: { node: Node; parent?: Node }) => {
      ctrlPressed = false;
      // 确保循环节点的子节点 zIndex 高于循环节点
      if (parent) {
        const parentData = parent.getData();
        if (parentData?.type === 'LOOP') {
          const parentZIndex = parent.getZIndex() || 0;
          node.setZIndex(parentZIndex + 1);
        }
      }
    });

    graphRef.value.on(
      'node:change:size',
      ({ node, options }: { node: Node; options: Record<string, unknown> }) => {
        if (options.skipParentHandler) {
          return;
        }

        const children = (node as unknown as { getChildren: () => Node[] }).getChildren?.();
        if (children && children.length) {
          node.prop('originSize', node.getSize());
        }
      }
    );

    graphRef.value.on(
      'node:change:position',
      ({ node, options }: { node: Node; options: Record<string, unknown> }) => {
        if (options.skipParentHandler || ctrlPressed) {
          return;
        }
        if (!node.isVisible()) return;
        const children = (node as unknown as { getChildren: () => Node[] }).getChildren?.();
        if (children && children.length) {
          node.prop('originPosition', node.getPosition());
        }
        const parent = (node as unknown as { getParent: () => unknown }).getParent?.();
        if (parent && (parent as unknown as { isNode: () => boolean }).isNode?.()) {
          const parentNode = parent as Node;
          let originSize = parentNode.prop('originSize') as { width: number; height: number };
          if (originSize == null) {
            originSize = parentNode.getSize();
            parentNode.prop('originSize', originSize);
          }

          let originPosition = parentNode.prop('originPosition') as { x: number; y: number };
          if (originPosition == null) {
            originPosition = parentNode.getPosition();
            parentNode.prop('originPosition', originPosition);
          }

          let x = originPosition.x;
          let y = originPosition.y;
          let cornerX = originPosition.x + originSize.width;
          let cornerY = originPosition.y + originSize.height;
          let hasChange = false;

          const parentChildren = (
            parentNode as unknown as { getChildren: () => Node[] }
          ).getChildren?.();
          if (parentChildren) {
            parentChildren.forEach((child) => {
              const bbox = (
                child as unknown as {
                  getBBox: () => {
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                    inflate: (padding: number) => unknown;
                    getCorner: () => { x: number; y: number };
                  };
                }
              ).getBBox?.();
              if (!bbox) return;

              const inflatedBBox = (
                bbox as unknown as {
                  inflate: (padding: number) => {
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                    getCorner: () => { x: number; y: number };
                  };
                }
              ).inflate(embedPadding);
              const corner = inflatedBBox.getCorner();

              if (inflatedBBox.x < x) {
                x = inflatedBBox.x;
                hasChange = true;
              }

              if (inflatedBBox.y < y) {
                y = inflatedBBox.y;
                hasChange = true;
              }

              if (corner.x > cornerX) {
                cornerX = corner.x;
                hasChange = true;
              }

              if (corner.y > cornerY) {
                cornerY = corner.y;
                hasChange = true;
              }
            });
          }

          if (hasChange) {
            parentNode.prop(
              {
                position: { x, y },
                size: { width: cornerX - x, height: cornerY - y },
              },
              { skipParentHandler: true }
            );
          }
        }
      }
    );

    // 监听循环节点 zIndex 变化，同步更新子节点
    graphRef.value.on(
      'node:change:zIndex',
      ({ node, current }: { node: Node; current: number }) => {
        const nodeData = node.getData();
        if (nodeData?.type === 'LOOP') {
          const children = (node as unknown as { getChildren: () => Node[] }).getChildren?.();
          if (children) {
            children.forEach((child) => {
              child.setZIndex(current + 1);
            });
          }
        }
      }
    );

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

    graphRef.value.on('node:click', ({ node, e }: { node: Node; e: MouseEvent }) => {
      handlePortClick(node, e);
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

    graphRef.value.cleanHistory();

    return graphRef.value;
  };

  const addNode = (type: string, x: number, y: number, label?: string) => {
    if (!graphRef.value) return null;

    const config = nodeRegistry[type];
    if (!config) return null;

    const isLoopNode = type === 'LOOP';
    const nodeConfig = getNodeConfig(type, label || config.name);

    // 获取当前最大的 zIndex，确保新节点在最上层
    const nodes = graphRef.value.getNodes();
    let maxZIndex = 0;
    nodes.forEach((n) => {
      const zIndex = n.getZIndex() || 0;
      if (zIndex > maxZIndex) {
        maxZIndex = zIndex;
      }
    });

    const cell = {
      ...nodeConfig,
      x,
      y,
      isGroup: isLoopNode,
      zIndex: maxZIndex + 1,
    };
    const node = graphRef.value.addNode(cell);
    return node;
  };

  const getNodeConfig = (type: string, label: string) => {
    const config = nodeRegistry[type];
    if (!config) return {};

    const isLoopNode = type === 'LOOP';

    return {
      shape: isLoopNode ? 'loop-node' : 'workflow-node',
      width: isLoopNode ? 200 : nodeStyle.width,
      height: isLoopNode ? 120 : nodeStyle.height,
      label,
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
    };
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
      const currentData = node.getData?.() || {};
      node.setData({ ...currentData, label });
      showStatusMessage('节点名称已更新');
    }
  };

  const updateNodeDescription = (nodeId: string, description: string) => {
    if (!graphRef.value) return;
    const node = graphRef.value.getCellById(nodeId);
    if (node) {
      const currentData = node.getData?.() || {};
      node.setData({ ...currentData, description });
      showStatusMessage('节点描述已更新');
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

  const handlePortClick = (node: Node, e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const portElement = target.closest('[port-group]');
    if (!portElement) return;

    const portGroup = portElement.getAttribute('port-group');
    if (!isOutputPort(portGroup)) return;

    const portId = portElement.getAttribute('port');
    if (!portId) return;

    const nodePosition = node.position();
    const nodeSize = node.size();
    let panelX = nodePosition.x;
    let panelY = nodePosition.y;

    if (portGroup === 'right') {
      panelX = nodePosition.x + nodeSize.width;
      panelY = nodePosition.y + nodeSize.height / 2;
    } else if (portGroup === 'bottom') {
      panelX = nodePosition.x + nodeSize.width / 2;
      panelY = nodePosition.y + nodeSize.height;
    }

    const canvasElement = graphRef.value?.container as HTMLElement;
    const rect = canvasElement?.getBoundingClientRect();
    const scale = (graphRef.value as unknown as { getScale: () => number }).getScale?.() || 1;

    const viewportX = (rect?.left || 0) + panelX * scale;
    const viewportY = (rect?.top || 0) + panelY * scale;

    uiStore.showNodePanel(
      { x: viewportX, y: viewportY },
      {
        sourceNode: node,
        sourcePortId: portId,
        targetPosition: { x: panelX + 150, y: panelY - nodeStyle.height / 2 },
      }
    );
  };

  const handleConnectingEnd = (targetPoint: { x: number; y: number }, edge: Edge | null) => {
    if (!edge) return;

    const sourceCell = edge.getSourceCell();
    const sourcePortId = edge.getSourcePortId?.();

    if (!sourceCell || !sourcePortId) {
      edge.remove();
      return;
    }

    const targetCell = edge.getTargetCell();
    if (targetCell) {
      return;
    }

    edge.remove();

    uiStore.showNodePanel(targetPoint, {
      sourceNode: sourceCell as Node,
      sourcePortId,
      targetPosition: targetPoint,
    });
  };

  const createNodeAndConnect = (nodeType: string) => {
    const context = uiStore.portClickContext;
    if (!context) return;

    const { sourceNode, sourcePortId, targetPosition } = context;

    const newNode = addNode(nodeType, targetPosition.x, targetPosition.y);
    if (!newNode) {
      uiStore.hideNodePanel();
      return;
    }

    const targetPortId = getInputPortId(sourcePortId);

    graphRef.value?.addEdge({
      ...edgeStyle,
      source: { cell: sourceNode.id, port: sourcePortId },
      target: { cell: newNode.id, port: targetPortId },
    });

    uiStore.hideNodePanel();
    showStatusMessage('节点创建成功');
  };

  return {
    graphRef,
    selectionStore,
    historyStore,
    keyboardStore,
    initGraph,
    addNode,
    getNodeConfig,
    clearCanvas,
    zoomIn,
    zoomOut,
    resetZoom,
    exportWorkflow,
    importWorkflow,
    showStatusMessage,
    updateNodeLabel,
    updateNodeDescription,
    updateNodeProperty,
    getNodeProperties,
    handleNodeMouseOver,
    handleNodeMouseOut,
    handlePortClick,
    handleConnectingEnd,
    createNodeAndConnect,
  };
});
