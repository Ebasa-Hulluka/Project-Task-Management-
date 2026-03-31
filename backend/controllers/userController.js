const Task = require("../models/Task");
const User = require("../models/User");
const Team = require("../models/Team");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { notifyAdmins } = require("../utils/notificationService");
const { logActivity } = require("../utils/activityLogger");

const VALID_USER_ROLES = ["superAdmin", "admin", "projectManager", "teamMember"];
const VALID_USER_STATUSES = ["active", "deactivated"];

const isSuperAdminUser = (user) => user?.role === "superAdmin";

const canManageAdminAccounts = (actor) => isSuperAdminUser(actor);

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
        const [pendingTasks, inProgressTasks, completedTasks, totalTasks] =
          await Promise.all([
            Task.countDocuments({ assignedTo: user._id, status: "Pending" }),
            Task.countDocuments({ assignedTo: user._id, status: "In Progress" }),
            Task.countDocuments({ assignedTo: user._id, status: "Completed" }),
            Task.countDocuments({ assignedTo: user._id }),
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

    if (normalizedPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (!VALID_USER_ROLES.includes(normalizedRole) || normalizedRole === "superAdmin") {
      return res.status(400).json({ message: "Invalid role for account creation" });
    }

    if (normalizedRole === "admin" && !canManageAdminAccounts(req.user)) {
      return res.status(403).json({ message: "Only the super admin can create admin accounts" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        message: `An account with this email already exists: ${normalizedEmail}`,
      });
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

    res.status(201).json({
      message: "User account created successfully",
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
    if (error?.code === 11000 && error?.keyPattern?.email) {
      const duplicateEmail = String(error?.keyValue?.email || req.body?.email || "")
        .trim()
        .toLowerCase();

      return res.status(400).json({
        message: `An account with this email already exists${duplicateEmail ? `: ${duplicateEmail}` : ""}`,
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

    const taskCount = await Task.countDocuments({ assignedTo: id });
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
            Task.countDocuments({ assignedTo: user._id, status: "Pending" }),
            Task.countDocuments({ assignedTo: user._id, status: "In Progress" }),
            Task.countDocuments({ assignedTo: user._id, status: "Completed" }),
            Task.countDocuments({ assignedTo: user._id }),
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

module.exports = {
  getUsers,
  createUser,
  getUserById,
  deleteUser,
  updateUserRole,
  assignUserToTeam,
  getUsersByRole,
  getTeamMembers,
  reactivateUserAccount,
  getDeactivatedUsers,
};
