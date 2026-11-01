// Minimal static server with gzip, no deps. Usage: node serve.cjs <dir> <port>
// Directory URLs map to index.html; extensionless paths try .html (Framework cleanUrls).
const http = require("http"), fs = require("fs"), path = require("path"), zlib = require("zlib");
const [dir, port] = [path.resolve(process.argv[2]), +process.argv[3]];
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".csv": "text/csv", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".woff2": "font/woff2", ".txt": "text/plain" };
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let f = path.join(dir, p);
  if (!f.startsWith(dir)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  else if (!fs.existsSync(f) && fs.existsSync(f + ".html")) f = f + ".html";
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end("404 " + p); }
  const body = fs.readFileSync(f), type = types[path.extname(f)] || "application/octet-stream";
  const gz = /gzip/.test(req.headers["accept-encoding"] || "") && /text|javascript|json|svg|csv/.test(type);
  res.writeHead(200, { "content-type": type, "cache-control": "no-cache", ...(gz ? { "content-encoding": "gzip" } : {}) });
  res.end(gz ? zlib.gzipSync(body) : body);
}).listen(port, "127.0.0.1", () => console.log(`serving ${dir} on ${port}`));
