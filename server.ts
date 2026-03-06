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

  app.get("/api/system/stats", (req, res) => {
    res.json({
      cpu: Math.random() * 100,
      ram: Math.random() * 64,
      network: Math.random() * 10,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
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
    
    const filesToRead = [
      { path: "src/App.tsx", label: "/src/App.tsx (Main Logic)", type: "TYPESCRIPT / REACT" },
      { path: "server.ts", label: "/server.ts (Backend Core)", type: "EXPRESS / SQLITE" },
      { path: "src/components/NeuralMap.tsx", label: "/src/components/NeuralMap.tsx", type: "D3.JS / REACT" },
      { path: "src/components/SystemCharts.tsx", label: "/src/components/SystemCharts.tsx", type: "RECHARTS / REACT" },
      { path: "package.json", label: "/package.json", type: "JSON" },
      { path: "vite.config.ts", label: "/vite.config.ts", type: "TYPESCRIPT" },
      { path: "index.html", label: "/index.html", type: "HTML" },
      { path: "src/main.tsx", label: "/src/main.tsx", type: "TYPESCRIPT" },
      { path: "src/index.css", label: "/src/index.css", type: "CSS" },
      { path: "tsconfig.json", label: "/tsconfig.json", type: "JSON" },
      { path: ".env.example", label: "/.env.example", type: "ENV" },
    ];

    const sourceCode: Record<string, string> = {};

    for (const file of filesToRead) {
      try {
        sourceCode[file.path] = fs.readFileSync(path.join(__dirname, file.path), "utf-8");
      } catch (e) {
        sourceCode[file.path] = `Source code for ${file.path} restricted or missing.`;
      }
    }

    const escape = (str: string) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>SUNSET MASTER SYSTEM - Mastered Manifest v3.0</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
              @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
              body { font-family: 'JetBrains Mono', monospace; background-color: #020202; color: #e2e8f0; }
              .glass { background: rgba(10, 10, 15, 0.8); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.03); }
              pre { background: rgba(0,0,0,0.9); padding: 2rem; border-radius: 1.5rem; overflow-x: auto; font-size: 0.75rem; border: 1px solid rgba(255,255,255,0.05); line-height: 1.6; }
              code { color: #cbd5e1; }
              .section-title { font-size: 1.25rem; font-weight: 800; color: #fff; margin-bottom: 2rem; display: flex; align-items: center; gap: 1rem; text-transform: uppercase; letter-spacing: 0.2em; }
              .dot { width: 0.75rem; height: 0.75rem; border-radius: 9999px; }
              .glow-orange { box-shadow: 0 0 40px rgba(249, 115, 22, 0.1); }
              .glow-text { text-shadow: 0 0 10px rgba(249, 115, 22, 0.5); }
              ::-webkit-scrollbar { width: 8px; }
              ::-webkit-scrollbar-track { background: transparent; }
              ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
              ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
              .code-header { display: flex; justify-content: space-between; align-items: center; padding: 0 1rem; margin-bottom: 1rem; }
          </style>
      </head>
      <body class="p-6 md:p-16">
          <div class="max-w-7xl mx-auto space-y-16">
              <header class="glass p-16 rounded-[3rem] border-orange-500/10 glow-orange relative overflow-hidden">
                  <div class="absolute -top-24 -right-24 opacity-5">
                      <svg width="400" height="400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.2"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M2 12h20"/><path d="m4.93 4.93 14.14 14.14"/><path d="m4.93 19.07 14.14-14.14"/></svg>
                  </div>
                  <div class="relative z-10">
                    <div class="flex items-center gap-4 mb-8">
                        <span class="px-3 py-1 bg-orange-500/10 text-orange-500 text-[10px] font-black rounded-full border border-orange-500/20 tracking-[0.2em]">MASTERED</span>
                        <span class="text-white/20 text-[10px] font-black tracking-widest uppercase">System Integrity: 100%</span>
                    </div>
                    <h1 class="text-7xl md:text-8xl font-black text-white mb-8 tracking-tighter italic glow-text">SUNSET<span class="text-orange-500">MASTER</span></h1>
                    <p class="text-white/20 uppercase tracking-[0.6em] text-[11px] font-black mb-12">Full System Source Manifest • Quantum Encryption Layer • v3.0.0-FINAL</p>
                    <div class="flex flex-wrap gap-8">
                        <div class="glass px-8 py-5 rounded-3xl border-orange-500/5">
                            <span class="text-[10px] text-white/20 block uppercase mb-2 font-bold tracking-widest">Kernel Core</span>
                            <span class="text-emerald-400 font-black text-base tracking-widest">ACTIVE / MASTERED</span>
                        </div>
                        <div class="glass px-8 py-5 rounded-3xl border-orange-500/5">
                            <span class="text-[10px] text-white/20 block uppercase mb-2 font-bold tracking-widest">Neural Nodes</span>
                            <span class="text-orange-400 font-black text-base tracking-widest">${nodes.length} SYNCHRONIZED</span>
                        </div>
                        <div class="glass px-8 py-5 rounded-3xl border-orange-500/5">
                            <span class="text-[10px] text-white/20 block uppercase mb-2 font-bold tracking-widest">Uptime</span>
                            <span class="text-blue-400 font-black text-base tracking-widest">${Math.floor(process.uptime())}s</span>
                        </div>
                        <div class="glass px-8 py-5 rounded-3xl border-orange-500/5">
                            <span class="text-[10px] text-white/20 block uppercase mb-2 font-bold tracking-widest">Database</span>
                            <span class="text-purple-400 font-black text-base tracking-widest">${snippets.length + downloads.length + versions.length} RECORDS</span>
                        </div>
                    </div>
                    <div class="mt-12">
                        <a href="/public/publicdownload.html" class="inline-flex items-center gap-3 px-8 py-4 bg-orange-500 text-black font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-orange-400 transition-all shadow-xl shadow-orange-500/20">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Download Full System Manifest
                        </a>
                    </div>
                  </div>
              </header>

              <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <section class="glass p-12 rounded-[3.5rem] lg:col-span-2 space-y-12">
                      <h2 class="section-title"><span class="dot bg-orange-500 animate-pulse"></span> Network Topology</h2>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                          ${nodes.map((n: any) => `
                              <div class="p-6 bg-black/40 border border-white/5 rounded-[2rem] flex justify-between items-center group hover:border-orange-500/20 transition-all">
                                  <div>
                                      <span class="text-[10px] text-white/10 uppercase font-black block mb-2 tracking-widest">${n.category}</span>
                                      <h3 class="text-white font-bold text-base group-hover:text-orange-400 transition-colors">${n.name}</h3>
                                  </div>
                                  <div class="flex items-center gap-6">
                                      <div class="text-right">
                                        <span class="text-[9px] font-black block ${n.connected ? 'text-orange-500' : 'text-white/5'} tracking-widest">${n.connected ? 'LINKED' : 'STANDBY'}</span>
                                        <span class="text-[9px] text-white/10 uppercase font-bold">${n.status}</span>
                                      </div>
                                      <div class="w-3 h-3 rounded-full ${n.status === 'online' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-red-500'}"></div>
                                  </div>
                              </div>
                          `).join('')}
                      </div>
                  </section>

                  <section class="glass p-12 rounded-[3.5rem] space-y-12">
                      <h2 class="section-title"><span class="dot bg-emerald-500 animate-pulse"></span> Data Streams</h2>
                      <div class="space-y-6">
                          ${downloads.length === 0 ? '<p class="text-white/10 italic text-sm text-center py-12">No active data streams detected.</p>' : downloads.map((d: any) => `
                              <div class="p-8 bg-black/40 border border-white/5 rounded-[2rem]">
                                  <div class="flex justify-between items-start mb-6">
                                      <div>
                                          <h3 class="text-white font-black text-sm mb-2 tracking-tight">${d.filename}</h3>
                                          <p class="text-[10px] text-white/20 uppercase font-bold tracking-widest">${d.size} • ${d.timestamp}</p>
                                      </div>
                                      <span class="text-[9px] font-black px-3 py-1.5 rounded-xl bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 uppercase tracking-widest">${d.malware_check}</span>
                                  </div>
                                  <div class="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                    <div class="bg-emerald-500 h-full w-full opacity-30"></div>
                                  </div>
                              </div>
                          `).join('')}
                      </div>
                  </section>
              </div>

              <section class="glass p-12 rounded-[3.5rem] space-y-16">
                  <h2 class="section-title"><span class="dot bg-blue-500 animate-pulse"></span> Master Source Repository</h2>
                  
                  <div class="grid grid-cols-1 gap-16">
                      ${filesToRead.map(file => `
                          <div class="space-y-8">
                              <div class="code-header">
                                <h3 class="text-white/30 text-[11px] font-black uppercase tracking-[0.4em]">${file.label}</h3>
                                <span class="text-[10px] text-blue-400 font-black tracking-widest">${file.type}</span>
                              </div>
                              <pre><code class="language-typescript">${escape(sourceCode[file.path])}</code></pre>
                          </div>
                      `).join('')}
                  </div>
              </section>

              <footer class="text-center text-white/5 text-[10px] uppercase tracking-[1em] font-black py-32">
                  System Mastered • Sunset Master Security Protocol • v3.0.0-FINAL
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

  // public/publicdownload.html Route - Forces Download
  app.get("/public/publicdownload.html", (req, res) => {
    try {
      const html = generateManifestHtml();
      res.setHeader('Content-Disposition', 'attachment; filename="sunset-master-system.html"');
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
