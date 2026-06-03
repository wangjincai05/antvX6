import { Dnd, type Graph, type Node } from '@antv/x6';
import { useDependency, DEPENDENCY_KEYS } from '@/di/container';
import type { Toast, GraphStore } from '@/di/types';
import { nodeRegistry } from '@/config/workflow/node-registry';

const loopNodeTypes = ['LOOP_BREAK'];

export class UiService {
  private toast: Toast;

  constructor() {
    this.toast = useDependency<Toast>(DEPENDENCY_KEYS.TOAST);
  }

  handleDragStart(event: DragEvent, nodeType: string): void {
    const graphStore = useDependency<GraphStore>(DEPENDENCY_KEYS.GRAPH_STORE);
    const graphRef = graphStore.graphRef as unknown as Graph;

    if (!graphRef) return;

    const config = nodeRegistry[nodeType];
    if (!config) return;

    const nodeConfig = graphStore.getNodeConfig(nodeType, config.name) as Record<string, unknown>;
    const isLoopNode = nodeType === 'LOOP';

    const cell = {
      ...nodeConfig,
      isGroup: isLoopNode,
    };

    const templateNode = graphRef.createNode(cell);

    interface NodeData {
      type: string;
    }

    interface NodeWithData {
      getData: () => NodeData;
      position: () => { x: number; y: number };
    }

    const dnd = new Dnd({
      target: graphRef,
      getDropNode: (node: Node) => {
        return node.clone() as Node;
      },
      validateNode: (droppingNode: NodeWithData) => {
        const nodeData = droppingNode.getData();
        const position = droppingNode.position();

        const nodesUnder = graphRef.getNodesFromPoint(position.x, position.y);
        const nodeUnder = nodesUnder[0] as NodeWithData | undefined;

        if (loopNodeTypes.includes(nodeData.type)) {
          if (!nodeUnder || nodeUnder.getData()?.type !== 'LOOP') {
            this.toast.warning(`${config.name}节点只能放置在循环节点内`);
            return false;
          }
        }

        return true;
      },
    });

    dnd.start(templateNode, event);
  }

  handleDragOver(event: DragEvent): void {
    event.preventDefault();
  }
}
