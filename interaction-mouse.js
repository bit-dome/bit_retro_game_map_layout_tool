import {
  buildObjectFromDrag,
  buildPlatformPolygon,
  buildPolyFloorLine,
  buildSpawnPoint,
  normalizeSelectedPoint,
  normalizeSelectedRectangle,
  normalizeSelectedPolygon,
  normalizeSelectedPolyline
} from './object-model.js';

export function createMouseInteraction(state, dom, draw, uiActions, updateJSONTextarea) {
  function getMapMetrics() {
    const domMapWidth = dom.mapImg.clientWidth;
    const domMapHeight = dom.mapImg.clientHeight;
    const domMapOffsetX = dom.mapImg.offsetLeft;
    const domMapOffsetY = dom.mapImg.offsetTop;

    return {
      mapWidth: domMapWidth > 0 ? domMapWidth : (state.mapWidth || dom.paintCanvas.width || 1),
      mapHeight: domMapHeight > 0 ? domMapHeight : (state.mapHeight || dom.paintCanvas.height || 1),
      mapOffsetX: Number.isFinite(domMapOffsetX) ? domMapOffsetX : (state.mapOffsetX || 0),
      mapOffsetY: Number.isFinite(domMapOffsetY) ? domMapOffsetY : (state.mapOffsetY || 0)
    };
  }

  function toCanvasX(nx) {
    const { mapWidth, mapOffsetX } = getMapMetrics();
    return mapOffsetX + nx * mapWidth;
  }

  function toCanvasY(ny) {
    const { mapHeight, mapOffsetY } = getMapMetrics();
    return mapOffsetY + ny * mapHeight;
  }

  function toMapX(canvasX) {
    const { mapWidth, mapOffsetX } = getMapMetrics();
    return (canvasX - mapOffsetX) / mapWidth;
  }

  function toMapY(canvasY) {
    const { mapHeight, mapOffsetY } = getMapMetrics();
    return (canvasY - mapOffsetY) / mapHeight;
  }

  function getCanvasPoint(e) {
    const rect = dom.paintCanvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (dom.paintCanvas.width / rect.width),
      y: (e.clientY - rect.top) * (dom.paintCanvas.height / rect.height)
    };
  }

  function getObjectBounds(obj) {
    if (obj.rectangle) {
      const rect = obj.rectangle;
      return {
        x1: toCanvasX(Math.min(rect.x1, rect.x2)),
        y1: toCanvasY(Math.min(rect.y1, rect.y2)),
        x2: toCanvasX(Math.max(rect.x1, rect.x2)),
        y2: toCanvasY(Math.max(rect.y1, rect.y2))
      };
    }

    if (Array.isArray(obj.polygon) && obj.polygon.length >= 3) {
      const px = obj.polygon.map((pt) => toCanvasX(Number(pt.x) || 0));
      const py = obj.polygon.map((pt) => toCanvasY(Number(pt.y) || 0));
      return {
        x1: Math.min(...px),
        y1: Math.min(...py),
        x2: Math.max(...px),
        y2: Math.max(...py)
      };
    }

    if (Array.isArray(obj.polyline) && obj.polyline.length >= 2) {
      const px = obj.polyline.map((pt) => toCanvasX(Number(pt.x) || 0));
      const py = obj.polyline.map((pt) => toCanvasY(Number(pt.y) || 0));
      return {
        x1: Math.min(...px),
        y1: Math.min(...py),
        x2: Math.max(...px),
        y2: Math.max(...py)
      };
    }

    if (obj.type === 'spawn_point' && obj.coord) {
      const x = toCanvasX(Number(obj.coord.x) || 0);
      const y = toCanvasY(Number(obj.coord.y) || 0);
      const halfSize = 10;
      return {
        x1: x - halfSize,
        y1: y - halfSize,
        x2: x + halfSize,
        y2: y + halfSize
      };
    }

    return null;
  }

  function getObjectLabel(obj, hasPolygon) {
    if (obj.type === 'area') {
      return obj.name || 'paper_station';
    }

    if (obj.type !== 'tunnel') return null;

    const tunnelName = typeof obj.tunnel_name === 'string' && obj.tunnel_name.trim()
      ? obj.tunnel_name
      : (obj.tunnel_id !== undefined ? String(obj.tunnel_id) : '');
    return `Tunnel (${tunnelName})`;
  }

  function getLabelBounds(obj) {
    const bounds = getObjectBounds(obj);
    if (!bounds) return null;

    const hasPolygon = Array.isArray(obj.polygon) && obj.polygon.length >= 3;
    const { ctx } = dom;
    ctx.save();
    ctx.font = '10px "Fira Code", monospace';
    const label = getObjectLabel(obj, hasPolygon);
    if (!label) {
      ctx.restore();
      return null;
    }

    const width = ctx.measureText(label).width + 8;
    ctx.restore();

    return {
      x1: bounds.x1,
      y1: bounds.y1 - 16,
      x2: bounds.x1 + width,
      y2: bounds.y1 + 2
    };
  }

  function isPointInLabel(x, y, obj) {
    const labelBounds = getLabelBounds(obj);
    if (!labelBounds) return false;

    return x >= labelBounds.x1
      && x <= labelBounds.x2
      && y >= labelBounds.y1
      && y <= labelBounds.y2;
  }

  function isPointDrawingTool(toolName) {
    return toolName === 'polygon' || toolName === 'poly_floor_line';
  }

  function isPointInPolygon(nx, ny, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
      const xi = Number(polygon[i].x) || 0;
      const yi = Number(polygon[i].y) || 0;
      const xj = Number(polygon[j].x) || 0;
      const yj = Number(polygon[j].y) || 0;

      const intersects = ((yi > ny) !== (yj > ny))
        && (nx < ((xj - xi) * (ny - yi)) / ((yj - yi) || 1e-10) + xi);
      if (intersects) inside = !inside;
    }
    return inside;
  }

  function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const vx = x2 - x1;
    const vy = y2 - y1;
    const wx = px - x1;
    const wy = py - y1;

    const lenSq = vx * vx + vy * vy;
    if (lenSq <= 1e-10) {
      return Math.hypot(px - x1, py - y1);
    }

    const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / lenSq));
    const projX = x1 + t * vx;
    const projY = y1 + t * vy;
    return Math.hypot(px - projX, py - projY);
  }

  function clearPolygonDraft() {
    state.isDrawing = false;
    state.polygonPoints = [];
    state.polygonPreviewPoint = null;
  }

  function finalizePolygonDrawing() {
    const minPoints = state.activeTool === 'poly_floor_line' ? 2 : 3;
    if (state.polygonPoints.length < minPoints) {
      clearPolygonDraft();
      draw();
      return;
    }

    const { mapWidth, mapHeight, mapOffsetX, mapOffsetY } = getMapMetrics();
    const mapRelativePoints = state.polygonPoints.map((pt) => ({
      x: pt.x - mapOffsetX,
      y: pt.y - mapOffsetY
    }));

    const newObject = state.activeTool === 'poly_floor_line'
      ? buildPolyFloorLine(mapRelativePoints, mapWidth, mapHeight)
      : buildPlatformPolygon(mapRelativePoints, mapWidth, mapHeight);
    clearPolygonDraft();

    if (!newObject) {
      draw();
      return;
    }

    state.objects.push(newObject);
    state.selectedObjectIndex = state.objects.length - 1;
    uiActions.showProperties(state.selectedObjectIndex);
    updateJSONTextarea();
    draw();
  }

  function getObjectIndexAt(canvasX, canvasY) {
    const nx = toMapX(canvasX);
    const ny = toMapY(canvasY);

    for (let i = state.objects.length - 1; i >= 0; i -= 1) {
      const obj = state.objects[i];
      if (isPointInLabel(canvasX, canvasY, obj)) {
        return i;
      }

      if (obj.rectangle) {
        const rect = obj.rectangle;
        const minX = Math.min(rect.x1, rect.x2);
        const maxX = Math.max(rect.x1, rect.x2);
        const minY = Math.min(rect.y1, rect.y2);
        const maxY = Math.max(rect.y1, rect.y2);

        if (nx >= minX && nx <= maxX && ny >= minY && ny <= maxY) {
          return i;
        }
      } else if (Array.isArray(obj.polygon) && obj.polygon.length >= 3 && isPointInPolygon(nx, ny, obj.polygon)) {
        return i;
      } else if (Array.isArray(obj.polyline) && obj.polyline.length >= 2) {
        const px = canvasX;
        const py = canvasY;
        const hitTolerance = 8;

        for (let seg = 0; seg < obj.polyline.length - 1; seg += 1) {
          const p1 = obj.polyline[seg];
          const p2 = obj.polyline[seg + 1];
          const x1 = toCanvasX(Number(p1.x) || 0);
          const y1 = toCanvasY(Number(p1.y) || 0);
          const x2 = toCanvasX(Number(p2.x) || 0);
          const y2 = toCanvasY(Number(p2.y) || 0);

          if (pointToSegmentDistance(px, py, x1, y1, x2, y2) <= hitTolerance) {
            return i;
          }
        }
      } else if (obj.type === 'spawn_point' && obj.coord) {
        const pointX = toCanvasX(Number(obj.coord.x) || 0);
        const pointY = toCanvasY(Number(obj.coord.y) || 0);
        if (Math.hypot(canvasX - pointX, canvasY - pointY) <= 10) {
          return i;
        }
      }
    }

    return -1;
  }

  function getResizeHandleAt(x, y) {
    if (state.selectedObjectIndex === -1 || state.activeTool !== 'select') return null;

    const obj = state.objects[state.selectedObjectIndex];
    if (!obj || !obj.rectangle) return null;

    const rect = obj.rectangle;

    const cx1 = toCanvasX(rect.x1);
    const cy1 = toCanvasY(rect.y1);
    const cx2 = toCanvasX(rect.x2);
    const cy2 = toCanvasY(rect.y2);

    const handles = {
      tl: { x: cx1, y: cy1 },
      tr: { x: cx2, y: cy1 },
      bl: { x: cx1, y: cy2 },
      br: { x: cx2, y: cy2 }
    };

    const hitSize = 10;

    for (const [key, pos] of Object.entries(handles)) {
      if (Math.abs(x - pos.x) <= hitSize && Math.abs(y - pos.y) <= hitSize) {
        return key;
      }
    }

    return null;
  }

  function getPolygonVertexHandleAt(x, y, obj) {
    if (!obj || !Array.isArray(obj.polygon) || obj.polygon.length < 3) return -1;

    const hitSize = 9;
    for (let i = 0; i < obj.polygon.length; i += 1) {
      const px = toCanvasX(Number(obj.polygon[i].x) || 0);
      const py = toCanvasY(Number(obj.polygon[i].y) || 0);
      if (Math.abs(x - px) <= hitSize && Math.abs(y - py) <= hitSize) {
        return i;
      }
    }

    return -1;
  }

  function getPolylineVertexHandleAt(x, y, obj) {
    if (!obj || !Array.isArray(obj.polyline) || obj.polyline.length < 2) return -1;

    const hitSize = 9;
    for (let i = 0; i < obj.polyline.length; i += 1) {
      const px = toCanvasX(Number(obj.polyline[i].x) || 0);
      const py = toCanvasY(Number(obj.polyline[i].y) || 0);
      if (Math.abs(x - px) <= hitSize && Math.abs(y - py) <= hitSize) {
        return i;
      }
    }

    return -1;
  }

  function onMouseDown(e) {
    if (!state.imageLoaded) return;

    const { x, y } = getCanvasPoint(e);

    if (isPointDrawingTool(state.activeTool)) {
      if (e.button === 2) return;

      if (!state.isDrawing) {
        state.isDrawing = true;
        state.polygonPoints = [{ x, y }];
        state.polygonPreviewPoint = { x, y };
        draw();
        return;
      }

      const first = state.polygonPoints[0];
      const closeToFirst = Math.hypot(x - first.x, y - first.y) <= 10;
      if (state.activeTool === 'polygon' && state.polygonPoints.length >= 3 && closeToFirst) {
        finalizePolygonDrawing();
        return;
      }

      state.polygonPoints.push({ x, y });
      state.polygonPreviewPoint = { x, y };

      const minPoints = state.activeTool === 'poly_floor_line' ? 2 : 3;
      if (e.detail >= 2 && state.polygonPoints.length >= minPoints) {
        finalizePolygonDrawing();
      } else {
        draw();
      }
      return;
    }

    if (state.activeTool === 'spawn_point') {
      if (e.button !== 0) return;

      const { mapWidth, mapHeight, mapOffsetX, mapOffsetY } = getMapMetrics();

      const newObject = buildSpawnPoint(
        x - mapOffsetX,
        y - mapOffsetY,
        mapWidth,
        mapHeight,
        state.lastSpawnName
      );
      state.lastSpawnName = newObject.name;
      state.objects.push(newObject);
      state.selectedObjectIndex = state.objects.length - 1;
      uiActions.showProperties(state.selectedObjectIndex);
      updateJSONTextarea();
      draw();
      return;
    }

    if (state.activeTool === 'select') {
      state.isDraggingVertex = false;
      state.selectedVertexIndex = -1;

      const resizeHandle = getResizeHandleAt(x, y);
      if (resizeHandle) {
        state.isResizing = true;
        state.resizeHandle = resizeHandle;
        state.resizeStartPos = { x, y };
        state.initialRectCoords = JSON.parse(JSON.stringify(state.objects[state.selectedObjectIndex].rectangle));
        draw();
        return;
      }

      const clickedIndex = getObjectIndexAt(x, y);
      state.selectedObjectIndex = clickedIndex;

      if (clickedIndex !== -1) {
        uiActions.showProperties(clickedIndex);
        const clickedObj = state.objects[clickedIndex];
        let vertexIndex = getPolygonVertexHandleAt(x, y, clickedObj);
        if (vertexIndex === -1) {
          vertexIndex = getPolylineVertexHandleAt(x, y, clickedObj);
        }

        if (vertexIndex !== -1) {
          state.isDraggingVertex = true;
          state.selectedVertexIndex = vertexIndex;
        } else {
          state.isMoving = true;
          state.moveStartPos = { x, y };
          state.initialRectCoords = JSON.parse(JSON.stringify(clickedObj));
        }
      } else {
        uiActions.hideProperties();
      }
      draw();
    } else {
      state.isDrawing = true;
      state.dragStart = { x, y };
      state.dragEnd = { x, y };
    }
  }

  function onMouseMove(e) {
    if (!state.imageLoaded) return;

    const { x, y } = getCanvasPoint(e);

    if (state.activeTool === 'select') {
      if (state.isDraggingVertex && state.selectedObjectIndex !== -1) {
        const selectedObj = state.objects[state.selectedObjectIndex];
        if (!selectedObj) return;

        const vertexIndex = state.selectedVertexIndex;
        const targetPoints = Array.isArray(selectedObj.polygon)
          ? selectedObj.polygon
          : Array.isArray(selectedObj.polyline)
            ? selectedObj.polyline
            : null;
        if (!targetPoints || vertexIndex < 0 || vertexIndex >= targetPoints.length) return;

        targetPoints[vertexIndex] = {
          x: parseFloat(toMapX(x).toFixed(4)),
          y: parseFloat(toMapY(y).toFixed(4))
        };

        uiActions.showProperties(state.selectedObjectIndex);
        updateJSONTextarea();
        draw();
      } else if (state.isResizing && state.selectedObjectIndex !== -1) {
        const { mapWidth, mapHeight } = getMapMetrics();
        const deltaX = (x - state.resizeStartPos.x) / mapWidth;
        const deltaY = (y - state.resizeStartPos.y) / mapHeight;
        const initial = state.initialRectCoords;
        const selectedObj = state.objects[state.selectedObjectIndex];

        if (!selectedObj || !selectedObj.rectangle || !initial) return;

        let x1 = initial.x1;
        let y1 = initial.y1;
        let x2 = initial.x2;
        let y2 = initial.y2;

        const minSize = 0.005;

        switch (state.resizeHandle) {
          case 'tl':
            x1 = Math.min(initial.x1 + deltaX, x2 - minSize);
            y1 = Math.min(initial.y1 + deltaY, y2 - minSize);
            break;
          case 'tr':
            x2 = Math.max(x1 + minSize, initial.x2 + deltaX);
            y1 = Math.min(initial.y1 + deltaY, y2 - minSize);
            break;
          case 'bl':
            x1 = Math.min(initial.x1 + deltaX, x2 - minSize);
            y2 = Math.max(y1 + minSize, initial.y2 + deltaY);
            break;
          case 'br':
            x2 = Math.max(x1 + minSize, initial.x2 + deltaX);
            y2 = Math.max(y1 + minSize, initial.y2 + deltaY);
            break;
          default:
            break;
        }

        selectedObj.rectangle = {
          x1: parseFloat(x1.toFixed(4)),
          y1: parseFloat(y1.toFixed(4)),
          x2: parseFloat(x2.toFixed(4)),
          y2: parseFloat(y2.toFixed(4))
        };

        uiActions.showProperties(state.selectedObjectIndex);
        updateJSONTextarea();
        draw();
      } else if (state.isMoving && state.selectedObjectIndex !== -1) {
        const { mapWidth, mapHeight } = getMapMetrics();
        const deltaX = (x - state.moveStartPos.x) / mapWidth;
        const deltaY = (y - state.moveStartPos.y) / mapHeight;
        const selectedObj = state.objects[state.selectedObjectIndex];
        const initialObj = state.initialRectCoords;

        if (!selectedObj || !initialObj) return;

        if (selectedObj.rectangle && initialObj.rectangle) {
          const newX1 = initialObj.rectangle.x1 + deltaX;
          const newX2 = initialObj.rectangle.x2 + deltaX;
          const newY1 = initialObj.rectangle.y1 + deltaY;
          const newY2 = initialObj.rectangle.y2 + deltaY;

          selectedObj.rectangle = {
            x1: parseFloat(newX1.toFixed(4)),
            y1: parseFloat(newY1.toFixed(4)),
            x2: parseFloat(newX2.toFixed(4)),
            y2: parseFloat(newY2.toFixed(4))
          };
        } else if (Array.isArray(selectedObj.polygon) && Array.isArray(initialObj.polygon)) {
          selectedObj.polygon = initialObj.polygon.map((pt) => ({
            x: parseFloat((Number(pt.x) + deltaX).toFixed(4)),
            y: parseFloat((Number(pt.y) + deltaY).toFixed(4))
          }));
        } else if (Array.isArray(selectedObj.polyline) && Array.isArray(initialObj.polyline)) {
          selectedObj.polyline = initialObj.polyline.map((pt) => ({
            x: parseFloat((Number(pt.x) + deltaX).toFixed(4)),
            y: parseFloat((Number(pt.y) + deltaY).toFixed(4))
          }));
        } else if (selectedObj.coord && initialObj.coord) {
          selectedObj.coord = {
            x: parseFloat(((Number(initialObj.coord.x) || 0) + deltaX).toFixed(4)),
            y: parseFloat(((Number(initialObj.coord.y) || 0) + deltaY).toFixed(4))
          };
        }

        uiActions.showProperties(state.selectedObjectIndex);
        updateJSONTextarea();
        draw();
      } else {
        const resizeHandle = getResizeHandleAt(x, y);
        if (resizeHandle) {
          dom.paintCanvas.style.cursor = (resizeHandle === 'tl' || resizeHandle === 'br') ? 'nwse-resize' : 'nesw-resize';
        } else {
          const selectedObj = state.selectedObjectIndex !== -1 ? state.objects[state.selectedObjectIndex] : null;
          let vertexIndex = getPolygonVertexHandleAt(x, y, selectedObj);
          if (vertexIndex === -1) {
            vertexIndex = getPolylineVertexHandleAt(x, y, selectedObj);
          }
          if (vertexIndex !== -1) {
            dom.paintCanvas.style.cursor = 'pointer';
          } else {
            const hoveredIndex = getObjectIndexAt(x, y);
            dom.paintCanvas.style.cursor = hoveredIndex !== -1 ? 'move' : 'default';
          }
        }
      }
    } else if (isPointDrawingTool(state.activeTool)) {
      dom.paintCanvas.style.cursor = 'crosshair';
      if (state.isDrawing) {
        state.polygonPreviewPoint = { x, y };
        draw();
      }
    } else {
      dom.paintCanvas.style.cursor = 'crosshair';
      if (state.isDrawing) {
        state.dragEnd = { x, y };
        draw();
      }
    }
  }

  function onMouseUp() {
    if (state.activeTool === 'select') {
      state.isMoving = false;
      state.isResizing = false;
      state.isDraggingVertex = false;
      state.resizeHandle = null;
      state.selectedVertexIndex = -1;
      state.initialRectCoords = null;

      if (state.selectedObjectIndex !== -1) {
        const selected = state.objects[state.selectedObjectIndex];
        if (selected && selected.rectangle) {
          normalizeSelectedRectangle(state);
        } else if (selected && Array.isArray(selected.polygon)) {
          normalizeSelectedPolygon(state);
        } else if (selected && Array.isArray(selected.polyline)) {
          normalizeSelectedPolyline(state);
        } else if (selected && selected.coord) {
          normalizeSelectedPoint(state);
        }
        updateJSONTextarea();
        draw();
      }
    } else if (isPointDrawingTool(state.activeTool)) {
      return;
    } else {
      if (!state.isDrawing) return;
      state.isDrawing = false;

      const dx = Math.abs(state.dragEnd.x - state.dragStart.x);
      const dy = Math.abs(state.dragEnd.y - state.dragStart.y);

      if (dx >= 5 && dy >= 5) {
        const { mapWidth, mapHeight, mapOffsetX, mapOffsetY } = getMapMetrics();
        const draftState = {
          ...state,
          dragStart: {
            x: state.dragStart.x - mapOffsetX,
            y: state.dragStart.y - mapOffsetY
          },
          dragEnd: {
            x: state.dragEnd.x - mapOffsetX,
            y: state.dragEnd.y - mapOffsetY
          }
        };
        const newObject = buildObjectFromDrag(draftState, mapWidth, mapHeight);
        state.objects.push(newObject);
        state.selectedObjectIndex = state.objects.length - 1;
        uiActions.showProperties(state.selectedObjectIndex);
        updateJSONTextarea();
        draw();
      } else {
        draw();
      }
    }
  }

  function onContextMenu(e) {
    if (isPointDrawingTool(state.activeTool) && state.isDrawing) {
      e.preventDefault();
      finalizePolygonDrawing();
    }
  }

  return {
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onContextMenu,
    finalizePolygonDrawing
  };
}
