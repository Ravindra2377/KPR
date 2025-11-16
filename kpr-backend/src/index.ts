import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth";
import ideaRoutes from "./routes/ideas";
import roomRoutes from "./routes/rooms";
import userRoutes from "./routes/user";
import oracleRoutes from "./routes/oracle";
import RoomMessage from "./models/RoomMessage";
import podRoutes from "./routes/pods";
import notificationRoutes from "./routes/notifications";
import { initNotificationEmitter, registerUserSocket, unregisterUserSocket } from "./utils/notifications-emitter";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
initNotificationEmitter(io);

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/ideas", ideaRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/users", userRoutes);
app.use("/api/pods", podRoutes);
app.use("/api/oracle", oracleRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (_req, res) => res.send("KPR Backend Running"));

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("identify", ({ userId }: { userId?: string }) => {
    if (userId) {
      socket.data.userId = userId;
      registerUserSocket(userId, socket.id);
      console.log(`Registered socket ${socket.id} for user ${userId}`);
    }
  });

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

  socket.on("joinPod", ({ podId, userId }) => {
    if (!podId) return;
    socket.join(`pod_${podId}`);
    socket.to(`pod_${podId}`).emit("podUserJoined", { podId, userId });
  });

  socket.on("podTaskUpdated", (payload) => {
    if (!payload?.podId) return;
    io.to(`pod_${payload.podId}`).emit("podTaskUpdated", payload);
  });

  socket.on("disconnect", () => {
    const uid = (socket as any).data?.userId;
    if (uid) unregisterUserSocket(uid, socket.id);
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

connectDB(process.env.MONGO_URI || "")
  .then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error(err));
