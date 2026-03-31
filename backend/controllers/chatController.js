const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const {
  isUserOnline,
  emitToConversation,
  emitToUser,
} = require("../socket/chatSocket");

const toObjectId = (value) => new mongoose.Types.ObjectId(String(value));

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeUser = (user) => ({
  _id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  profileImageUrl: user.profileImageUrl || null,
  isOnline: isUserOnline(user._id),
  lastSeenAt: user.lastSeenAt || null,
});

const getMessageStatusForSender = (message, senderId) => {
  const senderIdStr = String(senderId);
  const deliveredToOthers = (message.deliveredTo || []).filter(
    (entry) => String(entry.user) !== senderIdStr,
  );
  const seenByOthers = (message.seenBy || []).filter(
    (entry) => String(entry.user) !== senderIdStr,
  );

  if (seenByOthers.length > 0) {
    return {
      status: "seen",
      seenAt: seenByOthers[0].at || null,
    };
  }
  if (deliveredToOthers.length > 0) {
    return {
      status: "delivered",
      seenAt: null,
    };
  }

  return {
    status: "sent",
    seenAt: null,
  };
};

const normalizeMessage = (messageDoc, currentUserId) => {
  const message = messageDoc.toObject ? messageDoc.toObject() : messageDoc;
  const isSender = String(message.sender?._id || message.sender) === String(currentUserId);
  const sender = message.sender?._id
    ? normalizeUser(message.sender)
    : { _id: String(message.sender) };

  const senderReceipt = getMessageStatusForSender(message, currentUserId);

  return {
    _id: String(message._id),
    conversationId: String(message.conversation),
    sender,
    text: message.deletedForEveryone ? "This message was deleted" : message.text || "",
    attachment: message.deletedForEveryone ? null : message.attachment || null,
    edited: Boolean(message.edited && !message.deletedForEveryone),
    editedAt: message.editedAt || null,
    deletedForEveryone: Boolean(message.deletedForEveryone),
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    senderReceipt: isSender ? senderReceipt : null,
  };
};

const ensureConversationAccess = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId).populate(
    "participants",
    "name email role profileImageUrl lastSeenAt",
  );

  if (!conversation) return null;

  const hasAccess = conversation.participants.some(
    (participant) => String(participant._id) === String(userId),
  );

  if (!hasAccess) return null;
  return conversation;
};

const getOrCreateDirectConversation = async (userA, userB) => {
  const userAId = toObjectId(userA);
  const userBId = toObjectId(userB);

  let conversation = await Conversation.findOne({
    type: "direct",
    participants: { $all: [userAId, userBId], $size: 2 },
  })
    .populate("participants", "name email role profileImageUrl lastSeenAt")
    .populate({
      path: "lastMessage",
      populate: {
        path: "sender",
        select: "name email role profileImageUrl lastSeenAt",
      },
    });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userAId, userBId],
      type: "direct",
      lastMessageAt: null,
    });
    conversation = await Conversation.findById(conversation._id).populate(
      "participants",
      "name email role profileImageUrl lastSeenAt",
    );
  }

  return conversation;
};

const getConversationSummary = async (conversation, currentUserId) => {
  const currentUserIdStr = String(currentUserId);
  const otherParticipant = conversation.participants.find(
    (participant) => String(participant._id) !== currentUserIdStr,
  );

  const unreadCount = await Message.countDocuments({
    conversation: conversation._id,
    sender: { $ne: toObjectId(currentUserId) },
    deletedForEveryone: false,
    deletedFor: { $ne: toObjectId(currentUserId) },
    seenBy: {
      $not: {
        $elemMatch: { user: toObjectId(currentUserId) },
      },
    },
  });

  const lastMessage =
    conversation.lastMessage && String(conversation.lastMessage._id)
      ? normalizeMessage(conversation.lastMessage, currentUserId)
      : null;

  return {
    _id: String(conversation._id),
    participant: otherParticipant ? normalizeUser(otherParticipant) : null,
    unreadCount,
    lastMessage,
    lastMessageAt:
      conversation.lastMessageAt ||
      conversation.lastMessage?.createdAt ||
      conversation.updatedAt,
  };
};

