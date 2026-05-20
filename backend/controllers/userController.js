const Task = require("../models/Task");
const User = require("../models/User");
const Team = require("../models/Team");
const PasswordResetRequest = require("../models/PasswordResetRequest");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { notifyAdmins } = require("../utils/notificationService");
const { logActivity } = require("../utils/activityLogger");
const {
  sendNewUserCredentialsEmail,
  sendAccountStatusEmail,
  sendRoleChangedEmail,
  sendPasswordResetCompletedEmail,
} = require("../services/emailService");

const VALID_USER_ROLES = ["superAdmin", "admin", "projectManager", "teamMember", "tester"];
const VALID_USER_STATUSES = ["active", "deactivated"];
const DUPLICATE_EMAIL_MESSAGE = "There is already an account by this email.";

const isSuperAdminUser = (user) => user?.role === "superAdmin";

const canManageAdminAccounts = (actor) => isSuperAdminUser(actor);

const escapeRegExp = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findUserByEmail = (email) =>
  User.findOne({
    email: new RegExp(`^${escapeRegExp(String(email || "").trim())}$`, "i"),
  });

const trySendAccountEmail = async (sendEmail, context) => {
  try {
    await sendEmail();
  } catch (error) {
    console.error(`[UserController] Failed to send ${context}:`, error.message);
  }
};

