import mongoose from "mongoose";

const friendRequestSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { 
      type: String, 
      enum: ["pending", "accepted", "rejected"], 
      default: "pending" 
    },
  },
  { timestamps: true }
);

// Method to accept the request
friendRequestSchema.methods.acceptRequest = async function() {
  this.status = "accepted";
  await this.save();
};

// Method to reject the request
friendRequestSchema.methods.rejectRequest = async function() {
  this.status = "rejected";
  await this.save();
};

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);

export default FriendRequest;
