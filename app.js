/**
 * MapShaper - Game Map Layout Definer
 * Pure Vanilla JavaScript Application Logic
 */

// Application State
let state = {
  objects: [],
  activeTool: 'select', // 'select', 'platform', or 'tunnel'
  selectedObjectIndex: -1,
  isDrawing: false,
  dragStart: { x: 0, y: 0 },
  dragEnd: { x: 0, y: 0 },
  isMoving: false,
  moveStartPos: { x: 0, y: 0 },
  isResizing: false,
  resizeHandle: null,
  resizeStartPos: { x: 0, y: 0 },
  initialRectCoords: null,
  imageLoaded: false,
  imageSrc: ''
};

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const dropPrompt = document.getElementById('drop-prompt');
const workspaceWrapper = document.getElementById('workspace-wrapper');
const mapImg = document.getElementById('map-img');
const paintCanvas = document.getElementById('paint-canvas');
const ctx = paintCanvas.getContext('2d');

const toolSelect = document.getElementById('tool-select');
const toolPlatform = document.getElementById('tool-platform');
const toolTunnel = document.getElementById('tool-tunnel');
const btnLoadDemo = document.getElementById('btn-load-demo');
const btnClear = document.getElementById('btn-clear');
const btnCopyJson = document.getElementById('btn-copy-json');
const btnDownloadJson = document.getElementById('btn-download-json');
const btnFormatJson = document.getElementById('btn-format-json');
const fileInput = document.getElementById('file-input');

const jsonTextarea = document.getElementById('json-textarea');
const jsonStatus = document.getElementById('json-status');

const propertiesPanel = document.getElementById('properties-panel');
const closeProperties = document.getElementById('close-properties');
const propType = document.getElementById('prop-type');
const propCollisionContainer = document.getElementById('prop-collision-container');
const propCollision = document.getElementById('prop-collision');
const propTunnelContainer = document.getElementById('prop-tunnel-container');
const propTunnelId = document.getElementById('prop-tunnel-id');
const propCoords = document.getElementById('prop-coords');
const btnDeleteObject = document.getElementById('btn-delete-object');

// Initialize App
function init() {
  setupEventListeners();
  updateJSONTextarea();
}

// Event Listeners Configuration
function setupEventListeners() {
  // Toolbar Buttons
  toolSelect.addEventListener('click', () => setTool('select'));
  toolPlatform.addEventListener('click', () => setTool('platform'));
  toolTunnel.addEventListener('click', () => setTool('tunnel'));
  
  // Action Buttons
  btnLoadDemo.addEventListener('click', loadDemoMap);
  btnClear.addEventListener('click', clearAllObjects);
  btnCopyJson.addEventListener('click', copyJSONToClipboard);
  btnDownloadJson.addEventListener('click', downloadJSONFile);
  btnFormatJson.addEventListener('click', formatJSONText);
  
  // Drag & Drop Elements
  dropZone.addEventListener('dragover', onDragOver);
  dropZone.addEventListener('dragleave', onDragLeave);
  dropZone.addEventListener('drop', onDropFile);
  fileInput.addEventListener('change', onFileSelect);
  
  // Canvas Mouse Events
  paintCanvas.addEventListener('mousedown', onMouseDown);
  paintCanvas.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp); // Listen on window to handle mouse release outside canvas
  
  // Properties panel triggers
  closeProperties.addEventListener('click', hideProperties);
  btnDeleteObject.addEventListener('click', deleteSelectedObject);
  propTunnelId.addEventListener('input', onTunnelIdChange);
  
  // JSON Textarea Editing
  jsonTextarea.addEventListener('input', onJSONInput);
  
  // Resize listeners
  window.addEventListener('resize', resizeCanvas);
  
  // Keyboard Shortcuts
  document.addEventListener('keydown', onKeyDown);
}

// Tool Switching
function setTool(toolName) {
  state.activeTool = toolName;
  toolSelect.classList.toggle('active', toolName === 'select');
  toolPlatform.classList.toggle('active', toolName === 'platform');
  toolTunnel.classList.toggle('active', toolName === 'tunnel');
  
  if (toolName === 'select') {
    paintCanvas.style.cursor = 'default';
  } else {
    paintCanvas.style.cursor = 'crosshair';
  }
}

