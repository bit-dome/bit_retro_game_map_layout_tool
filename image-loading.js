export function createImageLoader(state, dom, draw, uiActions) {
  function resizeCanvas() {
    if (!state.imageLoaded) return;

    dom.workspaceWrapper.style.width = '';
    dom.workspaceWrapper.style.height = '';

    const displayWidth = dom.mapImg.clientWidth;
    const displayHeight = dom.mapImg.clientHeight;

    dom.workspaceWrapper.style.width = `${displayWidth}px`;
    dom.workspaceWrapper.style.height = `${displayHeight}px`;

    dom.paintCanvas.width = displayWidth;
    dom.paintCanvas.height = displayHeight;
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
