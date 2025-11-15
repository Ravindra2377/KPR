import express, { Request, Response } from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import ideaRoutes from "./routes/ideas";
import roomRoutes from "./routes/rooms";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/ideas", ideaRoutes);
app.use("/api/rooms", roomRoutes);

app.get("/", (_req: Request, res: Response) => res.send("KPR Backend Running"));

// socket skeleton
io.on("connection", (socket: Socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("joinRoom", ({ roomId, userId }: { roomId: string; userId: string }) => {
    socket.join(roomId);
    console.log(`${userId} joined ${roomId}`);
  });

  socket.on("leaveRoom", ({ roomId, userId }: { roomId: string; userId: string }) => {
    socket.leave(roomId);
    console.log(`${userId} left ${roomId}`);
  });

  socket.on("roomMessage", (payload: { roomId: string; message: string; userId: string }) => {
    const { roomId } = payload;
    io.to(roomId).emit("roomMessage", payload);
  });

  socket.on("disconnect", () => console.log("Socket disconnected", socket.id));
});

// DB connect + start
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI || "", {})
  .then(() => {
    server.listen(PORT, () => console.log(`Server running on ${PORT}`));
  })
  .catch((err) => console.error("Mongo connect error:", err));
