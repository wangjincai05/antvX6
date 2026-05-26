import { ref } from 'vue'
import { Dnd, type Graph, type Node } from '@antv/x6'
import { useGraph } from './useGraph'
import { nodeRegistry, portGroups } from '@/config/workflow/node-registry'

const isDragging = ref(false)
const dragNodeType = ref<string | null>(null)

const loopNodeTypes = ['LOOP_BREAK']

export function useDnd() {
  const { graphRef } = useGraph()

  const startDrag = (nodeType: string) => {
    isDragging.value = true
    dragNodeType.value = nodeType
  }

  const endDrag = () => {
    isDragging.value = false
    dragNodeType.value = null
  }

  const handleDragStart = (event: DragEvent, nodeType: string) => {
    if (!graphRef.value) return

    const config = nodeRegistry[nodeType]
    if (!config) return

    const ports = config.ports

    const templateNode = (graphRef.value as unknown as Graph).createNode({
      shape: 'workflow-node',
      label: config.name,
      attrs: {
        body: {
          stroke: '#5f95ff'
        }
      },
      ports: {
        groups: portGroups,
        items: ports
      },
      data: {
        type: nodeType,
        icon: config.icon
      }
    })

    const dnd = new Dnd({
      target: graphRef.value as unknown as Graph,
      getDropNode: (node: Node) => {
        return node.clone() as Node
      },
      validateNode: (droppingNode, _options) => {
        const nodeData = droppingNode.getData() as { type: string }
        const position = droppingNode.position()

        const nodesUnder = (graphRef.value as unknown as Graph).getNodesFromPoint(position.x, position.y)
        const nodeUnder = nodesUnder[0]

        if (loopNodeTypes.includes(nodeData.type)) {
          if (!nodeUnder || nodeUnder.getData()?.type !== 'LOOP') {
            alert(`${config.name}节点只能放置在循环节点内`)
            return false
          }
        }

        return true
      }
    })

    dnd.start(templateNode, event as any)
    endDrag()
  }

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
  }

  return {
    isDragging,
    dragNodeType,
    startDrag,
    endDrag,
    handleDragStart,
    handleDragOver
  }
}