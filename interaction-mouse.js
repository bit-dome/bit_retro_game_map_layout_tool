import { buildObjectFromDrag, normalizeSelectedRectangle } from './object-model.js';

export function createMouseInteraction(state, dom, draw, uiActions, updateJSONTextarea) {
  function getObjectIndexAt(canvasX, canvasY) {
    const nx = canvasX / dom.paintCanvas.width;
    const ny = canvasY / dom.paintCanvas.height;

    for (let i = state.objects.length - 1; i >= 0; i -= 1) {
      const obj = state.objects[i];
      if (!obj.rectangle) continue;

      const rect = obj.rectangle;
      const minX = Math.min(rect.x1, rect.x2);
      const maxX = Math.max(rect.x1, rect.x2);
      const minY = Math.min(rect.y1, rect.y2);
      const maxY = Math.max(rect.y1, rect.y2);

      if (nx >= minX && nx <= maxX && ny >= minY && ny <= maxY) {
        return i;
      }
    }

    return -1;
  }

  function getResizeHandleAt(x, y) {
    if (state.selectedObjectIndex === -1 || state.activeTool !== 'select') return null;

    const obj = state.objects[state.selectedObjectIndex];
    const rect = obj.rectangle;

    const cx1 = rect.x1 * dom.paintCanvas.width;
    const cy1 = rect.y1 * dom.paintCanvas.height;
    const cx2 = rect.x2 * dom.paintCanvas.width;
    const cy2 = rect.y2 * dom.paintCanvas.height;

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

  function onMouseDown(e) {
    if (!state.imageLoaded) return;

    const rect = dom.paintCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (state.activeTool === 'select') {
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
        state.isMoving = true;
        state.moveStartPos = { x, y };
        state.initialRectCoords = JSON.parse(JSON.stringify(state.objects[clickedIndex].rectangle));
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

    const rect = dom.paintCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (state.activeTool === 'select') {
      if (state.isResizing && state.selectedObjectIndex !== -1) {
        const deltaX = (x - state.resizeStartPos.x) / dom.paintCanvas.width;
        const deltaY = (y - state.resizeStartPos.y) / dom.paintCanvas.height;
        const initial = state.initialRectCoords;
        const selectedObj = state.objects[state.selectedObjectIndex];

        let x1 = initial.x1;
        let y1 = initial.y1;
        let x2 = initial.x2;
        let y2 = initial.y2;

        const minSize = 0.005;

        switch (state.resizeHandle) {
          case 'tl':
            x1 = Math.max(0, Math.min(initial.x1 + deltaX, x2 - minSize));
            y1 = Math.max(0, Math.min(initial.y1 + deltaY, y2 - minSize));
            break;
          case 'tr':
            x2 = Math.max(x1 + minSize, Math.min(initial.x2 + deltaX, 1));
            y1 = Math.max(0, Math.min(initial.y1 + deltaY, y2 - minSize));
            break;
          case 'bl':
            x1 = Math.max(0, Math.min(initial.x1 + deltaX, x2 - minSize));
            y2 = Math.max(y1 + minSize, Math.min(initial.y2 + deltaY, 1));
            break;
          case 'br':
            x2 = Math.max(x1 + minSize, Math.min(initial.x2 + deltaX, 1));
            y2 = Math.max(y1 + minSize, Math.min(initial.y2 + deltaY, 1));
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
        const deltaX = (x - state.moveStartPos.x) / dom.paintCanvas.width;
        const deltaY = (y - state.moveStartPos.y) / dom.paintCanvas.height;
        const selectedObj = state.objects[state.selectedObjectIndex];

        let newX1 = state.initialRectCoords.x1 + deltaX;
        let newX2 = state.initialRectCoords.x2 + deltaX;
        const w = newX2 - newX1;

        if (newX1 < 0) {
          newX1 = 0;
          newX2 = w;
        } else if (newX2 > 1) {
          newX2 = 1;
          newX1 = 1 - w;
        }

        let newY1 = state.initialRectCoords.y1 + deltaY;
        let newY2 = state.initialRectCoords.y2 + deltaY;
        const h = newY2 - newY1;

        if (newY1 < 0) {
          newY1 = 0;
          newY2 = h;
        } else if (newY2 > 1) {
          newY2 = 1;
          newY1 = 1 - h;
        }

        selectedObj.rectangle = {
          x1: parseFloat(newX1.toFixed(4)),
          y1: parseFloat(newY1.toFixed(4)),
          x2: parseFloat(newX2.toFixed(4)),
          y2: parseFloat(newY2.toFixed(4))
        };

        uiActions.showProperties(state.selectedObjectIndex);
        updateJSONTextarea();
        draw();
      } else {
        const resizeHandle = getResizeHandleAt(x, y);
        if (resizeHandle) {
          dom.paintCanvas.style.cursor = (resizeHandle === 'tl' || resizeHandle === 'br') ? 'nwse-resize' : 'nesw-resize';
        } else {
          const hoveredIndex = getObjectIndexAt(x, y);
          dom.paintCanvas.style.cursor = hoveredIndex !== -1 ? 'move' : 'default';
        }
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
      state.resizeHandle = null;
      state.initialRectCoords = null;

      if (state.selectedObjectIndex !== -1) {
        normalizeSelectedRectangle(state);
        updateJSONTextarea();
        draw();
      }
    } else {
      if (!state.isDrawing) return;
      state.isDrawing = false;

      const dx = Math.abs(state.dragEnd.x - state.dragStart.x);
      const dy = Math.abs(state.dragEnd.y - state.dragStart.y);

      if (dx >= 5 && dy >= 5) {
        const newObject = buildObjectFromDrag(state, dom.paintCanvas.width, dom.paintCanvas.height);
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

  return {
    onMouseDown,
    onMouseMove,
    onMouseUp
  };
}
