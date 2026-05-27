export const defaultGraphOptions = {
  grid: {
    size: 1,
    visible: true,
    type: 'dot',
    args: {
      color: '#d0d0d0',
      thickness: 1,
    },
  },
  panning: {
    enabled: true,
    modifiers: 'shift',
  },
  mousewheel: {
    enabled: true,
    modifiers: 'ctrl',
    minScale: 0.2,
    maxScale: 2,
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
    color: '#f2f3f5',
  },
  connecting: {
    router: 'manhattan',
    connector: {
      name: 'rounded',
      args: {
        radius: 8,
      },
    },
    anchor: 'center',
    connectionPoint: 'anchor',
    allowBlank: false,
    allowLoop: false,
    highlight: true,
    snap: {
      radius: 50,
    },
  },
  highlighting: {
    magnetAvailable: {
      name: 'stroke',
      args: {
        padding: 8,
        attrs: {
          fill: '#fff',
          stroke: '#31d0c6',
          strokeWidth: 4,
        },
      },
    },
  },
};

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
      ry: 8,
    },
    label: {
      fontSize: 14,
      fill: '#333333',
    },
  },
};

export const edgeStyle = {
  attrs: {
    line: {
      stroke: '#5f95ff',
      strokeWidth: 2,
      targetMarker: {
        name: 'classic',
        size: 8,
      },
    },
  },
  zIndex: 0,
};

export const edgeHighlightStyle = {
  attrs: {
    line: {
      stroke: '#ff4d4f',
      strokeWidth: 3,
    },
  },
};

export const edgeDeleteIcon = {
  attrs: {
    body: {
      fill: '#ff4d4f',
      stroke: '#fff',
      strokeWidth: 2,
      rx: 12,
      ry: 12,
    },
    label: {
      text: '×',
      fill: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
      textAnchor: 'middle',
      textVerticalAnchor: 'middle',
    },
  },
  width: 24,
  height: 24,
  x: -12,
  y: -12,
};
