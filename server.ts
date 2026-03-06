import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("sunset.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS code_snippets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS downloads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    size TEXT,
    status TEXT,
    malware_check TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS system_nodes (
    id TEXT PRIMARY KEY,
    name TEXT,
    status TEXT,
    type TEXT,
    category TEXT,
    connected INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version_tag TEXT,
    logs TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Ensure public directory exists
  const publicDir = path.join(__dirname, "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  // API Routes
  app.get("/api/database", (req, res) => {
    const snippets = db.prepare("SELECT * FROM code_snippets ORDER BY timestamp DESC").all();
    const downloads = db.prepare("SELECT * FROM downloads ORDER BY timestamp DESC").all();
    const nodes = db.prepare("SELECT * FROM system_nodes").all();
    const versions = db.prepare("SELECT * FROM versions ORDER BY timestamp DESC").all();
    res.json({ snippets, downloads, nodes, versions });
  });

  app.post("/api/database/code", (req, res) => {
    const { name, content } = req.body;
    const info = db.prepare("INSERT INTO code_snippets (name, content) VALUES (?, ?)").run(name, content);
    res.json({ id: info.lastInsertRowid });
  });

  app.post("/api/database/download", (req, res) => {
    const { filename, size, status, malware_check } = req.body;
    const info = db.prepare("INSERT INTO downloads (filename, size, status, malware_check) VALUES (?, ?, ?, ?)")
      .run(filename, size, status, malware_check);
    res.json({ id: info.lastInsertRowid });
  });

  app.post("/api/database/nodes", (req, res) => {
    const { nodes } = req.body;
    const deleteStmt = db.prepare("DELETE FROM system_nodes");
    const insertStmt = db.prepare("INSERT INTO system_nodes (id, name, status, type, category, connected) VALUES (?, ?, ?, ?, ?, ?)");
    
    const transaction = db.transaction((nodesList) => {
      deleteStmt.run();
      for (const node of nodesList) {
        insertStmt.run(node.id, node.name, node.status, node.type, node.category, node.connected ? 1 : 0);
      }
    });
    
    transaction(nodes);
    res.json({ status: "ok" });
  });

  app.post("/api/database/versions", (req, res) => {
    const { version_tag, logs } = req.body;
    const info = db.prepare("INSERT INTO versions (version_tag, logs) VALUES (?, ?)").run(version_tag, JSON.stringify(logs));
    res.json({ id: info.lastInsertRowid });
  });

  const generateManifestHtml = () => {
    const snippets = db.prepare("SELECT * FROM code_snippets").all();
    const downloads = db.prepare("SELECT * FROM downloads").all();
    const nodes = db.prepare("SELECT * FROM system_nodes").all();
    const versions = db.prepare("SELECT * FROM versions").all();
    
    let appCode = "Source code restricted.";
    let serverCode = "Source code restricted.";
    let packageJson = "Source code restricted.";
    let viteConfig = "Source code restricted.";
    let indexHtml = "Source code restricted.";
    let index24Html = "Source code restricted.";
    let mainTsx = "Source code restricted.";
    let indexCss = "Source code restricted.";

    try {
      appCode = fs.readFileSync(path.join(__dirname, "src/App.tsx"), "utf-8");
      serverCode = fs.readFileSync(path.join(__dirname, "server.ts"), "utf-8");
      packageJson = fs.readFileSync(path.join(__dirname, "package.json"), "utf-8");
      viteConfig = fs.readFileSync(path.join(__dirname, "vite.config.ts"), "utf-8");
      indexHtml = fs.readFileSync(path.join(__dirname, "index.html"), "utf-8");
      index24Html = fs.readFileSync(path.join(__dirname, "index24.html"), "utf-8");
      mainTsx = fs.readFileSync(path.join(__dirname, "src/main.tsx"), "utf-8");
      indexCss = fs.readFileSync(path.join(__dirname, "src/index.css"), "utf-8");
    } catch (e) {
      console.error("Failed to read source code", e);
    }

    const escape = (str: string) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sunset Console - Public Manifest (ChatGPT Codex Integrated)</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
              @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
              body { font-family: 'JetBrains Mono', monospace; background-color: #0f172a; color: #e2e8f0; }
              .glass { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
              pre { background: rgba(0,0,0,0.5); padding: 1rem; border-radius: 0.75rem; overflow-x: auto; font-size: 0.75rem; border: 1px solid rgba(255,255,255,0.05); }
              code { color: #94a3b8; }
              .section-title { font-size: 1.25rem; font-weight: 700; color: #fff; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem; }
              .dot { width: 0.5rem; height: 0.5rem; rounded: 9999px; }
          </style>
      </head>
      <body class="p-8">
          <div class="max-w-5xl mx-auto space-y-12">
              <header class="glass p-10 rounded-[2rem] border-orange-500/30 shadow-2xl relative overflow-hidden">
                  <div class="absolute top-0 right-0 p-8 opacity-10">
                      <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v8"/><path d="m4.93 4.93 1.41 1.41"/><path d="M2 12h8"/><path d="m4.93 19.07 1.41-1.41"/><path d="M12 22v-8"/><path d="m19.07 19.07-1.41-1.41"/><path d="M22 12h-8"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                  </div>
                  <h1 class="text-5xl font-bold text-orange-500 mb-4 tracking-tighter">SUNSET CONSOLE</h1>
                  <p class="text-white/40 uppercase tracking-[0.3em] text-xs font-bold">System Manifest • ChatGPT Codex Integrated • v2.5+</p>
                  <div class="mt-8 flex flex-wrap gap-4">
                      <div class="glass px-4 py-2 rounded-xl border-orange-500/20">
                          <span class="text-[10px] text-white/40 block uppercase mb-1">Database Status</span>
                          <span class="text-emerald-400 font-bold">ENCRYPTED / ONLINE</span>
                      </div>
                      <div class="glass px-4 py-2 rounded-xl border-orange-500/20">
                          <span class="text-[10px] text-white/40 block uppercase mb-1">Nodes Detected</span>
                          <span class="text-orange-400 font-bold">${nodes.length} ACTIVE</span>
                      </div>
                      <div class="glass px-4 py-2 rounded-xl border-orange-500/20">
                          <span class="text-[10px] text-white/40 block uppercase mb-1">Protection Level</span>
                          <span class="text-emerald-400 font-bold">KERNEL SHIELD (24/7 ACTIVE)</span>
                      </div>
                  </div>
              </header>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <section class="glass p-8 rounded-[2rem] space-y-6">
                      <h2 class="section-title"><span class="dot bg-orange-500 animate-pulse"></span> System Nodes (Software Hub)</h2>
                      <div class="grid grid-cols-1 gap-3">
                          ${nodes.map((n: any) => `
                              <div class="p-4 bg-black/40 border border-white/5 rounded-2xl flex justify-between items-center">
                                  <div>
                                      <span class="text-[10px] text-white/20 uppercase font-bold block mb-1">${n.category}</span>
                                      <h3 class="text-white font-medium text-sm">${n.name}</h3>
                                  </div>
                                  <div class="flex items-center gap-3">
                                      <span class="text-[10px] font-bold ${n.connected ? 'text-orange-400' : 'text-white/20'}">${n.connected ? 'CONNECTED' : 'DISCONNECTED'}</span>
                                      <div class="w-2 h-2 rounded-full ${n.status === 'online' ? 'bg-emerald-500' : 'bg-red-500'}"></div>
                                  </div>
                              </div>
                          `).join('')}
                      </div>
                  </section>

                  <section class="glass p-8 rounded-[2rem] space-y-6">
                      <h2 class="section-title"><span class="dot bg-emerald-500 animate-pulse"></span> Download History</h2>
                      <div class="space-y-4">
                          ${downloads.length === 0 ? '<p class="text-white/20 italic text-sm">No downloads recorded.</p>' : downloads.map((d: any) => `
                              <div class="p-5 bg-black/40 border border-white/5 rounded-2xl">
                                  <div class="flex justify-between items-start mb-3">
                                      <div>
                                          <h3 class="text-white font-bold text-sm mb-1">${d.filename}</h3>
                                          <p class="text-[10px] text-white/40 uppercase tracking-widest">${d.size} • ${d.timestamp}</p>
                                      </div>
                                      <span class="text-[10px] font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">${d.malware_check}</span>
                                  </div>
                              </div>
                          `).join('')}
                      </div>
                  </section>
              </div>

              <section class="glass p-8 rounded-[2rem] space-y-6">
                  <h2 class="section-title"><span class="dot bg-purple-500 animate-pulse"></span> Version History</h2>
                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      ${versions.length === 0 ? '<p class="text-white/20 italic text-sm">No versions saved.</p>' : versions.map((v: any) => `
                          <div class="p-4 bg-black/40 border border-white/5 rounded-2xl">
                              <div class="flex justify-between items-center">
                                  <span class="text-purple-400 font-bold text-sm">${v.version_tag}</span>
                                  <span class="text-[10px] text-white/20">${v.timestamp}</span>
                              </div>
                          </div>
                      `).join('')}
                  </div>
              </section>

              <section class="glass p-8 rounded-[2rem] space-y-8">
                  <h2 class="section-title"><span class="dot bg-blue-500 animate-pulse"></span> Full System Source Code (ALL FILES)</h2>
                  
                  <div class="space-y-4">
                      <h3 class="text-white/60 text-xs font-bold uppercase tracking-widest">/src/App.tsx (Frontend Logic)</h3>
                      <pre><code class="language-typescript">${escape(appCode)}</code></pre>
                  </div>

                  <div class="space-y-4">
                      <h3 class="text-white/60 text-xs font-bold uppercase tracking-widest">/server.ts (Backend & Database)</h3>
                      <pre><code class="language-typescript">${escape(serverCode)}</code></pre>
                  </div>

                  <div class="space-y-4">
                      <h3 class="text-white/60 text-xs font-bold uppercase tracking-widest">/package.json (Dependencies)</h3>
                      <pre><code class="language-json">${escape(packageJson)}</code></pre>
                  </div>

                  <div class="space-y-4">
                      <h3 class="text-white/60 text-xs font-bold uppercase tracking-widest">/vite.config.ts (Build Config)</h3>
                      <pre><code class="language-typescript">${escape(viteConfig)}</code></pre>
                  </div>

                  <div class="space-y-4">
                      <h3 class="text-white/60 text-xs font-bold uppercase tracking-widest">/index.html (Entry Point)</h3>
                      <pre><code class="language-html">${escape(indexHtml)}</code></pre>
                  </div>

                  <div class="space-y-4">
                      <h3 class="text-white/60 text-xs font-bold uppercase tracking-widest">/index24.html (System Access Page)</h3>
                      <pre><code class="language-html">${escape(index24Html)}</code></pre>
                  </div>

                  <div class="space-y-4">
                      <h3 class="text-white/60 text-xs font-bold uppercase tracking-widest">/src/main.tsx (React Entry)</h3>
                      <pre><code class="language-typescript">${escape(mainTsx)}</code></pre>
                  </div>

                  <div class="space-y-4">
                      <h3 class="text-white/60 text-xs font-bold uppercase tracking-widest">/src/index.css (Global Styles)</h3>
                      <pre><code class="language-css">${escape(indexCss)}</code></pre>
                  </div>
              </section>

              <footer class="text-center text-white/20 text-[10px] uppercase tracking-[0.5em] font-bold py-12">
                  End of System Manifest • Sunset Console Security Protocol • ChatGPT Codex Protected
              </footer>
          </div>
      </body>
      </html>
    `;
  };

  // PUBLIC.HTML Route
  app.get("/public.html", (req, res) => {
    res.send(generateManifestHtml());
  });

  // index24.html Route
  app.get("/index24.html", (req, res) => {
    const filePath = path.join(__dirname, "index24.html");
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send("index24.html not found");
    }
  });

  // public/publicdownload.html Route - Forces Download
  app.get("/public/publicdownload.html", (req, res) => {
    try {
      const html = generateManifestHtml();
      res.setHeader('Content-Disposition', 'attachment; filename="sunset-console-full-system.html"');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      console.error("Download failed", error);
      res.status(500).send("Internal Server Error during manifest generation");
    }
  });

  app.use("/public", express.static(publicDir));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
