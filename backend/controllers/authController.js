const User = require("../models/User");
const PasswordResetRequest = require("../models/PasswordResetRequest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { logActivity } = require("../utils/activityLogger");
const { createNotificationForUsers } = require("../utils/notificationService");
const { sendPasswordResetRequestEmail } = require("../services/emailService");
const {
  getUserRoles,
  sortRolesForSelection,
  serializeAuthUser,
} = require("../utils/userRoles");

const generateToken = (userId, activeRole) => {
  const payload = { id: userId };
  if (activeRole) payload.activeRole = activeRole;
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const generateRoleSelectionToken = (userId) =>
  jwt.sign(
    { id: userId, purpose: "role-selection" },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );

const isValidEmailFormat = (email = "") =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim().toLowerCase());

const escapeRegExp = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findUserByEmail = (email) =>
  User.findOne({
    email: new RegExp(`^${escapeRegExp(String(email || "").trim())}$`, "i"),
  });

// @desc    Upload profile image separately
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Generate the URL - use the port from your server
    const port = process.env.PORT || 5000;
    const imageUrl = `http://localhost:${port}/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      imageUrl: imageUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    let normalizedEmail = (email || "").trim().toLowerCase();
    if (normalizedEmail.endsWith("@gmial.com")) {
      normalizedEmail = normalizedEmail.replace("@gmial.com", "@gmail.com");
    }

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!isValidEmailFormat(normalizedEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address. Login requires email, not name.",
      });
    }

    const user = await User.findOne({ email: normalizedEmail }).populate("team", "name");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    const roles = sortRolesForSelection(getUserRoles(user));

    if (roles.length > 1) {
      return res.json({
        requiresRoleSelection: true,
        roles,
        selectionToken: generateRoleSelectionToken(user._id),
        user: serializeAuthUser(user, roles[0]),
      });
    }

    const activeRole = roles[0];
    await logActivity(
      user._id,
      "Logged in",
      `User logged into account as ${activeRole}`,
    );

    res.json({
      ...serializeAuthUser(user, activeRole),
      token: generateToken(user._id, activeRole),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Complete login by choosing active role (multi-role accounts)
const selectLoginRole = async (req, res) => {
  try {
    const { role, selectionToken } = req.body;

    if (!role || !selectionToken) {
      return res.status(400).json({
        message: "Role and selection token are required",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(selectionToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        message: "Role selection expired. Please log in again.",
      });
    }

    if (decoded.purpose !== "role-selection" || !decoded.id) {
      return res.status(401).json({ message: "Invalid role selection token" });
    }

    const user = await User.findById(decoded.id).populate("team", "name");
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Account is not available" });
    }

    const roles = getUserRoles(user);
    if (!roles.includes(role)) {
      return res.status(403).json({ message: "That role is not assigned to this account" });
    }

    await logActivity(
      user._id,
      "Logged in",
      `User logged into account as ${role}`,
    );

    res.json({
      ...serializeAuthUser(user, role),
      token: generateToken(user._id, role),
    });
  } catch (error) {
    console.error("Select login role error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("team", "name");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      ...user.toObject(),
      roles: getUserRoles(user),
      role: req.user.role,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const {
      name,
      email,
      currentPassword,
      newPassword,
      password,
      profileImageUrl,
      themePreference,
    } = req.body;

    const normalizedName = typeof name === "string" ? name.trim() : "";
    let normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (normalizedEmail.endsWith("@gmial.com")) {
      normalizedEmail = normalizedEmail.replace("@gmial.com", "@gmail.com");
    }
    const existingName = (user.name || "").trim();
    const existingEmail = (user.email || "").trim().toLowerCase();

    const isNameChanged = Boolean(normalizedName) && normalizedName !== existingName;
    const isEmailChanged = Boolean(normalizedEmail) && normalizedEmail !== existingEmail;
    const requestedNewPassword = typeof newPassword === "string" ? newPassword : password;
    const isPasswordChanged = Boolean(requestedNewPassword);

    if (isEmailChanged) {
      const existingUser = await findUserByEmail(normalizedEmail);
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: "There is already an account by this email." });
      }
    }

    if ((isNameChanged || isEmailChanged || isPasswordChanged) && !currentPassword) {
      return res.status(400).json({
        message:
          "Current password is required to confirm profile changes.",
      });
    }

    if (isNameChanged || isEmailChanged || isPasswordChanged) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
    }

    user.name = normalizedName || user.name;
    user.email = normalizedEmail || user.email;
    user.profileImageUrl =
      profileImageUrl !== undefined ? profileImageUrl : user.profileImageUrl;

    if (themePreference && !["light", "dark", "system"].includes(themePreference)) {
      return res.status(400).json({ message: "Invalid theme preference" });
    }

    if (themePreference) {
      user.themePreference = themePreference;
    }

    if (isPasswordChanged) {
      if (requestedNewPassword.length < 6) {
        return res
          .status(400)
          .json({ message: "New password must be at least 6 characters" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(requestedNewPassword, salt);
    }

    const updatedUser = await user.save();
    await logActivity(
      updatedUser._id,
      "Updated profile",
      "Updated personal profile information",
    );

    const activeRole = req.user?.role || getUserRoles(updatedUser)[0];

    res.json({
      ...serializeAuthUser(updatedUser, activeRole),
      token: generateToken(updatedUser._id, activeRole),
    });
  } catch (error) {
    console.error("Update profile error:", error);
    if (
      error?.code === 11000 &&
      (error?.keyPattern?.email || String(error?.message || "").includes("email"))
    ) {
      return res.status(400).json({ message: "There is already an account by this email." });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// @desc    Change user password
const changeUserPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    await logActivity(user._id, "Changed password", "Updated account password");

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    let normalizedEmail = String(req.body?.email || "").trim().toLowerCase();
    if (normalizedEmail.endsWith("@gmial.com")) {
      normalizedEmail = normalizedEmail.replace("@gmial.com", "@gmail.com");
    }

    if (!isValidEmailFormat(normalizedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
      const existingPending = await PasswordResetRequest.findOne({
        user: user._id,
        status: "pending",
      });

      if (!existingPending) {
        await PasswordResetRequest.create({
          user: user._id,
          email: user.email,
          status: "pending",
        });
      }

      const superAdmins = await User.find({
        $or: [{ role: "superAdmin" }, { roles: "superAdmin" }],
        isActive: true,
      }).select("_id");

      await createNotificationForUsers(
        superAdmins.map((admin) => admin._id.toString()),
        {
          type: "password_reset_requested",
          message: `Password reset requested by ${user.name} (${user.email}) at ${new Date().toLocaleString()}`,
          link: "/admin/users",
        },
      );

      try {
        await sendPasswordResetRequestEmail({
          to: user.email,
          name: user.name,
        });
      } catch (error) {
        console.error("[AuthController] Failed to email reset request confirmation:", error.message);
      }
    }

    res.status(200).json({
      message:
        "If this email belongs to an account, the super admin will receive your password reset request.",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  loginUser,
  selectLoginRole,
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  changeUserPassword,
  requestPasswordReset,
};
