import { Server } from "socket.io";

let ioInstance: Server | null = null;
const userSockets: Record<string, string[]> = {};

export function initNotificationEmitter(io: Server) {
  ioInstance = io;
}

export function registerUserSocket(userId: string, socketId: string) {
  if (!userId || !socketId) return;
  userSockets[userId] = userSockets[userId] || [];
  if (!userSockets[userId].includes(socketId)) {
    userSockets[userId].push(socketId);
  }
}

export function unregisterUserSocket(userId: string, socketId: string) {
  if (!userSockets[userId]) return;
  userSockets[userId] = userSockets[userId].filter((s) => s !== socketId);
  if (userSockets[userId].length === 0) delete userSockets[userId];
}

export function getUserConnectionCount(userId: string) {
  return userSockets[userId]?.length || 0;
}

export function isUserOnline(userId: string) {
  return getUserConnectionCount(userId) > 0;
}

export function emitNotificationToUser(userId: string, notification: any) {
  if (!ioInstance || !userId) return;
  const sockets = userSockets[userId] || [];
  sockets.forEach((sid) => {
    ioInstance?.to(sid).emit("notification", notification);
  });
}

export function emitEventToUser(userId: string, eventName: string, payload: any) {
  if (!ioInstance || !userId || !eventName) return;
  const sockets = userSockets[userId] || [];
  sockets.forEach((sid) => {
    ioInstance?.to(sid).emit(eventName, payload);
  });
}

export function emitDmListUpdated(roomId: string, payload: any = {}) {
  if (!ioInstance || !roomId) return;
  ioInstance.emit("dmListUpdated", { roomId, ...payload });
}

export function broadcastPresence(userId: string, online: boolean) {
  if (!ioInstance || !userId) return;
  ioInstance.emit("presence", { userId, online });
}
