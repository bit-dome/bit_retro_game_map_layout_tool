export function getDOM() {
  const paintCanvas = document.getElementById('paint-canvas');

  return {
    dropZone: document.getElementById('drop-zone'),
    dropPrompt: document.getElementById('drop-prompt'),
    workspaceWrapper: document.getElementById('workspace-wrapper'),
    mapImg: document.getElementById('map-img'),
    paintCanvas,
    ctx: paintCanvas.getContext('2d'),

    toolSelect: document.getElementById('tool-select'),
    toolPlatform: document.getElementById('tool-platform'),
    toolArea: document.getElementById('tool-area'),
    toolPolygon: document.getElementById('tool-polygon'),
    toolPolyFloorLine: document.getElementById('tool-poly-floor-line'),
    toolTunnel: document.getElementById('tool-tunnel'),
    toolDecor: document.getElementById('tool-decor'),
    toolSpawnPoint: document.getElementById('tool-spawn-point'),
    btnClear: document.getElementById('btn-clear'),
    btnCopyJson: document.getElementById('btn-copy-json'),
    btnDownloadJson: document.getElementById('btn-download-json'),
    btnFormatJson: document.getElementById('btn-format-json'),
    fileInput: document.getElementById('file-input'),

    jsonDropZone: document.getElementById('json-drop-zone'),
    jsonTextarea: document.getElementById('json-textarea'),
    jsonStatus: document.getElementById('json-status'),

    propertiesPanel: document.getElementById('properties-panel'),
    closeProperties: document.getElementById('close-properties'),
    propType: document.getElementById('prop-type'),
    propCollisionContainer: document.getElementById('prop-collision-container'),
    propCollision: document.getElementById('prop-collision'),
    propNameContainer: document.getElementById('prop-name-container'),
    propName: document.getElementById('prop-name'),
    propTunnelContainer: document.getElementById('prop-tunnel-container'),
    propTunnelId: document.getElementById('prop-tunnel-id'),
    propDecorContainer: document.getElementById('prop-decor-container'),
    propDecorTypes: document.getElementById('prop-decor-types'),
    propDecorNRow: document.getElementById('prop-decor-n-row'),
    propDecorNCol: document.getElementById('prop-decor-n-col'),
    propDecorFps: document.getElementById('prop-decor-fps'),
    propDecorNFrames: document.getElementById('prop-decor-n-frames'),
    propDecorFilename: document.getElementById('prop-decor-filename'),
    propDecorEventNameContainer: document.getElementById('prop-decor-event-name-container'),
    propDecorEventName: document.getElementById('prop-decor-event-name'),
    propDecorDropzone: document.getElementById('prop-decor-dropzone'),
    propCoords: document.getElementById('prop-coords'),
    btnDeleteObject: document.getElementById('btn-delete-object')
  };
}
