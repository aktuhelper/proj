import express from 'express';
import connectDB from './database/db.js';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import authrouter from './Routes/authroutes.js';
import cookieParser from 'cookie-parser';
import userRouter from './Routes/userroute.js';
import http from 'http'; // Required to create HTTP server for Socket.io
import { Server } from 'socket.io'; // Import Server for Socket.io
import { handleSocketConnection } from './socket/socket.js'; // Normal chat functionality
import { startChat, sendMessage, handleDisconnect, endChat } from './socket/randomchatSocket.js'; // Random chat functionality

const app = express();
const port = process.env.PORT || 4000;

// Connect to the database
connectDB();

// Allowed origins for CORS
const allowedOrigins = ['http://localhost:5173']; // Update with actual frontend URL

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Routes
app.use('/api/auth', authrouter);
app.use('/api/user', userRouter);

app.get('/', (req, res) => {
    res.send("API working");
});

// Create HTTP server and pass it to Socket.io
const server = http.createServer(app);

// Initialize Socket.io with the HTTP server
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL, // Frontend URL for CORS
        credentials: true,
    }
});

// Handle socket connections for normal chat (this should be in your `socket.js`)
handleSocketConnection(io);

// Handle socket connections for random chat
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // When a user clicks the "Start Chat" button for random chat
    socket.on('start-chat', (userId) => {
        console.log(`Received start chat request from user: ${userId}`);
        startChat(io, socket, userId);  // Call startChat from randomchatSocket.js
    });

    // Handle sending messages in random chat
    socket.on('send-message', (chatRoomId, senderId, message) => {
        // Log data to understand the structure
        console.log(`Received message from user ${senderId} in chat room ${chatRoomId}:`, message);

        if (message && message.text) {
            sendMessage(io, chatRoomId, senderId, message);  // Call sendMessage from randomchatSocket.js
        } else {
            console.error('Message content is empty or invalid!');
        }
    });

    // Handle user disconnect in random chat
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        handleDisconnect(socket, io);  // Call handleDisconnect from randomchatSocket.js
    });

    // Handle end chat event
    socket.on('end-chat', (userId) => {
        console.log(`Received end chat request from user: ${userId}`);
        endChat(io, userId);  // End the chat and notify users
    });

    // Handle any errors from socket connections
    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
});

// Start the server
server.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
