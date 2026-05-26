import { ref } from 'vue'
import { Graph } from '@antv/x6'
import { register } from '@antv/x6-vue-shape'
import {
  defaultGraphOptions,
  nodeStyle,
  edgeStyle,
} from '@/config/workflow/graph-options'
import { nodeRegistry, portGroups } from '@/config/workflow/node-registry'
import type { NodeData, EdgeData } from '@/types/workflow'
import WorkflowNode from '@/components/workflow/WorkflowNode.vue'

interface Position {
  x: number
  y: number
}

interface NodeProperties {
  position?: Position
}

interface ImportNodeData {
  id: string
  type: string
  label?: string
  properties?: NodeProperties
}

const graphRef = ref<Graph | null>(null)
const selectedNode = ref<any>(null)
const selectedEdge = ref<any>(null)

export function useGraph() {
  const initGraph = (container: HTMLElement) => {
    register({
      shape: 'workflow-node',
      width: nodeStyle.width,
      height: nodeStyle.height,
      component: WorkflowNode,
    })

    const options = {
      ...defaultGraphOptions,
      container,
      width: container.offsetWidth,
      height: container.offsetHeight,
      connecting: {
        ...defaultGraphOptions.connecting,
        createEdge() {
          return graphRef.value!.createEdge({
            ...edgeStyle,
          })
        },
        validateConnection({
          sourceCell,
          targetCell,
          sourceMagnet,
          targetMagnet,
        }: {
          sourceCell: unknown
          targetCell: unknown
          sourceMagnet: unknown
          targetMagnet: unknown
        }) {
          if (!sourceMagnet) return false
          if (!targetMagnet) return false
          if (sourceCell === targetCell) return false
          return true
        },
      },
    }

    graphRef.value = new Graph(options as any)

    graphRef.value.on('node:click', ({ node }: { node: any }) => {
      selectedNode.value = node
      selectedEdge.value = null
    })

    graphRef.value.on('edge:click', ({ edge }: { edge: any }) => {
      selectedEdge.value = edge
      selectedNode.value = null
    })

    graphRef.value.on('blank:click', () => {
      selectedNode.value = null
      selectedEdge.value = null
    })

    // Add default start node at canvas center
    const width = (graphRef.value as any).getWidth?.() || container.offsetWidth
    const height = (graphRef.value as any).getHeight?.() || container.offsetHeight
    addNode(
      'INPUT',
      width / 2 - nodeStyle.width / 2,
      height / 2 - nodeStyle.height / 2
    )

    // Override keyboard delete to protect start node
    ;(graphRef.value as any).bindKey('del', () => {
      const selected = graphRef.value!.getSelectedCells()
      const toRemove = selected.filter(
        (cell) => (cell as any).data?.type !== 'INPUT'
      )
      if (toRemove.length > 0) {
        graphRef.value!.removeCells(toRemove as any)
      }
    })
    ;(graphRef.value as any).bindKey('backspace', () => {
      const selected = graphRef.value!.getSelectedCells()
      const toRemove = selected.filter(
        (cell) => (cell as any).data?.type !== 'INPUT'
      )
      if (toRemove.length > 0) {
        graphRef.value!.removeCells(toRemove as any)
      }
    })

    return graphRef.value
  }

  const addNode = (type: string, x: number, y: number, label?: string) => {
    if (!graphRef.value) return null

    const config = nodeRegistry[type]
    if (!config) return null

    const node = graphRef.value.addNode({
      shape: 'workflow-node',
      x,
      y,
      label: label || config.name,
      attrs: {
        body: {
          stroke: '#5f95ff',
        },
      },
      ports: {
        groups: portGroups,
        items: config.ports,
      },
      data: {
        type,
        icon: config.icon,
      },
    })

    return node
  }

  const clearCanvas = () => {
    if (!graphRef.value) return
    graphRef.value.getCells().forEach((cell) => {
      if ((cell as any).data?.type !== 'INPUT') {
        cell.remove()
      }
    })
    selectedNode.value = null
    selectedEdge.value = null
  }

  const zoomIn = () => {
    if (!graphRef.value) return
    const currentScale = (
      graphRef.value as unknown as { getScale: () => number }
    ).getScale()
    ;(graphRef.value as unknown as { zoomTo: (scale: number) => void }).zoomTo(
      Math.min(currentScale * 1.2, 2)
    )
  }

  const zoomOut = () => {
    if (!graphRef.value) return
    const currentScale = (
      graphRef.value as unknown as { getScale: () => number }
    ).getScale()
    ;(graphRef.value as unknown as { zoomTo: (scale: number) => void }).zoomTo(
      Math.max(currentScale * 0.8, 0.2)
    )
  }

  const resetZoom = () => {
    if (!graphRef.value) return
    ;(graphRef.value as unknown as { zoomTo: (scale: number) => void }).zoomTo(
      1
    )
    ;(
      graphRef.value as unknown as { centerContent: () => void }
    ).centerContent()
  }

  const exportWorkflow = (): string => {
    if (!graphRef.value) return '{}'

    const nodes: NodeData[] = (
      graphRef.value as unknown as {
        getNodes: () => Array<{
          id: string
          data: { type?: string }
          label?: string
          position: () => { x: number; y: number }
        }>
      }
    )
      .getNodes()
      .map((node) => ({
        id: node.id,
        type: node.data.type || 'task',
        label: node.label || '',
        properties: {
          position: { x: node.position().x, y: node.position().y },
        },
      }))

    const edges: EdgeData[] = (
      graphRef.value as unknown as {
        getEdges: () => Array<{
          id: string
          getSourceCellId: () => string | undefined
          getTargetCellId: () => string | undefined
          getSourcePortId: () => string | undefined
          getTargetPortId: () => string | undefined
        }>
      }
    )
      .getEdges()
      .map((edge) => ({
        id: edge.id,
        source: edge.getSourceCellId()!,
        target: edge.getTargetCellId()!,
        sourcePort: edge.getSourcePortId(),
        targetPort: edge.getTargetPortId(),
      }))

    return JSON.stringify({ nodes, edges }, null, 2)
  }

  const importWorkflow = (jsonString: string) => {
    if (!graphRef.value) return

    try {
      const data = JSON.parse(jsonString)
      const graph = graphRef.value as any

      const hasInput = (data.nodes as ImportNodeData[])?.some(
        (n: ImportNodeData) => n.type === 'INPUT'
      )

      // Remove all cells except the start node (when imported data has no INPUT)
      graph.getCells().forEach((cell: any) => {
        if (cell.data?.type !== 'INPUT' || hasInput) {
          cell.remove()
        }
      })

      ;(data.nodes as ImportNodeData[])?.forEach((node: ImportNodeData) => {
        const pos = node.properties?.position || { x: 0, y: 0 }
        addNode(node.type, pos.x, pos.y, node.label)
      })

      // If imported data has no INPUT node, reposition the existing default start node
      if (!hasInput) {
        const existingInput = graph
          .getNodes()
          .find((n: any) => n.data?.type === 'INPUT')
        if (existingInput) {
          const width = graph.getWidth?.() || graph.options?.width || 800
          const height = graph.getHeight?.() || graph.options?.height || 600
          existingInput.position(
            width / 2 - nodeStyle.width / 2,
            height / 2 - nodeStyle.height / 2
          )
        }
      }

      ;(data.edges as EdgeData[])?.forEach((edge: EdgeData) => {
        graph.addEdge({
          source: { cell: edge.source, port: edge.sourcePort },
          target: { cell: edge.target, port: edge.targetPort },
        })
      })
    } catch {
      console.error('Invalid workflow JSON')
    }
  }

  return {
    graphRef,
    selectedNode,
    selectedEdge,
    initGraph,
    addNode,
    clearCanvas,
    zoomIn,
    zoomOut,
    resetZoom,
    exportWorkflow,
    importWorkflow,
  }
}
