import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// OAuth2 client setup
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Set credentials directly (no login required)
oauth2Client.setCredentials({
  access_token: process.env.ACCESS_TOKEN,
  refresh_token: process.env.REFRESH_TOKEN,
});

const gmail = google.gmail({ version: "v1", auth: oauth2Client });

// 📨 Send Email
app.post("/api/send", async (req, res) => {
  const { to, subject, message } = req.body;

  try {
    const raw = createMail(to, subject, message);

    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: raw,
      },
    });

    res.json({ success: true, message: "✅ Email sent successfully!" });
  } catch (error) {
    console.error("❌ Error sending email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// 📥 Read Inbox Emails
app.get("/api/inbox", async (req, res) => {
  try {
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
    });

    const messages = await Promise.all(
      response.data.messages.map(async (msg) => {
        const full = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
        });

        const headers = full.data.payload.headers;
        const subject =
          headers.find((h) => h.name === "Subject")?.value || "(No Subject)";
        const from =
          headers.find((h) => h.name === "From")?.value || "(Unknown Sender)";
        const snippet = full.data.snippet;

        return { id: msg.id, from, subject, snippet };
      })
    );

    res.json(messages);
  } catch (error) {
    console.error("❌ Error fetching inbox:", error);
    res.status(500).json({ error: "Failed to load inbox" });
  }
});

// Helper: format message
function createMail(to, subject, message) {
  const str = [
    `To: ${to}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: ${subject}`,
    "",
    message,
  ].join("\n");

  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

app.listen(5000, () =>
  console.log("🚀 Server running at http://localhost:5000")
);
