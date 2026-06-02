import type { Node } from '@antv/x6';

const iconResources = import.meta.glob('/src/assets/images/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

export const LOOP_NODE_TYPE = 'LOOP';

export interface LoopParentResult {
  isLoopChild: boolean;
  loopNode: Node | null;
}

export const isLoopChildNode = (node: Node): LoopParentResult => {
  let currentNode: Node | null | undefined = node;

  while (currentNode) {
    const parent = (
      currentNode as unknown as { getParent: () => Node | null | undefined }
    ).getParent?.();
    if (!parent) {
      break;
    }

    const parentData = (
      parent as unknown as { getData: () => Record<string, unknown> }
    ).getData?.();
    if (parentData?.type === LOOP_NODE_TYPE) {
      return { isLoopChild: true, loopNode: parent as Node };
    }

    currentNode = parent as Node;
  }

  return { isLoopChild: false, loopNode: null };
};

export const getLoopParentNode = (node: Node): Node | null => {
  const result = isLoopChildNode(node);
  return result.loopNode;
};

export const getIconPath = (iconName?: string): string => {
  const iconMap: Record<string, string> = {
    'icon-start': '/src/assets/images/icon-start.png',
    'icon-llm': '/src/assets/images/icon-llm.png',
    'icon-knowledge': '/src/assets/images/icon-knowledge.png',
    'icon-code': '/src/assets/images/icon-code.png',
    'icon-rest': '/src/assets/images/icon-database.png',
    'icon-variable': '/src/assets/images/icon-variable.png',
    'icon-condition': '/src/assets/images/icon-condition.png',
    'icon-plugin': '/src/assets/images/icon-plugin.png',
    'icon-bot': '/src/assets/images/icon-bot.png',
    'icon-graph': '/src/assets/images/icon-graph.png',
    'icon-end': '/src/assets/images/icon-end.png',
    'icon-extract': '/src/assets/images/icon-database.png',
    'icon-loopEnd': '/src/assets/images/icon-loopEnd.png',
    'icon-loop': '/src/assets/images/icon-loop.png',
  };

  const path = iconMap[iconName || ''] || '/src/assets/images/icon-variable.png';
  return (iconResources[path] as string) || path;
};
