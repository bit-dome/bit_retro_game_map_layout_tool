export function createKeyboard(state, dom, uiActions, draw, finalizePolygonDrawing) {
  function onKeyDown(e) {
    if (e.key === 'Enter' && state.activeTool === 'poly_floor_line' && state.isDrawing) {
      e.preventDefault();
      finalizePolygonDrawing();
      return;
    }

    if (e.key === 'Escape') {
      if (state.isDrawing) {
        state.isDrawing = false;
        state.polygonPoints = [];
        state.polygonPreviewPoint = null;
        draw();
      } else {
        uiActions.hideProperties();
      }
    }

    if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedObjectIndex !== -1) {
      const activeElem = document.activeElement;
      if (
        activeElem !== dom.jsonTextarea
        && activeElem !== dom.propTunnelId
        && activeElem !== dom.propName
        && activeElem !== dom.propDecorTypes
        && activeElem !== dom.propDecorNRow
        && activeElem !== dom.propDecorNCol
        && activeElem !== dom.propDecorFps
        && activeElem !== dom.propDecorNFrames
        && activeElem !== dom.propDecorFilename
        && activeElem !== dom.propDecorEventName
      ) {
        uiActions.deleteSelectedObject();
      }
    }
  }

  return { onKeyDown };
}
