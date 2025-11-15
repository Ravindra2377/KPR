import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth";
import ideaRoutes from "./routes/ideas";
import roomRoutes from "./routes/rooms";
import RoomMessage from "./models/RoomMessage";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/ideas", ideaRoutes);
app.use("/api/rooms", roomRoutes);

app.get("/", (_req, res) => res.send("KPR Backend Running"));

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("joinRoom", ({ roomId, userId }) => {
    socket.join(roomId);
    console.log(`${userId} joined room ${roomId}`);
  });

  socket.on("roomMessage", async (payload) => {
    try {
      const { roomId, content, userId, authorName } = payload || {};
      const safeContent = typeof content === "string" ? content.trim() : "";
      if (!roomId || !safeContent || !userId || !authorName) return;

      const message = await RoomMessage.create({
        room: roomId,
        content: safeContent.slice(0, 1000),
        author: userId,
        authorName
      });

      io.to(roomId).emit("roomMessage", {
        _id: message._id,
        roomId,
        content: message.content,
        author: userId,
        authorName,
        createdAt: message.createdAt
      });
    } catch (err) {
      console.error("roomMessage socket error", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

connectDB(process.env.MONGO_URI || "")
  .then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error(err));
