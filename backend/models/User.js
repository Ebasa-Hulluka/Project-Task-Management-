const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImageUrl: { type: String, default: null },
    themePreference: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system",
    },
    role: {
      type: String,
      enum: ["superAdmin", "admin", "projectManager", "teamMember"],
      default: "teamMember",
    },
    status: {
      type: String,
      enum: ["active", "deactivated"],
      default: "active",
    },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" }, // NEW: Link to team
    isActive: { type: Boolean, default: true },
    lastSeenAt: { type: Date, default: Date.now },
    deactivatedAt: { type: Date, default: null },
    deactivatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reactivatedAt: { type: Date, default: null },
    reactivatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", UserSchema);
