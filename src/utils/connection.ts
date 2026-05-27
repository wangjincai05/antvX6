import type { Cell, GraphEdge, Magnet } from '@/types';

export const OUTPUT_PORT_GROUPS = ['right', 'bottom'];
export const INPUT_PORT_GROUPS = ['left', 'top'];

export function isOutputPort(portGroup: string | null | undefined): boolean {
  return OUTPUT_PORT_GROUPS.includes(portGroup || '');
}

export function isInputPort(portGroup: string | null | undefined): boolean {
  return INPUT_PORT_GROUPS.includes(portGroup || '');
}

export function validateConnection(
  sourceCell: unknown,
  targetCell: unknown,
  sourceMagnet: unknown,
  targetMagnet: unknown,
  graph?: { getEdges: () => GraphEdge[] }
) {
  if (!sourceMagnet) return { valid: false, reason: '源连接点不存在' };
  if (!targetMagnet) return { valid: false, reason: '目标连接点不存在' };
  if (sourceCell === targetCell) return { valid: false, reason: '不能连接到自身' };

  const sourceCellData = sourceCell as Cell | null | undefined;
  const targetCellData = targetCell as Cell | null | undefined;
  const sourceMagnetObj = sourceMagnet as Magnet | null | undefined;
  const targetMagnetObj = targetMagnet as Magnet | null | undefined;

  const sourceType = sourceCellData?.data?.type;
  const targetType = targetCellData?.data?.type;
  const sourcePortGroup = sourceMagnetObj?.getAttribute('port-group');
  const targetPortGroup = targetMagnetObj?.getAttribute('port-group');

  if (sourceType === 'OUTPUT') {
    return { valid: false, reason: '输出节点不能作为源节点' };
  }

  if (targetType === 'INPUT') {
    return { valid: false, reason: '开始节点不能作为目标节点' };
  }

  if (!isOutputPort(sourcePortGroup)) {
    return { valid: false, reason: '输入桩不能发起连线，请使用输出桩（右侧或底部）' };
  }

  if (!isInputPort(targetPortGroup)) {
    return { valid: false, reason: '输出桩不能接收连线，请连接至输入桩（左侧或顶部）' };
  }

  if (graph && sourceCellData?.id && targetCellData?.id) {
    const edges = graph.getEdges();
    const existingConnection = edges.find((edge) => {
      const sourceId = edge.getSourceCellId?.();
      const targetId = edge.getTargetCellId?.();
      return sourceId === sourceCellData.id && targetId === targetCellData.id;
    });

    if (existingConnection) {
      return { valid: false, reason: '这两节点之间已存在连线' };
    }
  }

  return { valid: true, reason: '' };
}
