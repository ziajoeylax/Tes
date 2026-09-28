const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const ROOT = path.resolve(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

function send(res, status, type, body) {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

function safeFile(urlPath) {
  let pathname;
  try {
    pathname = decodeURIComponent(urlPath.split('?')[0] || '/');
  } catch {
    return null;
  }
  if (pathname === '/') pathname = '/index.html';
  const candidate = path.resolve(ROOT, `.${pathname}`);
  if (candidate !== ROOT && !candidate.startsWith(`${ROOT}${path.sep}`)) return null;
  return candidate;
}

const server = http.createServer((req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    return send(res, 405, 'text/plain; charset=utf-8', 'Method Not Allowed');
  }

  if (req.url.split('?')[0] === '/health') {
    return send(res, 200, 'application/json; charset=utf-8', JSON.stringify({ ok: true, service: 'vexo-dashboard' }));
  }

  const file = safeFile(req.url);
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    return send(res, 404, 'text/plain; charset=utf-8', 'Not found');
  }

  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const size = fs.statSync(file).size;
  res.writeHead(200, {
    'Content-Type': type,
    'Content-Length': size,
    'Cache-Control': 'no-cache'
  });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).on('error', () => {
    if (!res.headersSent) send(res, 500, 'text/plain; charset=utf-8', 'Internal Server Error');
    else res.destroy();
  }).pipe(res);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`VEXO dashboard running on ${HOST}:${PORT}`);
});
