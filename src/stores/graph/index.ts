import { defineStore } from 'pinia';
import { ref, type Ref } from 'vue';
import type { Graph, Node } from '@antv/x6';

import { useSelectionStore } from '@/stores/selectionStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useKeyboardStore } from '@/stores/keyboardStore';
import { useUiStore } from '@/stores/uiStore';
import { useToast } from '@/composables/useToast';

import { initGraph } from './init';
import {
  addNode,
  updateNodeLabel,
  updateNodeDescription,
  updateNodeProperty,
  getNodeProperties,
  clearCanvas,
} from './node-operations';
import { zoomIn, zoomOut, resetZoom } from './canvas-operations';
import { exportWorkflow, importWorkflow } from './import-export';
import { showStatusMessage } from './helpers';
import { getNodeConfig } from './node-config';
import {
  handleNodeMouseOver,
  handleNodeMouseOut,
  handlePortClick,
  handleConnectingEnd,
  createNodeAndConnect,
} from './events';

export const useGraphStore = defineStore('graph', () => {
  const graphRef: Ref<Graph | null> = ref(null);

  const selectionStore = useSelectionStore();
  const historyStore = useHistoryStore();
  const keyboardStore = useKeyboardStore();
  const uiStore = useUiStore();
  const toast = useToast();

  const initGraphStore = (container: HTMLElement) => {
    return initGraph(container, graphRef, toast);
  };

  const addGraphNode = (type: string, x: number, y: number, label?: string) => {
    return addNode(graphRef, type, x, y, label);
  };

  const updateGraphNodeLabel = (nodeId: string, label: string) => {
    updateNodeLabel(graphRef, toast, nodeId, label);
  };

  const updateGraphNodeDescription = (nodeId: string, description: string) => {
    updateNodeDescription(graphRef, toast, nodeId, description);
  };

  const updateGraphNodeProperty = (nodeId: string, key: string, value: unknown) => {
    updateNodeProperty(graphRef, toast, nodeId, key, value);
  };

  const getGraphNodeProperties = (nodeId: string) => {
    return getNodeProperties(graphRef, nodeId);
  };

  const clearGraphCanvas = () => {
    clearCanvas(graphRef);
  };

  const zoomGraphIn = () => {
    zoomIn(graphRef);
  };

  const zoomGraphOut = () => {
    zoomOut(graphRef);
  };

  const resetGraphZoom = () => {
    resetZoom(graphRef);
  };

  const exportGraphWorkflow = (): string => {
    return exportWorkflow(graphRef);
  };

  const importGraphWorkflow = (jsonString: string) => {
    importWorkflow(graphRef, addGraphNode, jsonString);
  };

  const showGraphStatusMessage = (message: string, duration: number = 2000) => {
    showStatusMessage(toast, message, duration);
  };

  return {
    graphRef,
    selectionStore,
    historyStore,
    initGraph: initGraphStore,
    addNode: addGraphNode,
    getNodeConfig: (type: string, label: string) => {
      return getNodeConfig(type, label);
    },
    clearCanvas: clearGraphCanvas,
    zoomIn: zoomGraphIn,
    zoomOut: zoomGraphOut,
    resetZoom: resetGraphZoom,
    exportWorkflow: exportGraphWorkflow,
    importWorkflow: importGraphWorkflow,
    showStatusMessage: showGraphStatusMessage,
    updateNodeLabel: updateGraphNodeLabel,
    updateNodeDescription: updateGraphNodeDescription,
    updateNodeProperty: updateGraphNodeProperty,
    getNodeProperties: getGraphNodeProperties,
    handleNodeMouseOver,
    handleNodeMouseOut,
    handlePortClick: (node: Node, e: MouseEvent) => {
      handlePortClick(graphRef, uiStore, node, e);
    },
    handleConnectingEnd: (
      targetPoint: { x: number; y: number },
      edge: Parameters<typeof handleConnectingEnd>[1]
    ) => {
      handleConnectingEnd(uiStore, targetPoint, edge);
    },
    createNodeAndConnect: (nodeType: string) => {
      createNodeAndConnect(graphRef, uiStore, addGraphNode, toast, nodeType);
    },
  };
});
