const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { logActivity } = require("../utils/activityLogger");
// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const isValidEmailFormat = (email = "") =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim().toLowerCase());

// @desc    Upload profile image separate
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
    const normalizedEmail = (email || "").trim().toLowerCase();

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

    await logActivity(user._id, "Logged in", "User logged into account");

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      isActive: user.isActive,
      team: user.team,
      profileImageUrl: user.profileImageUrl,
      themePreference: user.themePreference || "system",
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Login error:", error);
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
    res.json(user);
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
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const existingName = (user.name || "").trim();
    const existingEmail = (user.email || "").trim().toLowerCase();

    const isNameChanged = Boolean(normalizedName) && normalizedName !== existingName;
    const isEmailChanged = Boolean(normalizedEmail) && normalizedEmail !== existingEmail;
    const requestedNewPassword = typeof newPassword === "string" ? newPassword : password;
    const isPasswordChanged = Boolean(requestedNewPassword);

    if (isEmailChanged) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: "Email already in use" });
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

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
      isActive: updatedUser.isActive,
      profileImageUrl: updatedUser.profileImageUrl,
      themePreference: updatedUser.themePreference || "system",
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    console.error("Update profile error:", error);
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

module.exports = {
  loginUser,
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  changeUserPassword,
};
