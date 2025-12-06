const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
require("dotenv").config();

const {
  getAuthURL,
  handleOAuthCallback,
  getDriveClient
} = require("./googleAuth");
const { downloadTorrent } = require("./torrentDownloader");
const fs = require("fs");
const path = require("path");

const TOKEN = process.env.TELEGRAM_BOT_API_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

const app = express();
app.get("/oauth2callback", async (req, res) => {
  const { code, state: telegramId } = req.query;

  await handleOAuthCallback(code, telegramId);
  res.send("Google Drive linked! You can return to Telegram.");
  bot.sendMessage(telegramId, "✅ Google Drive connected!");
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const url = getAuthURL(chatId);

  bot.sendMessage(chatId, "Click to authenticate your Google Drive:\n" + url);
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text.startsWith("magnet:?")) return;

  const drive = getDriveClient(chatId);
  if (!drive) {
    const url = getAuthURL(chatId);
    return bot.sendMessage(chatId, "Please authenticate first:\n" + url);
  }

  bot.sendMessage(chatId, "Downloading torrent...");

  const downloadPath = "./downloads";

  const files = await downloadTorrent(text, downloadPath);

  bot.sendMessage(chatId, "Uploading to Google Drive...");

  for (const file of files) {
    const fileMetadata = { name: path.basename(file) };
    const media = { mimeType: 'application/octet-stream', body: fs.createReadStream(file) };

    await drive.files.create({ resource: fileMetadata, media, fields: "id" });
  }

  bot.sendMessage(chatId, "Upload complete!");
});

app.listen(3000, () => console.log("OAuth server running on port 3000"));
