import { readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { extname, join, relative } from "node:path";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

/** Serves a built site folder on a free local port. */
export function serveStatic(root: string): Promise<{ origin: string; server: Server }> {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url ?? "/", "http://local").pathname);
    const file = extname(path) ? join(root, path) : join(root, path, "index.html");
    let body: Buffer;
    try {
      body = await readFile(file);
    } catch {
      res.writeHead(404).end("not found");
      return;
    }
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  });
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve({ origin: `http://127.0.0.1:${port}`, server });
    }),
  );
}

/** Every page in a built site, as URL paths like "/" and "/plays/unblock-crawling/". */
export function pagesIn(root: string): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(join(dir, entry.name));
      else if (entry.name === "index.html") {
        const rel = relative(root, dir);
        found.push(rel ? `/${rel.split("\\").join("/")}/` : "/");
      }
    }
  };
  walk(root);
  return found.sort();
}