// Load Image Handler
function loadImage(src) {
  mapImg.src = src;
  mapImg.onload = () => {
    state.imageLoaded = true;
    state.imageSrc = src;
    
    // UI layout update
    dropPrompt.style.display = 'none';
    workspaceWrapper.style.display = 'block';
    
    // Ensure image is rendered before setting canvas bounds
    setTimeout(resizeCanvas, 50);
  };
  
  mapImg.onerror = () => {
    alert("Error loading image. Make sure the file exists and is a valid image.");
    resetToDropPrompt();
  };
}

function resetToDropPrompt() {
  state.imageLoaded = false;
  state.imageSrc = '';
  dropPrompt.style.display = 'flex';
  workspaceWrapper.style.display = 'none';
  hideProperties();
  clearAllObjects();
}

function resizeCanvas() {
  if (!state.imageLoaded) return;
  
  // Clear previous locked dimensions to let CSS responsive layout recalculate sizes
  workspaceWrapper.style.width = '';
  workspaceWrapper.style.height = '';
  
  // Measure the new display size of the scaled image
  const displayWidth = mapImg.clientWidth;
  const displayHeight = mapImg.clientHeight;
  
  // Lock the wrapper size to match the image dimensions exactly
  workspaceWrapper.style.width = `${displayWidth}px`;
  workspaceWrapper.style.height = `${displayHeight}px`;
  
  paintCanvas.width = displayWidth;
  paintCanvas.height = displayHeight;
  draw();
}

// Load Demo Image (sample_map.png in current workspace)
function loadDemoMap() {
  loadImage('sample_map.png');
}

// Clear all objects
function clearAllObjects() {
  if (state.objects.length === 0) return;
  if (confirm("Are you sure you want to clear all objects?")) {
    state.objects = [];
    state.selectedObjectIndex = -1;
    hideProperties();
    updateJSONTextarea();
    draw();
  }
}

// Drag & Drop Functionality
function onDragOver(e) {
  e.preventDefault();
  dropZone.classList.add('drag-over');
}

function onDragLeave(e) {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
}

