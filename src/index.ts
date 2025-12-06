import "dotenv/config";
import express from "express";
import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import path from "path";
import { formatBytes, progressBar, eta } from "./util";


import { getAuthURL, handleOAuthCallback, getDriveClient } from "./googleAuth.js";
import { downloadTorrent } from "./torrentDownloader.js";
import { connectDB } from "./db.js";

// Connect DB first
connectDB();
const bot = new TelegramBot(process.env.TELEGRAM_BOT_API_TOKEN!, { polling: true });
const app = express();
const activeDownloads: Map<number, any> = new Map();


// OAuth route
app.get("/oauth2callback", async (req, res) => {
  const code = req.query.code as string;
  const telegramId = req.query.state as string;

  await handleOAuthCallback(code, telegramId);

  res.send("Google Drive linked! Return to Telegram.");
  bot.sendMessage(Number(telegramId), "✅ Google Drive connected!");
});

// /start handler
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const url = getAuthURL(chatId);

  bot.sendMessage(chatId, "Login to Google Drive:\n" + url);
});

bot.onText(/\/cancel/, (msg) => {
  const chatId = msg.chat.id;

  const torrent = activeDownloads.get(chatId);
  if (!torrent) return bot.sendMessage(chatId, "❌ No active download.");

  torrent.destroy(); // stop torrent
  activeDownloads.delete(chatId);

  bot.sendMessage(chatId, "🛑 Download cancelled and cleaned up.");
});


// MAGNET HANDLER
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || !text.startsWith("magnet:?")) return;

  const drive = await getDriveClient(chatId);
  if (!drive) {
    const url = getAuthURL(chatId);
    return bot.sendMessage(chatId, "Please authenticate first:\n" + url);
  }

  // If already downloading → put in queue
  if (activeDownloads.has(chatId)) {
    return bot.sendMessage(chatId, "⚠ A download is already in progress. Please wait or use /cancel");
  }

  const statusMsg = await bot.sendMessage(chatId, "⏳ Fetching metadata...");

  const downloadPath = "./downloads";
  const torrent = await downloadTorrent(text, downloadPath);

  activeDownloads.set(chatId, torrent);

  torrent.on("metadata", () => {
    bot.editMessageText(
      `📄 Torrent: *${torrent.name}*\n` +
      `📦 Size: *${formatBytes(torrent.length)}*\n\n` +
      `🔄 Starting download...`,
      { chat_id: chatId, message_id: statusMsg.message_id, parse_mode: "Markdown" }
    );
  });

  let lastUpdate = 0;

  const interval = setInterval(async () => {
    if (torrent.done) return;

    const now = Date.now();
    if (now - lastUpdate < 5000) return;
    lastUpdate = now;

    const percent = +(torrent.progress * 100).toFixed(2);
    const speed = formatBytes(torrent.downloadSpeed) + "/s";
    const downloaded = formatBytes(torrent.downloaded);
    const remaining = formatBytes(torrent.length - torrent.downloaded);

    const timeLeft = torrent.timeRemaining; // in ms
    const etaText = eta(timeLeft);

    const text =
      `🎬 *${torrent.name}*\n` +
      `\n${progressBar(percent)} ${percent}%` +
      `\n\n⬇ Speed: *${speed}*` +
      `\n📦 Downloaded: *${downloaded} / ${formatBytes(torrent.length)}*` +
      `\n⏳ Remaining: *${remaining}*` +
      `\n⌛ ETA: *${etaText}*` +
      `\n\nUse /cancel to stop`;

    try {
      await bot.editMessageText(text, {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: "Markdown"
      });
    } catch {}
  }, 1000);

  torrent.on("done", async () => {
    clearInterval(interval);
    activeDownloads.delete(chatId);

    await bot.editMessageText("✔ Download finished! Preparing upload...", {
      chat_id: chatId,
      message_id: statusMsg.message_id
    });

    // Upload files
    for (const f of torrent.files) {
      const full = `${downloadPath}/${f.path}`;

      await drive.files.create({
        requestBody: { name: f.name },
        media: {
          mimeType: "application/octet-stream",
          body: fs.createReadStream(full)
        }
      });

      // Delete file
      fs.unlinkSync(full);
    }

    bot.sendMessage(chatId, "🎉 Upload complete!");
  });
});


// Start server
app.listen(3000, () => {
  console.log("OAuth server running at http://localhost:3000");
});
