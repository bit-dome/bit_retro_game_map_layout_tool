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
  } else if (state.activeTool === 'area') {
    newObject.name = 'paper_station';
  } else if (state.activeTool === 'tunnel') {
    let maxSuffix = 0;
    state.objects.forEach((obj) => {
      if (obj.type !== 'tunnel') return;

      const source = typeof obj.tunnel_name === 'string' && obj.tunnel_name.trim()
        ? obj.tunnel_name
        : String(obj.tunnel_id ?? '');
      const match = source.match(/^(?:tunnel_)?(\d+)$/i);
      if (!match) return;

      maxSuffix = Math.max(maxSuffix, Number(match[1]) || 0);
    });
    newObject.tunnel_name = `tunnel_${maxSuffix + 1}`;
  }

  return newObject;
}

export function buildSpawnPoint(canvasX, canvasY, canvasWidth, canvasHeight) {
  const x = Math.max(0, Math.min(1, canvasX / canvasWidth));
  const y = Math.max(0, Math.min(1, canvasY / canvasHeight));

  return {
    type: 'spawn_point',
    name: 'coin',
    coord: {
      x: parseFloat(x.toFixed(4)),
      y: parseFloat(y.toFixed(4))
    }
  };
}

export function buildPlatformPolygon(points, canvasWidth, canvasHeight) {
  if (!Array.isArray(points) || points.length < 3) return null;

  const normalizedPoints = points.map((pt) => {
    const x = Math.max(0, Math.min(1, pt.x / canvasWidth));
    const y = Math.max(0, Math.min(1, pt.y / canvasHeight));
    return {
      x: parseFloat(x.toFixed(4)),
      y: parseFloat(y.toFixed(4))
    };
  });

  return {
    type: 'platform',
    collision: true,
    polygon: normalizedPoints
  };
}

export function buildPolyFloorLine(points, canvasWidth, canvasHeight) {
  if (!Array.isArray(points) || points.length < 2) return null;

  const normalizedPoints = points.map((pt) => {
    const x = Math.max(0, Math.min(1, pt.x / canvasWidth));
    const y = Math.max(0, Math.min(1, pt.y / canvasHeight));
    return {
      x: parseFloat(x.toFixed(4)),
      y: parseFloat(y.toFixed(4))
    };
  });

  return {
    type: 'poly_floor_line',
    collision: true,
    one_way: true,
    polyline: normalizedPoints
  };
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

export function normalizeSelectedPolygon(state) {
  if (state.selectedObjectIndex === -1) return;

  const obj = state.objects[state.selectedObjectIndex];
  if (!obj || !Array.isArray(obj.polygon)) return;

  obj.polygon = obj.polygon.map((pt) => ({
    x: parseFloat((Math.max(0, Math.min(1, Number(pt.x) || 0))).toFixed(4)),
    y: parseFloat((Math.max(0, Math.min(1, Number(pt.y) || 0))).toFixed(4))
  }));
}

export function normalizeSelectedPolyline(state) {
  if (state.selectedObjectIndex === -1) return;

  const obj = state.objects[state.selectedObjectIndex];
  if (!obj || !Array.isArray(obj.polyline)) return;

  obj.polyline = obj.polyline.map((pt) => ({
    x: parseFloat((Math.max(0, Math.min(1, Number(pt.x) || 0))).toFixed(4)),
    y: parseFloat((Math.max(0, Math.min(1, Number(pt.y) || 0))).toFixed(4))
  }));
}

export function normalizeSelectedPoint(state) {
  if (state.selectedObjectIndex === -1) return;

  const obj = state.objects[state.selectedObjectIndex];
  if (!obj || !obj.coord) return;

  obj.coord = {
    x: parseFloat((Math.max(0, Math.min(1, Number(obj.coord.x) || 0))).toFixed(4)),
    y: parseFloat((Math.max(0, Math.min(1, Number(obj.coord.y) || 0))).toFixed(4))
  };
}
