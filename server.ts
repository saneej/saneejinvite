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

  let db: any = null;

  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    console.log(">>> Reading config from:", configPath);
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    if (getApps().length === 0) {
      console.log(">>> Initializing Firebase Admin with default credentials...");
      initializeApp();
    }

    db = firebaseConfig.firestoreDatabaseId 
      ? getFirestore(firebaseConfig.firestoreDatabaseId) 
      : getFirestore();
    
    console.log(">>> Firebase Admin successfully set up.");
  } catch (err) {
    console.error("!!! Firebase Admin init failed:", err);
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

  // Telegram Webhook
  app.post("/api/telegram-webhook", async (req, res) => {
    console.log(">>> Received Telegram Webhook request");
    if (!db) {
      console.error("!!! Firestore not available in webhook");
      return res.status(500).send("DB not ready");
    }

    const { message, callback_query } = req.body;
    const ownerId = req.query.ownerId as string;
    
    if (!ownerId) {
      console.error("!!! Missing ownerId in webhook URL query");
      return res.sendStatus(200);
    }

    try {
      // Fetch user settings
      const settingsSnap = await db.collection("users").doc(ownerId).collection("settings").doc("info").get();
      const settingsData = settingsSnap.data();
      const botToken = settingsData?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;

      if (!botToken) {
        console.error("!!! No Bot Token found for user:", ownerId);
        return res.sendStatus(200);
      }

      if (callback_query) {
        const chatId = callback_query.message.chat.id;
        const data = callback_query.data;
        const guestName = pendingGuests.get(chatId);

        if (guestName && data.startsWith("cat:")) {
          const category = data.split(":")[1];
          console.log(`>>> Adding guest: ${guestName} to category: ${category} (User: ${ownerId})`);
          
          await db.collection("users").doc(ownerId).collection("guests").add({
            name: guestName,
            category: category,
            status: "Not Invited",
            createdAt: FieldValue.serverTimestamp(),
            notes: "Added via Telegram",
            ownerId: ownerId
          });

          await sendTelegram(botToken, "sendMessage", {
            chat_id: chatId,
            text: `✅ Guest "${guestName}" added to "${category}"!`,
          });
          
          pendingGuests.delete(chatId);
        }
        return res.sendStatus(200);
      }

      if (message && message.text) {
        const chatId = message.chat.id;
        const text = message.text.trim();
        console.log(`>>> Received text message: "${text}" from chatId: ${chatId}`);

        if (text === "/start") {
          await sendTelegram(botToken, "sendMessage", {
            chat_id: chatId,
            text: "💍 Welcome! Send me a name to add a new guest to your wedding list.",
          });
          return res.sendStatus(200);
        }

        pendingGuests.set(chatId, text);

        let categories = ["Family", "Friends", "Groom Side", "Bride Side"];
        const catsSnap = await db.collection("users").doc(ownerId).collection("categories").get();
        if (!catsSnap.empty) {
          categories = catsSnap.docs.map((d: any) => d.data().name);
        }

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
      console.error("!!! Telegram Webhook processing error:", error);
    }

    res.sendStatus(200);
  });


  // Health check
  app.get("/api/health", (req, res) => {
    console.log(">>> Health check hit");
    res.json({ status: "ok" });
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
