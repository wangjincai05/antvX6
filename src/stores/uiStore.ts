import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Dnd, type Graph, type Node } from '@antv/x6';
import { nodeRegistry, portGroups } from '@/config/workflow/node-registry';
import { useGraphStore } from './graphStore';

const loopNodeTypes = ['LOOP_BREAK'];

export const useUiStore = defineStore('ui', () => {
  const isDragging = ref(false);
  const dragNodeType = ref<string | null>(null);

  const startDrag = (nodeType: string) => {
    isDragging.value = true;
    dragNodeType.value = nodeType;
  };

  const endDrag = () => {
    isDragging.value = false;
    dragNodeType.value = null;
  };

  const handleDragStart = (event: DragEvent, nodeType: string) => {
    const graphStore = useGraphStore();
    if (!graphStore.graphRef) return;

    const config = nodeRegistry[nodeType];
    if (!config) return;

    const ports = config.ports;

    const templateNode = (graphStore.graphRef as unknown as Graph).createNode({
      shape: 'workflow-node',
      label: config.name,
      attrs: {
        body: {
          stroke: '#5f95ff',
        },
      },
      ports: {
        groups: portGroups,
        items: ports,
      },
      data: {
        type: nodeType,
        icon: config.icon,
      },
    });

    interface NodeData {
      type: string;
    }

    interface NodeWithData {
      getData: () => NodeData;
      position: () => { x: number; y: number };
    }

    const dnd = new Dnd({
      target: graphStore.graphRef as unknown as Graph,
      getDropNode: (node: Node) => {
        return node.clone() as Node;
      },
      validateNode: (droppingNode: NodeWithData) => {
        const nodeData = droppingNode.getData();
        const position = droppingNode.position();

        const nodesUnder = (graphStore.graphRef as unknown as Graph).getNodesFromPoint(
          position.x,
          position.y
        );
        const nodeUnder = nodesUnder[0] as NodeWithData | undefined;

        if (loopNodeTypes.includes(nodeData.type)) {
          if (!nodeUnder || nodeUnder.getData()?.type !== 'LOOP') {
            alert(`${config.name}节点只能放置在循环节点内`);
            return false;
          }
        }

        return true;
      },
    });

    dnd.start(templateNode, event);
    endDrag();
  };

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
  };

  return {
    isDragging,
    dragNodeType,
    startDrag,
    endDrag,
    handleDragStart,
    handleDragOver,
  };
});
