import { defineStore } from 'pinia';
import { ref, type Ref } from 'vue';
import { History } from '@antv/x6';
import type { Graph } from '@antv/x6';

interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
}

export const useHistoryStore = defineStore('history', () => {
  const historyEnabled = ref(true);
  const historyState: Ref<HistoryState> = ref({ canUndo: false, canRedo: false });

  const enableHistory = () => {
    historyEnabled.value = true;
  };

  const disableHistory = () => {
    historyEnabled.value = false;
  };

  const undo = (graph: Graph, showMessage: (msg: string) => void) => {
    const history = graph as unknown as {
      canUndo: () => boolean;
      undo: () => void;
    };
    if (history.canUndo()) {
      history.undo();
      updateHistoryState(graph);
      showMessage('已撤销');
    } else {
      showMessage('无可撤销操作');
    }
  };

  const redo = (graph: Graph, showMessage: (msg: string) => void) => {
    const history = graph as unknown as {
      canRedo: () => boolean;
      redo: () => void;
    };
    if (history.canRedo()) {
      history.redo();
      updateHistoryState(graph);
      showMessage('已恢复');
    } else {
      showMessage('无可恢复操作');
    }
  };

  const updateHistoryState = (graph: Graph) => {
    const history = graph as unknown as {
      canUndo: () => boolean;
      canRedo: () => boolean;
    };
    historyState.value = {
      canUndo: history.canUndo?.() ?? false,
      canRedo: history.canRedo?.() ?? false,
    };
  };

  const bindHistoryPlugin = (graph: Graph) => {
    graph.use(
      new History({
        enabled: true,
        beforeAddCommand(_event, args) {
          if (!args) return true;
          const arg = args as { key?: string };
          if (arg.key && ['tools', 'attrs', 'ports', 'labels', 'zIndex'].includes(arg.key)) {
            return false;
          }
          return true;
        },
      })
    );
    updateHistoryState(graph);
  };

  const bindHistoryShortcuts = (graph: Graph, showMessage: (msg: string) => void) => {
    graph.bindKey(['ctrl+z', 'meta+z'], (e) => {
      e.preventDefault();
      undo(graph, showMessage);
    });

    graph.bindKey(['ctrl+shift+z', 'ctrl+y', 'meta+shift+z', 'meta+y'], (e) => {
      e.preventDefault();
      redo(graph, showMessage);
    });
  };

  return {
    historyEnabled,
    historyState,
    enableHistory,
    disableHistory,
    undo,
    redo,
    updateHistoryState,
    bindHistoryPlugin,
    bindHistoryShortcuts,
  };
});
