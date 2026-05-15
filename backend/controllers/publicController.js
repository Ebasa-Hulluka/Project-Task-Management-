const User = require("../models/User");
const Task = require("../models/Task");
const Team = require("../models/Team");

// @desc    Public landing stat
// @route   GET /api/public/landing-stats
// @access  Public
const getLandingStats = async (req, res) => {
  try {
    const [activeUsers, completedTasks, totalTeams] = await Promise.all([
      User.countDocuments(),
      Task.countDocuments({ status: "Completed" }),
      Team.countDocuments(),
    ]);

    res.status(200).json({
      activeUsers,
      completedTasks,
      totalTeams,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Public admin contact email
// @route   GET /api/public/admin-contact
// @access  Public
const getAdminContact = async (req, res) => {
  try {
    const admin = await User.findOne({
      role: { $in: ["superAdmin", "admin"] },
      isActive: true,
      status: "active",
    })
      .sort({ createdAt: 1 })
      .select("email")
      .lean();

    return res.status(200).json({
      email: admin?.email || null,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  getLandingStats,
  getAdminContact,
};