const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: toObjectId(userId),
    })
      .populate("participants", "name email role profileImageUrl lastSeenAt")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "name email role profileImageUrl lastSeenAt",
        },
      })
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    const list = await Promise.all(
      conversations.map((conversation) =>
        getConversationSummary(conversation, userId),
      ),
    );

    return res.status(200).json({ conversations: list });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch conversations", error: error.message });
  }
};

const searchUsersByEmail = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const emailQuery = String(req.query.email || "").trim();

    if (!emailQuery || emailQuery.length < 2) {
      return res.status(200).json({ users: [] });
    }

    const users = await User.find({
      _id: { $ne: toObjectId(currentUserId) },
      email: { $regex: escapeRegex(emailQuery), $options: "i" },
      status: "active",
      isActive: true,
    })
      .select("name email role profileImageUrl lastSeenAt")
      .sort({ email: 1 })
      .limit(20);

    return res.status(200).json({
      users: users.map(normalizeUser),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to search users", error: error.message });
  }
};

const getUserProfileForChat = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({
      _id: toObjectId(userId),
      status: "active",
      isActive: true,
    }).select("name email role profileImageUrl lastSeenAt createdAt");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      user: {
        ...normalizeUser(user),
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load user profile", error: error.message });
  }
};

const startConversation = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { recipientId, email } = req.body || {};

    let recipient = null;
    if (recipientId) {
      recipient = await User.findOne({
        _id: toObjectId(recipientId),
        status: "active",
        isActive: true,
      }).select("name email role profileImageUrl lastSeenAt");
    } else if (email) {
      recipient = await User.findOne({
        email: String(email).trim().toLowerCase(),
        status: "active",
        isActive: true,
      }).select("name email role profileImageUrl lastSeenAt");
    }

    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    if (String(recipient._id) === String(currentUserId)) {
      return res.status(400).json({ message: "You cannot chat with yourself" });
    }

    const conversation = await getOrCreateDirectConversation(
      currentUserId,
      recipient._id,
    );
    const summary = await getConversationSummary(conversation, currentUserId);

    return res.status(200).json({ conversation: summary });
  } catch (error) {
    return res.status(500).json({ message: "Failed to start conversation", error: error.message });
  }
};

