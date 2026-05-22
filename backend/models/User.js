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
    roles: {
      type: [String],
      enum: ["superAdmin", "admin", "projectManager", "teamMember", "tester"],
      default: ["teamMember"],
    },
    /** Active session role (set at login when user has multiple roles) */
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

  const { pickPrimaryRole, VALID_USER_ROLES } = require("../utils/userRoles");
  const validRole = (value) => VALID_USER_ROLES.includes(value);
  let roles = Array.isArray(this.roles) ? this.roles.filter(validRole) : [];

  // Do not let schema default ["teamMember"] override an explicit role (e.g. superAdmin on create)
  if (
    this.role &&
    validRole(this.role) &&
    (!roles.length || (roles.length === 1 && roles[0] === "teamMember" && this.role !== "teamMember"))
  ) {
    roles = [this.role];
  }

  if (!roles.length) {
    roles = this.role && validRole(this.role) ? [this.role] : ["teamMember"];
  }

  this.roles = [...new Set(roles)];
  if (!this.role || !this.roles.includes(this.role)) {
    this.role = pickPrimaryRole(this.roles);
  }

  next();
});

module.exports = mongoose.model("User", UserSchema);
