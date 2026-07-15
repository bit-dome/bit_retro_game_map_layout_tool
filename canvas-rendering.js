export function createCanvasRenderer(state, dom) {
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

  function getObjectColorVars(obj, palette) {
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
      return {
        colorVar: palette.spawnPoint.color,
        colorRgbVar: palette.spawnPoint.rgb
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

    return `Tunnel (ID: ${obj.tunnel_id})`;
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

    const { ctx, paintCanvas } = dom;
    ctx.beginPath();
    ctx.moveTo(points[0].x * paintCanvas.width, points[0].y * paintCanvas.height);
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i].x * paintCanvas.width, points[i].y * paintCanvas.height);
    }
    ctx.closePath();
  }

  function drawPolylinePath(points) {
    if (!Array.isArray(points) || points.length === 0) return;

    const { ctx, paintCanvas } = dom;
    ctx.beginPath();
    ctx.moveTo(points[0].x * paintCanvas.width, points[0].y * paintCanvas.height);
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i].x * paintCanvas.width, points[i].y * paintCanvas.height);
    }
  }

  function draw() {
    const { ctx, paintCanvas } = dom;
    const palette = getCanvasPalette();

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
        x1 = rect.x1 * paintCanvas.width;
        y1 = rect.y1 * paintCanvas.height;
        x2 = rect.x2 * paintCanvas.width;
        y2 = rect.y2 * paintCanvas.height;
      } else if (hasPoint) {
        const px = (Number(obj.coord.x) || 0) * paintCanvas.width;
        const py = (Number(obj.coord.y) || 0) * paintCanvas.height;
        const halfSize = 10;
        x1 = px - halfSize;
        y1 = py - halfSize;
        x2 = px + halfSize;
        y2 = py + halfSize;
      } else if (hasPolygon) {
        const px = obj.polygon.map((pt) => pt.x * paintCanvas.width);
        const py = obj.polygon.map((pt) => pt.y * paintCanvas.height);
        x1 = Math.min(...px);
        y1 = Math.min(...py);
        x2 = Math.max(...px);
        y2 = Math.max(...py);
      } else {
        const px = obj.polyline.map((pt) => pt.x * paintCanvas.width);
        const py = obj.polyline.map((pt) => pt.y * paintCanvas.height);
        x1 = Math.min(...px);
        y1 = Math.min(...py);
        x2 = Math.max(...px);
        y2 = Math.max(...py);
      }

      w = x2 - x1;
      h = y2 - y1;

      const isSelected = idx === state.selectedObjectIndex;
      const { colorVar, colorRgbVar } = getObjectColorVars(obj, palette);

      ctx.strokeStyle = `rgba(${colorRgbVar}, ${isSelected ? '1' : '0.7'})`;
      ctx.fillStyle = `rgba(${colorRgbVar}, ${isSelected ? '0.0' : '0.12'})`;
      ctx.lineWidth = isSelected ? 3 : 1.5;

      if (hasRectangle) {
        ctx.fillRect(x1, y1, w, h);
        ctx.strokeRect(x1, y1, w, h);
      } else if (hasPoint) {
        const centerX = (Number(obj.coord.x) || 0) * paintCanvas.width;
        const centerY = (Number(obj.coord.y) || 0) * paintCanvas.height;
        const crosshairRadius = isSelected ? 10 : 8;

        ctx.beginPath();
        ctx.moveTo(centerX - crosshairRadius, centerY);
        ctx.lineTo(centerX + crosshairRadius, centerY);
        ctx.moveTo(centerX, centerY - crosshairRadius);
        ctx.lineTo(centerX, centerY + crosshairRadius);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = colorVar;
        ctx.fill();
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
            const px = pt.x * paintCanvas.width;
            const py = pt.y * paintCanvas.height;
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
            const px = pt.x * paintCanvas.width;
            const py = pt.y * paintCanvas.height;
            const radius = pointIdx === state.selectedVertexIndex ? 6 : 5;
            ctx.beginPath();
            ctx.arc(px, py, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          });
        } else if (state.activeTool === 'select' && hasPoint) {
          const centerX = (Number(obj.coord.x) || 0) * paintCanvas.width;
          const centerY = (Number(obj.coord.y) || 0) * paintCanvas.height;
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