const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user._id;
    const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 100);
    const before = req.query.before ? new Date(req.query.before) : null;

    const conversation = await ensureConversationAccess(conversationId, currentUserId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const filter = {
      conversation: toObjectId(conversationId),
      deletedFor: { $ne: toObjectId(currentUserId) },
    };

    if (before && !Number.isNaN(before.getTime())) {
      filter.createdAt = { $lt: before };
    }

    const messages = await Message.find(filter)
      .populate("sender", "name email role profileImageUrl lastSeenAt")
      .sort({ createdAt: -1 })
      .limit(limit);

    const orderedMessages = [...messages].reverse();

    const now = new Date();
    const unseenDeliveredMessages = orderedMessages.filter((message) => {
      if (String(message.sender?._id || message.sender) === String(currentUserId)) {
        return false;
      }
      return !(message.deliveredTo || []).some(
        (entry) => String(entry.user) === String(currentUserId),
      );
    });

    if (unseenDeliveredMessages.length > 0) {
      await Message.updateMany(
        {
          _id: { $in: unseenDeliveredMessages.map((msg) => msg._id) },
        },
        {
          $push: { deliveredTo: { user: toObjectId(currentUserId), at: now } },
        },
      );

      const senderIds = [
        ...new Set(
          unseenDeliveredMessages.map((msg) => String(msg.sender?._id || msg.sender)),
        ),
      ];
      senderIds.forEach((senderId) => {
        emitToUser(senderId, "chat:message:delivered", {
          conversationId: String(conversationId),
          messageIds: unseenDeliveredMessages.map((msg) => String(msg._id)),
          deliveredBy: String(currentUserId),
          deliveredAt: now,
        });
      });
    }

    return res.status(200).json({
      messages: orderedMessages.map((message) =>
        normalizeMessage(message, currentUserId),
      ),
      hasMore: messages.length >= limit,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch messages", error: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { conversationId, recipientId } = req.body || {};
    const text = String(req.body?.text || "").trim();

    if (!text && !req.file) {
      return res.status(400).json({ message: "Message text or attachment is required" });
    }

    let conversation = null;
    if (conversationId) {
      conversation = await ensureConversationAccess(conversationId, currentUserId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
    } else {
      if (!recipientId) {
        return res.status(400).json({ message: "recipientId is required for a new chat" });
      }

      const recipient = await User.findOne({
        _id: toObjectId(recipientId),
        status: "active",
        isActive: true,
      }).select("_id");
      if (!recipient) {
        return res.status(404).json({ message: "Recipient not found" });
      }
      if (String(recipient._id) === String(currentUserId)) {
        return res.status(400).json({ message: "You cannot message yourself" });
      }

      conversation = await getOrCreateDirectConversation(currentUserId, recipient._id);
    }

    const participants = conversation.participants.map((participant) =>
      String(participant._id || participant),
    );

    let attachment = null;
    if (req.file) {
      const host = `${req.protocol}://${req.get("host")}`;
      attachment = {
        url: `${host}/uploads/chat/${req.file.filename}`,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      };
    }

    const now = new Date();
    const deliveredTo = [{ user: toObjectId(currentUserId), at: now }];

    participants
      .filter((participantId) => participantId !== String(currentUserId))
      .forEach((participantId) => {
        if (isUserOnline(participantId)) {
          deliveredTo.push({ user: toObjectId(participantId), at: now });
        }
      });

    const message = await Message.create({
      conversation: conversation._id,
      sender: currentUserId,
      text,
      attachment,
      deliveredTo,
      seenBy: [{ user: toObjectId(currentUserId), at: now }],
    });

    await Conversation.findByIdAndUpdate(conversation._id, {
      $set: {
        lastMessage: message._id,
        lastMessageAt: message.createdAt,
      },
    });

    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "name email role profileImageUrl lastSeenAt",
    );
    const normalized = normalizeMessage(populatedMessage, currentUserId);

    emitToConversation(conversation._id, "chat:message:new", {
      conversationId: String(conversation._id),
      message: normalized,
    });

    participants.forEach((participantId) => {
      emitToUser(participantId, "chat:conversation:updated", {
        conversationId: String(conversation._id),
      });
    });

    const deliveredRecipientIds = deliveredTo
      .map((entry) => String(entry.user))
      .filter((id) => id !== String(currentUserId));

    if (deliveredRecipientIds.length > 0) {
      emitToUser(currentUserId, "chat:message:delivered", {
        conversationId: String(conversation._id),
        messageIds: [String(message._id)],
        deliveredTo: deliveredRecipientIds,
        deliveredAt: now,
      });
    }

    return res.status(201).json({
      conversationId: String(conversation._id),
      message: normalized,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to send message", error: error.message });
  }
};

const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user._id;
    const text = String(req.body?.text || "").trim();

    if (!text) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (String(message.sender) !== String(currentUserId)) {
      return res.status(403).json({ message: "You can only edit your own messages" });
    }

    if (message.deletedForEveryone) {
      return res.status(400).json({ message: "Deleted messages cannot be edited" });
    }

    const conversation = await ensureConversationAccess(
      message.conversation,
      currentUserId,
    );
    if (!conversation) {
      return res.status(403).json({ message: "Conversation access denied" });
    }

    message.text = text;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "name email role profileImageUrl lastSeenAt",
    );
    const normalized = normalizeMessage(populatedMessage, currentUserId);

    emitToConversation(message.conversation, "chat:message:updated", {
      conversationId: String(message.conversation),
      message: normalized,
    });

    return res.status(200).json({ message: normalized });
  } catch (error) {
    return res.status(500).json({ message: "Failed to edit message", error: error.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user._id;
    const scope = String(req.body?.scope || req.query.scope || "me");

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const conversation = await ensureConversationAccess(
      message.conversation,
      currentUserId,
    );
    if (!conversation) {
      return res.status(403).json({ message: "Conversation access denied" });
    }

    if (scope === "everyone") {
      if (String(message.sender) !== String(currentUserId)) {
        return res.status(403).json({ message: "Only sender can delete for everyone" });
      }

      message.deletedForEveryone = true;
      message.deletedAt = new Date();
      message.text = "";
      message.attachment = null;
      message.edited = false;
      message.editedAt = null;
      await message.save();

      const populatedMessage = await Message.findById(message._id).populate(
        "sender",
        "name email role profileImageUrl lastSeenAt",
      );
      const normalized = normalizeMessage(populatedMessage, currentUserId);

      emitToConversation(message.conversation, "chat:message:updated", {
        conversationId: String(message.conversation),
        message: normalized,
      });

      const participantIds = conversation.participants.map((participant) =>
        String(participant._id || participant),
      );
      participantIds.forEach((participantId) => {
        emitToUser(participantId, "chat:conversation:updated", {
          conversationId: String(message.conversation),
        });
      });

      return res.status(200).json({ success: true, scope: "everyone", message: normalized });
    }

    if (!message.deletedFor.some((id) => String(id) === String(currentUserId))) {
      message.deletedFor.push(toObjectId(currentUserId));
      await message.save();
    }

    return res.status(200).json({ success: true, scope: "me", messageId: String(messageId) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete message", error: error.message });
  }
};

const markConversationSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user._id;

    const conversation = await ensureConversationAccess(conversationId, currentUserId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const unseenMessages = await Message.find({
      conversation: toObjectId(conversationId),
      sender: { $ne: toObjectId(currentUserId) },
      deletedForEveryone: false,
      deletedFor: { $ne: toObjectId(currentUserId) },
      seenBy: {
        $not: {
          $elemMatch: { user: toObjectId(currentUserId) },
        },
      },
    }).select("_id sender");

    if (unseenMessages.length === 0) {
      return res.status(200).json({ seenCount: 0 });
    }

    const now = new Date();
    const messageIds = unseenMessages.map((msg) => msg._id);

    await Message.updateMany(
      { _id: { $in: messageIds } },
      {
        $push: {
          seenBy: { user: toObjectId(currentUserId), at: now },
          deliveredTo: { user: toObjectId(currentUserId), at: now },
        },
      },
    );

    const senderIds = [...new Set(unseenMessages.map((msg) => String(msg.sender)))];
    senderIds.forEach((senderId) => {
      emitToUser(senderId, "chat:message:seen", {
        conversationId: String(conversationId),
        messageIds: messageIds.map((id) => String(id)),
        seenBy: String(currentUserId),
        seenAt: now,
      });
    });

    emitToConversation(conversationId, "chat:message:seen", {
      conversationId: String(conversationId),
      messageIds: messageIds.map((id) => String(id)),
      seenBy: String(currentUserId),
      seenAt: now,
    });

    return res.status(200).json({ seenCount: messageIds.length, seenAt: now });
  } catch (error) {
    return res.status(500).json({ message: "Failed to mark messages as seen", error: error.message });
  }
};

const searchConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user._id;
    const query = String(req.query.query || "").trim();

    if (!query || query.length < 2) {
      return res.status(200).json({ messages: [] });
    }

    const conversation = await ensureConversationAccess(conversationId, currentUserId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const regex = new RegExp(escapeRegex(query), "i");

    const messages = await Message.find({
      conversation: toObjectId(conversationId),
      deletedFor: { $ne: toObjectId(currentUserId) },
      deletedForEveryone: false,
      $or: [{ text: regex }, { "attachment.originalName": regex }],
    })
      .populate("sender", "name email role profileImageUrl lastSeenAt")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      messages: messages.map((message) => normalizeMessage(message, currentUserId)),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to search messages", error: error.message });
  }
};

module.exports = {
  getConversations,
  searchUsersByEmail,
  getUserProfileForChat,
  startConversation,
  getConversationMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markConversationSeen,
  searchConversationMessages,
};
