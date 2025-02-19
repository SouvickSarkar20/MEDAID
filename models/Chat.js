import mongoose from "mongoose";
const ChatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // Reference to User model
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
  },
  { timestamps: true, collection: "chats" }
);

export default mongoose.models.Chat || mongoose.model("Chat", ChatSchema);