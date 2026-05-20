const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: { type: String, required: true },
    profileImageUrl: { type: String, default: null },
    themePreference: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "light",
    },
    role: {
      type: String,
      enum: ["superAdmin", "admin", "projectManager", "teamMember", "tester"],
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

UserSchema.pre("validate", function normalizeEmail(next) {
  if (this.email) {
    this.email = String(this.email).trim().toLowerCase();
  }
  next();
});

module.exports = mongoose.model("User", UserSchema);
