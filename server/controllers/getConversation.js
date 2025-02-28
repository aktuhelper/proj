import mongoose from "mongoose";
import { ConversationModel } from '../database/conversationModel.js';  // ✅ Correct Import

const getConversation = async (currentUserId) => {
    if (!currentUserId || !mongoose.Types.ObjectId.isValid(currentUserId)) {
        console.error("❌ Invalid user ID provided:", currentUserId);
        return [];
    }

    try {
        console.log("🔍 Fetching conversations for user:", currentUserId);

        const currentUserConversation = await ConversationModel.find({
            "$or": [
                { sender: currentUserId },
                { receiver: currentUserId }
            ]
        })
        .sort({ updatedAt: -1 })
        .populate({
            path: 'messages',
            select: 'text seen msgByUserId createdAt',  // ✅ Only select needed fields
        })
        .populate('sender', 'name email profile_pic')  // ✅ Only fetch necessary sender details
        .populate('receiver', 'name email profile_pic'); // ✅ Only fetch necessary receiver details

        if (!currentUserConversation || currentUserConversation.length === 0) {
            console.warn("⚠️ No conversations found for user:", currentUserId);
            return [];
        }

        const conversations = currentUserConversation.map((conv) => {
            if (!conv.messages || conv.messages.length === 0) {
                return {
                    _id: conv._id,
                    sender: conv.sender,
                    receiver: conv.receiver,
                    unseenMsg: 0,
                    lastMsg: null,
                };
            }

            const countUnseenMsg = conv.messages.reduce((prev, curr) => {
                return curr.msgByUserId.toString() !== currentUserId && !curr.seen ? prev + 1 : prev;
            }, 0);

            const lastMsg = conv.messages[conv.messages.length - 1];

            return {
                _id: conv._id,
                sender: conv.sender,
                receiver: conv.receiver,
                unseenMsg: countUnseenMsg,
                lastMsg,
            };
        });

        console.log("✅ Conversations fetched successfully");
        return conversations;
    } catch (error) {
        console.error("❌ Error fetching conversations:", error.message);
        return [];
    }
};

export default getConversation;
