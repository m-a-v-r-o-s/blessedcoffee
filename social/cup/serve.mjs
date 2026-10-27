// Static server for the repo root, so cup.html can import the site's cup (src/scripts/cup.js), its label and
// three.js from node_modules (file:// blocks all three). Used by shots.mjs, render.mjs and ../render-reels.mjs.
// Loopback only. Port 3011+, never 3000.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.jpg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.css': 'text/css' };

export const serve = (root, port) => new Promise((ok) => {
  const srv = createServer(async (req, res) => {
    const path = join(root, normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)));
    if (!path.startsWith(root)) return res.writeHead(403).end();
    let body;
    try { body = await readFile(path); } catch { return res.writeHead(404).end(); }
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(body);
  }).listen(port, '127.0.0.1', () => ok(srv));
});
