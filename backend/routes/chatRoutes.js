const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const chatUpload = require("../middlewares/chatUploadMiddleware");
const {
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
} = require("../controllers/chatController");

const router = express.Router();

router.use(protect);

router.get("/conversations", getConversations);
router.post("/conversations/start", startConversation);
router.get("/conversations/:conversationId/messages", getConversationMessages);
router.post("/conversations/:conversationId/seen", markConversationSeen);
router.get("/conversations/:conversationId/search", searchConversationMessages);

router.get("/users/search", searchUsersByEmail);
router.get("/users/:userId/profile", getUserProfileForChat);

router.post("/messages", chatUpload.single("attachment"), sendMessage);
router.put("/messages/:messageId", editMessage);
router.delete("/messages/:messageId", deleteMessage);

module.exports = router;
