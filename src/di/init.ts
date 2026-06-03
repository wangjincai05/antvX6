import { container, DEPENDENCY_KEYS } from './container';
import { useToast } from '@/composables/useToast';
import { useSelectionStore } from '@/stores/selectionStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useUiStore } from '@/stores/uiStore';
import { useGraphStore } from '@/stores/graph/index';
import { useWorkflowStore } from '@/stores/workflowStore';

export function initDependencies(): void {
  container.registerFactory(DEPENDENCY_KEYS.TOAST, () => useToast());
  container.registerFactory(DEPENDENCY_KEYS.SELECTION_STORE, () => useSelectionStore());
  container.registerFactory(DEPENDENCY_KEYS.HISTORY_STORE, () => useHistoryStore());
  container.registerFactory(DEPENDENCY_KEYS.UI_STORE, () => useUiStore());
  container.registerFactory(DEPENDENCY_KEYS.GRAPH_STORE, () => useGraphStore());
  container.registerFactory(DEPENDENCY_KEYS.WORKFLOW_STORE, () => useWorkflowStore());
}

export function cleanupDependencies(): void {
  container.clear();
}
