import http from 'node:http';
import compression from 'compression';

process.env.ASTRO_NODE_AUTOSTART = 'disabled';
const { handler } = await import('./dist/server/entry.mjs');

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';

const compress = compression({
  threshold: 512,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
});

const server = http.createServer((req, res) => {
  const url = req.url || '';
  if (url.startsWith('/_astro/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (url.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
  }

  compress(req, res, () => {
    handler(req, res);
  });
});

server.listen(port, host, () => {
  console.log(`⚡ Production server with gzip/brotli listening on http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
});
