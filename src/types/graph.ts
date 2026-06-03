export interface NodeProperties {
  label?: string;
  description?: string;
  position?: { x: number; y: number };
  [key: string]: unknown;
}

export interface GraphNodeData {
  type: string;
  properties?: NodeProperties;
  description?: string;
  label?: string;
}

export interface GraphNode {
  id: string;
  data?: GraphNodeData;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface EdgeProperties {
  label?: string;
  color?: string;
  [key: string]: unknown;
}

export interface GraphEdge {
  id?: string;
  source?: unknown;
  target?: unknown;
  sourcePortId?: string;
  targetPortId?: string;
  getSourceCellId: () => string | undefined;
  getTargetCellId: () => string | undefined;
  getSourcePortId?: () => string | undefined;
  getTargetPortId?: () => string | undefined;
  data?: EdgeProperties;
}

export interface Graph {
  getNodes: () => GraphNode[];
  getEdges: () => GraphEdge[];
  getNodeById?: (id: string) => GraphNode | undefined;
  getEdgeById?: (id: string) => GraphEdge | undefined;
}

export type WorkflowNodeType =
  | 'INPUT'
  | 'OUTPUT'
  | 'CONDITION'
  | 'LOOP'
  | 'LOOP_END'
  | 'LOOP_BREAK'
  | 'LLM'
  | 'CODE'
  | 'DATABASE'
  | 'KNOWLEDGE'
  | 'default';

export type PortType = 'input' | 'output';

export interface PortConfig {
  id: string;
  type: PortType;
  group: string;
  position?: { x: number; y: number };
}

export interface NodeConfig {
  type: WorkflowNodeType;
  label: string;
  width?: number;
  height?: number;
  ports?: PortConfig[];
  icon?: string;
  color?: string;
}

export interface CellData {
  type?: string;
}

export interface Cell {
  data?: CellData;
  id?: string;
  getEdges?: () => GraphEdge[];
}

export interface Magnet {
  getAttribute: (name: string) => string | null;
}

export interface CellWithData {
  data?: CellData;
  remove?: () => void;
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

export interface X6Node {
  id: string;
  data?: { type?: string };
  getZIndex: () => number;
  setZIndex: (zIndex: number) => void;
  getBBox: () => BBox;
  getSize: () => { width: number; height: number };
  getPosition: () => { x: number; y: number };
  position: (x: number, y: number) => void;
  prop: (
    path: string | Record<string, unknown>,
    value?: unknown,
    options?: Record<string, unknown>
  ) => unknown;
  getData: () => Record<string, unknown>;
  setData: (data: Record<string, unknown>) => void;
  isVisible: () => boolean;
  getParent: () => X6Node | null;
  getChildren: () => X6Node[];
  isNode: () => boolean;
  attr: (path: string, value?: unknown) => unknown;
  setAttrs: (attrs: Record<string, unknown>) => void;
  getPorts: () => { id?: string; group?: string }[];
  setPortProp: (portId: string, path: string, value: unknown) => void;
}

export interface X6Edge {
  id: string;
  getSourceCell: () => X6Node | null;
  getTargetCell: () => X6Node | null;
  getSourcePortId: () => string | undefined;
  getTargetPortId: () => string | undefined;
  getSourceCellId: () => string | undefined;
  getTargetCellId: () => string | undefined;
  attr: (path: string, value?: unknown) => unknown;
  setAttrs: (attrs: Record<string, unknown>) => void;
  remove: () => void;
  addTools: (tools: unknown[]) => void;
  removeTools: () => void;
}

export interface X6Graph {
  getNodes: () => X6Node[];
  getEdges: () => X6Edge[];
  getCells: () => (X6Node | X6Edge)[];
  addNode: (config: Record<string, unknown>) => X6Node;
  addEdge: (config: Record<string, unknown>) => X6Edge;
  createEdge: (config: Record<string, unknown>) => X6Edge;
  getCellById: (id: string) => X6Node | X6Edge | null;
  getConnectedEdges: (node: X6Node) => X6Edge[];
  on: (eventName: string, handler: (args: unknown) => void) => void;
  use: (plugin: unknown) => void;
  dispose: () => void;
  cleanHistory: () => void;
  getWidth: () => number;
  getHeight: () => number;
  getScale: () => number;
  zoomTo: (scale: number) => void;
  centerContent: () => void;
  options?: { width?: number; height?: number };
}

export interface X6GraphOptions {
  container: HTMLElement;
  width: number;
  height: number;
  panning?: boolean;
  connecting?: Record<string, unknown>;
  embedding?: Record<string, unknown>;
}

export interface EmbeddingValidateArgs {
  child: X6Node;
  parent: X6Node;
}
