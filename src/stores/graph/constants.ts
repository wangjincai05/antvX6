// Graph Store 常量定义

export const ZOOM_FACTOR_IN = 1.2;
export const ZOOM_FACTOR_OUT = 0.8;
export const MAX_ZOOM = 2.0;
export const MIN_ZOOM = 0.2;

export const PASTE_OFFSET = 50;

export const EMBED_PADDING = 20;

export const DEFAULT_DURATION = 2000;

export const STATUS_MESSAGES = {
  CONNECTION_START: '从输出桩（绿色）拖动到输入桩（蓝色）',
  CONNECTION_SUCCESS: '连线创建成功',
  NODE_DELETED: '节点已删除',
  NODE_UPDATED: '节点名称已更新',
  NODE_CREATED: '节点创建成功',
  NODE_DESCRIPTION_UPDATED: '节点描述已更新',
  PROPERTY_UPDATED: (key: string) => `属性 "${key}" 已更新`,
} as const;

export const NODE_DIMENSIONS = {
  DEFAULT_WIDTH: 200,
  DEFAULT_HEIGHT: 80,
  LOOP_WIDTH: 200,
  LOOP_HEIGHT: 120,
} as const;
