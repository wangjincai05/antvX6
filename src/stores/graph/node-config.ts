import { nodeRegistry, portGroups } from '@/config/workflow/node-registry';
import { nodeStyle, edgeStyle } from '@/config/workflow/graph-options';
import { COLORS } from '@/config/constants';
import { NODE_DIMENSIONS } from './constants';

export function isLoopNode(type: string): boolean {
  return type === 'LOOP';
}

export function getNodeWidth(type: string): number {
  return isLoopNode(type) ? NODE_DIMENSIONS.LOOP_WIDTH : nodeStyle.width;
}

export function getNodeHeight(type: string): number {
  return isLoopNode(type) ? NODE_DIMENSIONS.LOOP_HEIGHT : nodeStyle.height;
}

export function getNodeConfig(type: string, label: string): Record<string, unknown> {
  const config = nodeRegistry[type];
  if (!config) return {};

  const loopNode = isLoopNode(type);

  return {
    shape: loopNode ? 'loop-node' : 'workflow-node',
    width: getNodeWidth(type),
    height: getNodeHeight(type),
    label,
    attrs: { body: { stroke: COLORS.primary } },
    ports: { groups: portGroups, items: config.ports },
    data: { type, icon: config.icon },
  };
}

export { edgeStyle, nodeStyle };
