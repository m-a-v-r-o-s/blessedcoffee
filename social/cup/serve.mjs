// Static server for social/, so the cup scene can load its texture and the CDN import map
// (file:// blocks both). Used by shots.mjs and ../render-reels.mjs. Port 3011+, never 3000.
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
