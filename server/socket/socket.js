import mongoose from "mongoose";
import usermodel from "../database/usermodel.js";
import { ConversationModel, MessageModel } from "../database/conversationModel.js";
import getConversation from "../controllers/getConversation.js";

export const handleSocketConnection = (io) => {
    const userSockets = new Map(); // Maps User ID → Socket ID
    const onlineUsers = new Map(); // Maps User ID → User Details

    io.on("connection", async (socket) => {
        console.log("✅ User connected:", socket.id);
        const userId = socket.handshake.query.userId;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            socket.disconnect();
            return;
        }

        let user;
        try {
            user = await usermodel.findById(userId).select("name profile_pic");
            if (!user) throw new Error("User not found");
        } catch (error) {
            console.error("Error fetching user:", error);
            socket.disconnect();
            return;
        }

        // Store user details
        userSockets.set(user._id.toString(), socket.id);
        onlineUsers.set(user._id.toString(), user);
        io.emit("onlineUsers", Array.from(onlineUsers.keys()));

        // Send chat list on connection
        const chatList = await getConversation(userId);
        socket.emit("conversation", chatList);

        // Fetch conversations
        socket.on("fetchConversations", async () => {
            const conversations = await getConversation(userId);
            socket.emit("conversation", conversations);
        });

        // Typing Indicator
    

        // Fetch messages
        socket.on("message-page", async (chatuserId) => {
            try {
                let conversation = await ConversationModel.findOne({
                    "$or": [
                        { sender: user._id, receiver: chatuserId },
                        { sender: chatuserId, receiver: user._id },
                    ],
                }).populate("messages");

                if (!conversation) {
                    socket.emit("message", []);
                    return;
                }

                await MessageModel.updateMany(
                    { _id: { $in: conversation.messages.map(msg => msg._id) }, seen: false },
                    { $set: { seen: true } }
                );

                socket.emit("message", conversation.messages);
                const senderSocket = userSockets.get(chatuserId.toString());
                if (senderSocket) {
                    io.to(senderSocket).emit("messagesRead", conversation._id);
                }
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        });

        // Handle new messages
        socket.on("newMessage", async (data, callback) => {
            try {
                const sender = data.senderId;
                const receiver = data.receiverId;

                let conversation = await ConversationModel.findOne({
                    "$or": [
                        { sender: sender, receiver: receiver },
                        { sender: receiver, receiver: sender },
                    ],
                });

                if (!conversation) {
                    conversation = new ConversationModel({ sender, receiver, messages: [] });
                    await conversation.save();
                }

                const message = new MessageModel({
                    text: data.text,
                    imageUrl: data.imageUrl || "",
                    videoUrl: data.videoUrl || "",
                    msgByUserId: sender,
                    seen: false,
                });

                await message.save();
                conversation.messages.push(message._id);
                await conversation.save();

                const updatedConversation = await ConversationModel.findById(conversation._id)
                    .populate("messages");

                const updatedMessages = updatedConversation.messages.map(msg => ({
                    ...msg.toObject(),
                    senderId: msg.msgByUserId,
                }));

                const senderSocket = userSockets.get(sender.toString());
                const receiverSocket = userSockets.get(receiver.toString());

                if (senderSocket) io.to(senderSocket).emit("message", updatedMessages);
                if (receiverSocket) {
                    io.to(receiverSocket).emit("message", updatedMessages);
                    io.to(receiverSocket).emit("message-user", { online: true });
                }

                // Update chat lists
                const senderChatList = await getConversation(sender);
                const receiverChatList = await getConversation(receiver);

                if (senderSocket) io.to(senderSocket).emit("conversation", senderChatList);
                if (receiverSocket) io.to(receiverSocket).emit("conversation", receiverChatList);

                if (callback && typeof callback === "function") {
                    callback({ success: true, messages: updatedMessages });
                }
            } catch (error) {
                console.error("Error handling new message:", error);
                if (callback && typeof callback === "function") {
                    callback({ success: false, error: "Failed to send message" });
                }
            }
        });

        // Handle user going online
        socket.on("user-online", async (userId) => {
            onlineUsers.set(userId, user);
            io.emit("onlineUsers", Array.from(onlineUsers.keys()));

            const chatList = await getConversation(userId);
            const userSocket = userSockets.get(userId.toString());
            if (userSocket) io.to(userSocket).emit("conversation", chatList);
        });

        // Handle user going offline
        socket.on("user-offline", async (userId) => {
            onlineUsers.delete(userId);
            io.emit("onlineUsers", Array.from(onlineUsers.keys()));

            const chatList = await getConversation(userId);
            const userSocket = userSockets.get(userId.toString());
            if (userSocket) io.to(userSocket).emit("conversation", chatList);
        });

        // Handle user disconnect gracefully
        socket.on("disconnect", () => {
            if (user) {
                userSockets.delete(user._id.toString());
                onlineUsers.delete(user._id.toString());
                io.emit("onlineUsers", Array.from(onlineUsers.keys()));
                console.log(`❌ User disconnected: ${user._id.toString()}`);
            }
        });
    });
};
