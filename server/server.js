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
let userSockets = {};

handleSocketConnection(io); // Normal chat handler

// WebSocket events
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Register user
  socket.on('register-user', (userId) => {
    userSockets[userId] = socket.id;
    console.log(`User ${userId} is connected with socket ${socket.id}`);
  });

  // Friend request handling
  socket.on('send-friend-request', async (senderId, receiverId) => {
    try {
      if (senderId === receiverId) {
        return socket.emit('error', 'You cannot send a friend request to yourself');
      }

      const sender = await UserModel.findById(senderId).select('friends');
      const receiver = await UserModel.findById(receiverId).select('friends');

      if (sender.friends.includes(receiverId)) {
        return socket.emit('error', 'You are already friends with this user');
      }

      const existingRequest = await FriendRequest.findOne({ sender: senderId, receiver: receiverId });
      if (existingRequest) {
        return socket.emit('error', 'Friend request already sent');
      }

      const newRequest = new FriendRequest({ sender: senderId, receiver: receiverId, status: 'pending' });
      await newRequest.save();

      const senderDetails = await UserModel.findById(senderId).select('name profile_pic');
      const requestWithSenderDetails = {
        ...newRequest.toObject(),
        senderDetails: { name: senderDetails.name, profile_pic: senderDetails.profile_pic },
      };

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

  socket.on('check-if-already-friends', async (senderId, receiverId) => {
    try {
      const sender = await UserModel.findById(senderId).select('friends');
      const isAlreadyFriends = sender.friends.includes(receiverId);
      socket.emit('friendStatus', { isAlreadyFriends });
    } catch (error) {
      console.error('Error checking friend status:', error);
      socket.emit('error', 'Error checking friend status');
    }
  });

  // Random chat logic
  socket.on('start-chat', (userId) => {
    console.log(`start-chat from ${userId}`);
    startChat(io, socket, userId);
  });

  socket.on('send-message', (chatRoomId, message) => {
    if (!chatRoomId || !message || !message.senderId) {
      console.error("Invalid send-message payload");
      return;
    }

    console.log(`send-message in room ${chatRoomId} by ${message.senderId}`);
    sendMessage(io, chatRoomId, message.senderId, message);
  });

  socket.on('end-chat', (userId) => {
    console.log(`end-chat from ${userId}`);
    endChat(io, userId);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    handleDisconnect(socket, io);
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