function onDropFile(e) {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  
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

// Mouse Canvas Interaction
function getObjectIndexAt(canvasX, canvasY) {
  const nx = canvasX / paintCanvas.width;
  const ny = canvasY / paintCanvas.height;
  
  for (let i = state.objects.length - 1; i >= 0; i--) {
    const obj = state.objects[i];
    if (obj.rectangle) {
      const rect = obj.rectangle;
      const minX = Math.min(rect.x1, rect.x2);
      const maxX = Math.max(rect.x1, rect.x2);
      const minY = Math.min(rect.y1, rect.y2);
      const maxY = Math.max(rect.y1, rect.y2);
      
      if (nx >= minX && nx <= maxX && ny >= minY && ny <= maxY) {
        return i;
      }
    }
  }
  return -1;
}

function getResizeHandleAt(x, y) {
  if (state.selectedObjectIndex === -1 || state.activeTool !== 'select') return null;
  
  const obj = state.objects[state.selectedObjectIndex];
  const rect = obj.rectangle;
  
  const cx1 = rect.x1 * paintCanvas.width;
  const cy1 = rect.y1 * paintCanvas.height;
  const cx2 = rect.x2 * paintCanvas.width;
  const cy2 = rect.y2 * paintCanvas.height;
  
  const handles = {
    tl: { x: cx1, y: cy1 },
    tr: { x: cx2, y: cy1 },
    bl: { x: cx1, y: cy2 },
    br: { x: cx2, y: cy2 }
  };
  
  const hitSize = 10; // hit box radius around corner
  
  for (const [key, pos] of Object.entries(handles)) {
    if (Math.abs(x - pos.x) <= hitSize && Math.abs(y - pos.y) <= hitSize) {
      return key;
    }
  }
  
  return null;
}

function onMouseDown(e) {
  if (!state.imageLoaded) return;
  
  const rect = paintCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  if (state.activeTool === 'select') {
    // 1. Check if user clicked a resize handle first
    const resizeHandle = getResizeHandleAt(x, y);
    if (resizeHandle) {
      state.isResizing = true;
      state.resizeHandle = resizeHandle;
      state.resizeStartPos = { x, y };
      state.initialRectCoords = JSON.parse(JSON.stringify(state.objects[state.selectedObjectIndex].rectangle));
      draw();
      return;
    }
    
    // 2. Otherwise check for object selection/movement
    const clickedIndex = getObjectIndexAt(x, y);
    state.selectedObjectIndex = clickedIndex;
    
    if (clickedIndex !== -1) {
      showProperties(clickedIndex);
      state.isMoving = true;
      state.moveStartPos = { x, y };
      state.initialRectCoords = JSON.parse(JSON.stringify(state.objects[clickedIndex].rectangle));
    } else {
      hideProperties();
    }
    draw();
  } else {
    // Drawing Tools
    state.isDrawing = true;
    state.dragStart = { x, y };
    state.dragEnd = { x, y };
  }
}

function onMouseMove(e) {
  if (!state.imageLoaded) return;
  
  const rect = paintCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  if (state.activeTool === 'select') {
    if (state.isResizing && state.selectedObjectIndex !== -1) {
      // HANDLE RESIZING
      const deltaX = (x - state.resizeStartPos.x) / paintCanvas.width;
      const deltaY = (y - state.resizeStartPos.y) / paintCanvas.height;
      const initial = state.initialRectCoords;
      const selectedObj = state.objects[state.selectedObjectIndex];
      
      let x1 = initial.x1;
      let y1 = initial.y1;
      let x2 = initial.x2;
      let y2 = initial.y2;
      
      const minSize = 0.005; // 0.5% minimum size limit
      
      switch (state.resizeHandle) {
        case 'tl':
          x1 = Math.max(0, Math.min(initial.x1 + deltaX, x2 - minSize));
          y1 = Math.max(0, Math.min(initial.y1 + deltaY, y2 - minSize));
          break;
        case 'tr':
          x2 = Math.max(x1 + minSize, Math.min(initial.x2 + deltaX, 1));
          y1 = Math.max(0, Math.min(initial.y1 + deltaY, y2 - minSize));
          break;
        case 'bl':
          x1 = Math.max(0, Math.min(initial.x1 + deltaX, x2 - minSize));
          y2 = Math.max(y1 + minSize, Math.min(initial.y2 + deltaY, 1));
          break;
        case 'br':
          x2 = Math.max(x1 + minSize, Math.min(initial.x2 + deltaX, 1));
          y2 = Math.max(y1 + minSize, Math.min(initial.y2 + deltaY, 1));
          break;
      }
      
      selectedObj.rectangle = {
        x1: parseFloat(x1.toFixed(4)),
        y1: parseFloat(y1.toFixed(4)),
        x2: parseFloat(x2.toFixed(4)),
        y2: parseFloat(y2.toFixed(4))
      };
      
      showProperties(state.selectedObjectIndex);
      updateJSONTextarea();
      draw();
    } else if (state.isMoving && state.selectedObjectIndex !== -1) {
      // HANDLE MOVING
      const deltaX = (x - state.moveStartPos.x) / paintCanvas.width;
      const deltaY = (y - state.moveStartPos.y) / paintCanvas.height;
      const selectedObj = state.objects[state.selectedObjectIndex];
      
      let newX1 = state.initialRectCoords.x1 + deltaX;
      let newX2 = state.initialRectCoords.x2 + deltaX;
      const w = newX2 - newX1;
      
      if (newX1 < 0) {
        newX1 = 0;
        newX2 = w;
      } else if (newX2 > 1) {
        newX2 = 1;
        newX1 = 1 - w;
      }
      
      let newY1 = state.initialRectCoords.y1 + deltaY;
      let newY2 = state.initialRectCoords.y2 + deltaY;
      const h = newY2 - newY1;
      
      if (newY1 < 0) {
        newY1 = 0;
        newY2 = h;
      } else if (newY2 > 1) {
        newY2 = 1;
        newY1 = 1 - h;
      }
      
      selectedObj.rectangle = {
        x1: parseFloat(newX1.toFixed(4)),
        y1: parseFloat(newY1.toFixed(4)),
        x2: parseFloat(newX2.toFixed(4)),
        y2: parseFloat(newY2.toFixed(4))
      };
      
      showProperties(state.selectedObjectIndex);
      updateJSONTextarea();
      draw();
    } else {
      // Hover feedback style
      const resizeHandle = getResizeHandleAt(x, y);
      if (resizeHandle) {
        paintCanvas.style.cursor = (resizeHandle === 'tl' || resizeHandle === 'br') ? 'nwse-resize' : 'nesw-resize';
      } else {
        const hoveredIndex = getObjectIndexAt(x, y);
        paintCanvas.style.cursor = hoveredIndex !== -1 ? 'move' : 'default';
      }
    }
  } else {
    // Drawing Tools
    paintCanvas.style.cursor = 'crosshair';
    if (state.isDrawing) {
      state.dragEnd = { x, y };
      draw();
    }
  }
}

function onMouseUp(e) {
  if (state.activeTool === 'select') {
    state.isMoving = false;
    state.isResizing = false;
    state.resizeHandle = null;
    state.initialRectCoords = null;
    
    // Sort coordinates safely to ensure x1 < x2 and y1 < y2
    if (state.selectedObjectIndex !== -1) {
      const obj = state.objects[state.selectedObjectIndex];
      if (obj && obj.rectangle) {
        const rect = obj.rectangle;
        const rx1 = Math.min(rect.x1, rect.x2);
        const rx2 = Math.max(rect.x1, rect.x2);
        const ry1 = Math.min(rect.y1, rect.y2);
        const ry2 = Math.max(rect.y1, rect.y2);
        
        obj.rectangle = {
          x1: parseFloat(rx1.toFixed(4)),
          y1: parseFloat(ry1.toFixed(4)),
          x2: parseFloat(rx2.toFixed(4)),
          y2: parseFloat(ry2.toFixed(4))
        };
        updateJSONTextarea();
        draw();
      }
    }
  } else {
    // Drawing Tools
    if (!state.isDrawing) return;
    state.isDrawing = false;
    
    const dx = Math.abs(state.dragEnd.x - state.dragStart.x);
    const dy = Math.abs(state.dragEnd.y - state.dragStart.y);
    
    // Draw tool only draws. Require a minimum size to prevent creating microscopic elements
    if (dx >= 5 && dy >= 5) {
      createObjectFromDrag();
    } else {
      draw(); // Clear draft line
    }
  }
}

function createObjectFromDrag() {
  const width = paintCanvas.width;
  const height = paintCanvas.height;
  
  // Calculate normalized coordinates bounded 0 to 1
  let x1 = Math.min(state.dragStart.x, state.dragEnd.x) / width;
  let x2 = Math.max(state.dragStart.x, state.dragEnd.x) / width;
  let y1 = Math.min(state.dragStart.y, state.dragEnd.y) / height;
  let y2 = Math.max(state.dragStart.y, state.dragEnd.y) / height;
  
  // Bounding safety
  x1 = Math.max(0, Math.min(1, x1));
  x2 = Math.max(0, Math.min(1, x2));
  y1 = Math.max(0, Math.min(1, y1));
  y2 = Math.max(0, Math.min(1, y2));
  
  const newObject = {
    type: state.activeTool,
    rectangle: {
      x1: parseFloat(x1.toFixed(4)),
      y1: parseFloat(y1.toFixed(4)),
      x2: parseFloat(x2.toFixed(4)),
      y2: parseFloat(y2.toFixed(4))
    }
  };
  
  if (state.activeTool === 'platform') {
    newObject.collision = true;
  } else if (state.activeTool === 'tunnel') {
    // Increment tunnel_id based on largest tunnel id
    let maxId = 0;
    state.objects.forEach(obj => {
      if (obj.type === 'tunnel' && typeof obj.tunnel_id === 'number') {
        maxId = Math.max(maxId, obj.tunnel_id);
      }
    });
    newObject.tunnel_id = maxId + 1;
  }
  
  state.objects.push(newObject);
  
  // After drawing, automatically select the object so user can view properties
  state.selectedObjectIndex = state.objects.length - 1;
  showProperties(state.selectedObjectIndex);
  updateJSONTextarea();
  draw();
}

// Drawing Routine
function draw() {
  ctx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
  
  // Draw existing shapes
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
    
    // Choose styling based on object type
    if (obj.type === 'platform') {
      ctx.strokeStyle = `rgba(var(--color-platform-rgb), ${isSelected ? '1' : '0.7'})`;
      ctx.fillStyle = `rgba(var(--color-platform-rgb), ${isSelected ? '0.25' : '0.12'})`;
      ctx.lineWidth = isSelected ? 3 : 1.5;
    } else if (obj.type === 'tunnel') {
      ctx.strokeStyle = `rgba(var(--color-tunnel-rgb), ${isSelected ? '1' : '0.7'})`;
      ctx.fillStyle = `rgba(var(--color-tunnel-rgb), ${isSelected ? '0.25' : '0.12'})`;
      ctx.lineWidth = isSelected ? 3 : 1.5;
    }
    
    // Draw base shape
    ctx.fillRect(x1, y1, w, h);
    ctx.strokeRect(x1, y1, w, h);
    
    // Draw inner highlight line if selected
    if (isSelected) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(x1 + 2, y1 + 2, w - 4, h - 4);
      ctx.setLineDash([]);
      
      // Draw corner resize handles in select mode
      if (state.activeTool === 'select') {
        const hSize = 8;
        const half = hSize / 2;
        const strokeColor = obj.type === 'platform' ? 'var(--color-platform)' : 'var(--color-tunnel)';
        
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        
        const corners = [
          { x: x1, y: y1 }, // Top-Left
          { x: x2, y: y1 }, // Top-Right
          { x: x1, y: y2 }, // Bottom-Left
          { x: x2, y: y2 }  // Bottom-Right
        ];
        
        corners.forEach(corner => {
          ctx.fillRect(corner.x - half, corner.y - half, hSize, hSize);
          ctx.strokeRect(corner.x - half, corner.y - half, hSize, hSize);
        });
      }
    }
    
    // Render labels above shapes
    ctx.font = '10px "Fira Code", monospace';
    let label = obj.type === 'platform' ? 'Platform' : `Tunnel (ID: ${obj.tunnel_id})`;
    
    const textWidth = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(11, 15, 25, 0.85)';
    // draw small label background box
    ctx.fillRect(x1, y1 - 16, textWidth + 8, 16);
    
    // label text color
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, x1 + 4, y1 - 4);
  });
  
  // Draw Active Drag Box
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

