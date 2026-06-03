import type {
  Toast,
  SelectionStore,
  HistoryStore,
  UiStore,
  GraphStore,
  WorkflowStore,
} from './types';

export interface Dependencies {
  toast?: Toast;
  selectionStore?: SelectionStore;
  historyStore?: HistoryStore;
  uiStore?: UiStore;
  graphStore?: GraphStore;
  workflowStore?: WorkflowStore;
}

class Container {
  private dependencies = new Map<string, unknown>();
  private factories = new Map<string, () => unknown>();

  register<T>(key: string, instance: T): void {
    this.dependencies.set(key, instance);
  }

  registerFactory<T>(key: string, factory: () => T): void {
    this.factories.set(key, factory);
  }

  resolve<T>(key: string): T {
    if (this.dependencies.has(key)) {
      return this.dependencies.get(key) as T;
    }

    if (this.factories.has(key)) {
      const factory = this.factories.get(key)!;
      const instance = factory();
      this.dependencies.set(key, instance);
      return instance as T;
    }

    throw new Error(`Dependency not found: ${key}`);
  }

  has(key: string): boolean {
    return this.dependencies.has(key) || this.factories.has(key);
  }

  clear(): void {
    this.dependencies.clear();
    this.factories.clear();
  }
}

export const container = new Container();

export const DEPENDENCY_KEYS = {
  TOAST: 'toast',
  SELECTION_STORE: 'selectionStore',
  HISTORY_STORE: 'historyStore',
  UI_STORE: 'uiStore',
  GRAPH_STORE: 'graphStore',
  WORKFLOW_STORE: 'workflowStore',
} as const;

export function useDependency<T>(key: string): T {
  return container.resolve<T>(key);
}
