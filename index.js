import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import roomRoutes from "./routes/room.js";
import { Server } from "socket.io";
import { createRoom, joinRoom, updateMessage } from "./controllers/room.js";

const app = express();
dotenv.config();

app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
// app.use(cors());
app.use("/auth", authRoutes);
app.use("/", roomRoutes);
const PORT = process.env.PORT;
const CONNECTION_URL = process.env.CONNECTION_URL;
const io = new Server({
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true,
  },
});
app.get("/status", (_, res) => {
  res.send("Server is up and running!");
});

io.on("connection", (socket) => {
  socket.on("join_room", async (data) => {
    try{
      const { username, room, userId } = data;
      const allClientMsg = `${username} has joined the chat room`;
      let timestamp = Date.now();
      let senderId;
      await joinRoom(room, userId, allClientMsg, timestamp);  
      socket.join(room);  
      io.in(room).emit("receive_message", {
        content: allClientMsg,
        username,
        timestamp,
        senderId,
      });
    }catch(err){
      return err;
    }
  });
  socket.on("create_room", async (data) => {
    try {
      const { username, room, userId } = data;
      const allClientMsg = `${username} has joined the chat room`;
      let timestamp = Date.now();
      let senderId;
      const res = await createRoom(room, userId, allClientMsg, timestamp);
      socket.join(room);

      io.in(room).emit("receive_message", {
        content: allClientMsg,
        username,
        timestamp,
        senderId,
      });
    } catch (err) {
      return err;
    }
  });

  socket.on("send_message", async (data) => {
    try {
      const {content: message, username,senderId: userId, room } = data;
      const timestamp = Date.now();
      await updateMessage(room, userId, message, timestamp);
      io.in(room).emit("receive_message", {...data,timestamp});
    } catch (err) {
      return err
    }
  });

  socket.on("join",(data)=>{
    socket.join(data)
  })
  socket.on("leave",(data)=>{
    socket.leave(data)
  })
});

mongoose
  .connect(CONNECTION_URL)
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`Server is running on PORT: ${PORT}`);
    });
    io.attach(server, {});
  })
  .catch((err) => {
    console.error("Error connecting to database:", err.message);
    process.exit(1); // Exit with a non-zero code to indicate failure
  });
