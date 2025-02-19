import mongoose from "mongoose";
const MessageSchema = new mongoose.Schema(
  {
    msg: { type: String, required: true },
    user_msg: { type: Boolean, required: true },
    ai_msg: { type: Boolean, required: true },
    timestamp: { type: Date, default: Date.now },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    }, // Reference to the Chat model
  },
  { collection: "messages" }
);

export default mongoose.models.Message ||
  mongoose.model("Message", MessageSchema);