export function createInitialState() {
  return {
    objects: [],
    activeTool: 'select',
    selectedObjectIndex: -1,
    isDrawing: false,
    dragStart: { x: 0, y: 0 },
    dragEnd: { x: 0, y: 0 },
    polygonPoints: [],
    polygonPreviewPoint: null,
    isMoving: false,
    moveStartPos: { x: 0, y: 0 },
    isResizing: false,
    isDraggingVertex: false,
    selectedVertexIndex: -1,
    resizeHandle: null,
    resizeStartPos: { x: 0, y: 0 },
    initialRectCoords: null,
    imageLoaded: false,
    imageSrc: ''
  };
}
