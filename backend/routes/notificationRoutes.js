const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const {
  getNotificationSettings,
  updateNotificationSettings,
  getNotifications,
  markAsRead,
  clearAllNotifications,
} = require("../controllers/notificationController");

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.delete("/clear", clearAllNotifications);
router.put("/:id/read", markAsRead);
router.get("/settings", getNotificationSettings);
router.put("/settings", updateNotificationSettings);

module.exports = router;
