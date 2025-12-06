import "dotenv/config";
import { google, drive_v3 } from "googleapis";
import { User } from "./models/User.js";

// --- OAuth Client ---
function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.REDIRECT_URI!
  );
}

// --- URL for Login ---
export function getAuthURL(telegramId: number): string {
  const oauth = getOAuthClient();

  return oauth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/drive.file"],
    state: telegramId.toString()
  });
}

// --- Handle Callback ---
export async function handleOAuthCallback(code: string, telegramId: string) {
  const oauth = getOAuthClient();
  const { tokens } = await oauth.getToken(code);

  await User.findOneAndUpdate(
    { telegramId },
    { tokens },
    { upsert: true }
  );

  return true;
}

// --- Get User Drive Client ---
export async function getDriveClient(telegramId: number): Promise<drive_v3.Drive | null> {
  const user = await User.findOne({ telegramId });

  if (!user) return null;

  const oauth = getOAuthClient();
  oauth.setCredentials(user.tokens);

  return google.drive({ version: "v3", auth: oauth });
}