// Properties Display Panel
function showProperties(index) {
  const obj = state.objects[index];
  if (!obj) return;
  
  propertiesPanel.style.display = 'block';
  
  // Clear classes
  propType.className = 'prop-val badge';
  propType.textContent = obj.type;
  propType.classList.add(obj.type);
  
  const rect = obj.rectangle;
  propCoords.textContent = `x1: ${rect.x1.toFixed(4)}, y1: ${rect.y1.toFixed(4)}, x2: ${rect.x2.toFixed(4)}, y2: ${rect.y2.toFixed(4)}`;
  
  if (obj.type === 'platform') {
    propCollisionContainer.style.display = 'flex';
    propTunnelContainer.style.display = 'none';
    propCollision.textContent = String(obj.collision);
  } else if (obj.type === 'tunnel') {
    propCollisionContainer.style.display = 'none';
    propTunnelContainer.style.display = 'flex';
    propTunnelId.value = obj.tunnel_id;
  }
}

function hideProperties() {
  propertiesPanel.style.display = 'none';
  state.selectedObjectIndex = -1;
  draw();
}

function deleteSelectedObject() {
  if (state.selectedObjectIndex === -1) return;
  
  state.objects.splice(state.selectedObjectIndex, 1);
  state.selectedObjectIndex = -1;
  
  hideProperties();
  updateJSONTextarea();
  draw();
}

