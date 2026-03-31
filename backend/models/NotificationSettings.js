const mongoose = require("mongoose");

const NotificationSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    taskAssignments: { type: Boolean, default: true },
    taskUpdates: { type: Boolean, default: true },
    projectDeadlines: { type: Boolean, default: true },
    teamUpdates: { type: Boolean, default: true },
    systemAnnouncements: { type: Boolean, default: true },
    visibleFrom: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("NotificationSettings", NotificationSettingsSchema);
