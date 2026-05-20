const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const { isOriginAllowed } = require("../utils/corsConfig");

let io = null;
const userSockets = new Map();

const getUserRoom = (userId) => `user:${String(userId)}`;
const getConversationRoom = (conversationId) =>
  `conversation:${String(conversationId)}`;

const addUserSocket = (userId, socketId) => {
  const key = String(userId);
  const current = userSockets.get(key) || new Set();
  current.add(socketId);
  userSockets.set(key, current);
};

const removeUserSocket = (userId, socketId) => {
  const key = String(userId);
  const current = userSockets.get(key);
  if (!current) return false;
  current.delete(socketId);
  if (current.size === 0) {
    userSockets.delete(key);
    return true;
  }
  userSockets.set(key, current);
  return false;
};

const isUserOnline = (userId) => {
  return userSockets.has(String(userId));
};

const emitToUser = (userId, event, payload) => {
  if (!io) return;
  io.to(getUserRoom(userId)).emit(event, payload);
};

const emitToConversation = (conversationId, event, payload) => {
  if (!io) return;
  io.to(getConversationRoom(conversationId)).emit(event, payload);
};

const emitUserStatus = (userId, isOnline, lastSeenAt = null) => {
  if (!io) return;
  io.emit("chat:user-status", {
    userId: String(userId),
    isOnline: Boolean(isOnline),
    lastSeenAt,
  });
};

const ensureConversationMembership = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId)
    .select("participants")
    .lean();
  if (!conversation) return false;
  return conversation.participants.some((id) => String(id) === String(userId));
};

const initSocket = (httpServer) => {
  if (io) return io;

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) return callback(null, true);
        return callback(new Error(`CORS policy: Origin ${origin} is not allowed.`));
      },
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake?.auth?.token;
      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id status isActive");
      if (!user || !user.isActive || user.status !== "active") {
        return next(new Error("Unauthorized"));
      }

      socket.user = user;
      return next();
    } catch (error) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = String(socket.user._id);

    socket.join(getUserRoom(userId));
    addUserSocket(userId, socket.id);
    emitUserStatus(userId, true);

    socket.on("chat:join", async ({ conversationId }) => {
      if (!conversationId) return;
      const allowed = await ensureConversationMembership(conversationId, userId);
      if (!allowed) return;
      socket.join(getConversationRoom(conversationId));
    });

    socket.on("chat:leave", ({ conversationId }) => {
      if (!conversationId) return;
      socket.leave(getConversationRoom(conversationId));
    });

    socket.on("chat:typing", async ({ conversationId }) => {
      if (!conversationId) return;
      const allowed = await ensureConversationMembership(conversationId, userId);
      if (!allowed) return;
      socket.to(getConversationRoom(conversationId)).emit("chat:typing", {
        conversationId: String(conversationId),
        userId,
      });
    });

    socket.on("chat:stop-typing", async ({ conversationId }) => {
      if (!conversationId) return;
      const allowed = await ensureConversationMembership(conversationId, userId);
      if (!allowed) return;
      socket.to(getConversationRoom(conversationId)).emit("chat:stop-typing", {
        conversationId: String(conversationId),
        userId,
      });
    });

    socket.on("disconnect", async () => {
      const becameOffline = removeUserSocket(userId, socket.id);
      if (!becameOffline) return;

      const lastSeenAt = new Date();
      try {
        await User.findByIdAndUpdate(userId, { $set: { lastSeenAt } });
      } catch (error) {
        console.error("Failed to update lastSeenAt:", error.message);
      }

      emitUserStatus(userId, false, lastSeenAt);
    });
  });

  return io;
};

const getIO = () => io;

module.exports = {
  initSocket,
  getIO,
  isUserOnline,
  emitToUser,
  emitToConversation,
  emitUserStatus,
};
