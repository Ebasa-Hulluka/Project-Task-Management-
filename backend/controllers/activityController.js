const Activity = require("../models/Activity");

// @desc    Get recent activity for logged-in user
// @route   GET /api/actty
// @access  Private
const getUserActivity = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);

    const activities = await Activity.find({ user: req.user._id })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch activity",
      error: error.message,
    });
  }
};

module.exports = { getUserActivity };
