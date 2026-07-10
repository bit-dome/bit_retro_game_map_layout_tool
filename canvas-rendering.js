export function createCanvasRenderer(state, dom) {
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

  function draw() {
    const { ctx, paintCanvas } = dom;

    ctx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);

    state.objects.forEach((obj, idx) => {
      const hasRectangle = Boolean(obj.rectangle);
      const hasPolygon = Array.isArray(obj.polygon) && obj.polygon.length >= 3;
      if (!hasRectangle && !hasPolygon) return;

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
      } else {
        const px = obj.polygon.map((pt) => pt.x * paintCanvas.width);
        const py = obj.polygon.map((pt) => pt.y * paintCanvas.height);
        x1 = Math.min(...px);
        y1 = Math.min(...py);
        x2 = Math.max(...px);
        y2 = Math.max(...py);
      }

      w = x2 - x1;
      h = y2 - y1;

      const isSelected = idx === state.selectedObjectIndex;

      if (obj.type === 'platform') {
        ctx.strokeStyle = `rgba(var(--color-platform-rgb), ${isSelected ? '1' : '0.7'})`;
        ctx.fillStyle = `rgba(var(--color-platform-rgb), ${isSelected ? '0.25' : '0.12'})`;
        ctx.lineWidth = isSelected ? 3 : 1.5;
      } else if (obj.type === 'tunnel') {
        ctx.strokeStyle = `rgba(var(--color-tunnel-rgb), ${isSelected ? '1' : '0.7'})`;
        ctx.fillStyle = `rgba(var(--color-tunnel-rgb), ${isSelected ? '0.25' : '0.12'})`;
        ctx.lineWidth = isSelected ? 3 : 1.5;
      }

      if (hasRectangle) {
        ctx.fillRect(x1, y1, w, h);
        ctx.strokeRect(x1, y1, w, h);
      } else {
        drawPolygonPath(obj.polygon);
        ctx.fill();
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
          const strokeColor = obj.type === 'platform' ? 'var(--color-platform)' : 'var(--color-tunnel)';

          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = strokeColor;
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
          ctx.strokeStyle = 'var(--color-platform)';
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
        }
      }

      ctx.font = '10px "Fira Code", monospace';
      const label = obj.type === 'platform'
        ? (hasPolygon ? 'Platform Polygon' : 'Platform')
        : `Tunnel (ID: ${obj.tunnel_id})`;

      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(11, 15, 25, 0.85)';
      ctx.fillRect(x1, y1 - 16, textWidth + 8, 16);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, x1 + 4, y1 - 4);
    });

    if (state.activeTool === 'polygon' && state.isDrawing && state.polygonPoints.length > 0) {
      const points = [...state.polygonPoints];
      if (state.polygonPreviewPoint) {
        points.push(state.polygonPreviewPoint);
      }

      ctx.strokeStyle = 'var(--color-platform)';
      ctx.fillStyle = 'rgba(var(--color-platform-rgb), 0.15)';
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
    } else if (state.isDrawing) {
      const x1 = state.dragStart.x;
      const y1 = state.dragStart.y;
      const x2 = state.dragEnd.x;
      const y2 = state.dragEnd.y;
      const w = x2 - x1;
      const h = y2 - y1;

      if (state.activeTool === 'platform') {
        ctx.strokeStyle = 'var(--color-platform)';
        ctx.fillStyle = 'rgba(var(--color-platform-rgb), 0.15)';
      } else {
        ctx.strokeStyle = 'var(--color-tunnel)';
        ctx.fillStyle = 'rgba(var(--color-tunnel-rgb), 0.15)';
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
