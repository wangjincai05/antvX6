import type { Graph, Edge, Node, Cell } from '@antv/x6';
import { Graph as X6Graph, Selection, Clipboard } from '@antv/x6';
import { defaultGraphOptions, nodeStyle, edgeStyle } from '@/config/workflow/graph-options';
import { useKeyboardStore } from '@/stores/keyboardStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useSelectionStore } from '@/stores/selectionStore';
import { useUiStore } from '@/stores/uiStore';
import { validateConnection } from '@/utils/connection';
import { registerNodes, bindEvents, handleConnectingEnd } from './events';
import { addNode } from './node-operations';
import { useToast } from '@/composables/useToast';
import { showStatusMessage } from './helpers';

let lastToastTime = 0;
const TOAST_DELAY = 3000;

export function initGraph(
  container: HTMLElement,
  graphRef: { value: Graph | null },
  toast: ReturnType<typeof useToast>
): Graph {
  registerNodes();

  const selectionStore = useSelectionStore();
  const historyStore = useHistoryStore();
  const keyboardStore = useKeyboardStore();

  const ctrlPressed = { value: false };

  const options = {
    ...(defaultGraphOptions as Record<string, unknown>),
    container,
    width: container.offsetWidth,
    height: container.offsetHeight,
    panning: true,
    connecting: {
      ...(defaultGraphOptions.connecting as Record<string, unknown>),
      createEdge() {
        return graphRef.value!.createEdge(edgeStyle);
      },
      validateMagnet(
        this: Graph,
        { magnet }: { magnet: { getAttribute: (name: string) => string | null } }
      ) {
        const portGroup = magnet.getAttribute('port-group');
        return !['left', 'top'].includes(portGroup || '');
      },
      validateConnection({
        sourceCell,
        targetCell,
        sourceMagnet,
        targetMagnet,
      }: {
        sourceCell: unknown;
        targetCell: unknown;
        sourceMagnet: unknown;
        targetMagnet: unknown;
      }) {
        const result = validateConnection(
          sourceCell,
          targetCell,
          sourceMagnet,
          targetMagnet,
          graphRef.value!
        );
        if (!result.valid && result.reason) {
          const now = Date.now();
          if (now - lastToastTime > TOAST_DELAY) {
            toast.warning(result.reason);
            lastToastTime = now;
          }
        }
        return result.valid;
      },
      allowBlank(this: Graph, args: unknown) {
        const { edge, edgeView } = args as {
          edge: Edge;
          edgeView?: { targetPoint?: { x: number; y: number } };
        };
        if (!edge) return false;
        handleConnectingEnd(uiStore, edgeView?.targetPoint || { x: 0, y: 0 }, edge);
        return true;
      },
    },
    embedding: {
      enabled: true,
      findParent(this: Graph, args: { node: Node; view: unknown }): Cell[] {
        const { node } = args;
        const bbox = node.getBBox();
        return this.getNodes().filter((n) => {
          const data = n.getData();
          if (data && data.type === 'LOOP') {
            if (data.collapsed === true) {
              return false;
            }
            const targetBBox = n.getBBox();
            return bbox.isIntersectWithRect(targetBBox);
          }
          return false;
        });
      },
      validate(this: Graph, args: { child: Node; parent?: Node }): boolean {
        const { child } = args;
        const data = child.getData();
        const forbiddenComponents = ['LOOP', 'INPUT'];
        if (forbiddenComponents.includes(data.type || '')) {
          return false;
        }

        const topLevelNodes = this.getNodes().filter((item) => !item.parent);
        const isExistingNode = topLevelNodes.some((item) => item.id === child.id);

        if (!isExistingNode) {
          return true;
        }

        if (!child.parent) {
          const hasNoConnectedEdges = this.getConnectedEdges(child).length === 0;
          return hasNoConnectedEdges && ctrlPressed.value;
        }

        return false;
      },
    },
  };

  graphRef.value = new X6Graph(options as unknown as ConstructorParameters<typeof X6Graph>[0]);

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

  graphRef.value.use(new Clipboard({ enabled: true }));

  keyboardStore.bindKeyboardPlugin(graphRef.value);
  historyStore.bindHistoryPlugin(graphRef.value);
  selectionStore.bindSelectionEvents(graphRef.value);

  const uiStore = useUiStore();

  bindEvents(
    graphRef,
    toast,
    uiStore,
    (message, duration) => {
      showStatusMessage(toast, message, duration);
    },
    ctrlPressed
  );

  keyboardStore.bindAllShortcuts(graphRef.value, (message) => {
    showStatusMessage(toast, message);
  });

  historyStore.bindHistoryShortcuts(graphRef.value, (message) => {
    showStatusMessage(toast, message);
  });

  const width =
    (graphRef.value as unknown as { getWidth?: () => number }).getWidth?.() ||
    container.offsetWidth;
  const height =
    (graphRef.value as unknown as { getHeight?: () => number }).getHeight?.() ||
    container.offsetHeight;

  addNode(graphRef, 'INPUT', width / 2 - nodeStyle.width / 2, height / 2 - nodeStyle.height / 2);

  graphRef.value.cleanHistory();

  return graphRef.value;
}
