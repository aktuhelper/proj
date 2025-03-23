import express from 'express';
import connectDB from './database/db.js';
import dotenv from 'dotenv';
import cors from 'cors';
import authrouter from './Routes/authroutes.js';
import cookieParser from 'cookie-parser';
import userRouter from './Routes/userroute.js';
import http from 'http';
import { Server } from 'socket.io';
import { handleSocketConnection } from './socket/socket.js'; // Normal chat functionality
import { startChat, sendMessage, handleDisconnect, endChat } from './socket/randomchatSocket.js'; // Random chat functionality
import router from './Routes/convid.js';
import FriendRequest from './database/FriendRequestModel.js'; // Import the FriendRequest model
import UserModel from './database/usermodel.js'; // Import the User model
import friendRequestRoute from './Routes/friendroute.js'; // Import the new friend request route
import acceptorreject from './Routes/acceptorreject.js';
import rou from './Routes/checkFriend.js';
import path from 'path';
dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const __dirname= path.resolve();
// Connect to the database
connectDB();

// Allowed origins for CORS
const allowedOrigins = ['https://chatsphere-hzox.onrender.com']; // Frontend URL

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Routes
app.use('/api/auth', authrouter);
app.use('/api/user', userRouter);
app.use('/api/conv', router);
app.use('/api/friend-requests', friendRequestRoute); // Add the friend requests route
app.use("/api/friends", acceptorreject);
app.use("/api/user",rou)
// API Health Check
app.get('/', (req, res) => res.redirect('/login'));

// Create HTTP server and pass it to Socket.io
const server = http.createServer(app);

// Initialize Socket.io with the HTTP server
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true,
    }
});

// Track user sockets by user ID
let userSockets = {}; // In-memory object to store userId -> socketId mapping

// Handle socket connections for normal chat (this should be in your `socket.js`)
handleSocketConnection(io);

// Handle socket connections for random chat
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Register user on socket connection
    socket.on('register-user', (userId) => {
        userSockets[userId] = socket.id; // Store the user's socketId
        console.log(`User ${userId} is connected with socket ${socket.id}`);
    });

    // Handle sending friend requests
    socket.on('send-friend-request', async (senderId, receiverId) => {
        console.log(`Received friend request from ${senderId} to ${receiverId}`);
        
        try {
            // Prevent sending a friend request to self
            if (senderId === receiverId) {
                return socket.emit('error', 'You cannot send a friend request to yourself');
            }
    
            // Check if sender and receiver are already friends
            const sender = await UserModel.findById(senderId).select('friends');
            const receiver = await UserModel.findById(receiverId).select('friends');
    
            if (sender.friends.includes(receiverId)) {
                return socket.emit('error', 'You are already friends with this user');
            }
    
            // Check if a friend request already exists
            const existingRequest = await FriendRequest.findOne({ sender: senderId, receiver: receiverId });
            if (existingRequest) {
                return socket.emit('error', 'Friend request already sent');
            }
    
            // Create a new friend request
            const newRequest = new FriendRequest({ sender: senderId, receiver: receiverId, status: 'pending' });
            await newRequest.save();
            console.log('Friend request saved to database:', newRequest);
    
            // Fetch sender's details for notification
            const senderDetails = await UserModel.findById(senderId).select('name profile_pic');
            const requestWithSenderDetails = {
                ...newRequest.toObject(),
                senderDetails: { name: senderDetails.name, profile_pic: senderDetails.profile_pic },
            };
    
            // Send friend request notification to receiver
            const receiverSocketId = userSockets[receiverId];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('receive-friend-request', requestWithSenderDetails);
                console.log(`Friend request sent to receiver ${receiverId}`);
            } else {
                console.log(`Receiver ${receiverId} is not online.`);
            }
        } catch (error) {
            console.error('Error sending friend request:', error);
            socket.emit('error', 'Error sending friend request');
        }
    });

    // Emit the friend status when a user navigates to the message page
    socket.on('check-if-already-friends', async (senderId, receiverId) => {
        try {
            // Fetch the sender's and receiver's friends list
            const sender = await UserModel.findById(senderId).select('friends');
            const isAlreadyFriends = sender.friends.includes(receiverId);
            
            // Emit whether the users are already friends
            socket.emit('friendStatus', { isAlreadyFriends });
        } catch (error) {
            console.error('Error checking friend status:', error);
            socket.emit('error', 'Error checking friend status');
        }
    });

    // Handle random chat events
    socket.on('start-chat', (userId) => {
        console.log(`Received start chat request from user: ${userId}`);
        startChat(io, socket, userId);
    });

    socket.on('send-message', (chatRoomId, senderId, message) => {
        console.log(`Received message from user ${senderId} in chat room ${chatRoomId}:`, message);
        if (message && message.text) {
            sendMessage(io, chatRoomId, senderId, message);
        } else {
            console.error('Message content is empty or invalid!');
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        handleDisconnect(socket, io);
    });

    socket.on('end-chat', (userId) => {
        console.log(`Received end chat request from user: ${userId}`);
        endChat(io, userId);
    });

    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
});
app.use(express.static(path.join(__dirname,'/client/dist')))
app.get('*',(req,res)=>{
    res.sendFile(path.resolve(__dirname,'client','dist','index.html'))
})
// Start the server
server.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
