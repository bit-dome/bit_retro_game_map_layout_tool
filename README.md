# Map Layout Tool

This project is a static web app (HTML/CSS/JS modules). It does not require a build step.

## Start on localhost

Option 1 (Node + npx):

npx --yes http-server . -p 5500 -c-1

Then open:

http://localhost:5500

Option 2 (if you have Python installed):

python -m http.server 5500

Then open:

http://localhost:5500

## Tools

- Select: click shape to select and move.
- Platform: drag to draw rectangle platform.
- Tunnel: drag to draw rectangle tunnel.
- Spawn Point: click once to place a spawn marker stored as `{ type: "spawn_point", name, coord }`.
- Decor: drag to draw decor box stored as `{ type: "decor", rectangle, decor_type, n_row, n_col, fps, n_frames, event_name, filename }`.
- Polygon Floor: click to add polygon points, click first point or right-click to finish.
- Poly Floor Line: click to add one-way floor line points, then press Enter, double-click, or right-click to finish.

## Polygon editing

- Switch to Select tool.
- Click a polygon to select it.
- Drag inside polygon to move whole polygon.
- Drag white vertex handles to edit slope points.

## Spawn point naming

- Spawn points render as red crosshairs.
- Change the spawn semantic name, such as `coin` or `star`, by editing the object's `name` field in the JSON editor.

## Decor sprite workflow

- Select a decor object to edit `decor_type`, `n_row`, `n_col`, `fps`, `n_frames`, `event_name`, and `filename`.
- Drop a sprite sheet image onto the decor drop zone in properties to register it for runtime rendering.
- JSON stores only `filename`; the dropped image is kept in memory for the current session.
- Decor animation is rendered on canvas using sprite-sheet frame slicing and stretches each frame to fit the decor box.
- `n_frames` lets you cap playback to the used frames so trailing empty cells (for example on the last row) are skipped.
- `n_frames = 1` means the decor is rendered as a single static frame (no animation loop).
- `event_name` is only used when `decor_type = "interact"`; for other types it is automatically kept empty.
