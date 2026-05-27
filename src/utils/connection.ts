import type { Graph } from '@antv/x6';
import { nodeRegistry } from '@/config/workflow/node-registry';

interface CellData {
  type?: string;
}

interface Cell {
  data?: CellData;
}

interface Magnet {
  getAttribute: (name: string) => string | null;
}

export function validateConnection(
  sourceCell: Cell | null | undefined,
  targetCell: Cell | null | undefined,
  sourceMagnet: Magnet | null | undefined,
  targetMagnet: Magnet | null | undefined
) {
  if (!sourceMagnet) return { valid: false, reason: '源连接点不存在' };
  if (!targetMagnet) return { valid: false, reason: '目标连接点不存在' };
  if (sourceCell === targetCell) return { valid: false, reason: '不能连接到自身' };

  const sourceType = sourceCell?.data?.type;
  const targetType = targetCell?.data?.type;

  if (sourceType === 'INPUT') {
    if (!sourceMagnet.getAttribute('port-group')?.includes('bottom')) {
      return { valid: false, reason: '开始节点只能从底部端口输出' };
    }
  }

  if (targetType === 'OUTPUT') {
    if (!targetMagnet.getAttribute('port-group')?.includes('top')) {
      return { valid: false, reason: '结束节点只能从顶部端口输入' };
    }
  }

  if (sourceType === 'OUTPUT') {
    return { valid: false, reason: '结束节点不能作为源节点' };
  }

  if (targetType === 'INPUT') {
    return { valid: false, reason: '开始节点不能作为目标节点' };
  }

  return { valid: true, reason: '' };
}

export function getConnectionRules(nodeType: string) {
  const config = nodeRegistry[nodeType];
  if (!config) return { canConnectFrom: true, canConnectTo: true };

  switch (nodeType) {
    case 'INPUT':
      return { canConnectFrom: false, canConnectTo: true };
    case 'OUTPUT':
      return { canConnectFrom: true, canConnectTo: false };
    default:
      return { canConnectFrom: true, canConnectTo: true };
  }
}

export function hasValidConnection(graph: Graph, sourceNodeId: string, targetNodeId: string) {
  const sourceNode = graph.getCellById(sourceNodeId);
  const targetNode = graph.getCellById(targetNodeId);

  if (!sourceNode || !targetNode) return false;

  const sourceType = sourceNode.data?.type;
  const targetType = targetNode.data?.type;

  if (sourceType === 'OUTPUT') return false;
  if (targetType === 'INPUT') return false;

  return true;
}
