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
app.use(cors());
app.use("/auth", authRoutes);
app.use("/", roomRoutes);
const PORT = process.env.PORT;
const CONNECTION_URL = process.env.CONNECTION_URL;
const io = new Server({
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});
app.get("/status", (_, res) => {
  res.send("Server is up and running!");
});

io.on("connection", (socket) => {
  socket.on("join_room", async (data) => {
    const { username, room, userId } = data;
    const allClientMsg = `${username} has joined the chat room`;
    const creatorMsg = `Welcome ${username}`;
    let createdTime = Date.now();
    const res = await joinRoom(room, userId, allClientMsg, createdTime);
    if (res.errMessage) {
      socket.emit("error_message", {
        message: res.errMessage,
      });
      return;
    }

    socket.join(room);

    socket.to(room).emit("receive_message", {
      message: allClientMsg,
      username,
      createdTime,
      userId,
      messageType: 1,
    });
  });
  socket.on("create_room", async (data) => {
    try {
      const { username, room, userId } = data;
      const allClientMsg = `${username} has joined the chat room`;
      const creatorMsg = `Welcome ${username}`;
      let createdTime = Date.now();
      await createRoom(room, userId, allClientMsg, createdTime);
      socket.join(room);

      socket.to(room).emit("receive_message", {
        message: allClientMsg,
        createdTime,
        userId,
        messageType: 1,
      });
    } catch (err) {
      console.log(err);
      socket.emit("error_message", {
        message: err,
      });
    }
  });

  socket.on("send_message", async (data) => {
    try {
      const { message, username, userId, room } = data;
      const createdTime = Date.now();
      await updateMessage(room, userId, message, createdTime);
      io.in(room).emit("receive_message", data);
    } catch (err) {
      console.log(err);
      socket.emit("error_message", {
        message: err,
      });
    }
  });
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
