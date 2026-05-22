export interface NodeType {
  id: string
  name: string
  icon: string
  color: string
  description: string
}

export interface NodeData {
  id: string
  type: string
  label: string
  properties: Record<string, unknown>
}

export interface EdgeData {
  id: string
  source: string
  target: string
  sourcePort?: string
  targetPort?: string
}

export interface WorkflowData {
  nodes: NodeData[]
  edges: EdgeData[]
}