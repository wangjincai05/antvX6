import { defineStore } from 'pinia';
import { ref, type Ref } from 'vue';
import { Keyboard } from '@antv/x6';
import type { Graph, Cell } from '@antv/x6';
import { ZOOM_MIN, ZOOM_MAX, STATUS_MESSAGES } from '@/config/constants';

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
        graph.removeCells(toRemove as Cell[]);
        showMessage(STATUS_MESSAGES.nodeDeleted(toRemove.length));
      } else {
        showMessage(STATUS_MESSAGES.noNodeSelected);
      }
    };

    graph.bindKey('del', deleteCells);
    graph.bindKey('backspace', deleteCells);
  };

  const bindZoomShortcuts = (graph: Graph, showMessage: (msg: string) => void) => {
    const ZOOM_STEP_VALUE = 0.1;

    graph.bindKey(['ctrl+[', 'meta+['], (e) => {
      e.preventDefault();
      const zoomLevel = Number(graph.zoom().toFixed(1));
      if (zoomLevel > ZOOM_MIN) {
        graph.zoom(-ZOOM_STEP_VALUE);
      } else {
        showMessage(STATUS_MESSAGES.zoomMin);
      }
    });

    graph.bindKey(['ctrl+]', 'meta+]'], (e) => {
      e.preventDefault();
      const zoomLevel = Number(graph.zoom().toFixed(1));
      if (zoomLevel < ZOOM_MAX) {
        graph.zoom(ZOOM_STEP_VALUE);
      } else {
        showMessage(STATUS_MESSAGES.zoomMax);
      }
    });
  };

  const bindCopyPasteShortcuts = (graph: Graph, showMessage: (msg: string) => void) => {
    const OFFSET = 50;

    graph.bindKey(['ctrl+c', 'meta+c'], (e) => {
      e.preventDefault();
      const selected = graph.getSelectedCells();

      if (selected.length === 0) {
        showMessage(STATUS_MESSAGES.noNodeSelected);
        return;
      }

      const copyableNodes = selected.filter((cell: CellWithData) => cell.data?.type !== 'INPUT');

      if (copyableNodes.length === 0) {
        showMessage(STATUS_MESSAGES.startNodeCannotCopy);
        return;
      }

      if (copyableNodes.length < selected.length) {
        showMessage(STATUS_MESSAGES.startNodeCannotCopy);
      }

      graph.copy(copyableNodes as Cell[]);
      showMessage(STATUS_MESSAGES.nodeCopied(copyableNodes.length));
    });

    graph.bindKey(['ctrl+v', 'meta+v'], (e) => {
      e.preventDefault();
      try {
        const pastedCells = graph.paste({ offset: OFFSET });
        graph.cleanSelection();
        graph.select(pastedCells);
        if (pastedCells && pastedCells.length > 0) {
          showMessage(STATUS_MESSAGES.nodePasted(pastedCells.length));
        } else {
          showMessage(STATUS_MESSAGES.clipboardEmpty);
        }
      } catch {
        showMessage(STATUS_MESSAGES.clipboardEmpty);
      }
    });
  };

  const bindAllShortcuts = (graph: Graph, showMessage: (msg: string) => void) => {
    bindDeleteShortcuts(graph, showMessage);
    bindZoomShortcuts(graph, showMessage);
    bindCopyPasteShortcuts(graph, showMessage);
  };

  return {
    keyboardEnabled,
    enableKeyboard,
    disableKeyboard,
    bindKeyboardPlugin,
    bindDeleteShortcuts,
    bindZoomShortcuts,
    bindCopyPasteShortcuts,
    bindAllShortcuts,
  };
});
