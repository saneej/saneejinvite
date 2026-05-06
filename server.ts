import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import bodyParser from "body-parser";
import { initializeApp, getApps } from "firebase-admin/app";
import fs from "fs";

async function startServer() {
  console.log(">>> Server process starting...");
  const app = express();
  const PORT = 3000;

  const LOG_FILE = path.join(process.cwd(), "server.log");
  function logToFile(msg: string) {
    const entry = `[${new Date().toISOString()}] ${msg}\n`;
    try {
      fs.appendFileSync(LOG_FILE, entry);
    } catch (e) {}
    console.log(msg);
  }

  app.get("/api/logs", (req, res) => {
    if (fs.existsSync(LOG_FILE)) {
      res.setHeader("Content-Type", "text/plain");
      res.send(fs.readFileSync(LOG_FILE, "utf-8"));
    } else {
      res.send("No logs found.");
    }
  });

  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    console.log(">>> Reading config from:", configPath);
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    logToFile(`>>> ENV check: PROJECT_ID=${process.env.GOOGLE_CLOUD_PROJECT}, ADC=${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
    logToFile(`>>> Initializing Firebase Admin for project: ${firebaseConfig.projectId}`);
    
    if (getApps().length === 0) {
      logToFile(">>> Manually setting GOOGLE_CLOUD_PROJECT and initializing...");
      process.env.GOOGLE_CLOUD_PROJECT = firebaseConfig.projectId;
      initializeApp();
    }
    
    logToFile(">>> Firebase Admin successfully set up.");
  } catch (err) {
    logToFile(`!!! Firebase Admin init failed: ${err}`);
  }

  // Health check
  app.get("/api/health", (req, res) => {
    console.log(">>> Health check hit");
    res.json({ status: "ok" });
  });

  app.use(bodyParser.json());

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
