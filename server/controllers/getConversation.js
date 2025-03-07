import mongoose from "mongoose";
import { ConversationModel } from "../database/conversationModel.js"; // ✅ Correct Import

const getConversation = async (currentUserId) => {
    if (!currentUserId || !mongoose.Types.ObjectId.isValid(currentUserId)) {
        console.error("❌ Invalid user ID provided:", currentUserId);
        return [];
    }

    try {
        console.log("🔍 Fetching conversations for user:", currentUserId);

        const conversations = await ConversationModel.find({
            "$or": [
                { sender: currentUserId },
                { receiver: currentUserId }
            ]
        })
        .sort({ updatedAt: -1 })
        .populate({
            path: "messages",
            select: "text seen msgByUserId createdAt",
        })
        .populate("sender", "name email profile_pic")
        .populate("receiver", "name email profile_pic")
        .lean();  // ✅ Returns plain JavaScript objects for better performance

        if (!conversations || conversations.length === 0) {
            console.warn("⚠️ No conversations found for user:", currentUserId);
            return [];
        }

        return conversations.map((conv) => {
            const unseenMsgCount = conv.messages?.reduce((count, msg) => {
                return msg.msgByUserId.toString() !== currentUserId && !msg.seen ? count + 1 : count;
            }, 0) || 0;  // ✅ Prevents undefined issues

            return {
                _id: conv._id,
                sender: conv.sender,
                receiver: conv.receiver,
                unseenMsg: unseenMsgCount,
                lastMsg: conv.messages?.[conv.messages.length - 1] || null, // ✅ Prevents undefined errors
            };
        });

    } catch (error) {
        console.error("❌ Error fetching conversations:", error.message);
        return [];
    }
};

export default getConversation;
