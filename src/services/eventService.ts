import type { Ref } from 'vue';
import type { Graph, Node, Edge } from '@antv/x6';
import { useDependency, DEPENDENCY_KEYS } from '@/di/container';
import type { Toast, UiStore } from '@/di/types';

export class EventService {
  private toast: Toast;
  private uiStore: UiStore;

  constructor() {
    this.toast = useDependency<Toast>(DEPENDENCY_KEYS.TOAST);
    this.uiStore = useDependency<UiStore>(DEPENDENCY_KEYS.UI_STORE);
  }

  handleNodeMouseOver(node: Node): void {
    node.attr('body/stroke', '#1890ff');
    node.attr('body/stroke-width', 2);
  }

  handleNodeMouseOut(node: Node): void {
    node.attr('body/stroke', '#d9d9d9');
    node.attr('body/stroke-width', 1);
  }

  handlePortClick(_graphRef: Ref<Graph | null>, node: Node, e: MouseEvent): void {
    const portId = (e.target as HTMLElement)?.getAttribute('port-id');
    if (!portId) return;

    const targetPosition = { x: e.clientX, y: e.clientY };

    this.uiStore.showNodePanel(targetPosition, {
      sourceNode: node,
      sourcePortId: portId,
      targetPosition,
    });
  }

  handleConnectingEnd(_targetPoint: { x: number; y: number }, edge: Edge | null): void {
    if (!edge) {
      this.toast.info('连线已取消');
      return;
    }

    const sourceCell = edge.getSourceCell();
    const targetCell = edge.getTargetCell();

    if (!sourceCell || !targetCell) {
      edge.remove();
      this.toast.warning('请连接到有效的节点');
      return;
    }

    this.toast.success('连线成功');
  }

  createNodeAndConnect(
    _graphRef: Ref<Graph | null>,
    nodeType: string,
    addNode: (type: string, x: number, y: number, label?: string) => void
  ): void {
    const context = this.uiStore.panelPosition;
    const portContext = this.uiStore.portClickContext;

    if (!portContext) return;

    const x = context.x - 60;
    const y = context.y - 40;

    addNode(nodeType, x, y);

    this.uiStore.hideNodePanel();
    this.toast.success('节点创建成功');
  }
}
