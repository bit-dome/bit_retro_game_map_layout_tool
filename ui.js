export function createUI(state, dom, draw, callbacks) {
  function setTool(toolName) {
    state.activeTool = toolName;
    dom.toolSelect.classList.toggle('active', toolName === 'select');
    dom.toolPlatform.classList.toggle('active', toolName === 'platform');
    dom.toolTunnel.classList.toggle('active', toolName === 'tunnel');

    dom.paintCanvas.style.cursor = toolName === 'select' ? 'default' : 'crosshair';
  }

  function showProperties(index) {
    const obj = state.objects[index];
    if (!obj) return;

    dom.propertiesPanel.style.display = 'block';

    dom.propType.className = 'prop-val badge';
    dom.propType.textContent = obj.type;
    dom.propType.classList.add(obj.type);

    const rect = obj.rectangle;
    dom.propCoords.textContent = `x1: ${rect.x1.toFixed(4)}, y1: ${rect.y1.toFixed(4)}, x2: ${rect.x2.toFixed(4)}, y2: ${rect.y2.toFixed(4)}`;

    if (obj.type === 'platform') {
      dom.propCollisionContainer.style.display = 'flex';
      dom.propTunnelContainer.style.display = 'none';
      dom.propCollision.textContent = String(obj.collision);
    } else if (obj.type === 'tunnel') {
      dom.propCollisionContainer.style.display = 'none';
      dom.propTunnelContainer.style.display = 'flex';
      dom.propTunnelId.value = obj.tunnel_id;
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

  function onTunnelIdChange(e) {
    if (state.selectedObjectIndex === -1) return;

    const obj = state.objects[state.selectedObjectIndex];
    if (obj && obj.type === 'tunnel') {
      const val = parseInt(e.target.value, 10);
      obj.tunnel_id = Number.isNaN(val) ? 0 : val;
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
    onTunnelIdChange,
    clearAllObjects
  };
}
