export function createUI(state, dom, draw, callbacks) {
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
      dom.propCollision.textContent = String(obj.collision);
    } else if (obj.type === 'area') {
      dom.propCollisionContainer.style.display = 'none';
      dom.propNameContainer.style.display = 'flex';
      dom.propTunnelContainer.style.display = 'none';
      dom.propName.value = typeof obj.name === 'string' && obj.name.trim() ? obj.name : 'paper_station';
    } else if (obj.type === 'spawn_point') {
      dom.propCollisionContainer.style.display = 'none';
      dom.propNameContainer.style.display = 'flex';
      dom.propTunnelContainer.style.display = 'none';
      dom.propName.value = typeof obj.name === 'string' && obj.name.trim()
        ? obj.name
        : (typeof state.lastSpawnName === 'string' && state.lastSpawnName.trim() ? state.lastSpawnName : 'coin');
    } else if (obj.type === 'tunnel') {
      dom.propCollisionContainer.style.display = 'none';
      dom.propNameContainer.style.display = 'none';
      dom.propTunnelContainer.style.display = 'flex';
      dom.propTunnelId.value = typeof obj.tunnel_name === 'string' ? obj.tunnel_name : '';
    } else {
      dom.propCollisionContainer.style.display = 'none';
      dom.propNameContainer.style.display = 'none';
      dom.propTunnelContainer.style.display = 'none';
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
    clearAllObjects
  };
}
