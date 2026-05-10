// server/src/index.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');

const JWTService = require('./services/JWTService');
const User = require('./models/User');
const Space = require('./models/Space');
const Project = require('./models/Project');
const Chat = require('./models/Chat');
const Message = require('./models/Message');
const UserChatState = require('./models/UserChatState');
const { userCanAccessChat, computeReceiptStatus } = require('./services/chatService');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/users.routes');
const spaceRoutes = require('./routes/spaces.routes');
const projectRoutes = require('./routes/projects.routes');
const taskRoutes = require('./routes/tasks.routes');
const historyRoutes = require('./routes/history.routes');
const meetingRoutes = require('./routes/meetings.routes');
const chatRoutes = require('./routes/chats.routes');
const timeEntryRoutes = require('./routes/timeEntries.routes');
const aiRoutes = require('./routes/ai.routes');
const meetingService = require('./services/communication/meetingService');

/** Comma-separated list (production). Dev allows any localhost / 127.0.0.1 port for Vite. */
function buildProductionCorsOrigins() {
  const raw = [process.env.CORS_ORIGINS, process.env.FRONTEND_URL].filter(Boolean).join(',');
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const isProduction = process.env.NODE_ENV === 'production';
const productionOrigins = buildProductionCorsOrigins();

const socketCors = isProduction
  ? { origin: productionOrigins.length ? productionOrigins : false, credentials: true, methods: ['GET', 'POST'] }
  : { origin: true, credentials: true, methods: ['GET', 'POST'] };

const app = express();
const server = http.createServer(app);

// Socket.io — in dev, allow any Vite port; in production use CORS_ORIGINS / FRONTEND_URL only.
const io = new Server(server, { cors: socketCors });

function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';').map((p) => p.trim());
  const match = parts.find((p) => p.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(name.length + 1));
}

io.use(async (socket, next) => {
  try {
    const cookieHeader = socket.request.headers?.cookie;
    const accessToken = getCookieValue(cookieHeader, 'accessToken');
    if (!accessToken) return next(new Error('Not authorized'));

    const decoded = JWTService.verifyAccessToken(accessToken);
    if (!decoded?._id) return next(new Error('Not authorized'));

    const user = await User.findById(decoded._id).select('_id name email');
    if (!user) return next(new Error('Not authorized'));

    socket.user = user;
    return next();
  } catch {
    return next(new Error('Not authorized'));
  }
});

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

app.use(
  isProduction
    ? cors({
        origin(origin, cb) {
          if (!origin) return cb(null, true);
          const ok = productionOrigins.includes(origin);
          return cb(null, ok);
        },
        credentials: true,
      })
    : cors({ origin: true, credentials: true })
);

app.use(express.json());
app.use(cookieParser());

let requestCount = 0;
app.use((req, res, next) => {
    requestCount++;
    console.log(`Request #${requestCount}: ${req.method} ${req.url}`);
    next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/spaces', spaceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/ai', aiRoutes);

app.get("/", (req, res) => {
    res.send("The base route is working");
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.join(`user-${socket.user._id}`);

    // Join space room for real-time updates
    socket.on('join-space', (spaceId) => {
        socket.join(`space-${spaceId}`);
        console.log(`User ${socket.id} joined space-${spaceId}`);
    });

    // Leave space room
    socket.on('leave-space', (spaceId) => {
        socket.leave(`space-${spaceId}`);
        console.log(`User ${socket.id} left space-${spaceId}`);
    });

    // Join project room
    socket.on('join-project', (projectId) => {
        socket.join(`project-${projectId}`);
        console.log(`User ${socket.id} joined project-${projectId}`);
    });

    // Leave project room
    socket.on('leave-project', (projectId) => {
        socket.leave(`project-${projectId}`);
        console.log(`User ${socket.id} left project-${projectId}`);
    });

    socket.on('join-meeting', async (meetingId) => {
        try {
            if (!meetingId) return;
            const ok = await meetingService.userMaySubscribeMeetingRoom(meetingId, socket.user._id);
            if (!ok) return;
            socket.join(`meeting-${meetingId}`);
            console.log(`User ${socket.id} joined meeting-${meetingId}`);
        } catch {
            // ignore invalid ids / transient errors
        }
    });

    socket.on('leave-meeting', (meetingId) => {
        if (!meetingId) return;
        socket.leave(`meeting-${meetingId}`);
        console.log(`User ${socket.id} left meeting-${meetingId}`);
    });

    socket.on('join-chat', async (chatId) => {
        try {
            if (!chatId) return;
            const chat = await Chat.findById(chatId).select('_id kind projectId participants isGroup');
            const ok = await userCanAccessChat(socket.user._id, chat);
            if (!ok) return;
            socket.join(`chat-${chatId}`);
        } catch {
            // invalid id / transient
        }
    });

    socket.on('leave-chat', (chatId) => {
        if (!chatId) return;
        socket.leave(`chat-${chatId}`);
    });

    socket.on('chat:ack-delivered', async (payload) => {
        try {
            const { chatId, messageIds } = payload || {};
            if (!chatId || !Array.isArray(messageIds) || !messageIds.length) return;
            const chat = await Chat.findById(chatId).select('participants');
            if (!chat || !(await userCanAccessChat(socket.user._id, chat))) return;
            const uid = socket.user._id;
            const participantIds = chat.participants.map((p) => p.toString());
            const unique = [...new Set(messageIds)].slice(0, 60);
            for (const mid of unique) {
                if (!mongoose.Types.ObjectId.isValid(mid)) continue;
                const existing = await Message.findOne({ _id: mid, chat: chatId }).select('sender');
                if (!existing || existing.sender.toString() === uid.toString()) continue;
                await Message.updateOne(
                    { _id: mid, chat: chatId },
                    { $addToSet: { deliveredTo: uid } },
                );
                const upd = await Message.findById(mid).populate('sender', '_id name email avatar');
                if (!upd) continue;
                const states = await UserChatState.find({ chat: chatId }).lean();
                const plain = upd.toObject();
                const receiptStatus = computeReceiptStatus(plain, participantIds, states);
                io.to(`chat-${chatId}`).emit('chat:message-status', {
                    chatId: String(chatId),
                    messageId: String(mid),
                    deliveredTo: plain.deliveredTo,
                    receiptStatus,
                });
            }
        } catch (e) {
            console.error('chat:ack-delivered', e?.message);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Export io for use in routes (for emitting events)
app.set('io', io);

const PORT = process.env.PORT || 5000;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\n[server] Port ${PORT} is already in use — another Node process is listening (e.g. an older terminal still running npm start / nodemon).\n` +
        `  Fix: close that terminal, or in PowerShell find and stop it:\n` +
        `    netstat -ano | findstr ":${PORT} "\n` +
        `    taskkill /PID <pid_from_LISTENING_row> /F\n` +
        `  Or run on another port:  $env:PORT=3001; npm start\n`
    );
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => console.log(`Server running on ${PORT}`));