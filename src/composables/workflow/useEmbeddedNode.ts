import { useGraph } from './useGraph'

export function useEmbeddedNode() {
  const { graphRef } = useGraph()

  const createContainerNode = (type: string, x: number, y: number, label?: string) => {
    const graph = graphRef.value
    if (!graph) return null

    const node = graph.addNode({
      shape: 'workflow-node',
      x,
      y,
      width: 300,
      height: 200,
      label: label || '容器节点',
      attrs: {
        body: {
          fill: '#f8fafc',
          stroke: '#8b5cf6',
          strokeWidth: 2,
          strokeDasharray: '5,5',
          rx: 8,
          ry: 8
        }
      },
      data: {
        type,
        isContainer: true
      }
    })

    return node
  }

  const addChildToContainer = (containerId: string, childNodeId: string) => {
    const graph = graphRef.value
    if (!graph) return false

    const container = graph.getCellById(containerId)
    const child = graph.getCellById(childNodeId)

    if (!container || !child) return false

    const containerPos = (container as any).position?.() || { x: 0, y: 0 }
    const containerSize = (container as any).getSize?.() || { width: 0, height: 0 }
    const childPos = (child as any).position?.() || { x: 0, y: 0 }

    const relativeX = childPos.x - containerPos.x - containerSize.width / 2 + 90
    const relativeY = childPos.y - containerPos.y - containerSize.height / 2 + 60

    child.setData({
      ...child.data,
      parentId: containerId,
      relativePosition: { x: relativeX, y: relativeY }
    })

    return true
  }

  const removeChildFromContainer = (childNodeId: string) => {
    const graph = graphRef.value
    if (!graph) return false

    const child = graph.getCellById(childNodeId)
    if (!child) return false

    const data = { ...child.data }
    delete data.parentId
    delete data.relativePosition
    child.setData(data)

    return true
  }

  const getContainerChildren = (containerId: string): string[] => {
    const graph = graphRef.value
    if (!graph) return []

    return graph
      .getNodes()
      .filter((node) => node.data?.parentId === containerId)
      .map((node) => node.id)
  }

  const moveContainer = (containerId: string, dx: number, dy: number) => {
    const graph = graphRef.value
    if (!graph) return

    const container = graph.getCellById(containerId)
    if (!container) return

    container.translate(dx, dy)

    const children = getContainerChildren(containerId)
    children.forEach((childId) => {
      const child = graph.getCellById(childId)
      if (child) {
        child.translate(dx, dy)
      }
    })
  }

  const isNodeInContainer = (nodeId: string): boolean => {
    const graph = graphRef.value
    if (!graph) return false

    const node = graph.getCellById(nodeId)
    return !!node?.data?.parentId
  }

  const getNodeContainer = (nodeId: string): string | null => {
    const graph = graphRef.value
    if (!graph) return null

    const node = graph.getCellById(nodeId)
    return node?.data?.parentId || null
  }

  return {
    createContainerNode,
    addChildToContainer,
    removeChildFromContainer,
    getContainerChildren,
    moveContainer,
    isNodeInContainer,
    getNodeContainer
  }
}
