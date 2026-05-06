import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
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

  let db: any = null;

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
    console.log(`>>> Sending Telegram [${method}] to chatId: ${body.chat_id}`);
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      console.log(`>>> Telegram response:`, data);
      return data;
    } catch (err) {
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
    if (token) return token;

    // 2. Try Admin SDK
    if (db) {
      try {
        const snap = await db.collection("users").doc(ownerId).collection("settings").doc("info").get();
        token = snap.data()?.telegramBotToken;
        if (token) {
          cacheToken(ownerId, token);
          return token;
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
            cacheToken(ownerId, token);
            return token;
          }
        } else {
          logToFile(`>>> REST getBotToken failed: ${res.status} ${await res.text()}`);
        }
      } catch (e) {
        logToFile(`>>> REST getBotToken error: ${e}`);
      }
    }

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
        
        const fields: any = {
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
          return snap.docs.map((d: any) => d.data().name);
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
          const data = await res.json();
          if (data.documents) {
             return data.documents.map((d: any) => d.fields.name.stringValue);
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
    if (!ownerId) return res.sendStatus(200);

    const { message, callback_query } = req.body;
    
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
              text: `❌ Failed to save guest. Please check your app settings.`,
            });
          }
          
          pendingGuests.delete(chatId);
        }
        return res.sendStatus(200);
      }

      if (message && message.text) {
        const chatId = message.chat.id;
        const text = message.text.trim();
        logToFile(`>>> Received text message: "${text}" from chatId: ${chatId}`);

        if (text === "/start") {
          await sendTelegram(botToken, "sendMessage", {
            chat_id: chatId,
            text: "💍 Welcome! Send me a name to add a new guest to your wedding list.",
          });
          return res.sendStatus(200);
        }

        pendingGuests.set(chatId, text);
        const categories = await firestoreGetCategories(ownerId);

        await sendTelegram(botToken, "sendMessage", {
          chat_id: chatId,
          text: `Which category for "${text}"?`,
          reply_markup: {
            inline_keyboard: categories.reduce((acc: any[][], cat, i) => {
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

      const protocol = "https"; 
      const rawHost = (req.headers["x-forwarded-host"] as string) || (req.headers["host"] as string);
      const domain = rawHost.split(":")[0];
      const webhookUrl = `${protocol}://${domain}/api/telegram-webhook?ownerId=${ownerId}`;

      logToFile(`>>> Webhook Setup: using domain ${domain}. Final URL: ${webhookUrl}`);
      
      // Step 1: Check existing webhook info
      try {
        const checkRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
        const checkData = await checkRes.json();
        if (checkData.ok && checkData.result.url === webhookUrl) {
          logToFile(">>> Webhook already correctly set. Skipping setWebhook.");
          return res.json({ success: true, result: checkData.result, alreadySet: true });
        }
      } catch (e) {
        logToFile(`>>> getWebhookInfo failed (ignoring): ${e}`);
      }

      logToFile(`>>> Activating webhook for token: ${token.substring(0, 5)}...`);
      const telRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
      const result = await telRes.json();

      logToFile(`>>> Telegram Setup Result: ${JSON.stringify(result)}`);
      res.json({ success: true, result });
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
