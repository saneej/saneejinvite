import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import bodyParser from "body-parser";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  console.log(">>> Server process starting...");
  const app = express();
  const PORT = 3000;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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

  app.use(bodyParser.json());

  // Health check
  app.get("/api/health", (req, res) => {
    console.log(">>> Health check hit");
    res.json({ status: "ok" });
  });

  // --- AI Endpoints ---

  app.post("/api/ai/chat", async (req, res) => {
    const { query, guests, settings, history } = req.body;

    const contextPrompt = `You are a helpful wedding planning assistant. 
Current Wedding Details:
- Couple: ${settings.brideName} & ${settings.groomName}
- Date: ${settings.weddingDate}
- Venue: ${settings.venue}

Guest List Overview:
- Total Guests: ${guests.length}

Guest Data:
${guests.map((g: { name: string; category: string; status: string }) => `- ${g.name} (${g.category}): Status: ${g.status}`).join('\n')}

Using this data, answer the user's question or help them with their wedding planning.`;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const model = (ai as any).getGenerativeModel({ model: "gemini-1.5-flash" });
      const chat = model.startChat({
        history: [
          { role: 'user', parts: [{ text: contextPrompt }] },
          { role: 'model', parts: [{ text: "Understood." }] },
          ...(history || []).map((h: { role: string; text: string }) => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          }))
        ]
      });

      const result = await chat.sendMessage(query);
      res.json({ text: result.response.text() });
    } catch (error) {
           console.error("AI Chat Error:", error);
      res.status(500).json({ error: "AI processing failed" });
    }
  });

  app.post("/api/ai/generate-invitation", async (req, res) => {
    const { guestName, category, tone, weddingDate, weddingLocation } = req.body;
    const prompt = `Write a wedding invitation message for ${guestName} (${category}). Date: ${weddingDate}, Venue: ${weddingLocation}. Tone: ${tone}.`;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const model = (ai as any).getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      res.json({ text: result.response.text() });
    } catch (error) {
      res.status(500).json({ error: "AI generation failed" });
    }
  });

  app.post("/api/ai/suggest-categories", async (req, res) => {
    const { names } = req.body;
    const prompt = `Suggest categories for these guests: ${names.join(', ')}. Return JSON array of {name, category}.`;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const model = (ai as any).getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });
      const result = await model.generateContent(prompt);
      res.json(JSON.parse(result.response.text()));
    } catch (error) {
      res.status(500).json({ error: "AI categorization failed" });
    }
  });

  app.post("/api/ai/extract-guests", async (req, res) => {
    const { base64Data, mimeType } = req.body;
    const prompt = "Extract names as JSON array of strings.";

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const model = (ai as any).getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });
      const result = await model.generateContent([
        { inlineData: { data: base64Data, mimeType: mimeType } },
        { text: prompt }
      ]);
      res.json(JSON.parse(result.response.text()));
    } catch (error) {
      res.status(500).json({ error: "AI extraction failed" });
    }
  });

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
