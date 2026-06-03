import type { Graph, Node, Edge } from '@antv/x6';
import { register } from '@antv/x6-vue-shape';
import { nodeStyle, edgeStyle } from '@/config/workflow/graph-options';
import { portInteractionStyles } from '@/config/workflow/node-registry';
import { useUiStore } from '@/stores/uiStore';
import { useToast } from '@/composables/useToast';
import { isOutputPort, getInputPortId, validateLoopNodeConnection } from '@/utils/connection';
import { COLORS } from '@/config/constants';
import { showStatusMessage } from './helpers';
import { EMBED_PADDING, PASTE_OFFSET } from './constants';
import { isLoopChildNode } from '@/utils/node-utils';
import { throttle, debounce } from '@/utils/throttle';
import WorkflowNode from '@/components/workflow/WorkflowNode.vue';
import LoopNode from '@/components/workflow/LoopNode.vue';

let lastEdgeToastTime = 0;
const EDGE_TOAST_DELAY = 3000;

const THROTTLE_DELAY = 50;
const DEBOUNCE_DELAY = 100;

export function registerNodes(): void {
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
}

export function handleNodeMouseOver(node: Node): void {
  const nodeWithPorts = node as {
    getPorts: () => { id?: string; group?: string }[];
    setPortProp: (portId: string, path: string, value: number) => void;
  };

  const ports = nodeWithPorts.getPorts();
  ports.forEach((port) => {
    if (port.group === 'right' || port.group === 'bottom') {
      nodeWithPorts.setPortProp(port.id || '', 'attrs/circle/r', portInteractionStyles.nodeHover.r);
    }
  });
}

export function handleNodeMouseOut(node: Node): void {
  const nodeWithPorts = node as {
    getPorts: () => { id?: string; group?: string }[];
    setPortProp: (portId: string, path: string, value: number) => void;
  };

  const ports = nodeWithPorts.getPorts();
  ports.forEach((port) => {
    if (port.group === 'right' || port.group === 'bottom') {
      nodeWithPorts.setPortProp(port.id || '', 'attrs/circle/r', portInteractionStyles.default.r);
    }
  });
}

export function highlightEdge(edge: Edge, highlight: boolean): void {
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
        args: { attrs: { fill: COLORS.error } },
      },
      {
        name: 'button-remove',
        args: {
          attrs: {
            body: { fill: COLORS.error, stroke: COLORS.nodeFill, strokeWidth: 2 },
            label: { fill: COLORS.nodeFill },
          },
          distance: -40,
          onClick: () => {
            edgeWithAttrs.remove();
            showStatusMessage(useToast(), '连线已删除');
          },
        },
      },
    ]);
  } else {
    edgeWithAttrs.attr('line/stroke', COLORS.primary);
    edgeWithAttrs.attr('line/strokeWidth', 2);
    edgeWithAttrs.removeTools();
  }
}

export function handlePortClick(
  graphRef: { value: Graph | null },
  uiStore: ReturnType<typeof useUiStore>,
  node: Node,
  e: MouseEvent
): void {
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

  const canvasElement = (graphRef.value as unknown as { container?: HTMLElement })
    ?.container as HTMLElement;
  const rect = canvasElement?.getBoundingClientRect();
  const scale = (graphRef.value as unknown as { getScale?: () => number }).getScale?.() || 1;

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
}

export function handleConnectingEnd(
  uiStore: ReturnType<typeof useUiStore>,
  targetPoint: { x: number; y: number },
  edge: Edge | null
): void {
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
}

export function createNodeAndConnect(
  graphRef: { value: Graph | null },
  uiStore: ReturnType<typeof useUiStore>,
  addNode: (type: string, x: number, y: number, label?: string) => Node | null,
  toast: ReturnType<typeof useToast>,
  nodeType: string
): void {
  const context = uiStore.portClickContext;
  if (!context) return;

  const { sourceNode, sourcePortId, targetPosition } = context;

  const loopParentResult = isLoopChildNode(sourceNode);
  const loopNode = loopParentResult.loopNode;

  let newNode: Node | null;

  if (loopParentResult.isLoopChild && loopNode) {
    const loopPosition = loopNode.position();
    const loopSize = loopNode.size();

    const relativeX = targetPosition.x - loopPosition.x;
    const relativeY = targetPosition.y - loopPosition.y;

    const clampedX = Math.max(20, Math.min(relativeX, loopSize.width - 140));
    const clampedY = Math.max(60, Math.min(relativeY, loopSize.height - 60));

    newNode = addNode(nodeType, loopPosition.x + clampedX, loopPosition.y + clampedY);

    if (newNode && graphRef.value) {
      (loopNode as unknown as { addChild: (node: Node) => void }).addChild(newNode);
    }
  } else {
    newNode = addNode(nodeType, targetPosition.x, targetPosition.y);
  }

  loopNode?.fit({
    padding: {
      top: PASTE_OFFSET,
      bottom: EMBED_PADDING,
      left: EMBED_PADDING,
      right: EMBED_PADDING,
    },
  });
  if (!newNode) {
    uiStore.hideNodePanel();
    return;
  }

  const inputPortId = getInputPortId(sourcePortId);

  const edge = graphRef.value?.addEdge({
    ...edgeStyle,
    source: { cell: sourceNode.id, port: sourcePortId },
    target: { cell: newNode.id, port: inputPortId },
  });

  edge?.toFront();

  uiStore.hideNodePanel();
  showStatusMessage(toast, '节点创建成功');
}

