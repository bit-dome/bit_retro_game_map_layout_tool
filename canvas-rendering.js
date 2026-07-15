export function createCanvasRenderer(state, dom) {
  const SPAWN_VISUALS = [
    { shape: 'cross', color: '#ef4444', rgb: '239, 68, 68' },
    { shape: 'triangle', color: '#22c55e', rgb: '34, 197, 94' },
    { shape: 'circle', color: '#3b82f6', rgb: '59, 130, 246' },
    { shape: 'diamond', color: '#f59e0b', rgb: '245, 158, 11' },
    { shape: 'square', color: '#a855f7', rgb: '168, 85, 247' },
    { shape: 'hexagon', color: '#14b8a6', rgb: '20, 184, 166' }
  ];

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

  function getCanvasPalette() {
    const styles = getComputedStyle(document.documentElement);
    return {
      platform: {
        color: styles.getPropertyValue('--color-platform').trim(),
        rgb: styles.getPropertyValue('--color-platform-rgb').trim()
      },
      area: {
        color: styles.getPropertyValue('--color-area').trim(),
        rgb: styles.getPropertyValue('--color-area-rgb').trim()
      },
      polygon: {
        color: styles.getPropertyValue('--color-polygon').trim(),
        rgb: styles.getPropertyValue('--color-polygon-rgb').trim()
      },
      polyFloorLine: {
        color: styles.getPropertyValue('--color-poly-floor-line').trim(),
        rgb: styles.getPropertyValue('--color-poly-floor-line-rgb').trim()
      },
      spawnPoint: {
        color: styles.getPropertyValue('--color-spawn-point').trim(),
        rgb: styles.getPropertyValue('--color-spawn-point-rgb').trim()
      },
      tunnel: {
        color: styles.getPropertyValue('--color-tunnel').trim(),
        rgb: styles.getPropertyValue('--color-tunnel-rgb').trim()
      }
    };
  }

  function getSpawnName(obj) {
    if (!obj || obj.type !== 'spawn_point') return '';

    const rawName = typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim() : 'coin';
    return rawName.toLowerCase();
  }

  function getSpawnVisualMap(objects) {
    const uniqueSpawnNames = [...new Set(
      objects
        .filter((obj) => obj && obj.type === 'spawn_point')
        .map((obj) => getSpawnName(obj))
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));

    const visualMap = new Map();
    uniqueSpawnNames.forEach((name, idx) => {
      visualMap.set(name, SPAWN_VISUALS[idx % SPAWN_VISUALS.length]);
    });

    return visualMap;
  }

  function drawSpawnMarker(centerX, centerY, marker, isSelected) {
    const { ctx } = dom;
    const size = isSelected ? 10 : 8;

    ctx.save();
    ctx.strokeStyle = marker.color;
    ctx.fillStyle = marker.color;
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    if (marker.shape === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - size);
      ctx.lineTo(centerX + size, centerY + size);
      ctx.lineTo(centerX - size, centerY + size);
      ctx.closePath();
      ctx.stroke();
    } else if (marker.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(centerX, centerY, size, 0, Math.PI * 2);
      ctx.stroke();
    } else if (marker.shape === 'diamond') {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - size);
      ctx.lineTo(centerX + size, centerY);
      ctx.lineTo(centerX, centerY + size);
      ctx.lineTo(centerX - size, centerY);
      ctx.closePath();
      ctx.stroke();
    } else if (marker.shape === 'square') {
      const edge = size * 1.8;
      ctx.strokeRect(centerX - edge / 2, centerY - edge / 2, edge, edge);
    } else if (marker.shape === 'hexagon') {
      ctx.beginPath();
      for (let i = 0; i < 6; i += 1) {
        const angle = ((Math.PI * 2) / 6) * i - Math.PI / 2;
        const px = centerX + Math.cos(angle) * size;
        const py = centerY + Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(centerX - size, centerY - size);
      ctx.lineTo(centerX + size, centerY + size);
      ctx.moveTo(centerX + size, centerY - size);
      ctx.lineTo(centerX - size, centerY + size);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(centerX, centerY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function getObjectColorVars(obj, palette, spawnVisualMap) {
    if (obj.type === 'poly_floor_line') {
      return {
        colorVar: palette.polyFloorLine.color,
        colorRgbVar: palette.polyFloorLine.rgb
      };
    }

    if (obj.type === 'area') {
      return {
        colorVar: palette.area.color,
        colorRgbVar: palette.area.rgb
      };
    }

    if (obj.type === 'tunnel') {
      return {
        colorVar: palette.tunnel.color,
        colorRgbVar: palette.tunnel.rgb
      };
    }

    if (obj.type === 'spawn_point') {
      const marker = spawnVisualMap.get(getSpawnName(obj));
      return {
        colorVar: marker?.color || palette.spawnPoint.color,
        colorRgbVar: marker?.rgb || palette.spawnPoint.rgb
      };
    }

    return {
      colorVar: palette.platform.color,
      colorRgbVar: palette.platform.rgb
    };
  }

  function getLabelText(obj, hasPolygon) {
    if (obj.type === 'area') {
      return obj.name || 'paper_station';
    }

    if (obj.type !== 'tunnel') return null;

    const tunnelName = typeof obj.tunnel_name === 'string' && obj.tunnel_name.trim()
      ? obj.tunnel_name
      : (obj.tunnel_id !== undefined ? String(obj.tunnel_id) : '');
    return `Tunnel (${tunnelName})`;
  }

  function getLabelBounds(ctx, obj, x1, y1, hasPolygon) {
    const label = getLabelText(obj, hasPolygon);
    if (!label) return null;

    const textWidth = ctx.measureText(label).width;
    return {
      label,
      x: x1,
      y: y1 - 16,
      width: textWidth + 8,
      height: 18,
      textX: x1 + 4,
      textY: y1 - 4
    };
  }

  function drawPolygonPath(points) {
    if (!Array.isArray(points) || points.length === 0) return;

    const { ctx } = dom;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(points[0].x), toCanvasY(points[0].y));
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(toCanvasX(points[i].x), toCanvasY(points[i].y));
    }
    ctx.closePath();
  }

  function drawPolylinePath(points) {
    if (!Array.isArray(points) || points.length === 0) return;

    const { ctx } = dom;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(points[0].x), toCanvasY(points[0].y));
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(toCanvasX(points[i].x), toCanvasY(points[i].y));
    }
  }

  function draw() {
    const { ctx, paintCanvas } = dom;
    const palette = getCanvasPalette();
    const spawnVisualMap = getSpawnVisualMap(state.objects);

    ctx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);

    state.objects.forEach((obj, idx) => {
      const hasRectangle = Boolean(obj.rectangle);
      const hasPolygon = Array.isArray(obj.polygon) && obj.polygon.length >= 3;
      const hasPolyline = Array.isArray(obj.polyline) && obj.polyline.length >= 2;
      const hasPoint = obj.type === 'spawn_point' && Boolean(obj.coord);
      if (!hasRectangle && !hasPolygon && !hasPolyline && !hasPoint) return;

      let x1 = 0;
      let y1 = 0;
      let x2 = 0;
      let y2 = 0;
      let w = 0;
      let h = 0;

      if (hasRectangle) {
        const rect = obj.rectangle;
        x1 = toCanvasX(rect.x1);
        y1 = toCanvasY(rect.y1);
        x2 = toCanvasX(rect.x2);
        y2 = toCanvasY(rect.y2);
      } else if (hasPoint) {
        const px = toCanvasX(Number(obj.coord.x) || 0);
        const py = toCanvasY(Number(obj.coord.y) || 0);
        const halfSize = 10;
        x1 = px - halfSize;
        y1 = py - halfSize;
        x2 = px + halfSize;
        y2 = py + halfSize;
      } else if (hasPolygon) {
        const px = obj.polygon.map((pt) => toCanvasX(pt.x));
        const py = obj.polygon.map((pt) => toCanvasY(pt.y));
        x1 = Math.min(...px);
        y1 = Math.min(...py);
        x2 = Math.max(...px);
        y2 = Math.max(...py);
      } else {
        const px = obj.polyline.map((pt) => toCanvasX(pt.x));
        const py = obj.polyline.map((pt) => toCanvasY(pt.y));
        x1 = Math.min(...px);
        y1 = Math.min(...py);
        x2 = Math.max(...px);
        y2 = Math.max(...py);
      }

      w = x2 - x1;
      h = y2 - y1;

      const isSelected = idx === state.selectedObjectIndex;
      const { colorVar, colorRgbVar } = getObjectColorVars(obj, palette, spawnVisualMap);

      ctx.strokeStyle = `rgba(${colorRgbVar}, ${isSelected ? '1' : '0.7'})`;
      ctx.fillStyle = `rgba(${colorRgbVar}, ${isSelected ? '0.0' : '0.12'})`;
      ctx.lineWidth = isSelected ? 3 : 1.5;

      if (hasRectangle) {
        ctx.fillRect(x1, y1, w, h);
        ctx.strokeRect(x1, y1, w, h);
      } else if (hasPoint) {
        const centerX = toCanvasX(Number(obj.coord.x) || 0);
        const centerY = toCanvasY(Number(obj.coord.y) || 0);
        const marker = spawnVisualMap.get(getSpawnName(obj)) || SPAWN_VISUALS[0];
        drawSpawnMarker(centerX, centerY, marker, isSelected);
      } else if (hasPolygon) {
        drawPolygonPath(obj.polygon);
        ctx.fill();
        ctx.stroke();
      } else {
        drawPolylinePath(obj.polyline);
        ctx.fillStyle = `rgba(${colorRgbVar}, ${isSelected ? '0.16' : '0.08'})`;
        ctx.fillRect(x1, y1 - 3, w, 6);
        ctx.lineWidth = isSelected ? 4 : 3;
        ctx.stroke();
      }

      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(x1 + 2, y1 + 2, w - 4, h - 4);
        ctx.setLineDash([]);

        if (state.activeTool === 'select' && hasRectangle) {
          const hSize = 8;
          const half = hSize / 2;

          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = colorVar;
          ctx.lineWidth = 2;

          const corners = [
            { x: x1, y: y1 },
            { x: x2, y: y1 },
            { x: x1, y: y2 },
            { x: x2, y: y2 }
          ];

          corners.forEach((corner) => {
            ctx.fillRect(corner.x - half, corner.y - half, hSize, hSize);
            ctx.strokeRect(corner.x - half, corner.y - half, hSize, hSize);
          });
        } else if (state.activeTool === 'select' && hasPolygon) {
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = colorVar;
          ctx.lineWidth = 2;

          obj.polygon.forEach((pt, pointIdx) => {
            const px = toCanvasX(pt.x);
            const py = toCanvasY(pt.y);
            const radius = pointIdx === state.selectedVertexIndex ? 6 : 5;
            ctx.beginPath();
            ctx.arc(px, py, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          });
        } else if (state.activeTool === 'select' && hasPolyline) {
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = colorVar;
          ctx.lineWidth = 2;

          obj.polyline.forEach((pt, pointIdx) => {
            const px = toCanvasX(pt.x);
            const py = toCanvasY(pt.y);
            const radius = pointIdx === state.selectedVertexIndex ? 6 : 5;
            ctx.beginPath();
            ctx.arc(px, py, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          });
        } else if (state.activeTool === 'select' && hasPoint) {
          const centerX = toCanvasX(Number(obj.coord.x) || 0);
          const centerY = toCanvasY(Number(obj.coord.y) || 0);
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = colorVar;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }

      ctx.font = '10px "Fira Code", monospace';
      const labelBounds = getLabelBounds(ctx, obj, x1, y1, hasPolygon);
      if (labelBounds) {
        ctx.fillStyle = 'rgba(11, 15, 25, 0.85)';
        ctx.fillRect(labelBounds.x, labelBounds.y, labelBounds.width, labelBounds.height);

        ctx.fillStyle = colorVar;
        ctx.fillText(labelBounds.label, labelBounds.textX, labelBounds.textY);
      }
    });

    if (state.activeTool === 'polygon' && state.isDrawing && state.polygonPoints.length > 0) {
      const points = [...state.polygonPoints];
      if (state.polygonPreviewPoint) {
        points.push(state.polygonPreviewPoint);
      }

      ctx.strokeStyle = palette.platform.color;
      ctx.fillStyle = `rgba(${palette.platform.rgb}, 0.15)`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 3]);

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      if (state.polygonPoints.length >= 3) {
        ctx.closePath();
        ctx.fill();
      }
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.fillStyle = '#ffffff';
      state.polygonPoints.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (state.activeTool === 'poly_floor_line' && state.isDrawing && state.polygonPoints.length > 0) {
      const points = [...state.polygonPoints];
      if (state.polygonPreviewPoint) {
        points.push(state.polygonPreviewPoint);
      }

      ctx.strokeStyle = palette.polyFloorLine.color;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.fillStyle = '#ffffff';
      state.polygonPoints.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (state.isDrawing) {
      const x1 = state.dragStart.x;
      const y1 = state.dragStart.y;
      const x2 = state.dragEnd.x;
      const y2 = state.dragEnd.y;
      const w = x2 - x1;
      const h = y2 - y1;

      if (state.activeTool === 'platform') {
        ctx.strokeStyle = palette.platform.color;
        ctx.fillStyle = `rgba(${palette.platform.rgb}, 0.15)`;
      } else if (state.activeTool === 'area') {
        ctx.strokeStyle = palette.area.color;
        ctx.fillStyle = `rgba(${palette.area.rgb}, 0.15)`;
      } else {
        ctx.strokeStyle = palette.tunnel.color;
        ctx.fillStyle = `rgba(${palette.tunnel.rgb}, 0.15)`;
      }

      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 3]);
      ctx.fillRect(x1, y1, w, h);
      ctx.strokeRect(x1, y1, w, h);
      ctx.setLineDash([]);
    }
  }

  return { draw };
}
