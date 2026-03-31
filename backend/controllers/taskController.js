const Task = require("../models/Task");
const Project = require("../models/Project");
const mongoose = require("mongoose");
const { logActivity } = require("../utils/activityLogger");

// @desc    Get all tasks (Admin: all, Manager: their projects, User: assigned)
// @route   GET /api/tasks/
// @access  Private
const getTasks = async (req, res) => {
  try {
    const { status, projectId } = req.query;
    let filter = {};
    let projectIds = [];
    let baseRoleFilter = {};

    if (status) {
      filter.status = status;
    }

    if (projectId) {
      filter.projectId = projectId;
    }

    let tasks;

    if (req.user.role === "admin") {
      // Admin sees all tasks
      baseRoleFilter = {};
      tasks = await Task.find(filter)
        .populate("assignedTo", "name email profileImageUrl")
        .populate("projectId", "name");
    } else if (req.user.role === "projectManager") {
      // Project Manager sees tasks from their projects
      const projects = await Project.find({ createdBy: req.user._id }).select(
        "_id",
      );
      projectIds = projects.map((p) => p._id);
      filter.projectId = { $in: projectIds };
      baseRoleFilter = { projectId: { $in: projectIds } };

      tasks = await Task.find(filter)
        .populate("assignedTo", "name email profileImageUrl")
        .populate("projectId", "name");
    } else {
      // Team Member sees only assigned tasks
      baseRoleFilter = { assignedTo: req.user._id };
      tasks = await Task.find({ ...filter, ...baseRoleFilter })
        .populate("assignedTo", "name email profileImageUrl")
        .populate("projectId", "name");
    }

    // Add completed todoChecklist count to each task
    tasks = tasks.map((task) => {
      const checklist = Array.isArray(task.todoChecklist)
        ? task.todoChecklist
        : [];
      const completedCount = checklist.filter((item) => item?.completed).length;
      return { ...task._doc, completedTodoCount: completedCount };
    });

    // Status summary counts
    const allTasks = await Task.countDocuments(baseRoleFilter);

    const pendingTasks = await Task.countDocuments({
      ...baseRoleFilter,
      ...filter,
      status: "Pending",
    });

    const inProgressTasks = await Task.countDocuments({
      ...baseRoleFilter,
      ...filter,
      status: "In Progress",
    });

    const completedTasks = await Task.countDocuments({
      ...baseRoleFilter,
      ...filter,
      status: "Completed",
    });

    res.json({
      tasks,
      statusSummary: {
        all: allTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
      },
    });
  } catch (error) {
    console.error("Error in getTasks:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res) => {
  try {
    const taskId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        message: "Invalid task ID format",
      });
    }

    const task = await Task.findById(taskId)
      .populate("assignedTo", "name email profileImageUrl")
      .populate("projectId", "name")
      .populate("createdBy", "name");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    console.error("Error in getTaskById:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Create a new task (Admin or Project Manager)
// @route   POST /api/tasks/
// @access  Private (Admin, Project Manager)
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      projectId,
      attachments,
      todoChecklist,
    } = req.body;

    if (!Array.isArray(assignedTo)) {
      return res
        .status(400)
        .json({ message: "assignedTo must be an array of user IDs" });
    }

    // If Project Manager, verify they own the project
    if (req.user.role === "projectManager" && projectId) {
      const project = await Project.findById(projectId);
      if (
        !project ||
        project.createdBy.toString() !== req.user._id.toString()
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to create tasks in this project" });
      }
    }

    const task = await Task.create({
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      projectId,
      createdBy: req.user._id,
      todoChecklist,
      attachments,
    });

    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email profileImageUrl")
      .populate("projectId", "name");

    res
      .status(201)
      .json({ message: "Task created successfully", task: populatedTask });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update task details
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID format" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Check authorization
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    const isManager = req.user.role === "projectManager";

    if (!isAdmin && !isCreator && !isManager) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this task" });
    }

    task.title = req.body.title || task.title;
    task.description = req.body.description || task.description;
    task.priority = req.body.priority || task.priority;
    task.dueDate = req.body.dueDate || task.dueDate;
    task.todoChecklist = req.body.todoChecklist || task.todoChecklist;
    task.attachments = req.body.attachments || task.attachments;
    task.projectId = req.body.projectId || task.projectId;

    if (req.body.assignedTo) {
      if (!Array.isArray(req.body.assignedTo)) {
        return res
          .status(400)
          .json({ message: "assignedTo must be an array of user IDs" });
      }
      task.assignedTo = req.body.assignedTo;
    }

    const updatedTask = await task.save();
    const populatedTask = await Task.findById(updatedTask._id)
      .populate("assignedTo", "name email profileImageUrl")
      .populate("projectId", "name");

    res.json({ message: "Task updated successfully", task: populatedTask });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete a task (Admin or Project Manager)
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID format" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Check authorization
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    const isManager = req.user.role === "projectManager";

    if (!isAdmin && !isCreator && !isManager) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this task" });
    }

    await task.deleteOne();
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Update task status
// @route   PUT /api/tasks/:id/status
// @access  Private
const updateTaskStatus = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID format" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const previousStatus = task.status;

    const isAssigned = task.assignedTo.some(
      (userId) => userId.toString() === req.user._id.toString(),
    );

    if (
      !isAssigned &&
      req.user.role !== "admin" &&
      req.user.role !== "projectManager"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    task.status = req.body.status || task.status;

    if (task.status === "Completed") {
      task.todoChecklist.forEach((item) => (item.completed = true));
      task.progress = 100;
    }

    await task.save();
    if (previousStatus !== "Completed" && task.status === "Completed") {
      await logActivity(
        req.user._id,
        "Completed task",
        `Completed task "${task.title}"`,
      );
    }
    res.json({ message: "Task status updated", task });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update task checklist
// @route   PUT /api/tasks/:id/todo
// @access  Private
const updateTaskChecklist = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID format" });
    }

    const { todoChecklist } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const previousStatus = task.status;

    const isAssigned = task.assignedTo.some(
      (userId) => userId.toString() === req.user._id.toString(),
    );

    if (
      !isAssigned &&
      req.user.role !== "admin" &&
      req.user.role !== "projectManager"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update checklist" });
    }

    task.todoChecklist = todoChecklist;

    // Auto-update progress based on checklist completion
    const completedCount = task.todoChecklist.filter(
      (item) => item.completed,
    ).length;
    const totalItems = task.todoChecklist.length;
    task.progress =
      totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

    // Auto-mark task as completed if all items are checked
    if (task.progress === 100) {
      task.status = "Completed";
    } else if (task.progress > 0) {
      task.status = "In Progress";
    } else {
      task.status = "Pending";
    }

    await task.save();
    if (previousStatus !== "Completed" && task.status === "Completed") {
      await logActivity(
        req.user._id,
        "Completed task",
        `Completed task "${task.title}"`,
      );
    }
    const updatedTask = await Task.findById(req.params.id)
      .populate("assignedTo", "name email profileImageUrl")
      .populate("projectId", "name");

    res.json({ message: "Task checklist updated", task: updatedTask });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get tasks by project
