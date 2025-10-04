// server/src/index.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chats');

const Message = require('./models/Message');
const Chat = require('./models/Chat');

const app = express();
const server = http.createServer(app);

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
    cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000' }
});

app.get("/", (req, res) => {
    res.send("The base route is working");
})

// Map to store online users: userId -> socketId
const onlineUsers = new Map();

io.on('connection', (socket) => {
    // when client sends 'user:online' we store mapping
    socket.on('user:online', (userId) => {
        onlineUsers.set(userId, socket.id);
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
