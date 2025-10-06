// server/src/index.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const {google} = require('googleapis');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chats');

const Message = require('./models/Message');
const Chat = require('./models/Chat');

const app = express();

const { Server } = require('socket.io');
const server = http.createServer(app);
// const { WebSocketServer } = require("ws");         // This is a different thing than socket.io

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('MongoDB connected');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);

const io = new Server(server, {
    cors: { origin: "*" }
});

app.get("/", (req, res) => {
    res.send("The base route is working");
});

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

// Load credentials from .env
const SDK_KEY = process.env.ZOOM_CLIENT_ID; // Client ID
const SDK_SECRET = process.env.ZOOM_CLIENT_SECRET; // Client Secret
const ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;

// Generate Meeting Signature (for Web SDK)
app.get("/signature", (req, res) => {
  const meetingNumber = req.query.meetingNumber;
  const role = req.query.role || 0;

  const timestamp = new Date().getTime() - 30000;
  const msg = Buffer.from(SDK_KEY + meetingNumber + timestamp + role).toString(
    "base64"
  );
  const hash = crypto
    .createHmac("sha256", SDK_SECRET)
    .update(msg)
    .digest("base64");
  const signature = Buffer.from(
    `${SDK_KEY}.${meetingNumber}.${timestamp}.${role}.${hash}`
  ).toString("base64");

  res.json({ signature });
});

// Get Access Token (for Zoom API calls like Create Meeting)
async function getAccessToken() {
  const response = await axios.post(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ACCOUNT_ID}`,
    {},
    {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${SDK_KEY}:${SDK_SECRET}`
        ).toString("base64")}`,
      },
    }
  );
  return response.data.access_token;
}

// Create a Meeting
app.post("/create-meeting", async (req, res) => {
  try {
    const token = await getAccessToken();
    const result = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        topic: req.body.topic || "MERN App Meeting",
        type: 1, // Instant meeting
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    res.json(result.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to create meeting" });
  }
});

// List Meetings
app.get("/meetings", async (req, res) => {
  try {
    const token = await getAccessToken();
    const result = await axios.get("https://api.zoom.us/v2/users/me/meetings", {
      headers: { Authorization: `Bearer ${token}` },
    });
    res.json(result.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to list meetings" });
  }
});

// Map to store online users: userId -> socketId
const onlineUsers = new Map();

io.on('connection', (socket) => {
    // when client sends 'user:online' we store mapping
    socket.on('user:online', (userId) => {
        onlineUsers.set(userId, socket.id);
        // console.log(onlineUsers);
        // optionally broadcast online status
    });

    // handle joining a chat room (chatId)
    socket.on('join:chat', (chatId) => {
        socket.join(chatId);
    });

    // send message event
    socket.on('private:message', async ({ chatId, senderId, content }) => {
        try {
            // store message
            const msg = await Message.create({ chat: chatId, sender: senderId, content, status: 'sent', createdAt: new Date() });
            socket.emit("message:recoil", msg);
            // update chat's last message
            await Chat.findByIdAndUpdate(chatId, { lastMessage: content, updatedAt: new Date() });

            // emit to room
            io.to(chatId).emit('private:message', { message: msg });

            // also emit to specific user's socket if online (works for 1-1)
            const chat = await Chat.findById(chatId).populate('participants', '_id');
            chat.participants.forEach((p) => {
                const socketId = onlineUsers.get(String(p._id));
                if (socketId) io.to(socketId).emit('notification:new_message', { chatId, message: msg });
            });
        } catch (err) {
            console.error(err);
        }
    });

    socket.on('disconnect', () => {
        // remove user from onlineUsers
        for (const [userId, sockId] of onlineUsers.entries()) {
            if (sockId === socket.id) {
                onlineUsers.delete(userId);
                break;
            }
        }
    });
});

const TRELLO_KEY = process.env.TRELLO_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const MEMBER_ID = "68dcbbf686582c853dd25c18"; 
const BOARD_ID = "68e20dd5c636e8634f1119ab";  

// ✅ Route to get all boards of the user
app.get("/api/boards", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.trello.com/1/members/${MEMBER_ID}/boards?key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch boards" });
  }
});

// ✅ Route to get specific board details
app.get("/api/board", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.trello.com/1/boards/${BOARD_ID}?key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch board" });
  }
});

// ✅ Route to get lists (To Do / In Progress / Done)
app.get("/api/board/lists", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.trello.com/1/boards/${BOARD_ID}/lists?key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch board lists" });
  }
});

// ✅ Route to get cards of a board
app.get("/api/board/cards", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.trello.com/1/boards/${BOARD_ID}/cards?key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch board cards" });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));