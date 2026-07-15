export function createImageLoader(state, dom, draw, uiActions) {
  function getMapDisplaySize() {
    const naturalWidth = dom.mapImg.naturalWidth || 1;
    const naturalHeight = dom.mapImg.naturalHeight || 1;
    const dropZoneStyles = getComputedStyle(dom.dropZone);
    const horizontalPadding = parseFloat(dropZoneStyles.paddingLeft) + parseFloat(dropZoneStyles.paddingRight);
    const verticalPadding = parseFloat(dropZoneStyles.paddingTop) + parseFloat(dropZoneStyles.paddingBottom);

    const availableWidth = Math.max(320, dom.dropZone.clientWidth - horizontalPadding);
    const availableHeight = Math.max(240, dom.dropZone.clientHeight - verticalPadding);
    const scale = Math.min(availableWidth / naturalWidth, availableHeight / naturalHeight);
    const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;

    return {
      width: Math.max(1, Math.round(naturalWidth * safeScale)),
      height: Math.max(1, Math.round(naturalHeight * safeScale))
    };
  }

  function resizeCanvas() {
    if (!state.imageLoaded) return;

    dom.workspaceWrapper.style.width = '';
    dom.workspaceWrapper.style.height = '';

    const displaySize = getMapDisplaySize();
    const displayWidth = displaySize.width;
    const displayHeight = displaySize.height;

    const padding = Math.max(
      state.workspaceMinPadding,
      Math.round(Math.max(displayWidth, displayHeight) * state.workspacePaddingRatio)
    );
    state.mapOffsetX = padding;
    state.mapOffsetY = padding;

    const workspaceWidth = displayWidth + padding * 2;
    const workspaceHeight = displayHeight + padding * 2;

    dom.mapImg.style.left = `${state.mapOffsetX}px`;
    dom.mapImg.style.top = `${state.mapOffsetY}px`;
    dom.mapImg.style.width = `${displayWidth}px`;
    dom.mapImg.style.height = `${displayHeight}px`;

    dom.workspaceWrapper.style.width = `${workspaceWidth}px`;
    dom.workspaceWrapper.style.height = `${workspaceHeight}px`;

    dom.paintCanvas.width = workspaceWidth;
    dom.paintCanvas.height = workspaceHeight;
    dom.paintCanvas.style.width = `${workspaceWidth}px`;
    dom.paintCanvas.style.height = `${workspaceHeight}px`;

    // Read real rendered map metrics after layout to keep pointer math and JSON mapping exact.
    const workspaceRect = dom.workspaceWrapper.getBoundingClientRect();
    const mapRect = dom.mapImg.getBoundingClientRect();
    state.mapOffsetX = mapRect.left - workspaceRect.left;
    state.mapOffsetY = mapRect.top - workspaceRect.top;
    state.mapWidth = mapRect.width;
    state.mapHeight = mapRect.height;

    draw();
  }

  function resetToDropPrompt() {
    state.imageLoaded = false;
    state.imageSrc = '';
    dom.dropPrompt.style.display = 'flex';
    dom.workspaceWrapper.style.display = 'none';
    uiActions.hideProperties();
    uiActions.clearAllObjects();
  }

  function loadImage(src) {
    dom.mapImg.src = src;
    dom.mapImg.onload = () => {
      state.imageLoaded = true;
      state.imageSrc = src;

      dom.dropPrompt.style.display = 'none';
      dom.workspaceWrapper.style.display = 'block';

      setTimeout(resizeCanvas, 50);
    };

    dom.mapImg.onerror = () => {
      alert('Error loading image. Make sure the file exists and is a valid image.');
      resetToDropPrompt();
    };
  }

  function handleImageFile(file) {
    if (!file.type.match('image.*')) {
      alert('Please select a valid image file (PNG, JPG, or SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      loadImage(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  function onDragOver(e) {
    e.preventDefault();
    dom.dropZone.classList.add('drag-over');
  }

  function onDragLeave(e) {
    e.preventDefault();
    dom.dropZone.classList.remove('drag-over');
  }

  function onDropFile(e) {
    e.preventDefault();
    dom.dropZone.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageFile(files[0]);
    }
  }

  function onFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
      handleImageFile(files[0]);
    }
  }

  return {
    loadImage,
    resetToDropPrompt,
    resizeCanvas,
    onDragOver,
    onDragLeave,
    onDropFile,
    onFileSelect
  };
}
