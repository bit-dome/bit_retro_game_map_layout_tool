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
- Polygon Floor: click to add polygon points, click first point or right-click to finish.

## Polygon editing

- Switch to Select tool.
- Click a polygon to select it.
- Drag inside polygon to move whole polygon.
- Drag white vertex handles to edit slope points.
