export function buildObjectFromDrag(state, canvasWidth, canvasHeight) {
  let x1 = Math.min(state.dragStart.x, state.dragEnd.x) / canvasWidth;
  let x2 = Math.max(state.dragStart.x, state.dragEnd.x) / canvasWidth;
  let y1 = Math.min(state.dragStart.y, state.dragEnd.y) / canvasHeight;
  let y2 = Math.max(state.dragStart.y, state.dragEnd.y) / canvasHeight;

  x1 = Math.max(0, Math.min(1, x1));
  x2 = Math.max(0, Math.min(1, x2));
  y1 = Math.max(0, Math.min(1, y1));
  y2 = Math.max(0, Math.min(1, y2));

  const newObject = {
    type: state.activeTool,
    rectangle: {
      x1: parseFloat(x1.toFixed(4)),
      y1: parseFloat(y1.toFixed(4)),
      x2: parseFloat(x2.toFixed(4)),
      y2: parseFloat(y2.toFixed(4))
    }
  };

  if (state.activeTool === 'platform') {
    newObject.collision = true;
  } else if (state.activeTool === 'tunnel') {
    let maxId = 0;
    state.objects.forEach((obj) => {
      if (obj.type === 'tunnel' && typeof obj.tunnel_id === 'number') {
        maxId = Math.max(maxId, obj.tunnel_id);
      }
    });
    newObject.tunnel_id = maxId + 1;
  }

  return newObject;
}

export function normalizeSelectedRectangle(state) {
  if (state.selectedObjectIndex === -1) return;

  const obj = state.objects[state.selectedObjectIndex];
  if (!obj || !obj.rectangle) return;

  const rect = obj.rectangle;
  const rx1 = Math.min(rect.x1, rect.x2);
  const rx2 = Math.max(rect.x1, rect.x2);
  const ry1 = Math.min(rect.y1, rect.y2);
  const ry2 = Math.max(rect.y1, rect.y2);

  obj.rectangle = {
    x1: parseFloat(rx1.toFixed(4)),
    y1: parseFloat(ry1.toFixed(4)),
    x2: parseFloat(rx2.toFixed(4)),
    y2: parseFloat(ry2.toFixed(4))
  };
}
