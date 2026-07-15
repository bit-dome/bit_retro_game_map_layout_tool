export function createInitialState() {
  return {
    objects: [],
    lastSpawnName: 'coin',
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
    imageSrc: '',
    mapWidth: 0,
    mapHeight: 0,
    mapOffsetX: 0,
    mapOffsetY: 0,
    workspacePaddingRatio: 0.35,
    workspaceMinPadding: 140
  };
}
