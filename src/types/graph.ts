export interface GraphNode {
  id: string;
  data?: { type?: string };
}

export interface GraphEdge {
  getSourceCellId: () => string | undefined;
  getTargetCellId: () => string | undefined;
  getSourcePortId?: () => string | undefined;
  getTargetPortId?: () => string | undefined;
}

export interface Graph {
  getNodes: () => GraphNode[];
  getEdges: () => GraphEdge[];
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
