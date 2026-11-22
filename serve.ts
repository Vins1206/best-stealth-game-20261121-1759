// serve.ts — a tiny static server for playing Lantern Heist locally.
// Run: node serve.ts, then open http://localhost:8080 in desktop Chrome.

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'game');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

const server = createServer((request, response) => {
  const url = new URL(request.url || '/', 'http://localhost');
  let path = join(root, url.pathname === '/' ? 'index.html' : url.pathname);
  if (!path.startsWith(root) || !existsSync(path) || !statSync(path).isFile()) {
    response.writeHead(404, { 'content-type': 'text/plain' });
    response.end('not found');
    return;
  }
  response.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' });
  response.end(readFileSync(path));
});

server.listen(8080, () => {
  console.log('Lantern Heist at http://localhost:8080');
});
