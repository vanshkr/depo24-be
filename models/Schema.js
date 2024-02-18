import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String },
});

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  recipientId: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  content: { type: String, required: true },
  timestamp: { type: Date, required: true },
});

const conversationSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  participants: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ],
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
});

const User = mongoose.model("User", userSchema);
const Message = mongoose.model("Message", messageSchema);
const Conversation = mongoose.model("Conversation", conversationSchema);

export { User, Message, Conversation};
