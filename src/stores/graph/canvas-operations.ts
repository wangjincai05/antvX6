import type { Graph } from '@antv/x6';
import { ZOOM_FACTOR_IN, ZOOM_FACTOR_OUT, MAX_ZOOM, MIN_ZOOM } from './constants';

export function zoomIn(graphRef: { value: Graph | null }): void {
  if (!graphRef.value) return;

  const graph = graphRef.value as unknown as {
    getScale: () => number;
    zoomTo: (scale: number) => void;
  };

  const currentScale = graph.getScale();
  const newScale = Math.min(currentScale * ZOOM_FACTOR_IN, MAX_ZOOM);
  graph.zoomTo(newScale);
}

export function zoomOut(graphRef: { value: Graph | null }): void {
  if (!graphRef.value) return;

  const graph = graphRef.value as unknown as {
    getScale: () => number;
    zoomTo: (scale: number) => void;
  };

  const currentScale = graph.getScale();
  const newScale = Math.max(currentScale * ZOOM_FACTOR_OUT, MIN_ZOOM);
  graph.zoomTo(newScale);
}

export function resetZoom(graphRef: { value: Graph | null }): void {
  if (!graphRef.value) return;

  const graph = graphRef.value as unknown as {
    zoomTo: (scale: number) => void;
    centerContent: () => void;
  };

  graph.zoomTo(1);
  graph.centerContent();
}
