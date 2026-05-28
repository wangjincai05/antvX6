import {
  COLORS,
  ZOOM_MIN,
  ZOOM_MAX,
  NODE_WIDTH,
  NODE_HEIGHT,
  GRID_CONFIG,
  SNAP_CONFIG,
  CONNECTION_CONFIG,
  EDGE_CONFIG,
  NODE_CONFIG,
} from '@/config/constants';

export const defaultGraphOptions = {
  grid: {
    size: GRID_CONFIG.size,
    visible: true,
    type: 'dot',
    args: {
      color: GRID_CONFIG.color,
      thickness: GRID_CONFIG.thickness,
    },
  },
  panning: {
    enabled: true,
    modifiers: 'shift',
  },
  mousewheel: {
    enabled: true,
    modifiers: 'ctrl',
    minScale: ZOOM_MIN,
    maxScale: ZOOM_MAX,
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
    color: COLORS.background,
  },
  connecting: {
    router: CONNECTION_CONFIG.router,
    connector: {
      name: 'rounded',
      args: {
        radius: CONNECTION_CONFIG.connectorRadius,
      },
    },
    anchor: CONNECTION_CONFIG.anchor,
    connectionPoint: CONNECTION_CONFIG.connectionPoint,
    allowBlank: true,
    allowLoop: false,
    highlight: true,
    snap: {
      radius: SNAP_CONFIG.radius,
    },
  },
  highlighting: {
    magnetAvailable: {
      name: 'stroke',
      args: {
        padding: 8,
        attrs: {
          fill: COLORS.nodeFill,
          stroke: COLORS.info,
          strokeWidth: 4,
        },
      },
    },
  },
};

export const nodeStyle = {
  shape: 'workflow-node',
  width: NODE_WIDTH,
  height: NODE_HEIGHT,
  attrs: {
    body: {
      fill: COLORS.nodeFill,
      stroke: COLORS.primary,
      strokeWidth: NODE_CONFIG.strokeWidth,
      rx: NODE_CONFIG.borderRadius,
      ry: NODE_CONFIG.borderRadius,
    },
    label: {
      fontSize: NODE_CONFIG.labelFontSize,
      fill: COLORS.text,
    },
  },
};

export const edgeStyle = {
  attrs: {
    line: {
      stroke: COLORS.primary,
      strokeWidth: EDGE_CONFIG.strokeWidth,
      targetMarker: {
        name: 'classic',
        size: EDGE_CONFIG.targetMarkerSize,
      },
    },
  },
  zIndex: 0,
};

export const edgeHighlightStyle = {
  attrs: {
    line: {
      stroke: COLORS.error,
      strokeWidth: EDGE_CONFIG.highlightStrokeWidth,
    },
  },
};

export const edgeDeleteIcon = {
  attrs: {
    body: {
      fill: COLORS.error,
      stroke: COLORS.nodeFill,
      strokeWidth: 2,
      rx: 12,
      ry: 12,
    },
    label: {
      text: '×',
      fill: COLORS.nodeFill,
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
