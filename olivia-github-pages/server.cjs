// Optional development server. Published game consists only of static files.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json' };
module.exports = http.createServer((req, res) => {
  let requested;
  try { requested = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400).end('Bad request'); return; }
  // A mount prefix lets us verify GitHub project Pages URLs locally.
  if (requested.startsWith('/preview-repo/')) requested = requested.slice('/preview-repo'.length);
  if (requested.endsWith('/')) requested += 'index.html';
  const file = path.resolve(root, '.' + requested);
  const relative = path.relative(root, file);
  if (relative.startsWith('..') || path.isAbsolute(relative) || relative.split(path.sep).some(p => p.startsWith('.'))) {
    res.writeHead(403).end('Forbidden'); return;
  }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(data);
  });
}).listen(port, '0.0.0.0', () => console.log(`Olivia is ready: http://localhost:${port}\nProject Pages preview: http://localhost:${port}/preview-repo/`));
