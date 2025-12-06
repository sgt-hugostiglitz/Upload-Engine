require("dotenv").config();
const { google } = require("googleapis");
const fs = require("fs");

const TOKEN_PATH = "./users.json";
let users = fs.existsSync(TOKEN_PATH) ? JSON.parse(fs.readFileSync(TOKEN_PATH)) : {};

function saveUsers() {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(users, null, 2));
}

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

exports.getAuthURL = (telegramId) => {
  const oauth2Client = getOAuthClient();

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/drive.file"],
    state: telegramId
  });
};

exports.handleOAuthCallback = async (code, telegramId) => {
  const oauth2Client = getOAuthClient();

  const { tokens } = await oauth2Client.getToken(code);

  users[telegramId] = tokens;
  saveUsers();

  return true;
};

exports.getDriveClient = (telegramId) => {
  if (!users[telegramId]) return null;

  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials(users[telegramId]);

  return google.drive({
    version: "v3",
    auth: oauth2Client
  });
};
