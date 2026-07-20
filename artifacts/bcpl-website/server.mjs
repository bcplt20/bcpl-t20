/**
 * Minimal production static file server for BCPL T20 website.
 * Uses only Node.js built-ins — no pnpm/vite needed at runtime.
 * Handles SPA routing by falling back to index.html.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, 'dist/public');
// In production, PORT is set to localPort (20570) by artifact.toml.
// Fallback to 20570 to match localPort even if env var is absent.
const port = parseInt(process.env.PORT ?? '20570', 10);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.mjs':  'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':  'font/ttf',
  '.txt':  'text/plain',
};

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

const server = createServer(async (req, res) => {
  // Strip query string
  const url = req.url.split('?')[0];

  // Try the exact path first, then fall back to index.html (SPA routing)
  const candidates = [
    join(distDir, url === '/' ? 'index.html' : url),
    join(distDir, url, 'index.html'),
    join(distDir, 'index.html'),
  ];

  for (const candidate of candidates) {
    if (await exists(candidate)) {
      try {
        const content = await readFile(candidate);
        const mime = MIME[extname(candidate)] ?? 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': mime,
          'Cache-Control': extname(candidate) === '.html'
            ? 'no-cache'
            : 'public, max-age=31536000, immutable',
        });
        res.end(content);
        return;
      } catch {
        break;
      }
    }
  }

  // Should never reach here — last candidate is always index.html
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`BCPL T20 server listening on port ${port}`);
});
