// Servidor estático mínimo para revisar dist/ tal como quedará publicado (Vercel):
// - /ruta → 308 a /ruta/ (trailingSlash)
// - Archivos con hash (_astro, img, fonts, marca): caché inmutable de un año; HTML: sin caché.
// - Brotli para texto.
// Uso: node scripts/serve-dist.mjs [puerto]   (por defecto 5591)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const port = Number(process.argv[2] || process.env.PORT || 5591);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};
const INMUTABLE = /^\/(_astro|img|fonts|marca)\//;

http
  .createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://localhost');
    const ruta = decodeURIComponent(url.pathname);
    let file = path.join(root, ruta);
    if (!file.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    const esDir = fs.existsSync(file) && fs.statSync(file).isDirectory();
    if (esDir && !ruta.endsWith('/')) {
      res.writeHead(308, { Location: `${url.pathname}/${url.search}` }).end();
      return;
    }
    if (esDir) file = path.join(file, 'index.html');
    let status = 200;
    if (!fs.existsSync(file)) {
      file = path.join(root, '404.html');
      status = 404;
    }
    const ext = path.extname(file);
    const body = fs.readFileSync(file);
    const headers = {
      'Content-Type': types[ext] || 'application/octet-stream',
      'Cache-Control': status === 200 && INMUTABLE.test(ruta) ? 'public, max-age=31536000, immutable' : 'no-cache',
    };
    const compressible = /\.(html|js|css|json|xml|txt|svg|webmanifest)$/.test(ext);
    if (compressible && /\bbr\b/.test(req.headers['accept-encoding'] || '')) {
      res.writeHead(status, { ...headers, 'Content-Encoding': 'br' });
      res.end(zlib.brotliCompressSync(body));
    } else {
      res.writeHead(status, headers);
      res.end(body);
    }
  })
  .listen(port, () => console.log(`JB MERCH → http://localhost:${port}/`));
