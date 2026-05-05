import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, doc, serverTimestamp } from "firebase/firestore";
import fs from "fs";

// Load Firebase Config
const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const appFirebase = initializeApp(firebaseConfig);
const db = getFirestore(appFirebase, firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(bodyParser.json());

  // Pending guest additions memory (in-memory for simplicity in this demo)
  // In production, this should be in a DB or Redis
  const pendingGuests = new Map<number, string>();

  // Helper to send Telegram message
  async function sendTelegram(token: string, method: string, body: Record<string, unknown>) {
    return fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  // Telegram Webhook
  app.post("/api/telegram-webhook", async (req, res) => {
    const { message, callback_query } = req.body;
    const ownerId = req.query.ownerId as string;
    
    // Fallback bot token from environment if not provided per request
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      console.error("No bot token available");
      return res.sendStatus(200);
    }

    // Handle Category Selection
    if (callback_query) {
      const chatId = callback_query.message.chat.id;
      const data = callback_query.data;
      const guestName = pendingGuests.get(chatId);

      if (guestName && data.startsWith("cat:")) {
        const category = data.split(":")[1];
        
        try {
          if (!ownerId) throw new Error("No ownerId provided in webhook URL");

          const userRef = doc(db, "users", ownerId);
          await addDoc(collection(userRef, "guests"), {
            name: guestName,
            category: category,
            status: "Not Invited",
            createdAt: serverTimestamp(),
            notes: "Added via Telegram",
            ownerId: ownerId
          });

          await sendTelegram(botToken, "sendMessage", {
            chat_id: chatId,
            text: `✅ Guest "${guestName}" added to "${category}"!`,
          });
          
          pendingGuests.delete(chatId);
        } catch (error) {
          console.error("Error adding guest from Telegram:", error);
          await sendTelegram(botToken, "sendMessage", {
            chat_id: chatId,
            text: "❌ Error adding guest. Make sure your Webhook URL is correct with ownerId.",
          });
        }
      }
      return res.sendStatus(200);
    }

    // Handle New Message (Guest Name)
    if (message && message.text) {
      const chatId = message.chat.id;
      const text = message.text.trim();

      if (text === "/start") {
        await sendTelegram(botToken, "sendMessage", {
          chat_id: chatId,
          text: "💍 Welcome! Send me a name to add a new guest to your wedding list.",
        });
        return res.sendStatus(200);
      }

      pendingGuests.set(chatId, text);

      // Try to fetch user's actual categories
      let categories = ["Family", "Friends", "Groom Side", "Bride Side"];
      if (ownerId) {
        try {
          const userRef = doc(db, "users", ownerId);
          const catsSnap = await getDocs(collection(userRef, "categories"));
          if (!catsSnap.empty) {
            categories = catsSnap.docs.map(d => d.data().name);
          }
        } catch (err) {
          console.error("Error fetching categories:", err);
        }
      }

      await sendTelegram(botToken, "sendMessage", {
        chat_id: chatId,
        text: `Which category for "${text}"?`,
        reply_markup: {
          inline_keyboard: categories.reduce((acc: {text: string, callback_data: string}[][], cat, i) => {
            if (i % 2 === 0) acc.push([{ text: cat, callback_data: `cat:${cat}` }]);
            else acc[acc.length - 1].push({ text: cat, callback_data: `cat:${cat}` });
            return acc;
          }, [])
        }
      });
    }

    res.sendStatus(200);
  });

  // Health check
  app.get("/api/health", (req, res) => {
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
