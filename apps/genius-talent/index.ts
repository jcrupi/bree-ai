import index from "./index.html";

const isDev = Bun.env.NODE_ENV !== "production";
const tailwindInput = "./src/index.css";
const tailwindOutput = "./src/tailwind.css";

if (isDev) {
  Bun.spawn(
    ["bunx", "tailwindcss", "-i", tailwindInput, "-o", tailwindOutput, "--watch"],
    {
      stdout: "inherit",
      stderr: "inherit",
    }
  );
}

const port = process.env.PORT || 3000;

const server = Bun.serve({
  port: port,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // Handle API
    if (path === "/api/claude" && req.method === "POST") {
      try {
        const { command } = await req.json();
        const proc = Bun.spawn(["claude", command], { cwd: process.cwd() });
        const output = await new Response(proc.stdout).text();
        const error = await new Response(proc.stderr).text();
        return Response.json({ 
          output: output || error || `Command "${command}" executed with no output.` 
        });
      } catch (e) {
        return Response.json({ error: "Failed to execute command" }, { status: 500 });
      }
    }

    // Serve static files from dist/ (Production) or public/ (Dev/Fallback)
    const baseDir = isDev ? "./public" : "./dist";
    let file = Bun.file(`${baseDir}${path}`);
    
    // If path is root or file doesn't exist, serve index.html
    if (path === "/" || !(await file.exists())) {
      file = Bun.file(`${baseDir}/index.html`);
    }

    if (await file.exists()) {
      return new Response(file);
    }

    return new Response("Not Found", { status: 404 });
  },
  development: {
    hmr: true,
  },
});

console.log(`GeniusTalentAI running at http://localhost:${port}`);