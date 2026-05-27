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
  sourceCell: unknown,
  targetCell: unknown,
  sourceMagnet: unknown,
  targetMagnet: unknown
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

  if (sourceType === 'INPUT') {
    if (!sourceMagnetObj?.getAttribute('port-group')?.includes('bottom')) {
      return { valid: false, reason: '开始节点只能从底部端口输出' };
    }
  }

  if (targetType === 'OUTPUT') {
    if (!targetMagnetObj?.getAttribute('port-group')?.includes('top')) {
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
