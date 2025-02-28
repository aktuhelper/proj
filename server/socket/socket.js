import mongoose from "mongoose";
import usermodel from "../database/usermodel.js";
import { ConversationModel, MessageModel } from '../database/conversationModel.js';
import getConversation from '../controllers/getConversation.js';

export const handleSocketConnection = (io) => {
    const onlineUsers = new Set();
    const userSockets = new Map(); // ✅ Stores User ID -> Socket ID

    io.on('connection', async (socket) => {
        console.log("✅ User connected:", socket.id);

        const userId = socket.handshake.query.userId;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            console.log("❌ Invalid or missing user ID.");
            socket.disconnect();
            return;
        }

        const user = await usermodel.findById(userId).select("-password");
        if (!user) {
            console.log("❌ User not found.");
            socket.disconnect();
            return;
        }

        // ✅ Store the user's active socket
        userSockets.set(user._id.toString(), socket.id);
        onlineUsers.add(user._id.toString());
        io.emit('onlineUsers', Array.from(onlineUsers));

        // ✅ Fetch messages for a user
        socket.on('message-page', async (chatUserId) => {
            console.log("📨 Fetching messages for:", chatUserId);

            if (!chatUserId || !mongoose.Types.ObjectId.isValid(chatUserId)) {
                console.log("❌ Invalid user ID in message-page event.");
                return;
            }

            const userDetails = await usermodel.findById(chatUserId).select("-password");
            if (!userDetails) {
                console.log("❌ Error: User details not found.");
                return;
            }

            const payload = {
                _id: userDetails._id,
                name: userDetails.name,
                email: userDetails.email,
                profile_pic: userDetails.profile_pic,
                online: onlineUsers.has(chatUserId),
            };

            socket.emit('message-user', payload);

            const conversation = await ConversationModel.findOne({
                "$or": [
                    { sender: user._id, receiver: chatUserId },
                    { sender: chatUserId, receiver: user._id },
                ],
            }).populate('messages');

            socket.emit('message', conversation?.messages || []);
        });

        // ✅ Handling new messages
        socket.on('new message', async (data) => {
            console.log("📩 New message received:", data);

            const sender = data.senderId;
            const receiver = data.receiverId;

            if (!sender || !receiver || !mongoose.Types.ObjectId.isValid(sender) || !mongoose.Types.ObjectId.isValid(receiver)) {
                console.error("❌ Error: Invalid sender or receiver ID.", { sender, receiver });
                return;
            }

            let conversation = await ConversationModel.findOne({
                "$or": [
                    { sender: sender, receiver: receiver },
                    { sender: receiver, receiver: sender },
                ],
            });

            if (!conversation) {
                console.log("🆕 Creating new conversation.");
                conversation = await new ConversationModel({
                    sender: sender,
                    receiver: receiver,
                }).save();
            }

            const message = await new MessageModel({
                text: data.text,
                imageUrl: data.imageUrl || null,
                videoUrl: data.videoUrl || null,
                msgByUserId: sender,
                seen: false,
            }).save();

            conversation.messages.push(message._id);
            await conversation.save();

            const updatedConversation = await ConversationModel.findById(conversation._id)
                .populate('messages')
                .sort({ updatedAt: -1 });

            // ✅ Only send messages to the specific user's socket, not everyone in the room
            const senderSocket = userSockets.get(sender.toString());
            const receiverSocket = userSockets.get(receiver.toString());

            if (senderSocket) io.to(senderSocket).emit('message', updatedConversation?.messages || []);
            if (receiverSocket) io.to(receiverSocket).emit('message', updatedConversation?.messages || []);

            // ✅ Update conversation lists
            const senderConversation = await getConversation(sender);
            const receiverConversation = await getConversation(receiver);

            if (senderSocket) io.to(senderSocket).emit('conversation', senderConversation);
            if (receiverSocket) io.to(receiverSocket).emit('conversation', receiverConversation);
        });

        // ✅ Handle user disconnection
        socket.on('disconnect', () => {
            onlineUsers.delete(user._id.toString());
            userSockets.delete(user._id.toString()); // Remove from socket map
            console.log("❌ User disconnected:", socket.id);
            io.emit('onlineUsers', Array.from(onlineUsers));
        });
    });
};
export const handlerandomConnection = (io) => {
    const onlineUsers = new Set();
    const userSockets = new Map();
    const waitingQueue = []; // Queue for users waiting to be matched
    const activeChats = new Map(); // Track active chat rooms
  
    io.on("connection", async (socket) => {
      console.log("✅ User connected:", socket.id);
  
      const userId = socket.handshake.query.userId;
  
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        console.log("❌ Invalid or missing user ID.");
        socket.disconnect();
        return;
      }
  
      let user;
      try {
        user = await usermodel.findById(userId).select("-password");
        if (!user) {
          console.log("❌ User not found.");
          socket.disconnect();
          return;
        }
      } catch (error) {
        console.error("❌ Error fetching user:", error);
        socket.disconnect();
        return;
      }
  
      userSockets.set(user._id.toString(), socket.id);
      onlineUsers.add(user._id.toString());
      io.emit("onlineUsers", Array.from(onlineUsers));
  
      // When user starts a random chat
      socket.on("startRandomChat", () => {
        console.log(`${user.name} is looking for a random chat!`);
        
        // Add user to waiting queue
        waitingQueue.push(user._id.toString());
        
        // Try to match the user with someone in the waiting queue
        if (waitingQueue.length >= 2) {
          const partnerId = waitingQueue.shift(); // Get the first user from the queue
          const partnerSocketId = userSockets.get(partnerId);
  
          if (partnerSocketId) {
            // Emit random chat started to both users
            io.to(socket.id).emit("randomChatStarted", { partnerId, room: socket.id });
            io.to(partnerSocketId).emit("randomChatStarted", {
              partnerId: user._id.toString(),
              room: partnerSocketId,
            });
  
            // Log the match
            console.log("Random chat started between:", user.name, partnerId);
          } else {
            console.log(`Partner with ID ${partnerId} not found.`);
          }
        } else {
          console.log(`Waiting for more users to join the random chat. Current waiting queue: ${waitingQueue.length}`);
        }
      });
  
      // Handle incoming random chat messages
      socket.on("randomChatMessage", (message) => {
        const room = message.room || socket.id;
        io.to(room).emit("randomChatMessage", message);
        console.log(`Message from ${user.name}:`, message);
      });
  
      // When user disconnects
      socket.on("disconnect", () => {
        console.log(`${user.name} disconnected`);
        onlineUsers.delete(user._id.toString());
        userSockets.delete(user._id.toString());
        io.emit("onlineUsers", Array.from(onlineUsers));
      });
    });
  };
