const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "react-client", "dist");
const port = 3000;

const mime = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".json": "application/json",
};

const server = http.createServer((req, res) => {
  let fp = path.join(root, req.url.split("?")[0]);
  if (fp.endsWith("/")) fp = path.join(fp, "index.html");
  if (!fs.existsSync(fp)) {
    res.writeHead(404);
    return res.end("Not found");
  }
  const ext = path.extname(fp).toLowerCase();
  res.writeHead(200, {
    "Content-Type": mime[ext] || "application/octet-stream",
  });
  fs.createReadStream(fp).pipe(res);
});

server.listen(port, () =>
  console.log(`Static server serving ${root} on http://localhost:${port}`),
);
