import express from 'express';
import connectDB from './database/db.js';
import dotenv from 'dotenv';
dotenv.config();
import cors from "cors";
import authrouter from './Routes/authroutes.js';
import cookieParser from 'cookie-parser';
import userRouter from './Routes/userroute.js';
import http from 'http'; // Required to create HTTP server for Socket.io
import { Server } from 'socket.io'; // Import Server for Socket.io
import { handlerandomConnection, handleSocketConnection } from '../server/socket/socket.js'; // Import socket connection handler
const app = express();
const port = process.env.PORT || 4000;

// Connect to database
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

// Handle socket connections
handleSocketConnection(io); 
handlerandomConnection(io) // Pass io to the socket handler
// Start the server
server.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
