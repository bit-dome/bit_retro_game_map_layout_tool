export function createUI(state, dom, draw, callbacks) {
  function clampPositiveInt(value, fallback) {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return fallback;
    return Math.max(1, Math.round(num));
  }

  function getDecorCellCount(obj) {
    const rows = clampPositiveInt(obj?.n_row, 1);
    const cols = clampPositiveInt(obj?.n_col, 1);
    return rows * cols;
  }

  function updateDecorEventNameVisibility(obj) {
    if (!dom.propDecorEventNameContainer) return;
    const isInteract = obj?.decor_type === 'interact';
    dom.propDecorEventNameContainer.style.display = isInteract ? 'flex' : 'none';
  }

  function normalizeDecorFrameConfig(obj) {
    if (!obj) return;

    obj.n_row = clampPositiveInt(obj.n_row, 1);
    obj.n_col = clampPositiveInt(obj.n_col, 1);
    obj.fps = clampPositiveInt(obj.fps, 8);
    obj.n_frames = Math.min(clampPositiveInt(obj.n_frames, getDecorCellCount(obj)), getDecorCellCount(obj));
    const decorType = typeof obj.decor_type === 'string' ? obj.decor_type.trim() : '';
    obj.decor_type = ['normal', 'background', 'interact'].includes(decorType) ? decorType : 'normal';
    obj.event_name = typeof obj.event_name === 'string' ? obj.event_name.trim() : '';
    if (obj.decor_type !== 'interact') {
      obj.event_name = '';
    }
  }

  function getSelectedDecorObject() {
    if (state.selectedObjectIndex === -1) return null;
    const obj = state.objects[state.selectedObjectIndex];
    return obj && obj.type === 'decor' ? obj : null;
  }

  function setTool(toolName) {
    const isPointDrawingTool = state.activeTool === 'polygon' || state.activeTool === 'poly_floor_line';

    if (isPointDrawingTool && toolName !== state.activeTool && state.isDrawing) {
      state.isDrawing = false;
      state.polygonPoints = [];
      state.polygonPreviewPoint = null;
      draw();
    }

    state.activeTool = toolName;
    dom.toolSelect.classList.toggle('active', toolName === 'select');
    dom.toolPlatform.classList.toggle('active', toolName === 'platform');
    dom.toolArea.classList.toggle('active', toolName === 'area');
    dom.toolPolygon.classList.toggle('active', toolName === 'polygon');
    dom.toolPolyFloorLine.classList.toggle('active', toolName === 'poly_floor_line');
    dom.toolTunnel.classList.toggle('active', toolName === 'tunnel');
    dom.toolDecor.classList.toggle('active', toolName === 'decor');
    dom.toolSpawnPoint.classList.toggle('active', toolName === 'spawn_point');

    dom.paintCanvas.style.cursor = toolName === 'select' ? 'default' : 'crosshair';
  }

  function showProperties(index) {
    const obj = state.objects[index];
    if (!obj) return;

    dom.propertiesPanel.style.display = 'block';

    dom.propType.className = 'prop-val badge';
    dom.propType.textContent = obj.type;
    dom.propType.classList.add(obj.type);

    if (obj.rectangle) {
      const rect = obj.rectangle;
      dom.propCoords.textContent = `x1: ${rect.x1.toFixed(4)}, y1: ${rect.y1.toFixed(4)}, x2: ${rect.x2.toFixed(4)}, y2: ${rect.y2.toFixed(4)}`;
    } else if (Array.isArray(obj.polygon) && obj.polygon.length > 0) {
      const xs = obj.polygon.map((pt) => Number(pt.x) || 0);
      const ys = obj.polygon.map((pt) => Number(pt.y) || 0);
      const x1 = Math.min(...xs);
      const y1 = Math.min(...ys);
      const x2 = Math.max(...xs);
      const y2 = Math.max(...ys);
      dom.propCoords.textContent = `polygon ${obj.polygon.length} pts | x1: ${x1.toFixed(4)}, y1: ${y1.toFixed(4)}, x2: ${x2.toFixed(4)}, y2: ${y2.toFixed(4)}`;
    } else if (Array.isArray(obj.polyline) && obj.polyline.length > 0) {
      const xs = obj.polyline.map((pt) => Number(pt.x) || 0);
      const ys = obj.polyline.map((pt) => Number(pt.y) || 0);
      const x1 = Math.min(...xs);
      const y1 = Math.min(...ys);
      const x2 = Math.max(...xs);
      const y2 = Math.max(...ys);
      dom.propCoords.textContent = `line ${obj.polyline.length} pts | x1: ${x1.toFixed(4)}, y1: ${y1.toFixed(4)}, x2: ${x2.toFixed(4)}, y2: ${y2.toFixed(4)}`;
    } else if (obj.coord) {
      dom.propCoords.textContent = `x: ${(Number(obj.coord.x) || 0).toFixed(4)}, y: ${(Number(obj.coord.y) || 0).toFixed(4)}`;
    }

    if (obj.type === 'platform' || obj.type === 'poly_floor_line') {
      dom.propCollisionContainer.style.display = 'flex';
      dom.propNameContainer.style.display = 'none';
      dom.propTunnelContainer.style.display = 'none';
      dom.propDecorContainer.style.display = 'none';
      dom.propCollision.textContent = String(obj.collision);
    } else if (obj.type === 'area') {
      dom.propCollisionContainer.style.display = 'none';
      dom.propNameContainer.style.display = 'flex';
      dom.propTunnelContainer.style.display = 'none';
      dom.propDecorContainer.style.display = 'none';
      dom.propName.value = typeof obj.name === 'string' && obj.name.trim() ? obj.name : 'paper_station';
    } else if (obj.type === 'spawn_point') {
      dom.propCollisionContainer.style.display = 'none';
      dom.propNameContainer.style.display = 'flex';
      dom.propTunnelContainer.style.display = 'none';
      dom.propDecorContainer.style.display = 'none';
      dom.propName.value = typeof obj.name === 'string' && obj.name.trim()
        ? obj.name
        : (typeof state.lastSpawnName === 'string' && state.lastSpawnName.trim() ? state.lastSpawnName : 'coin');
    } else if (obj.type === 'tunnel') {
      dom.propCollisionContainer.style.display = 'none';
      dom.propNameContainer.style.display = 'none';
      dom.propTunnelContainer.style.display = 'flex';
      dom.propDecorContainer.style.display = 'none';
      dom.propTunnelId.value = typeof obj.tunnel_name === 'string' ? obj.tunnel_name : '';
    } else if (obj.type === 'decor') {
      normalizeDecorFrameConfig(obj);
      dom.propCollisionContainer.style.display = 'none';
      dom.propNameContainer.style.display = 'none';
      dom.propTunnelContainer.style.display = 'none';
      dom.propDecorContainer.style.display = 'block';
      dom.propDecorTypes.value = obj.decor_type;
      dom.propDecorNRow.value = String(obj.n_row);
      dom.propDecorNCol.value = String(obj.n_col);
      dom.propDecorFps.value = String(obj.fps);
      dom.propDecorNFrames.value = String(obj.n_frames);
      dom.propDecorFilename.value = typeof obj.filename === 'string' ? obj.filename : '';
      dom.propDecorEventName.value = typeof obj.event_name === 'string' ? obj.event_name : '';
      updateDecorEventNameVisibility(obj);
    } else {
      dom.propCollisionContainer.style.display = 'none';
      dom.propNameContainer.style.display = 'none';
      dom.propTunnelContainer.style.display = 'none';
      dom.propDecorContainer.style.display = 'none';
      updateDecorEventNameVisibility(null);
    }
  }

  function hideProperties() {
    dom.propertiesPanel.style.display = 'none';
    state.selectedObjectIndex = -1;
    draw();
  }

  function deleteSelectedObject() {
    if (state.selectedObjectIndex === -1) return;

    state.objects.splice(state.selectedObjectIndex, 1);
    state.selectedObjectIndex = -1;

    hideProperties();
    callbacks.updateJSONTextarea();
    draw();
  }

  function onTunnelNameChange(e) {
    if (state.selectedObjectIndex === -1) return;

    const obj = state.objects[state.selectedObjectIndex];
    if (obj && obj.type === 'tunnel') {
      obj.tunnel_name = e.target.value;
      callbacks.updateJSONTextarea();
      draw();
    }
  }

  function onNameChange(e) {
    if (state.selectedObjectIndex === -1) return;

    const obj = state.objects[state.selectedObjectIndex];
    if (obj && (obj.type === 'area' || obj.type === 'spawn_point')) {
      const nextName = e.target.value.trim();
      obj.name = nextName || (obj.type === 'spawn_point' ? 'coin' : 'paper_station');
      if (obj.type === 'spawn_point') {
        state.lastSpawnName = obj.name;
      }
      if (e.target.value !== obj.name) {
        e.target.value = obj.name;
      }
      callbacks.updateJSONTextarea();
      draw();
    }
  }

  function onDecorTypesChange(e) {
    const obj = getSelectedDecorObject();
    if (!obj) return;

    const next = e.target.value;
    obj.decor_type = ['normal', 'background', 'interact'].includes(next) ? next : 'normal';
    if (obj.decor_type !== 'interact') {
      obj.event_name = '';
      dom.propDecorEventName.value = '';
    }
    e.target.value = obj.decor_type;
    updateDecorEventNameVisibility(obj);
    callbacks.updateJSONTextarea();
    draw();
  }

  function onDecorNRowChange(e) {
    const obj = getSelectedDecorObject();
    if (!obj) return;

    obj.n_row = clampPositiveInt(e.target.value, 1);
    obj.n_frames = Math.min(clampPositiveInt(obj.n_frames, getDecorCellCount(obj)), getDecorCellCount(obj));
    e.target.value = String(obj.n_row);
    dom.propDecorNFrames.value = String(obj.n_frames);
    callbacks.updateJSONTextarea();
    draw();
  }

  function onDecorNColChange(e) {
    const obj = getSelectedDecorObject();
    if (!obj) return;

    obj.n_col = clampPositiveInt(e.target.value, 1);
    obj.n_frames = Math.min(clampPositiveInt(obj.n_frames, getDecorCellCount(obj)), getDecorCellCount(obj));
    e.target.value = String(obj.n_col);
    dom.propDecorNFrames.value = String(obj.n_frames);
    callbacks.updateJSONTextarea();
    draw();
  }

  function onDecorFpsChange(e) {
    const obj = getSelectedDecorObject();
    if (!obj) return;

    obj.fps = clampPositiveInt(e.target.value, 8);
    e.target.value = String(obj.fps);
    callbacks.updateJSONTextarea();
    draw();
  }

  function onDecorNFramesChange(e) {
    const obj = getSelectedDecorObject();
    if (!obj) return;

    const maxFrames = getDecorCellCount(obj);
    obj.n_frames = Math.min(clampPositiveInt(e.target.value, maxFrames), maxFrames);
    e.target.value = String(obj.n_frames);
    callbacks.updateJSONTextarea();
    draw();
  }

  function onDecorFilenameChange(e) {
    const obj = getSelectedDecorObject();
    if (!obj) return;

    obj.filename = typeof e.target.value === 'string' ? e.target.value.trim() : '';
    if (e.target.value !== obj.filename) {
      e.target.value = obj.filename;
    }
    callbacks.updateJSONTextarea();
    draw();
  }

  function onDecorEventNameChange(e) {
    const obj = getSelectedDecorObject();
    if (!obj) return;

    if (obj.decor_type !== 'interact') {
      obj.event_name = '';
      e.target.value = '';
      callbacks.updateJSONTextarea();
      draw();
      return;
    }

    obj.event_name = typeof e.target.value === 'string' ? e.target.value.trim() : '';
    if (e.target.value !== obj.event_name) {
      e.target.value = obj.event_name;
    }
    callbacks.updateJSONTextarea();
    draw();
  }

  function onDecorDropOver(e) {
    const obj = getSelectedDecorObject();
    if (!obj) return;

    e.preventDefault();
    dom.propDecorDropzone.classList.add('drag-over');
  }

  function onDecorDropLeave(e) {
    e.preventDefault();
    if (!dom.propDecorDropzone.contains(e.relatedTarget)) {
      dom.propDecorDropzone.classList.remove('drag-over');
    }
  }

  function onDecorDrop(e) {
    const obj = getSelectedDecorObject();
    if (!obj) return;

    e.preventDefault();
    dom.propDecorDropzone.classList.remove('drag-over');

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.match('image.*')) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const src = typeof evt.target?.result === 'string' ? evt.target.result : '';
      if (!src) return;

      const img = new Image();
      img.onload = () => {
        const filename = file.name.trim();
        obj.filename = filename;
        dom.propDecorFilename.value = filename;
        state.decorSpriteCache[filename] = img;
        callbacks.updateJSONTextarea();
        draw();
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }

  function clearAllObjects() {
    if (state.objects.length === 0) return;

    if (confirm('Are you sure you want to clear all objects?')) {
      state.objects = [];
      state.selectedObjectIndex = -1;
      hideProperties();
      callbacks.updateJSONTextarea();
      draw();
    }
  }

  return {
    setTool,
    showProperties,
    hideProperties,
    deleteSelectedObject,
    onNameChange,
    onTunnelNameChange,
    onDecorTypesChange,
    onDecorNRowChange,
    onDecorNColChange,
    onDecorFpsChange,
    onDecorNFramesChange,
    onDecorFilenameChange,
    onDecorEventNameChange,
    onDecorDropOver,
    onDecorDropLeave,
    onDecorDrop,
    clearAllObjects
  };
}
