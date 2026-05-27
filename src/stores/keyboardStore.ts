import { defineStore } from 'pinia';
import { ref, type Ref } from 'vue';
import { Keyboard } from '@antv/x6';
import type { Graph } from '@antv/x6';
import { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, ZOOM_OUT_STEP } from '@/config/constants';

interface CellWithData {
  data?: { type?: string };
  remove?: () => void;
}

export const useKeyboardStore = defineStore('keyboard', () => {
  const keyboardEnabled: Ref<boolean> = ref(true);

  const enableKeyboard = (graph: Graph) => {
    keyboardEnabled.value = true;
    graph.enableKeyboard();
  };

  const disableKeyboard = (graph: Graph) => {
    keyboardEnabled.value = false;
    graph.disableKeyboard();
  };

  const bindKeyboardPlugin = (graph: Graph) => {
    graph.use(
      new Keyboard({
        enabled: true,
        guard(this: Graph, e: KeyboardEvent) {
          const target = e.target as HTMLElement;
          const isInput =
            target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
          return !isInput && keyboardEnabled.value;
        },
      })
    );
  };

  const bindDeleteShortcuts = (graph: Graph, showMessage: (msg: string) => void) => {
    const deleteCells = (e: Event) => {
      e.preventDefault();
      const selected = graph.getSelectedCells();
      const toRemove = selected.filter((cell: CellWithData) => cell.data?.type !== 'INPUT');
      if (toRemove.length > 0) {
        graph.removeCells(toRemove as unknown as Parameters<typeof graph.removeCells>[0]);
        showMessage(`已删除 ${toRemove.length} 个节点`);
      } else {
        showMessage('未选择任何节点');
      }
    };

    graph.bindKey('del', deleteCells);
    graph.bindKey('backspace', deleteCells);
  };

  const bindZoomShortcuts = (graph: Graph, showMessage: (msg: string) => void) => {
    graph.bindKey(['ctrl++', 'ctrl+='], (e) => {
      e.preventDefault();
      const currentScale = (graph as unknown as { getScale: () => number }).getScale();
      const zoomGraph = graph as unknown as { zoomTo: (scale: number) => void };
      if (currentScale < ZOOM_MAX) {
        const newScale = Math.min(currentScale * ZOOM_STEP, ZOOM_MAX);
        zoomGraph.zoomTo(newScale);
        showMessage(`缩放: ${Math.round(newScale * 100)}%`);
      } else {
        showMessage('已达到最大缩放比例');
      }
    });

    graph.bindKey(['ctrl+-'], (e) => {
      e.preventDefault();
      const currentScale = (graph as unknown as { getScale: () => number }).getScale();
      const zoomGraph = graph as unknown as { zoomTo: (scale: number) => void };
      if (currentScale > ZOOM_MIN) {
        const newScale = Math.max(currentScale * ZOOM_OUT_STEP, ZOOM_MIN);
        zoomGraph.zoomTo(newScale);
        showMessage(`缩放: ${Math.round(newScale * 100)}%`);
      } else {
        showMessage('已达到最小缩放比例');
      }
    });
  };

  const bindAllShortcuts = (graph: Graph, showMessage: (msg: string) => void) => {
    bindDeleteShortcuts(graph, showMessage);
    bindZoomShortcuts(graph, showMessage);
  };

  return {
    keyboardEnabled,
    enableKeyboard,
    disableKeyboard,
    bindKeyboardPlugin,
    bindDeleteShortcuts,
    bindZoomShortcuts,
    bindAllShortcuts,
  };
});