export function bindEvents(
  graphRef: { value: Graph | null },
  _toast: ReturnType<typeof useToast>,
  uiStore: ReturnType<typeof useUiStore>,
  showStatusMessageFn: (message: string, duration?: number) => void,
  ctrlPressedRef?: { value: boolean }
): void {
  if (!graphRef.value) return;

  const ctrlPressed = { value: false };
  const targetCtrlPressed = ctrlPressedRef || ctrlPressed;

  graphRef.value.on('node:embedding', ({ e }: { e: unknown }) => {
    const mouseEvent = e as MouseEvent;
    targetCtrlPressed.value = mouseEvent.metaKey || mouseEvent.ctrlKey;
  });

  graphRef.value.on('node:embedded', ({ node, parent }: { node: Node; parent?: Node }) => {
    targetCtrlPressed.value = false;
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
    debounce(({ node, options }: { node: Node; options: Record<string, unknown> }) => {
      if (options.skipParentHandler) {
        return;
      }

      const children = (node as unknown as { getChildren: () => Node[] }).getChildren?.();
      if (children && children.length) {
        node.prop('originSize', node.getSize());
      }
    }, DEBOUNCE_DELAY)
  );

  const positionHandler = debounce(
    ({ node, options }: { node: Node; options: Record<string, unknown> }) => {
      if (options.skipParentHandler || targetCtrlPressed.value) {
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
            const bbox = (child as unknown as { getBBox: () => unknown }).getBBox?.();
            if (!bbox) return;

            const inflatedBBox = (
              bbox as unknown as { inflate: (padding: number) => unknown }
            ).inflate(EMBED_PADDING);
            const corner = (
              inflatedBBox as unknown as { getCorner: () => { x: number; y: number } }
            ).getCorner();

            if ((inflatedBBox as unknown as { x: number }).x < x) {
              x = (inflatedBBox as unknown as { x: number }).x;
              hasChange = true;
            }

            if ((inflatedBBox as unknown as { y: number }).y - PASTE_OFFSET < y) {
              y = (inflatedBBox as unknown as { y: number }).y - PASTE_OFFSET;
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
            { position: { x, y }, size: { width: cornerX - x, height: cornerY - y } },
            { skipParentHandler: true }
          );
        }
      }
    },
    DEBOUNCE_DELAY
  );

  graphRef.value.on('node:change:position', positionHandler);

  graphRef.value.on('node:mousedown', ({ node }: { node: Node }) => {
    node.toFront();
  });

  graphRef.value.on('node:change:zIndex', ({ node, current }: { node: Node; current: number }) => {
    const nodeData = node.getData();
    if (nodeData?.type === 'LOOP') {
      const children = (node as unknown as { getChildren: () => Node[] }).getChildren?.();
      if (children) {
        children.forEach((child) => {
          child.setZIndex(current + 1);
        });
      }
    }
  });

  graphRef.value.on(
    'edge:mouseenter',
    throttle(({ edge }: { edge: Edge }) => {
      highlightEdge(edge, true);
    }, THROTTLE_DELAY)
  );

  graphRef.value.on(
    'edge:mouseleave',
    throttle(({ edge }: { edge: Edge }) => {
      highlightEdge(edge, false);
    }, THROTTLE_DELAY)
  );

  graphRef.value.on(
    'node:mouseover',
    throttle(({ node }: { node: Node }) => {
      handleNodeMouseOver(node);
    }, THROTTLE_DELAY)
  );

  graphRef.value.on(
    'node:mouseout',
    throttle(({ node }: { node: Node }) => {
      handleNodeMouseOut(node);
    }, THROTTLE_DELAY)
  );

  graphRef.value.on('connecting:start', () => {
    showStatusMessageFn('从输出桩（绿色）拖动到输入桩（蓝色）', 3000);
  });

  graphRef.value.on('edge:connected', () => {
    showStatusMessageFn('连线创建成功');
  });

  graphRef.value.on('node:click', ({ node, e }: { node: Node; e: MouseEvent }) => {
    handlePortClick(graphRef, uiStore, node, e);
  });

  graphRef.value.on(
    'edge:change:target',
    throttle(({ edge }: { edge: Edge }) => {
      const sourceCell = edge.getSourceCell();
      const targetCell = edge.getTargetCell();

      if (sourceCell && targetCell && sourceCell.isNode() && targetCell.isNode()) {
        const result = validateLoopNodeConnection(sourceCell, targetCell);
        if (!result.valid) {
          const now = Date.now();
          if (now - lastEdgeToastTime > EDGE_TOAST_DELAY) {
            _toast.warning(result.reason);
            lastEdgeToastTime = now;
          }
          edge.remove();
        }
      }
    }, THROTTLE_DELAY)
  );

  graphRef.value.on(
    'edge:change:source',
    throttle(({ edge }: { edge: Edge }) => {
      const sourceCell = edge.getSourceCell();
      const targetCell = edge.getTargetCell();

      if (sourceCell && targetCell && sourceCell.isNode() && targetCell.isNode()) {
        const result = validateLoopNodeConnection(sourceCell, targetCell);
        if (!result.valid) {
          const now = Date.now();
          if (now - lastEdgeToastTime > EDGE_TOAST_DELAY) {
            _toast.warning(result.reason);
            lastEdgeToastTime = now;
          }
          edge.remove();
        }
      }
    }, THROTTLE_DELAY)
  );
}
