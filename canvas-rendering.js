export function createCanvasRenderer(state, dom) {
  function draw() {
    const { ctx, paintCanvas } = dom;

    ctx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);

    state.objects.forEach((obj, idx) => {
      if (!obj.rectangle) return;

      const rect = obj.rectangle;
      const x1 = rect.x1 * paintCanvas.width;
      const y1 = rect.y1 * paintCanvas.height;
      const x2 = rect.x2 * paintCanvas.width;
      const y2 = rect.y2 * paintCanvas.height;
      const w = x2 - x1;
      const h = y2 - y1;

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

      ctx.fillRect(x1, y1, w, h);
      ctx.strokeRect(x1, y1, w, h);

      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(x1 + 2, y1 + 2, w - 4, h - 4);
        ctx.setLineDash([]);

        if (state.activeTool === 'select') {
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
        }
      }

      ctx.font = '10px "Fira Code", monospace';
      const label = obj.type === 'platform' ? 'Platform' : `Tunnel (ID: ${obj.tunnel_id})`;

      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(11, 15, 25, 0.85)';
      ctx.fillRect(x1, y1 - 16, textWidth + 8, 16);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, x1 + 4, y1 - 4);
    });

    if (state.isDrawing) {
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