function onTunnelIdChange(e) {
  if (state.selectedObjectIndex === -1) return;
  const obj = state.objects[state.selectedObjectIndex];
  if (obj && obj.type === 'tunnel') {
    const val = parseInt(e.target.value, 10);
    obj.tunnel_id = isNaN(val) ? 0 : val;
    updateJSONTextarea();
    draw();
  }
}

// Bidirectional Sync: Canvas -> JSON Textarea
function updateJSONTextarea() {
  const mapData = {
    objects: state.objects
  };
  jsonTextarea.value = JSON.stringify(mapData, null, 2);
  setJSONStatus(true);
}

// Bidirectional Sync: JSON Textarea -> Canvas
function onJSONInput() {
  const val = jsonTextarea.value.trim();
  if (val === '') {
    state.objects = [];
    setJSONStatus(true);
    draw();
    return;
  }
  
  try {
    const parsed = JSON.parse(val);
    if (parsed && Array.isArray(parsed.objects)) {
      // Validate structure matches to avoid breaking rendering
      const cleanedObjects = parsed.objects.map(obj => {
        const cleaned = {
          type: obj.type || 'platform'
        };
        
        if (obj.rectangle) {
          cleaned.rectangle = {
            x1: Number(obj.rectangle.x1) || 0,
            y1: Number(obj.rectangle.y1) || 0,
            x2: Number(obj.rectangle.x2) || 0,
            y2: Number(obj.rectangle.y2) || 0
          };
        } else {
          cleaned.rectangle = { x1: 0, y1: 0, x2: 0.1, y2: 0.1 };
        }
        
        if (cleaned.type === 'platform') {
          cleaned.collision = obj.collision !== undefined ? obj.collision : true;
        } else if (cleaned.type === 'tunnel') {
          cleaned.tunnel_id = obj.tunnel_id !== undefined ? Number(obj.tunnel_id) : 0;
        }
        
        return cleaned;
      });
      
      state.objects = cleanedObjects;
      
      // Keep selected shape highlighted if index is still valid
      if (state.selectedObjectIndex >= state.objects.length) {
        state.selectedObjectIndex = -1;
        hideProperties();
      } else if (state.selectedObjectIndex !== -1) {
        showProperties(state.selectedObjectIndex);
      }
      
      setJSONStatus(true);
      draw();
    } else {
      setJSONStatus(false, 'JSON must contain an "objects" array.');
    }
  } catch (err) {
    setJSONStatus(false, err.message);
  }
}

