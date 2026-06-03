import type { Ref } from 'vue';
import type { Graph } from '@antv/x6';
import { useDependency, DEPENDENCY_KEYS } from '@/di/container';
import type { Toast } from '@/di/types';

export class GraphOperations {
  private toast: Toast;

  constructor() {
    this.toast = useDependency<Toast>(DEPENDENCY_KEYS.TOAST);
  }

  updateNodeLabel(graphRef: Ref<Graph | null>, nodeId: string, label: string): void {
    const node = graphRef.value?.getCellById(nodeId);
    if (node) {
      node.attr('label/text', label);
      this.toast.success('标签更新成功');
    }
  }

  updateNodeDescription(graphRef: Ref<Graph | null>, nodeId: string, description: string): void {
    const node = graphRef.value?.getCellById(nodeId);
    if (node) {
      const currentData = node.getData() as Record<string, unknown>;
      node.setData({ ...currentData, description });
      this.toast.success('描述更新成功');
    }
  }

  updateNodeProperty(
    graphRef: Ref<Graph | null>,
    nodeId: string,
    key: string,
    value: unknown
  ): void {
    const node = graphRef.value?.getCellById(nodeId);
    if (node) {
      const currentData = node.getData() as Record<string, unknown>;
      const properties = (currentData.properties as Record<string, unknown>) || {};
      node.setData({
        ...currentData,
        properties: { ...properties, [key]: value },
      });
      this.toast.success('属性更新成功');
    }
  }

  getNodeProperties(graphRef: Ref<Graph | null>, nodeId: string): Record<string, unknown> | null {
    const node = graphRef.value?.getCellById(nodeId);
    if (node) {
      const data = node.getData() as Record<string, unknown>;
      return (data.properties as Record<string, unknown>) || {};
    }
    return null;
  }

  clearCanvas(graphRef: Ref<Graph | null>): void {
    graphRef.value?.clearCells();
    this.toast.info('画布已清空');
  }

  showStatusMessage(message: string, duration: number = 2000): void {
    this.toast.info(message, { duration });
  }
}
