import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  console.log(">>> Server process starting...");
  const app = express();
  const PORT = 3000;

  const ai = new GoogleGenAI(process.env.GEMINI_API_KEY || "");

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

  let db: FirebaseFirestore.Firestore | null = null;

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

    db = firebaseConfig.firestoreDatabaseId 
      ? getFirestore(firebaseConfig.firestoreDatabaseId) 
      : getFirestore();
    
    logToFile(">>> Firebase Admin successfully set up.");
  } catch (err) {
    logToFile(`!!! Firebase Admin init failed: ${err}`);
  }

  app.use(bodyParser.json());

  // Pending guest additions memory
  const pendingGuests = new Map<number, string>();

  // Helper to send Telegram message
  async function sendTelegram(token: string, method: string, body: Record<string, unknown>) {
    logToFile(`>>> Sending Telegram [${method}] to chatId: ${body.chat_id}`);
    try {
      const response = await fetch(`https://api.telegram.org/bot${token.trim()}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      logToFile(`>>> Telegram response for [${method}]: ${JSON.stringify(data)}`);
      return data;
    } catch (err) {
      logToFile(`!!! Telegram [${method}] failed: ${err}`);
      console.error(`!!! Telegram [${method}] failed:`, err);
    }
  }

  const TOKEN_CACHE = path.join(process.cwd(), "bot_tokens.json");
  function cacheToken(ownerId: string, token: string) {
    try {
      let cache: Record<string, string> = {};
      if (fs.existsSync(TOKEN_CACHE)) {
        cache = JSON.parse(fs.readFileSync(TOKEN_CACHE, "utf-8"));
      }
      cache[ownerId] = token;
      fs.writeFileSync(TOKEN_CACHE, JSON.stringify(cache, null, 2));
      logToFile(`>>> Cached bot token for owner: ${ownerId}`);
    } catch (e) {
      logToFile(`!!! Failed to cache token: ${e}`);
    }
  }

  function getCachedToken(ownerId: string): string | null {
    try {
      if (fs.existsSync(TOKEN_CACHE)) {
        const cache = JSON.parse(fs.readFileSync(TOKEN_CACHE, "utf-8"));
        return cache[ownerId] || null;
      }
    } catch (e) {}
    return null;
  }

  async function getMetadataToken() {
    try {
      logToFile(">>> Fetching Metadata token...");
      const res = await fetch("http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token", {
        headers: { "Metadata-Flavor": "Google" }
      });
      if (!res.ok) {
        logToFile(`!!! Metadata token fetch failed: ${res.status}`);
        return null;
      }
      const data = await res.json();
      return data.access_token;
    } catch (e) {
      logToFile(`!!! Metadata token error: ${e}`);
      return null;
    }
  }

  async function getBotToken(ownerId: string, userToken?: string | null): Promise<string | null> {
    // 1. Try Cache
    let token = getCachedToken(ownerId);
    if (token) {
      logToFile(`>>> Bot token found in cache for ${ownerId}`);
      return token.trim();
    }

    // 2. Try Admin SDK
    if (db) {
      try {
        const snap = await db.collection("users").doc(ownerId).collection("settings").doc("info").get();
        token = snap.data()?.telegramBotToken;
        if (token) {
          logToFile(`>>> Bot token retrieved via Admin SDK for ${ownerId}`);
          cacheToken(ownerId, token.trim());
          return token.trim();
        }
      } catch (err) {
        logToFile(`>>> Admin SDK getBotToken failed: ${err}`);
      }
    }

    // 3. Try REST API with User Token or Metadata Token
    const authHeaderToken = userToken || await getMetadataToken();
    if (authHeaderToken) {
      try {
        const configPath = path.join(process.cwd(), "firebase-applet-config.json");
        const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        const dbId = firebaseConfig.firestoreDatabaseId || "(default)";
        const projId = firebaseConfig.projectId;
        const url = `https://firestore.googleapis.com/v1/projects/${projId}/databases/${dbId}/documents/users/${ownerId}/settings/info`;
        
        const res = await fetch(url, {
          headers: { "Authorization": `Bearer ${authHeaderToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          token = data.fields?.telegramBotToken?.stringValue;
          if (token) {
            logToFile(`>>> Bot token retrieved via REST API for ${ownerId}`);
            cacheToken(ownerId, token.trim());
            return token.trim();
          }
        } else {
          logToFile(`>>> REST getBotToken failed for ${ownerId}: ${res.status} ${await res.text()}`);
        }
      } catch (e) {
        logToFile(`>>> REST getBotToken error for ${ownerId}: ${e}`);
      }
    }

    logToFile(`!!! Bot token NOT FOUND for ${ownerId} in cache, Admin SDK, or REST API`);
    return null;
  }

  async function firestoreAddGuest(ownerId: string, name: string, category: string) {
    const guestData = {
      name,
      category,
      status: "Not Invited",
      notes: "Added via Telegram",
      ownerId,
      createdAt: new Date().toISOString() // Simpler for REST compatibility
    };

    if (db) {
      try {
        await db.collection("users").doc(ownerId).collection("guests").add({
          ...guestData,
          createdAt: FieldValue.serverTimestamp()
        });
        logToFile(`>>> Added guest via Admin SDK: ${name}`);
        return true;
      } catch (err) {
        logToFile(`>>> Admin SDK guest add failed: ${err}`);
      }
    }

    const token = await getMetadataToken();
    if (token) {
      try {
        const configPath = path.join(process.cwd(), "firebase-applet-config.json");
        const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        const dbId = firebaseConfig.firestoreDatabaseId || "(default)";
        const projId = firebaseConfig.projectId;
        const url = `https://firestore.googleapis.com/v1/projects/${projId}/databases/${dbId}/documents/users/${ownerId}/guests`;
        
        const fields: Record<string, { stringValue?: string; timestampValue?: string }> = {
          name: { stringValue: name },
          category: { stringValue: category },
          status: { stringValue: "Not Invited" },
          notes: { stringValue: "Added via Telegram" },
          ownerId: { stringValue: ownerId },
          createdAt: { timestampValue: new Date().toISOString() }
        };

        const res = await fetch(url, {
          method: "POST",
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ fields })
        });

        if (res.ok) {
          logToFile(`>>> Added guest via REST API: ${name}`);
          return true;
        } else {
          logToFile(`!!! REST guest add failed: ${res.status} ${await res.text()}`);
        }
      } catch (e) {
        logToFile(`!!! REST guest add error: ${e}`);
      }
    }
    return false;
  }

  async function firestoreGetCategories(ownerId: string) {
    if (db) {
      try {
        const snap = await db.collection("users").doc(ownerId).collection("categories").get();
        if (!snap.empty) {
          return snap.docs.map((d) => (d.data() as { name: string }).name);
        }
      } catch (e) {
        logToFile(`>>> Admin SDK getCategories failed: ${e}`);
      }
    }

    const token = await getMetadataToken();
    if (token) {
      try {
        const configPath = path.join(process.cwd(), "firebase-applet-config.json");
        const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        const dbId = firebaseConfig.firestoreDatabaseId || "(default)";
        const projId = firebaseConfig.projectId;
        const url = `https://firestore.googleapis.com/v1/projects/${projId}/databases/${dbId}/documents/users/${ownerId}/categories`;
        
        const res = await fetch(url, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = (await res.json()) as { documents?: { fields: { name: { stringValue: string } } }[] };
          if (data.documents) {
             return data.documents.map((d) => d.fields.name.stringValue);
          }
        }
      } catch (e) {
        logToFile(`!!! REST getCategories failed: ${e}`);
      }
    }
    return ["Family", "Friends", "Groom Side", "Bride Side"];
  }

  // Telegram Webhook
  app.post("/api/telegram-webhook", async (req, res) => {
    logToFile(`>>> Webhook hit. Query: ${JSON.stringify(req.query)}`);
    const ownerId = req.query.ownerId as string;
    
    const { message, callback_query } = req.body;
    const bodyChatId = message?.chat?.id || callback_query?.message?.chat?.id;

    if (!ownerId) {
      logToFile("!!! Webhook received without ownerId query param.");
      return res.sendStatus(200);
    }

    try {
      const botToken = await getBotToken(ownerId);
      if (!botToken) {
        logToFile(`!!! Failed to retrieve bot token for ${ownerId}`);
        return res.sendStatus(200);
      }

      if (callback_query) {
        const chatId = callback_query.message.chat.id;
        const data = callback_query.data;
        const guestName = pendingGuests.get(chatId);

        if (guestName && data.startsWith("cat:")) {
          const category = data.split(":")[1];
          logToFile(`>>> Processing guest addition: ${guestName} to ${category}`);
          
          const success = await firestoreAddGuest(ownerId, guestName, category);

          if (success) {
            await sendTelegram(botToken, "sendMessage", {
              chat_id: chatId,
              text: `✅ Guest "${guestName}" added to "${category}"!`,
            });
          } else {
            await sendTelegram(botToken, "sendMessage", {
              chat_id: chatId,
              text: `❌ Failed to save guest. Make sure your Telegram ID is linked in settings.`,
            });
          }
          
          pendingGuests.delete(chatId);
        }
        return res.sendStatus(200);
      }

      if (message && message.text) {
        const chatId = message.chat.id;
        const text = message.text.trim();
        logToFile(`>>> Received text message: "${text}" from chatId: ${chatId} (Owner: ${ownerId})`);

        if (text.startsWith("/start")) {
          await sendTelegram(botToken, "sendMessage", {
            chat_id: chatId,
            text: "💍 Bot linked! \n\nSend me a name to add a new guest.\n\nType /status to verify connection.",
          });
          return res.sendStatus(200);
        }

        if (text === "/status") {
          await sendTelegram(botToken, "sendMessage", {
            chat_id: chatId,
            text: `✅ Connection Active\n👤 Owner ID: ${ownerId.substring(0, 5)}...`,
          });
          return res.sendStatus(200);
        }

        pendingGuests.set(chatId, text);
        const categories = await firestoreGetCategories(ownerId);

        await sendTelegram(botToken, "sendMessage", {
          chat_id: chatId,
          text: `Which category for "${text}"?`,
          reply_markup: {
            inline_keyboard: categories.reduce((acc: { text: string; callback_data: string }[][], cat, i) => {
              if (i % 2 === 0) acc.push([{ text: cat, callback_data: `cat:${cat}` }]);
              else acc[acc.length - 1].push({ text: cat, callback_data: `cat:${cat}` });
              return acc;
            }, [])
          }
        });
      }
    } catch (error) {
      logToFile(`!!! Telegram Webhook processing error: ${error}`);
    }

    res.sendStatus(200);
  });

  // --- Specific Telegram Routes as requested by the user ---
  
  app.get("/api/telegram/webhook", (req, res) => {
    res.send("Telegram webhook endpoint is active.");
  });

  app.post("/api/telegram/webhook", async (req, res) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      logToFile("!!! Global TELEGRAM_BOT_TOKEN is not set in environment.");
      return res.status(500).json({ error: "TELEGRAM_BOT_TOKEN not configured" });
    }

    try {
      const update = req.body;
      logToFile(`[GlobalBot] Incoming update: ${JSON.stringify(update)}`);

      if (update && update.message) {
        const chatId = update.message.chat.id;
        const text = update.message.text;
        const firstName = update.message.from.first_name;

        if (chatId && firstName) {
          logToFile(`[GlobalBot] Replying to ${firstName} (${chatId})`);
          await sendTelegram(token, "sendMessage", {
            chat_id: chatId,
            text: `Hi ${firstName}, your message has been received successfully.`
          });
        }
      }
      res.sendStatus(200);
    } catch (err) {
      logToFile(`!!! GlobalBot Webhook Error: ${err}`);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/telegram/set-webhook", async (req, res) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return res.status(500).json({ error: "TELEGRAM_BOT_TOKEN not set" });

    const rawHost = (req.headers["x-forwarded-host"] as string) || (req.headers["host"] as string);
    // The user strictly asked for their Vercel URL, but we will use the current host for reliability in previews.
    // If they want to force the Vercel URL, we can check for an env var or just use req host.
    const webhookUrl = `https://${rawHost}/api/telegram/webhook`;

    logToFile(`>>> Setting Global Webhook to: ${webhookUrl}`);
    try {
      const telRes = await fetch(`https://api.telegram.org/bot${token.trim()}/setWebhook?url=${encodeURIComponent(webhookUrl)}&drop_pending_updates=true`);
      const data = await telRes.json();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get("/api/telegram/webhook-info", async (req, res) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return res.status(500).json({ error: "TELEGRAM_BOT_TOKEN not set" });

    try {
      const telRes = await fetch(`https://api.telegram.org/bot${token.trim()}/getWebhookInfo`);
      const data = await telRes.json();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // --- AI Endpoints ---

  app.post("/api/ai/chat", async (req, res) => {
    const { query, guests, settings, history } = req.body;
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

    const contextPrompt = `You are a helpful wedding planning assistant. 
Current Wedding Details:
- Couple: ${settings.brideName} & ${settings.groomName}
- Date: ${settings.weddingDate}
- Venue: ${settings.venue}

Guest List Overview:
- Total Guests: ${guests.length}

Guest Data:
${guests.map((g: { name: string; category: string; status: string }) => `- ${g.name} (${g.category}): Status: ${g.status}`).join('\n')}

Using this data, answer the user's question or help them with their wedding planning. 
If they ask for statistics, calculate them. If they ask for advice, be supportive and elegant.
Keep your response concise and helpful.`;

    try {
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const chat = model.startChat({
        history: [
          { role: 'user', parts: [{ text: contextPrompt }] },
          { role: 'model', parts: [{ text: "Understood. I am ready to help you manage your wedding guest list and planning." }] },
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
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

    const prompt = `Write a wedding invitation message for a guest.
Context:
- Guest Name: ${guestName}
- Relation/Category: ${category}
- Date: ${weddingDate}
- Venue: ${weddingLocation}
- Requested Tone: ${tone}

Please write a personalized, warm message that can be sent via WhatsApp.
Output ONLY the message text.`;

    try {
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      res.json({ text: result.response.text() });
    } catch (error) {
      res.status(500).json({ error: "AI generation failed" });
    }
  });

  app.post("/api/ai/suggest-categories", async (req, res) => {
    const { names } = req.body;
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

    const prompt = `Given this list of wedding guests, suggest a short category name for each (e.g., "Groom's Family", "Bride's Friends", "Work Colleagues").
Names:
${names.join('\n')}

Format your response as a JSON array of objects: [{"name": "Name", "category": "Suggested Category"}].
Return ONLY the JSON.`;

    try {
      const model = ai.getGenerativeModel({
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
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

    const prompt = `Extract all individual names from this image of a guest list or WhatsApp group members.
Format your response as a simple JSON array of strings: ["Name 1", "Name 2", ...].
Exclude common words like 'Admin', 'Joined', 'Left', or dates and timestamps.
Return ONLY the JSON.`;

    try {
      const model = ai.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });
      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        },
        { text: prompt }
      ]);
      res.json(JSON.parse(result.response.text()));
    } catch (error) {
      res.status(500).json({ error: "AI extraction failed" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    console.log(">>> Health check hit");
    res.json({ status: "ok" });
  });

  app.post("/api/setup-bot", async (req, res) => {
    const { ownerId } = req.body;
    const authHeader = req.headers.authorization;
    const idToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    logToFile(`>>> Setup-bot trigger for ${ownerId}. Token present: ${!!idToken}`);
    if (!ownerId) return res.status(400).json({ error: "Missing ownerId" });

    try {
      const token = await getBotToken(ownerId, idToken);
      if (!token) {
        return res.status(400).json({ error: "Could not retrieve Bot Token. Save changes first." });
      }

      const rawHost = (req.headers["x-forwarded-host"] as string) || (req.headers["host"] as string);
      // AI Studio preview URLs might have ports or be behind specific proxies.
      // We want the external host.
      const webhookUrl = `https://${rawHost}/api/telegram-webhook?ownerId=${ownerId}`;

      logToFile(`>>> Webhook Setup: rawHost=${rawHost}. Final URL: ${webhookUrl}`);
      
      // Step 1: Check existing webhook info
      try {
        const checkRes = await fetch(`https://api.telegram.org/bot${token.trim()}/getWebhookInfo`);
        const checkData = await checkRes.json();
        logToFile(`>>> Current Webhook Info: ${JSON.stringify(checkData)}`);
        if (checkData.ok && checkData.result.url === webhookUrl) {
          logToFile(">>> Webhook already correctly set. Skipping setWebhook.");
          return res.json({ success: true, result: checkData.result, alreadySet: true });
        }
      } catch (e) {
        logToFile(`>>> getWebhookInfo failed (ignoring): ${e}`);
      }

      logToFile(`>>> Activating webhook for token: ${token.substring(0, 5)}...`);
      const telRes = await fetch(`https://api.telegram.org/bot${token.trim()}/setWebhook?url=${encodeURIComponent(webhookUrl)}&drop_pending_updates=true`);
      const result = await telRes.json();

      logToFile(`>>> Telegram setWebhook Result: ${JSON.stringify(result)}`);
      
      let botUsername = null;
      if (result.ok) {
        try {
          const meRes = await fetch(`https://api.telegram.org/bot${token.trim()}/getMe`);
          const meData = await meRes.json();
          if (meData.ok) {
            botUsername = meData.result.username;
            logToFile(`>>> Bot Username confirmed: @${botUsername}`);
          }
        } catch (e) {
          logToFile(`>>> getMe failed: ${e}`);
        }
      }
      
      if (!result.ok) {
        logToFile(`!!! setWebhook failed: ${result.description}`);
      }
      res.json({ success: true, result, botUsername });
    } catch (err) {
      logToFile(`!!! Setup-bot final error: ${err}`);
      res.status(500).json({ error: String(err) });
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
