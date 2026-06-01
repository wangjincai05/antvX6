import type { Graph, Node, Edge, Cell } from '@antv/x6';

export interface GraphWithExtensions {
  graph: Graph;
  getScale: () => number;
  zoomTo: (scale: number) => void;
  centerContent: () => void;
  getWidth: () => number;
  getHeight: () => number;
}

export interface NodeWithData {
  node: Node;
  getData: () => NodeData;
  getChildren: () => Node[];
  getBBox: () => BBox;
  getSize: () => { width: number; height: number };
  getPosition: () => { x: number; y: number };
  position: (x: number, y: number) => void;
  setZIndex: (zIndex: number) => void;
  getZIndex: () => number;
  getParent: () => Node | null;
  prop: (
    path: string | Record<string, unknown>,
    value?: unknown,
    options?: Record<string, unknown>
  ) => unknown;
  attr: (path: string, value?: unknown) => unknown;
  isVisible: () => boolean;
  getPorts: () => NodePort[];
  setPortProp: (portId: string, path: string, value: unknown) => void;
}

export interface CellWithData {
  cell: Cell;
  data?: NodeData;
  remove: () => void;
  getChildren?: () => Cell[];
}

export interface EdgeWithTools {
  edge: Edge;
  attr: (path: string, value?: unknown) => unknown;
  setAttrs: (attrs: Record<string, unknown>) => void;
  remove: () => void;
  addTools: (tools: unknown[]) => void;
  removeTools: () => void;
  getSourceCell: () => Node | null;
  getTargetCell: () => Node | null;
  getSourcePortId: () => string | undefined;
  getTargetPortId: () => string | undefined;
}

export interface NodePort {
  id?: string;
  group?: string;
}

export interface NodeData {
  type?: string;
  icon?: string;
  label?: string;
  description?: string;
  properties?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
  inflate: (padding: number) => BBox;
  getCorner: () => { x: number; y: number };
  isIntersectWithRect: (other: BBox) => boolean;
}

export interface HistoryAPI {
  canUndo: () => boolean;
  canRedo: () => boolean;
  undo: () => void;
  redo: () => void;
}

export interface GraphWithHistory {
  graph: Graph;
  canUndo: () => boolean;
  canRedo: () => boolean;
  undo: () => void;
  redo: () => void;
}
