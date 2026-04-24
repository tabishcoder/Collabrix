// server/src/index.js
require('dotenv').config();
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

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/users.routes');
const spaceRoutes = require('./routes/spaces.routes');
const projectRoutes = require('./routes/projects.routes');
const taskRoutes = require('./routes/tasks.routes');
const historyRoutes = require('./routes/history.routes');
const chatRoutes   = require('./routes/chats.routes');
const inviteRoutes = require('./routes/invites.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST']
  }
});

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
  } catch (err) {
    return next(new Error('Not authorized'));
  }
});

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

connectDB();

app.use(cors({
    origin: [
        'http://localhost:5173',
        `${process.env.FRONTEND_URL}`
    ],
    credentials: true
}));

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
app.use('/api/chats',   chatRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/admin', adminRoutes);

app.get("/", (req, res) => {
    res.send("The base route is working");
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join space room for real-time updates
    socket.on('join-space', async (spaceId) => {
        try {
            const space = await Space.findOne({
                _id: spaceId,
                $or: [{ owner: socket.user._id }, { 'members.user': socket.user._id }],
            }).select('_id');
            if (!space) return;

            socket.join(`space-${spaceId}`);
            console.log(`User ${socket.id} joined space-${spaceId}`);
        } catch {
            // ignore invalid ids / transient errors
        }
    });

    // Leave space room
    socket.on('leave-space', (spaceId) => {
        socket.leave(`space-${spaceId}`);
        console.log(`User ${socket.id} left space-${spaceId}`);
    });

    // Join project room
    socket.on('join-project', async (projectId) => {
        try {
            const project = await Project.findOne({ _id: projectId })
                .select('_id spaceId members')
                .populate('spaceId', 'owner members');

            if (!project) return;
            const space = project.spaceId;
            const uid = socket.user._id.toString();

            const isSpaceOwner  = space?.owner?.toString() === uid;
            const isSpaceMember = Array.isArray(space?.members) &&
                space.members.some((m) => m.user?.toString() === uid);
            const isProjectMember = project.members.some((m) => m.user?.toString() === uid);

            if (!isSpaceOwner && !isSpaceMember && !isProjectMember) return;

            socket.join(`project-${projectId}`);
            console.log(`User ${socket.id} joined project-${projectId}`);
        } catch {
            // ignore invalid ids / transient errors
        }
    });

    // Leave project room
    socket.on('leave-project', (projectId) => {
        socket.leave(`project-${projectId}`);
        console.log(`User ${socket.id} left project-${projectId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Export io for use in routes (for emitting events)
app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));