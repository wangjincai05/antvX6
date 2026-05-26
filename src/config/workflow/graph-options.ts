export const defaultGraphOptions = {
  grid: {
    size: 1,
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
    multiple: true,
    rubberEdge: true,
    rubberNode: true,
    rubberband: true,
    multipleSelectionModifiers: ['ctrl'],
    modifiers: ['ctrl', 'shift'],
    showNodeSelectionBox: true,
    className: 'my-selecting',
    movable: true,
  },
  keyboard: true,
  clipboard: true,
  background: {
    color: '#f2f3f5'
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
}

export const nodeStyle = {
  shape: 'workflow-node',
  width: 200,
  height: 70,
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
}

export const edgeStyle = {
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
}