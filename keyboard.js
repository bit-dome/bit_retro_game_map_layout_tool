export function createKeyboard(state, dom, uiActions, draw) {
  function onKeyDown(e) {
    if (e.key === 'Escape') {
      if (state.isDrawing) {
        state.isDrawing = false;
        draw();
      } else {
        uiActions.hideProperties();
      }
    }

    if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedObjectIndex !== -1) {
      const activeElem = document.activeElement;
      if (activeElem !== dom.jsonTextarea && activeElem !== dom.propTunnelId) {
        uiActions.deleteSelectedObject();
      }
    }
  }

  return { onKeyDown };
}
