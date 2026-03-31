const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to protect routes
const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (token && token.startsWith("Bearer")) {
      token = token.split(" ")[1]; // Extract token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user || !req.user.isActive || req.user.status === "deactivated") {
        return res.status(401).json({ message: "Not authorized" });
      }
      next();
    } else {
      res.status(401).json({ message: "Not authorized, no token" });
    }
  } catch (error) {
    res.status(401).json({ message: "Token failed", error: error.message });
  }
};

// Middleware for Admin-only access
const adminOnly = (req, res, next) => {
  if (req.user && ["superAdmin", "admin"].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: "Access denied, admin only" });
  }
};

// NEW: Middleware for Project Manager only
const projectManagerOnly = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "superAdmin" ||
      req.user.role === "admin" ||
      req.user.role === "projectManager")
  ) {
    next();
  } else {
    res.status(403).json({ message: "Access denied, project manager only" });
  }
};

// NEW: Middleware for Team Member only
const teamMemberOnly = (req, res, next) => {
  if (req.user && req.user.role === "teamMember") {
    next();
  } else {
    res.status(403).json({ message: "Access denied, team member only" });
  }
};

// NEW: Check if user is assigned to task
const checkTaskAssignment = async (req, res, next) => {
  try {
    const Task = require("../models/Task");
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Admin can do anything
    if (["superAdmin", "admin"].includes(req.user.role)) {
      return next();
    }

    // Check if user is assigned to this task
    const isAssigned = task.assignedTo.some(
      (userId) => userId.toString() === req.user._id.toString(),
    );

    if (isAssigned || req.user.role === "projectManager") {
      next();
    } else {
      res.status(403).json({ message: "Not authorized to access this task" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  protect,
  adminOnly,
  projectManagerOnly,
  teamMemberOnly,
  checkTaskAssignment,
};
