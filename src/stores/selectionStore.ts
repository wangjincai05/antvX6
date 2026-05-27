import { defineStore } from 'pinia';
import { ref, type Ref } from 'vue';
import { Node, Edge, type Graph } from '@antv/x6';

export const useSelectionStore = defineStore('selection', () => {
  const selectedNode: Ref<Node | null> = ref(null);
  const selectedEdge: Ref<Edge | null> = ref(null);

  const selectNode = (node: Node | null) => {
    selectedNode.value = node;
    selectedEdge.value = null;
    if (node) {
      node.toFront();
    }
  };

  const selectEdge = (edge: Edge | null) => {
    selectedEdge.value = edge;
    selectedNode.value = null;
  };

  const clearSelection = () => {
    selectedNode.value = null;
    selectedEdge.value = null;
  };

  const bindSelectionEvents = (graph: Graph) => {
    graph.on('node:click', ({ node }: { node: Node }) => {
      selectNode(node);
    });

    graph.on('edge:click', ({ edge }: { edge: Edge }) => {
      selectEdge(edge);
    });

    graph.on('blank:click', () => {
      clearSelection();
    });
  };

  return {
    selectedNode,
    selectedEdge,
    selectNode,
    selectEdge,
    clearSelection,
    bindSelectionEvents,
  };
});