function setJSONStatus(isValid, msg = '') {
  if (isValid) {
    jsonStatus.textContent = 'Valid';
    jsonStatus.className = 'status-badge valid';
    jsonStatus.title = 'JSON structure is correct and synced';
  } else {
    jsonStatus.textContent = 'Error';
    jsonStatus.className = 'status-badge error';
    jsonStatus.title = `Parsing error: ${msg}`;
  }
}

function formatJSONText() {
  try {
    const val = JSON.parse(jsonTextarea.value);
    jsonTextarea.value = JSON.stringify(val, null, 2);
    setJSONStatus(true);
  } catch (err) {
    setJSONStatus(false, err.message);
  }
}

// Copy JSON
function copyJSONToClipboard() {
  jsonTextarea.select();
  document.execCommand('copy');
  
  // Visual button feedback
  const originalText = btnCopyJson.innerHTML;
  btnCopyJson.innerHTML = '<span class="icon">✓</span> Copied!';
  btnCopyJson.style.backgroundColor = '#10b981';
  setTimeout(() => {
    btnCopyJson.innerHTML = originalText;
    btnCopyJson.style.backgroundColor = '';
  }, 1500);
}

// Download JSON
function downloadJSONFile() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonTextarea.value);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "map.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Keyboard shortcuts handlers
function onKeyDown(e) {
  // ESC cancels drawing or selection
  if (e.key === 'Escape') {
    if (state.isDrawing) {
      state.isDrawing = false;
      draw();
    } else {
      hideProperties();
    }
  }
  
  // Delete/Backspace removes selected object (avoid triggering if user is editing inputs or textarea)
  if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedObjectIndex !== -1) {
    const activeElem = document.activeElement;
    if (activeElem !== jsonTextarea && activeElem !== propTunnelId) {
      deleteSelectedObject();
    }
  }
}

// Start application
init();
