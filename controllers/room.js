
import { User, Conversation, Message } from "../models/Schema.js";
import mongoose from "mongoose";
export const createRoom = async (room, userId, message, timestamp) => {
  
  try {
    const existingRoom = await Conversation.findOne({ roomId: room});
    if (existingRoom) throw new Error("Room already exists.");
    
    const existingUser = await User.findById(userId);
    if (!existingUser) throw new Error("User doesn't exist.");
    
    const messageResult = await Message.create({
      content: message,
      timestamp: timestamp,
    });
    
    const newParticipants = [userId];
    const newMessages = [messageResult._id];
    
    const conversationResult = await Conversation.create({
      roomId: room,
      participants: newParticipants,
      messages: newMessages,
    });
    
    return conversationResult;
  } catch (err) {
    throw new Error("Error while creating room.");
  }
};

export const joinRoom = async (room, userId, message, timestamp) => {
 
  try {
    const existingRoom = await Conversation.findOne({
      roomId: room,
      

    });
    if (!existingRoom) throw new Error("Room already exist. ");
    if (existingRoom.participants.some((id) => id.equals(userId)))
      throw new Error("Participant already present. " );
    const existingUser = await User.findById({ _id: userId });
    if (!existingUser) throw new Error("User doesn't exist. ");
    const messageResult = await Message.create({
      content: message,
      timestamp: timestamp,
    });
    const newParticipants = [...existingRoom.participants, userId];
    const newMessages = [...existingRoom.messages, messageResult._id];
    const conversationResult = await Conversation.updateOne(
      { roomId: room },
      {
        $set: {
          participants: newParticipants,
          messages: newMessages,
        },
      },
      { new: true }
    );
    return conversationResult;
  } catch (err) {
    throw new Error("Error while joining room . ");
  }
};

export const updateMessage = async (room, userId, message, timestamp) => {
  try {
    const existingRoom = await Conversation.findOne({
      roomId: room,
    });
    if (!existingRoom) throw new Error({ errMsg: "Room already exist. " });
    const existingUser = await User.findById({ _id: userId });
    if (!existingUser) throw new Error({ errMsg: "User doesn't exist. " });
    const newReceipients = existingRoom.participants.filter(
      (id) => !id.equals(userId)
    );
    const messageResult = await Message.create({
      senderId: userId,
      recipientId: newReceipients,
      content: message,
      timestamp: timestamp,
    });
    const newMessages = [...existingRoom.messages, messageResult._id];
    const conversationResult = await Conversation.updateOne(
      { roomId: room },
      {
        $set: {
          messages: newMessages,
        },
      },
      { new: true }
    );
    return conversationResult;
  } catch (err) {
    throw new Error("Error while updating message. ");
  }
};

export const getRoomList = async (req, res) => {
  const { userId } = req.params;
  const newUserId = new mongoose.Types.ObjectId(userId)
  try {
    const conversationResult = await Conversation.find({ participants:newUserId });
    res.status(200).json({ result: conversationResult });
  } catch (err) {
    res.status(500).json({ message: "Error while fetching room list." });
  }
};

export const getRoomDetails = async (req,res) => {
  const{room,userId} = req.params
  const newUserId = new mongoose.Types.ObjectId(userId)
  try {
    const conversationResult = await Conversation.findOne({
      roomId: room,
      participants: newUserId,
    })
      .populate("participants")
      .populate("messages");
      res.status(200).json({ result: conversationResult });
  } catch (err) {
    res.status(500).json({ message: "Error while getting room details. " });
  }
};
