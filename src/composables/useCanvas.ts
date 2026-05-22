import { ref } from 'vue'
import { Graph, Node, Edge, Shape } from '@antv/x6'
import { register } from '@antv/x6-vue-shape'
import type { NodeData, EdgeData } from '@/types'

const graphRef = ref<Graph | null>(null)
const selectedNode = ref<Node | null>(null)
const selectedEdge = ref<Edge | null>(null)

export function useCanvas() {
  const initGraph = (container: HTMLElement) => {
    Shape.Rect.define({
      shape: 'workflow-node',
      width: 180,
      height: 60,
      attrs: {
        body: {
          fill: '#ffffff',
          stroke: '#5f95ff',
          strokeWidth: 2,
          rx: 8,
          ry: 8
        },
        label: {
          fontSize: 14,
          fill: '#333333'
        }
      }
    })

    graphRef.value = new Graph({
      container,
      width: container.offsetWidth,
      height: container.offsetHeight,
      grid: {
        size: 10,
        visible: true,
        type: 'dot',
        args: {
          color: '#d0d0d0',
          thickness: 1
        }
      },
      panning: {
        enabled: true,
        modifiers: 'shift'
      },
      mousewheel: {
        enabled: true,
        modifiers: 'ctrl',
        minScale: 0.2,
        maxScale: 2
      },
      selecting: {
        enabled: true,
        rubberband: true,
        showNodeSelectionBox: true
      },
      connecting: {
        router: 'manhattan',
        connector: {
          name: 'rounded',
          args: {
            radius: 8
          }
        },
        anchor: 'center',
        connectionPoint: 'anchor',
        allowBlank: false,
        snap: {
          radius: 20
        },
        createEdge() {
          return graphRef.value!.createEdge({
            attrs: {
              line: {
                stroke: '#5f95ff',
                strokeWidth: 2,
                targetMarker: {
                  name: 'classic',
                  size: 8
                }
              }
            },
            zIndex: 0
          })
        },
        validateConnection({ sourceCell, targetCell, sourceMagnet, targetMagnet }) {
          if (!sourceMagnet) return false
          if (!targetMagnet) return false
          if (sourceCell === targetCell) return false
          return true
        }
      },
      highlighting: {
        magnetAdsorbed: {
          name: 'stroke',
          args: {
            attrs: {
              fill: '#fff',
              stroke: '#31d0c6',
              strokeWidth: 4
            }
          }
        }
      }
    })

    graphRef.value.on('node:click', ({ node }) => {
      selectedNode.value = node
      selectedEdge.value = null
    })

    graphRef.value.on('edge:click', ({ edge }) => {
      selectedEdge.value = edge
      selectedNode.value = null
    })

    graphRef.value.on('blank:click', () => {
      selectedNode.value = null
      selectedEdge.value = null
    })

    graphRef.value.bindKey(['backspace', 'delete'], () => {
      const cells = graphRef.value!.getSelectedCells()
      if (cells.length) {
        graphRef.value!.removeCells(cells)
      }
    })

    graphRef.value.bindKey('ctrl+z', () => {
      graphRef.value!.undo()
    })

    graphRef.value.bindKey('ctrl+y', () => {
      graphRef.value!.redo()
    })

    return graphRef.value
  }

  const addNode = (type: string, x: number, y: number, label?: string) => {
    if (!graphRef.value) return null

    const colors: Record<string, string> = {
      start: '#10b981',
      end: '#ef4444',
      task: '#3b82f6',
      condition: '#f59e0b',
      parallel: '#8b5cf6'
    }

    const icons: Record<string, string> = {
      start: '▶',
      end: '■',
      task: '⚙',
      condition: '?',
      parallel: '⟹'
    }

    const node = graphRef.value.addNode({
      shape: 'workflow-node',
      x,
      y,
      label: label || getDefaultLabel(type),
      attrs: {
        body: {
          stroke: colors[type] || '#5f95ff'
        }
      },
      ports: {
        groups: {
          top: {
            position: 'top',
            attrs: {
              circle: {
                r: 6,
                magnet: true,
                stroke: '#5f95ff',
                strokeWidth: 2,
                fill: '#fff'
              }
            }
          },
          bottom: {
            position: 'bottom',
            attrs: {
              circle: {
                r: 6,
                magnet: true,
                stroke: '#5f95ff',
                strokeWidth: 2,
                fill: '#fff'
              }
            }
          },
          left: {
            position: 'left',
            attrs: {
              circle: {
                r: 6,
                magnet: true,
                stroke: '#5f95ff',
                strokeWidth: 2,
                fill: '#fff'
              }
            }
          },
          right: {
            position: 'right',
            attrs: {
              circle: {
                r: 6,
                magnet: true,
                stroke: '#5f95ff',
                strokeWidth: 2,
                fill: '#fff'
              }
            }
          }
        },
        items: getPortsByType(type)
      },
      data: {
        type,
        icon: icons[type] || '○'
      }
    })

    return node
  }

  const getDefaultLabel = (type: string): string => {
    const labels: Record<string, string> = {
      start: '开始',
      end: '结束',
      task: '任务',
      condition: '条件判断',
      parallel: '并行分支'
    }
    return labels[type] || '节点'
  }

  const getPortsByType = (type: string): { group: string; id: string }[] => {
    const ports: Record<string, { group: string; id: string }[]> = {
      start: [{ group: 'bottom', id: 'out-port' }],
      end: [{ group: 'top', id: 'in-port' }],
      task: [
        { group: 'top', id: 'in-port' },
        { group: 'bottom', id: 'out-port' }
      ],
      condition: [
        { group: 'top', id: 'in-port' },
        { group: 'left', id: 'left-port' },
        { group: 'right', id: 'right-port' }
      ],
      parallel: [
        { group: 'top', id: 'in-port' },
        { group: 'bottom', id: 'out-port-1' },
        { group: 'bottom', id: 'out-port-2' }
      ]
    }
    return ports[type] || [
      { group: 'top', id: 'in-port' },
      { group: 'bottom', id: 'out-port' }
    ]
  }

  const exportWorkflow = (): string => {
    if (!graphRef.value) return '{}'

    const nodes: NodeData[] = graphRef.value.getNodes().map((node) => ({
      id: node.id,
      type: node.data.type || 'task',
      label: node.label || '',
      properties: {
        position: { x: node.position().x, y: node.position().y }
      }
    }))

    const edges: EdgeData[] = graphRef.value.getEdges().map((edge) => ({
      id: edge.id,
      source: edge.getSourceCellId()!,
      target: edge.getTargetCellId()!,
      sourcePort: edge.getSourcePortId(),
      targetPort: edge.getTargetPortId()
    }))

    return JSON.stringify({ nodes, edges }, null, 2)
  }

  const importWorkflow = (jsonString: string) => {
    if (!graphRef.value) return

    try {
      const data = JSON.parse(jsonString)
      graphRef.value.clearCells()

      data.nodes?.forEach((node: NodeData) => {
        addNode(
          node.type,
          node.properties.position?.x || 0,
          node.properties.position?.y || 0,
          node.label
        )
      })

      data.edges?.forEach((edge: EdgeData) => {
        graphRef.value!.addEdge({
          source: { cell: edge.source, port: edge.sourcePort },
          target: { cell: edge.target, port: edge.targetPort }
        })
      })
    } catch {
      console.error('Invalid workflow JSON')
    }
  }

  const clearCanvas = () => {
    graphRef.value?.clearCells()
    selectedNode.value = null
    selectedEdge.value = null
  }

  return {
    graphRef,
    selectedNode,
    selectedEdge,
    initGraph,
    addNode,
    exportWorkflow,
    importWorkflow,
    clearCanvas
  }
}