const getUsers = async (req, res) => {
  try {
    const { role, status } = req.query;
    const query = {};

    if (role) {
      if (!VALID_USER_ROLES.includes(role)) {
        return res.status(400).json({ message: "Invalid role filter" });
      }
      query.role = role;
    }

    if (status && status !== "all") {
      if (!VALID_USER_STATUSES.includes(status)) {
        return res.status(400).json({ message: "Invalid status filter" });
      }

      if (status === "deactivated") {
        query.isActive = false;
      } else {
        query.isActive = { $ne: false };
        query.status = "active";
      }
    }

    const users = await User.find(query).select("-password").populate("team", "name");

    const usersWithTaskCounts = await Promise.all(
      users.map(async (user) => {
        const taskOwnerFilter =
          user.role === "tester" ? { tester: user._id } : { assignedTo: user._id };
        const [pendingTasks, inProgressTasks, completedTasks, totalTasks] =
          await Promise.all([
            Task.countDocuments({ ...taskOwnerFilter, status: "Pending" }),
            Task.countDocuments({ ...taskOwnerFilter, status: "In Progress" }),
            Task.countDocuments({ ...taskOwnerFilter, status: "Completed" }),
            Task.countDocuments(taskOwnerFilter),
          ]);

        return {
          ...user._doc,
          pendingTasks,
          inProgressTasks,
          completedTasks,
          totalTasks,
        };
      }),
    );

    const [totalUsers, roleCountsRaw, statusCountsRaw] = await Promise.all([
      User.countDocuments(),
      User.aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
          },
        },
      ]),
      User.aggregate([
        {
          $project: {
            normalizedStatus: {
              $cond: [{ $eq: ["$isActive", false] }, "deactivated", "active"],
            },
          },
        },
        {
          $group: {
            _id: "$normalizedStatus",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const roleCounts = roleCountsRaw.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const statusCounts = statusCountsRaw.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.json({
      users: usersWithTaskCounts,
      summary: {
        totalUsers,
        byRole: {
          superAdmin: roleCounts.superAdmin || 0,
          admin: roleCounts.admin || 0,
          projectManager: roleCounts.projectManager || 0,
          teamMember: roleCounts.teamMember || 0,
          tester: roleCounts.tester || 0,
        },
        byStatus: {
          active: statusCounts.active || 0,
          deactivated: statusCounts.deactivated || 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role = "teamMember", profileImageUrl = null } = req.body;

    const normalizedName = String(name || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPassword = String(password || "");
    const normalizedRole = String(role || "").trim();

    if (!normalizedName) {
      return res.status(400).json({ message: "Name is required" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({
        message: DUPLICATE_EMAIL_MESSAGE,
      });
    }

    if (normalizedPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (!VALID_USER_ROLES.includes(normalizedRole) || normalizedRole === "superAdmin") {
      return res.status(400).json({ message: "Invalid role for account creation" });
    }

    if (normalizedRole === "admin" && !canManageAdminAccounts(req.user)) {
      return res.status(403).json({ message: "Only the super admin can create admin accounts" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(normalizedPassword, salt);

    const createdUser = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      role: normalizedRole,
      profileImageUrl,
      status: "active",
      isActive: true,
    });

    await logActivity(
      req.user._id,
      "Created user account",
      `Created ${normalizedRole} account for ${createdUser.email}`,
    );

    let emailSent = true;
    try {
      await sendNewUserCredentialsEmail({
        to: createdUser.email,
        name: createdUser.name,
        password: normalizedPassword,
        role: createdUser.role,
      });
    } catch (error) {
      emailSent = false;
      console.error("[UserController] Failed to send new user credentials:", error.message);
    }

    res.status(201).json({
      message: emailSent
        ? "User account created successfully and credentials email sent"
        : "User account created successfully, but credentials email could not be sent",
      emailSent,
      user: {
        _id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        status: createdUser.status,
        isActive: createdUser.isActive,
        profileImageUrl: createdUser.profileImageUrl,
      },
    });
  } catch (error) {
    if (
      error?.code === 11000 &&
      (error?.keyPattern?.email || String(error?.message || "").includes("email"))
    ) {
      return res.status(400).json({
        message: DUPLICATE_EMAIL_MESSAGE,
      });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(req.params.id).select("-password").populate("team", "name");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentPassword = String(req.body?.currentPassword || "");

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    if (!currentPassword) {
      return res.status(400).json({ message: "Your password is required to delete a user" });
    }

    const actor = await User.findById(req.user._id).select("+password");
    if (!actor) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, actor.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (String(req.user._id) === String(user._id)) {
      return res.status(403).json({ message: "You cannot delete your own account" });
    }

    if (user.role === "superAdmin") {
      return res.status(403).json({ message: "Super admin account cannot be deleted" });
    }

    if (user.role === "admin" && !canManageAdminAccounts(req.user)) {
      return res.status(403).json({ message: "Only the super admin can delete admin accounts" });
    }

    const taskCount = await Task.countDocuments({
      $or: [{ assignedTo: id }, { tester: id }],
    });
    if (taskCount > 0) {
      return res.status(400).json({
        message: "Cannot delete user with assigned tasks. Reassign tasks first.",
      });
    }

    await Team.updateMany({ members: id }, { $pull: { members: id } });
    await Team.updateMany({ lead: id }, { $set: { lead: null } });

    await user.deleteOne();
    await logActivity(
      actor._id,
      "Deleted user account",
      `Deleted ${user.role} account for ${user.email}`,
    );
    res.json({ message: "User removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deactivateUserAccount = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (String(req.user._id) === String(user._id)) {
      return res.status(403).json({ message: "You cannot deactivate your own account" });
    }

    if (user.role === "superAdmin") {
      return res.status(403).json({ message: "Super admin account cannot be deactivated" });
    }

    if (user.role === "admin" && !canManageAdminAccounts(req.user)) {
      return res.status(403).json({ message: "Only the super admin can deactivate admin accounts" });
    }

    if (user.isActive === false || user.status === "deactivated") {
      return res.status(400).json({ message: "Account is already deactivated" });
    }

    user.isActive = false;
    user.status = "deactivated";
    user.deactivatedAt = new Date();
    user.deactivatedBy = req.user._id;
    await user.save();

    await logActivity(
      req.user._id,
      "Deactivated user account",
      `Deactivated ${user.role} account for ${user.email}`,
    );

    await trySendAccountEmail(
      () =>
        sendAccountStatusEmail({
          to: user.email,
          name: user.name,
          action: "deactivated",
          role: user.role,
        }),
      "account deactivation email",
    );

    res.status(200).json({
      message: "Account deactivated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    if (!VALID_USER_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (String(req.user._id) === String(user._id)) {
      return res.status(403).json({ message: "You cannot change your own role" });
    }

    if (user.role === "superAdmin" || role === "superAdmin") {
      return res.status(403).json({ message: "Super admin role cannot be modified here" });
    }

    if (user.role === "admin" && !canManageAdminAccounts(req.user)) {
      return res.status(403).json({ message: "Admins cannot modify other admin accounts" });
    }

    if (role === "admin" && !canManageAdminAccounts(req.user)) {
      return res.status(403).json({ message: "Only the super admin can assign the admin role" });
    }

    const previousRole = user.role;
    user.role = role;
    await user.save();

    if (previousRole !== role) {
      await notifyAdmins({
        type: "user_role_changed",
        message: `Role updated for ${user.name}: ${previousRole} -> ${role}`,
        link: "/admin/users",
      });
      await trySendAccountEmail(
        () =>
          sendRoleChangedEmail({
            to: user.email,
            name: user.name,
            previousRole,
            newRole: role,
          }),
        "role changed email",
      );
    }

    res.json({
      message: "User role updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const assignUserToTeam = async (req, res) => {
  try {
    const { userId, teamId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (!team.members.includes(userId)) {
      team.members.push(userId);
      await team.save();
    }

    user.team = teamId;
    await user.save();

    res.json({
      message: "User assigned to team successfully",
      user: {
        _id: user._id,
        name: user.name,
        team: team.name,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;

    if (!VALID_USER_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const users = await User.find({ role }).select("-password").populate("team", "name");

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getTeamMembers = async (req, res) => {
  try {
    const users = await User.find({
      role: "teamMember",
      isActive: { $ne: false },
      status: "active",
    })
      .select("-password")
      .populate("team", "name");

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const reactivateUserAccount = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isActive) {
      return res.status(400).json({ message: "Account is already active" });
    }

    if (user.role === "superAdmin") {
      return res.status(403).json({ message: "Super admin account cannot be reactivated here" });
    }

    if (user.role === "admin" && !canManageAdminAccounts(req.user)) {
      return res.status(403).json({ message: "Admins cannot reactivate other admin accounts" });
    }

    user.isActive = true;
    user.status = "active";
    user.reactivatedAt = new Date();
    user.reactivatedBy = req.user.id;
    await user.save();

    await logActivity(
      user._id,
      "Account reactivated",
      `Account reactivated by ${req.user.name || "Admin"}`,
    );

    await trySendAccountEmail(
      () =>
        sendAccountStatusEmail({
          to: user.email,
          name: user.name,
          action: "reactivated",
          role: user.role,
        }),
      "account reactivation email",
    );

    res.status(200).json({
      message: "Account reactivated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getDeactivatedUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: false })
      .select("-password")
      .populate("team", "name")
      .sort({ updatedAt: -1 });

    const usersWithTaskCounts = await Promise.all(
      users.map(async (user) => {
        const [pendingTasks, inProgressTasks, completedTasks, totalTasks] =
          await Promise.all([
            Task.countDocuments({
              ...(user.role === "tester" ? { tester: user._id } : { assignedTo: user._id }),
              status: "Pending",
            }),
            Task.countDocuments({
              ...(user.role === "tester" ? { tester: user._id } : { assignedTo: user._id }),
              status: "In Progress",
            }),
            Task.countDocuments({
              ...(user.role === "tester" ? { tester: user._id } : { assignedTo: user._id }),
              status: "Completed",
            }),
            Task.countDocuments(
              user.role === "tester" ? { tester: user._id } : { assignedTo: user._id },
            ),
          ]);

        return {
          ...user._doc,
          status: "deactivated",
          pendingTasks,
          inProgressTasks,
          completedTasks,
          totalTasks,
        };
      }),
    );

    res.status(200).json(usersWithTaskCounts);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getPasswordResetRequests = async (req, res) => {
  try {
    if (!isSuperAdminUser(req.user)) {
      return res.status(403).json({ message: "Only the super admin can view password reset requests" });
    }

    const requests = await PasswordResetRequest.find({ status: "pending" })
      .populate("user", "name email role isActive status")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const completePasswordResetRequest = async (req, res) => {
  try {
    if (!isSuperAdminUser(req.user)) {
      return res.status(403).json({ message: "Only the super admin can reset requested passwords" });
    }

    const { id } = req.params;
    const newPassword = String(req.body?.newPassword || "");

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid request ID format" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const request = await PasswordResetRequest.findById(id).populate("user");
    if (!request || request.status !== "pending") {
      return res.status(404).json({ message: "Pending password reset request not found" });
    }

    const user = request.user;
    if (!user) {
      return res.status(404).json({ message: "User not found for this request" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    request.status = "completed";
    request.completedBy = req.user._id;
    request.completedAt = new Date();
    await request.save();

    await logActivity(
      req.user._id,
      "Reset user password",
      `Reset password for ${user.email}`,
    );

    await sendPasswordResetCompletedEmail({
      to: user.email,
      name: user.name,
      password: newPassword,
    });

    res.json({ message: "Password reset completed and emailed to user" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getUsers,
  createUser,
  getUserById,
  deleteUser,
  deactivateUserAccount,
  updateUserRole,
  assignUserToTeam,
  getUsersByRole,
  getTeamMembers,
  reactivateUserAccount,
  getDeactivatedUsers,
  getPasswordResetRequests,
  completePasswordResetRequest,
};
