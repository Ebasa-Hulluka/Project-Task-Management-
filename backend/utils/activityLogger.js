const Activity = require("../models/Activity");

const logActivity = async (userId, action, details = "") => {
  try {
    if (!userId || !action) return;
    await Activity.create({
      user: userId,
      action,
      details,
      timestamp: new Date(),
    });
  } catch (error) {
    // Logging must never break the request flow.
    console.error("Activity logging failed:", error.message);
  }
};

module.exports = { logActivity };
