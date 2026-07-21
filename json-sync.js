export function createJSONSync(state, dom, draw, showProperties, hideProperties) {
  function sanitizeDecorType(value) {
    const type = typeof value === 'string' ? value.trim() : '';
    return ['normal', 'background', 'interact'].includes(type) ? type : 'normal';
  }

  function sanitizePositiveInt(value, fallback) {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return fallback;
    return Math.max(1, Math.round(num));
  }

  function setJSONStatus(isValid, msg = '') {
    if (isValid) {
      dom.jsonStatus.textContent = 'Valid';
      dom.jsonStatus.className = 'status-badge valid';
      dom.jsonStatus.title = 'JSON structure is correct and synced';
    } else {
      dom.jsonStatus.textContent = 'Error';
      dom.jsonStatus.className = 'status-badge error';
      dom.jsonStatus.title = `Parsing error: ${msg}`;
    }
  }

  function updateJSONTextarea() {
    dom.jsonTextarea.value = JSON.stringify({ objects: state.objects }, null, 2);
    setJSONStatus(true);
  }

  function setJSONDropState(isActive) {
    dom.jsonDropZone.classList.toggle('drag-over', isActive);
  }

  function onJSONInput() {
    const val = dom.jsonTextarea.value.trim();
    if (val === '') {
      state.objects = [];
      setJSONStatus(true);
      draw();
      return;
    }

    try {
      const parsed = JSON.parse(val);
      if (parsed && Array.isArray(parsed.objects)) {
        const cleanedObjects = parsed.objects.map((obj) => {
          const cleaned = {
            type: obj.type || 'platform'
          };

          if (cleaned.type === 'decor') {
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
          } else if (cleaned.type === 'spawn_point' && obj.coord) {
            cleaned.coord = {
              x: Number(obj.coord.x) || 0,
              y: Number(obj.coord.y) || 0
            };
          } else if (Array.isArray(obj.polygon) && obj.polygon.length >= 3) {
            cleaned.polygon = obj.polygon.map((pt) => ({
              x: Number(pt.x) || 0,
              y: Number(pt.y) || 0
            }));
          } else if (Array.isArray(obj.polyline) && obj.polyline.length >= 2) {
            cleaned.polyline = obj.polyline.map((pt) => ({
              x: Number(pt.x) || 0,
              y: Number(pt.y) || 0
            }));
          } else if (obj.rectangle) {
            cleaned.rectangle = {
              x1: Number(obj.rectangle.x1) || 0,
              y1: Number(obj.rectangle.y1) || 0,
              x2: Number(obj.rectangle.x2) || 0,
              y2: Number(obj.rectangle.y2) || 0
            };
          } else {
            if (cleaned.type === 'spawn_point') {
              cleaned.coord = { x: 0, y: 0 };
            } else if (cleaned.type === 'poly_floor_line') {
              cleaned.polyline = [
                { x: 0, y: 0 },
                { x: 0.1, y: 0 }
              ];
            } else {
              cleaned.rectangle = { x1: 0, y1: 0, x2: 0.1, y2: 0.1 };
            }
          }

          if (cleaned.type === 'platform') {
            cleaned.collision = obj.collision !== undefined ? obj.collision : true;
          } else if (cleaned.type === 'area') {
            cleaned.name = typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim() : 'paper_station';
          } else if (cleaned.type === 'poly_floor_line') {
            cleaned.collision = obj.collision !== undefined ? obj.collision : true;
            cleaned.one_way = obj.one_way !== undefined ? Boolean(obj.one_way) : true;
          } else if (cleaned.type === 'tunnel') {
            if (typeof obj.tunnel_name === 'string') {
              cleaned.tunnel_name = obj.tunnel_name;
            } else if (obj.tunnel_id !== undefined) {
              cleaned.tunnel_name = String(obj.tunnel_id);
            } else {
              cleaned.tunnel_name = '';
            }
          } else if (cleaned.type === 'spawn_point') {
            cleaned.name = typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim() : 'coin';
          } else if (cleaned.type === 'decor') {
            cleaned.types = sanitizeDecorType(obj.types);
            cleaned.n_row = sanitizePositiveInt(obj.n_row, 1);
            cleaned.n_col = sanitizePositiveInt(obj.n_col, 1);
            cleaned.fps = sanitizePositiveInt(obj.fps, 8);
            cleaned.n_frames = Math.min(
              sanitizePositiveInt(obj.n_frames, cleaned.n_row * cleaned.n_col),
              cleaned.n_row * cleaned.n_col
            );
            cleaned.event_name = cleaned.types === 'interact'
              ? (typeof obj.event_name === 'string' ? obj.event_name.trim() : '')
              : '';
            cleaned.filename = typeof obj.filename === 'string' ? obj.filename.trim() : '';
          }

          return cleaned;
        });

        state.objects = cleanedObjects;

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

  function formatJSONText() {
    try {
      const val = JSON.parse(dom.jsonTextarea.value);
      dom.jsonTextarea.value = JSON.stringify(val, null, 2);
      setJSONStatus(true);
    } catch (err) {
      setJSONStatus(false, err.message);
    }
  }

  function copyJSONToClipboard() {
    dom.jsonTextarea.select();
    document.execCommand('copy');

    const originalText = dom.btnCopyJson.innerHTML;
    dom.btnCopyJson.innerHTML = '<span class="icon">✓</span> Copied!';
    dom.btnCopyJson.style.backgroundColor = '#10b981';
    setTimeout(() => {
      dom.btnCopyJson.innerHTML = originalText;
      dom.btnCopyJson.style.backgroundColor = '';
    }, 1500);
  }

  function downloadJSONFile() {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(dom.jsonTextarea.value)}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'map.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  function onJSONDragOver(e) {
    e.preventDefault();
    setJSONDropState(true);
  }

  function onJSONDragLeave(e) {
    e.preventDefault();

    if (!dom.jsonDropZone.contains(e.relatedTarget)) {
      setJSONDropState(false);
    }
  }

  function onJSONDropFile(e) {
    e.preventDefault();
    setJSONDropState(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) {
      return;
    }

    const [file] = files;
    const isJsonFile = file.type === 'application/json' || file.name.toLowerCase().endsWith('.json');

    if (!isJsonFile) {
      setJSONStatus(false, 'Please drop a .json file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      dom.jsonTextarea.value = typeof event.target.result === 'string' ? event.target.result : '';
      onJSONInput();
    };
    reader.onerror = () => {
      setJSONStatus(false, 'Unable to read dropped file.');
    };
    reader.readAsText(file);
  }

  return {
    updateJSONTextarea,
    onJSONInput,
    formatJSONText,
    copyJSONToClipboard,
    downloadJSONFile,
    onJSONDragOver,
    onJSONDragLeave,
    onJSONDropFile
  };
}
