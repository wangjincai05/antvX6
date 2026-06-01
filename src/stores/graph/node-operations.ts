import type { Graph, Node } from '@antv/x6';
import { useSelectionStore } from '@/stores/selectionStore';
import { showStatusMessage } from './helpers';
import { useToast } from '@/composables/useToast';
import { getNodeConfig, isLoopNode } from './node-config';

export function addNode(
  graphRef: { value: Graph | null },
  type: string,
  x: number,
  y: number,
  label?: string
): Node | null {
  if (!graphRef.value) return null;

  const config = getNodeConfig(type, label || '');
  if (!config || Object.keys(config).length === 0) return null;

  const nodes = graphRef.value.getNodes();
  const maxZIndex = nodes.reduce((max, n) => Math.max(max, n.getZIndex() || 0), 0);

  const cell = { ...config, x, y, isGroup: isLoopNode(type), zIndex: maxZIndex + 1 };
  const node = graphRef.value.addNode(cell);
  return node;
}

export function updateNodeLabel(
  graphRef: { value: Graph | null },
  toast: ReturnType<typeof useToast>,
  nodeId: string,
  label: string
): void {
  if (!graphRef.value) return;

  const node = graphRef.value.getCellById(nodeId);
  if (node && node.isNode()) {
    (node as Node).attr('label/text', label);
    const currentData = (node as Node).getData?.() || {};
    (node as Node).setData?.({ ...currentData, label });
    showStatusMessage(toast, '节点名称已更新');
  }
}

export function updateNodeDescription(
  graphRef: { value: Graph | null },
  toast: ReturnType<typeof useToast>,
  nodeId: string,
  description: string
): void {
  if (!graphRef.value) return;

  const node = graphRef.value.getCellById(nodeId);
  if (node && node.isNode()) {
    const currentData = (node as Node).getData?.() || {};
    (node as Node).setData?.({ ...currentData, description });
    showStatusMessage(toast, '节点描述已更新');
  }
}

export function updateNodeProperty(
  graphRef: { value: Graph | null },
  toast: ReturnType<typeof useToast>,
  nodeId: string,
  key: string,
  value: unknown
): void {
  if (!graphRef.value) return;

  const node = graphRef.value.getCellById(nodeId);
  if (node && node.isNode()) {
    const currentData = (node as Node).getData?.() || {};
    const newData = { ...currentData, properties: { ...currentData.properties, [key]: value } };
    (node as Node).setData?.(newData);
    showStatusMessage(toast, `属性 "${key}" 已更新`);
  }
}

export function getNodeProperties(
  graphRef: { value: Graph | null },
  nodeId: string
): Record<string, unknown> {
  if (!graphRef.value) return {};

  const node = graphRef.value.getCellById(nodeId);
  return (node as Node)?.getData?.()?.properties || {};
}

export function clearCanvas(graphRef: { value: Graph | null }): void {
  if (!graphRef.value) return;

  const selectionStore = useSelectionStore();
  graphRef.value.getCells().forEach((cell) => {
    const cellData = (cell as { data?: { type?: string } }).data;
    if (cellData?.type !== 'INPUT') {
      (cell as { remove?: () => void }).remove?.();
    }
  });
  selectionStore.clearSelection();
}
