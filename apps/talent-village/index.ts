const isDev = Bun.env.NODE_ENV !== "production";

const port = process.env.PORT || 3000;

const server = Bun.serve({
  port: port,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // Serve static files from dist/ in production
    const baseDir = isDev ? "./public" : "./dist";
    let file = Bun.file(`${baseDir}${path}`);

    // If path is root or file doesn't exist, serve index.html (SPA fallback)
    if (path === "/" || !(await file.exists())) {
      file = Bun.file(`${baseDir}/index.html`);
    }

    if (await file.exists()) {
      return new Response(file);
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Talent Village running at http://localhost:${port}`);
