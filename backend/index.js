// server/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const spaceRoutes = require('./routes/spaces');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const historyRoutes = require('./routes/history');

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

app.get("/", (req, res) => {
    res.send("The base route is working");
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

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

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Export io for use in routes (for emitting events)
app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));