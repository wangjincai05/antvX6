export const ZOOM_MIN = 0.2;
export const ZOOM_MAX = 2;
export const ZOOM_STEP = 1.2;
export const ZOOM_OUT_STEP = 0.8;

export const NODE_WIDTH = 200;
export const NODE_HEIGHT = 70;

export const COLORS = {
  primary: '#5f95ff',
  success: '#52c41a',
  error: '#ff4d4f',
  warning: '#faad14',
  info: '#31d0c6',
  background: '#f2f3f5',
  nodeFill: '#ffffff',
  grid: '#d0d0d0',
  text: '#333333',
  textLight: '#666666',
  border: '#e5e5e5',
};

export const PORT_COLORS = {
  input: COLORS.primary,
  output: COLORS.success,
};

export const PORT_GROUPS = {
  input: ['left', 'top'],
  output: ['right', 'bottom'],
};

export const MESSAGE_DURATION = {
  short: 2000,
  medium: 3000,
  long: 5000,
};

export const STATUS_MESSAGES = {
  connectStart: '从输出桩（绿色）拖动到输入桩（蓝色）',
  connectSuccess: '连线创建成功',
  nodeDeleted: (count: number) => `已删除 ${count} 个节点`,
  noNodeSelected: '未选择任何节点',
  undo: '已撤销',
  noUndo: '无可撤销操作',
  redo: '已恢复',
  noRedo: '无可恢复操作',
  zoomMin: '已达到最小缩放比例',
  zoomMax: '已达到最大缩放比例',
  labelUpdated: '节点名称已更新',
  propertyUpdated: (key: string) => `属性 "${key}" 已更新`,
  workflowExported: '工作流已导出',
  workflowImported: '工作流已导入',
  canvasCleared: '画布已清空',
};

export const VALIDATION_ERRORS = {
  cycleDetected: (path: string) => `检测到循环依赖: ${path}`,
  emptyWorkflow: '工作流为空',
  missingStartNode: '缺少开始节点',
  multipleStartNodes: '只能有一个开始节点',
  missingEndNode: '缺少结束节点',
  invalidConnection: {
    noSource: '源连接点不存在',
    noTarget: '目标连接点不存在',
    selfConnect: '不能连接到自身',
    outputAsSource: '输出节点不能作为源节点',
    inputAsTarget: '开始节点不能作为目标节点',
    inputPortAsSource: '输入桩不能发起连线，请使用输出桩（右侧或底部）',
    outputPortAsTarget: '输出桩不能接收连线，请连接至输入桩（左侧或顶部）',
    duplicateConnection: '这两节点之间已存在连线',
  },
};

export const GRID_CONFIG = {
  size: 1,
  color: COLORS.grid,
  thickness: 1,
};

export const SNAP_CONFIG = {
  radius: 50,
};

export const CONNECTION_CONFIG = {
  router: 'manhattan' as const,
  connectorRadius: 8,
  anchor: 'center' as const,
  connectionPoint: 'anchor' as const,
};

export const EDGE_CONFIG = {
  strokeWidth: 2,
  highlightStrokeWidth: 3,
  targetMarkerSize: 8,
};

export const NODE_CONFIG = {
  borderRadius: 8,
  strokeWidth: 2,
  labelFontSize: 14,
};

export const TOAST_CONFIG = {
  duration: 3000,
  maxWidth: 400,
  minWidth: 280,
};

export const DRAG_DROP_CONFIG = {
  loopNodeTypes: ['LOOP_BREAK'],
  loopContainerType: 'LOOP',
};
