import mongoose from "mongoose";
// Message Schema
const messageSchema = new mongoose.Schema({
    text: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    videoUrl: { type: String, default: "" },
    seen: { type: Boolean, default: false },
    msgByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
}, { timestamps: true });

const MessageModel = mongoose.model("Message", messageSchema);

// Conversation Schema
const conversationSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
}, { timestamps: true });

const ConversationModel = mongoose.model("Conversation", conversationSchema);

// ✅ Correct export
export { MessageModel, ConversationModel };
