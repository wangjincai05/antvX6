export interface NodeData {
  type?: string;
  label?: string;
}

export interface InspectorNode {
  data?: NodeData;
  getData?: () => NodeData;
  label?: string;
  position: () => { x: number; y: number };
  setLabel?: (label: string) => void;
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
