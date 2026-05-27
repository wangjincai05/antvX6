export interface NodeData {
  type?: string;
  label?: string;
  properties?: Record<string, unknown>;
}

export interface InspectorNode {
  id?: string;
  data?: NodeData;
  getData?: () => NodeData;
  label?: string;
  position: () => { x: number; y: number };
  setLabel?: (label: string) => void;
  setData?: (data: NodeData) => void;
}

export interface NodeProperty {
  key: string;
  label: string;
  type: 'string' | 'number' | 'select' | 'boolean';
  value: unknown;
  options?: { label: string; value: unknown }[];
  description?: string;
}

export interface EdgeLineAttrs {
  stroke?: string;
}

export interface EdgeAttrs {
  line?: EdgeLineAttrs;
}

export interface InspectorEdge {
  getSourceCellId: () => string | undefined;
  getTargetCellId: () => string | undefined;
  attrs?: EdgeAttrs | null;
  setAttrs?: (...args: unknown[]) => unknown;
  attr: (path: string, value: string) => void;
}
