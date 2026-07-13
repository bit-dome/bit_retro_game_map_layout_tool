import { createInitialState } from './state.js';
import { getDOM } from './dom.js';
import { createCanvasRenderer } from './canvas-rendering.js';
import { createUI } from './ui.js';
import { createJSONSync } from './json-sync.js';
import { createImageLoader } from './image-loading.js';
import { createMouseInteraction } from './interaction-mouse.js';
import { createKeyboard } from './keyboard.js';

const state = createInitialState();
const dom = getDOM();
const { draw } = createCanvasRenderer(state, dom);

const callbacks = {
  updateJSONTextarea: () => {}
};

const uiActions = createUI(state, dom, draw, callbacks);
const jsonSync = createJSONSync(state, dom, draw, uiActions.showProperties, uiActions.hideProperties);
callbacks.updateJSONTextarea = jsonSync.updateJSONTextarea;

const imageLoader = createImageLoader(state, dom, draw, uiActions);
const mouseInteraction = createMouseInteraction(state, dom, draw, uiActions, jsonSync.updateJSONTextarea);
const keyboard = createKeyboard(state, dom, uiActions, draw);

function setupEventListeners() {
  dom.toolSelect.addEventListener('click', () => uiActions.setTool('select'));
  dom.toolPlatform.addEventListener('click', () => uiActions.setTool('platform'));
  dom.toolPolygon.addEventListener('click', () => uiActions.setTool('polygon'));
  dom.toolPolyFloorLine.addEventListener('click', () => uiActions.setTool('poly_floor_line'));
  dom.toolTunnel.addEventListener('click', () => uiActions.setTool('tunnel'));
  dom.toolSpawnPoint.addEventListener('click', () => uiActions.setTool('spawn_point'));

  dom.btnClear.addEventListener('click', uiActions.clearAllObjects);
  dom.btnCopyJson.addEventListener('click', jsonSync.copyJSONToClipboard);
  dom.btnDownloadJson.addEventListener('click', jsonSync.downloadJSONFile);
  dom.btnFormatJson.addEventListener('click', jsonSync.formatJSONText);

  dom.dropZone.addEventListener('dragover', imageLoader.onDragOver);
  dom.dropZone.addEventListener('dragleave', imageLoader.onDragLeave);
  dom.dropZone.addEventListener('drop', imageLoader.onDropFile);
  dom.fileInput.addEventListener('change', imageLoader.onFileSelect);

  dom.paintCanvas.addEventListener('mousedown', mouseInteraction.onMouseDown);
  dom.paintCanvas.addEventListener('mousemove', mouseInteraction.onMouseMove);
  dom.paintCanvas.addEventListener('contextmenu', mouseInteraction.onContextMenu);
  window.addEventListener('mouseup', mouseInteraction.onMouseUp);

  dom.closeProperties.addEventListener('click', uiActions.hideProperties);
  dom.btnDeleteObject.addEventListener('click', uiActions.deleteSelectedObject);
  dom.propTunnelId.addEventListener('input', uiActions.onTunnelIdChange);

  dom.jsonDropZone.addEventListener('dragover', jsonSync.onJSONDragOver);
  dom.jsonDropZone.addEventListener('dragleave', jsonSync.onJSONDragLeave);
  dom.jsonDropZone.addEventListener('drop', jsonSync.onJSONDropFile);
  dom.jsonTextarea.addEventListener('input', jsonSync.onJSONInput);
  window.addEventListener('resize', imageLoader.resizeCanvas);
  document.addEventListener('keydown', keyboard.onKeyDown);
}

function init() {
  setupEventListeners();
  jsonSync.updateJSONTextarea();
}

init();
