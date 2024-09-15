import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import userRoutes from "./Routes/user.js";

dotenv.config({ path: "./.env" });

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose
  .connect(process.env.DATABASE)
  .then(() => {
    console.log("Database Connected Successfully");
  })
  .catch((err) => console.log("DB CONNECTION ERROR =>", err));


app.use("/api/users", userRoutes);

const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:5173", // Update with your frontend URL
  },
});

// User Queue for matchmaking
let matchmakingQueue = [];

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Event when a user is looking for a match
  socket.on("findMatch", () => {
    if (matchmakingQueue.length > 0) {
      // Match the current user with the first user in the queue
      const matchedUser = matchmakingQueue.shift();
      const roomId = `${socket.id}-${matchedUser}`;

      // Join both users in a private room
      socket.join(roomId);
      io.to(matchedUser).emit("matchFound", { roomId, partner: socket.id });
      socket.emit("matchFound", { roomId, partner: matchedUser });
    } else {
      // No users available, add the current user to the queue
      matchmakingQueue.push(socket.id);
      socket.emit("waitingForMatch");
    }
  });

  // Handle messaging
  socket.on("sendMessage", (data) => {
    const { content, roomId } = data;
    io.to(roomId).emit("messageReceived", { content, from: socket.id });
  });

  // Handle video call signaling (WebRTC)
  socket.on("callUser", ({ offer, roomId }) => {
    io.to(roomId).emit("receiveCall", { offer, from: socket.id });
  });

  socket.on("answerCall", ({ answer, roomId }) => {
    io.to(roomId).emit("callAnswered", { answer });
  });

  socket.on("sendIceCandidate", ({ candidate, roomId }) => {
    io.to(roomId).emit("receiveIceCandidate", candidate);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);

    // Remove user from matchmaking queue if they were waiting
    matchmakingQueue = matchmakingQueue.filter((userId) => userId !== socket.id);
  });
});

// Start Server
server.listen(port, () => {
  console.log(`Server is running at port: ${port}`);
});