// @route   GET /api/tasks/project/:projectId
// @access  Private
const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project ID format" });
    }

    const tasks = await Task.find({ projectId })
      .populate("assignedTo", "name email profileImageUrl")
      .populate("projectId", "name");

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Dashboard Data (Admin only)
// @route   GET /api/tasks/dashboard-data
// @access  Private
const getDashboardData = async (req, res) => {
  try {
    // Fetch statistics
    const totalTasks = await Task.countDocuments();
    const pendingTasks = await Task.countDocuments({ status: "Pending" });
    const completedTasks = await Task.countDocuments({ status: "Completed" });
    const overdueTasks = await Task.countDocuments({
      status: { $ne: "Completed" },
      dueDate: { $lt: new Date() },
    });

    // Task distribution by status
    const taskStatuses = ["Pending", "In Progress", "Completed"];
    const taskDistributionRaw = await Task.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
    const taskDistribution = taskStatuses.reduce((acc, status) => {
      const formattedKey = status.replace(/\s+/g, "");
      acc[formattedKey] =
        taskDistributionRaw.find((item) => item._id === status)?.count || 0;
      return acc;
    }, {});

    taskDistribution["All"] = totalTasks;

    // Task distribution by priority
    const taskPriorities = ["Low", "Medium", "High"];
    const taskPriorityLevelsRaw = await Task.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);
    const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
      acc[priority] =
        taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
      return acc;
    }, {});

    // Tasks by project
    const tasksByProject = await Task.aggregate([
      {
        $group: {
          _id: "$projectId",
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: "projects",
          localField: "_id",
          foreignField: "_id",
          as: "project",
        },
      },
    ]);

    const recentTasks = await Task.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("projectId", "name")
      .select("title status priority dueDate createdAt projectId");

    res.status(200).json({
      statistics: {
        totalTasks,
        pendingTasks,
        completedTasks,
        overdueTasks,
      },
      charts: {
        taskDistribution,
        taskPriorityLevels,
        tasksByProject,
      },
      recentTasks,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Dashboard Data (User-specific)
// @route   GET /api/tasks/user-dashboard-data
// @access  Private
const getUserDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch statistics for user-specific tasks
    const totalTasks = await Task.countDocuments({ assignedTo: userId });
    const pendingTasks = await Task.countDocuments({
      assignedTo: userId,
      status: "Pending",
    });
    const inProgressTasks = await Task.countDocuments({
      assignedTo: userId,
      status: "In Progress",
    });
    const completedTasks = await Task.countDocuments({
      assignedTo: userId,
      status: "Completed",
    });
    const overdueTasks = await Task.countDocuments({
      assignedTo: userId,
      status: { $ne: "Completed" },
      dueDate: { $lt: new Date() },
    });

    // Task distribution by status
    const taskStatuses = ["Pending", "In Progress", "Completed"];
    const taskDistributionRaw = await Task.aggregate([
      {
        $match: { assignedTo: userId },
      },
      {
        $group: { _id: "$status", count: { $sum: 1 } },
      },
    ]);

    const taskDistribution = taskStatuses.reduce((acc, status) => {
      const formattedKey = status.replace(/\s+/g, "");
      acc[formattedKey] =
        taskDistributionRaw.find((item) => item._id === status)?.count || 0;
      return acc;
    }, {});
    taskDistribution["All"] = totalTasks;

    // Task distribution by priority
    const taskPriorities = ["Low", "Medium", "High"];
    const taskPriorityLevelsRaw = await Task.aggregate([
      { $match: { assignedTo: userId } },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);

    const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
      acc[priority] =
        taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
      return acc;
    }, {});

    const recentTasks = await Task.find({ assignedTo: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("projectId", "name")
      .select("title status priority dueDate createdAt projectId");

    res.status(200).json({
      statistics: {
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        overdueTasks,
      },
      charts: {
        taskDistribution,
        taskPriorityLevels,
      },
      recentTasks,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskChecklist,
  getTasksByProject,
  getDashboardData,
  getUserDashboardData,
};
