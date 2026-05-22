const Task = require("../models/Task");
const Project = require("../models/Project");
const { isAdminRole, isTaskViewOnlyRole } = require("../utils/roles");
const mongoose = require("mongoose");
const { logActivity } = require("../utils/activityLogger");
const { syncProjectFromTasks } = require("../utils/projectStatus");
const {
  normalizeReferenceAttachments,
  normalizeCompletionAttachments,
  serializeTaskAttachments,
} = require("../utils/taskAttachments");

const syncProjectForTask = async (task) => {
  const projectId = task?.projectId?._id || task?.projectId;
  if (projectId) {
    await syncProjectFromTasks(projectId);
  }
};

const populateTask = (query) =>
  query
    .populate("assignedTo", "name email profileImageUrl")
    .populate("tester", "name email profileImageUrl")
    .populate("projectId", "name")
    .populate("completionAttachments.uploadedBy", "name email profileImageUrl");

const completeOrSendToReview = (task) => {
  task.todoChecklist.forEach((item) => (item.completed = true));
  task.progress = 100;
  task.status = task.tester ? "In Review" : "Completed";
};

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

    if (req.user.role === "admin" || req.user.role === "superAdmin") {
      // Admin sees all tasks
      baseRoleFilter = {};
      tasks = await populateTask(Task.find(filter));
    } else if (req.user.role === "projectManager") {
      // Project Manager sees tasks from their projects
      const projects = await Project.find({ createdBy: req.user._id }).select(
        "_id",
      );
      projectIds = projects.map((p) => p._id);
      filter.projectId = { $in: projectIds };
      baseRoleFilter = { projectId: { $in: projectIds } };

      tasks = await populateTask(Task.find(filter));
    } else if (req.user.role === "tester") {
      baseRoleFilter = { tester: req.user._id };
      tasks = await populateTask(Task.find({ ...filter, ...baseRoleFilter }));
    } else {
      // Team Member sees only assigned tasks
      baseRoleFilter = { assignedTo: req.user._id };
      tasks = await populateTask(Task.find({ ...filter, ...baseRoleFilter }));
    }

    // Add completed todoChecklist count to each task
    tasks = tasks.map((task) => {
      const checklist = Array.isArray(task.todoChecklist)
        ? task.todoChecklist
        : [];
      const completedCount = checklist.filter((item) => item?.completed).length;
      const plain =
        typeof task.toObject === "function"
          ? task.toObject({ virtuals: true })
          : task?._doc
            ? { ...task._doc }
            : { ...task };
      return { ...plain, completedTodoCount: completedCount };
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
    const inReviewTasks = await Task.countDocuments({
      ...baseRoleFilter,
      ...filter,
      status: "In Review",
    });
    const changesRequestedTasks = await Task.countDocuments({
      ...baseRoleFilter,
      ...filter,
      status: "Changes Requested",
    });

    res.json({
      tasks,
      statusSummary: {
        all: allTasks,
        pendingTasks,
        inProgressTasks,
        inReviewTasks,
        changesRequestedTasks,
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
      .populate("tester", "name email profileImageUrl")
      .populate("projectId", "name")
      .populate("createdBy", "name")
      .populate("reviewHistory.tester", "name email profileImageUrl");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(serializeTaskAttachments(task));
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
    if (isTaskViewOnlyRole(req.user.role)) {
      return res.status(403).json({
        message:
          "Super Admins and Admins can only view tasks. Creating tasks is not allowed for your role.",
      });
    }

    const {
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      projectId,
      tester,
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
      tester: tester || null,
      projectId,
      createdBy: req.user._id,
      todoChecklist,
      attachments: normalizeReferenceAttachments(attachments),
    });

    const populatedTask = await populateTask(Task.findById(task._id));
    await syncProjectForTask(task);

    res
      .status(201)
      .json({
        message: "Task created successfully",
        task: serializeTaskAttachments(populatedTask),
      });
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

    if (isTaskViewOnlyRole(req.user.role)) {
      return res.status(403).json({
        message:
          "Super Admins and Admins can only view tasks. Editing tasks is not allowed for your role.",
      });
    }

    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isManager = req.user.role === "projectManager";

    if (!isCreator && !isManager) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this task" });
    }

    task.title = req.body.title || task.title;
    task.description = req.body.description || task.description;
    task.priority = req.body.priority || task.priority;
    task.dueDate = req.body.dueDate || task.dueDate;
    task.todoChecklist = req.body.todoChecklist || task.todoChecklist;
    if (req.body.attachments !== undefined) {
      task.attachments = normalizeReferenceAttachments(req.body.attachments);
    }
    task.projectId = req.body.projectId || task.projectId;
    if (Object.prototype.hasOwnProperty.call(req.body, "tester")) {
      task.tester = req.body.tester || null;
    }

    if (req.body.assignedTo) {
      if (!Array.isArray(req.body.assignedTo)) {
        return res
          .status(400)
          .json({ message: "assignedTo must be an array of user IDs" });
      }
      task.assignedTo = req.body.assignedTo;
    }

    const updatedTask = await task.save();
    await syncProjectForTask(updatedTask);
    const populatedTask = await populateTask(Task.findById(updatedTask._id));

    res.json({
      message: "Task updated successfully",
      task: serializeTaskAttachments(populatedTask),
    });
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

    if (isTaskViewOnlyRole(req.user.role)) {
      return res.status(403).json({
        message:
          "Super Admins and Admins can only view tasks. Deleting tasks is not allowed for your role.",
      });
    }

    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isManager = req.user.role === "projectManager";

    if (!isCreator && !isManager) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this task" });
    }

    const projectId = task.projectId;
    await task.deleteOne();
    if (projectId) {
      await syncProjectFromTasks(projectId);
    }
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

    if (req.user.role === "teamMember") {
      if (!isAssigned) {
        return res
          .status(403)
          .json({ message: "Only assigned team members can update task status" });
      }
    } else if (isTaskViewOnlyRole(req.user.role)) {
      return res.status(403).json({
        message:
          "Super Admins and Admins can only view tasks. Status updates are not allowed for your role.",
      });
    } else {
      return res.status(403).json({
        message:
          "Task status is updated automatically when team members complete checklist items",
      });
    }

    const requestedStatus = req.body.status || task.status;
    task.status = requestedStatus;

    if (requestedStatus === "Completed") {
      completeOrSendToReview(task);
    }

    await task.save();
    if (previousStatus !== "Completed" && task.status === "Completed") {
      await logActivity(
        req.user._id,
        "Completed task",
        `Completed task "${task.title}"`,
      );
    }
    const updatedTask = await populateTask(Task.findById(task._id));
    await syncProjectForTask(task);
    res.json({ message: "Task status updated", task: updatedTask });
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

    const { todoChecklist, completionAttachments } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const previousStatus = task.status;

    const isAssigned = task.assignedTo.some(
      (userId) => userId.toString() === req.user._id.toString(),
    );

    if (req.user.role === "teamMember") {
      if (!isAssigned) {
        return res.status(403).json({
          message: "Only assigned team members can update the checklist",
        });
      }
    } else if (isTaskViewOnlyRole(req.user.role)) {
      return res.status(403).json({
        message:
          "Super Admins and Admins can only view tasks. Checklist updates are not allowed for your role.",
      });
    } else {
      return res.status(403).json({
        message: "Only assigned team members can update the checklist",
      });
    }

    task.todoChecklist = todoChecklist;

    // Auto-update progress based on checklist completion
    const completedCount = task.todoChecklist.filter(
      (item) => item.completed,
    ).length;
    const totalItems = task.todoChecklist.length;
    task.progress =
      totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

    const submittingForReview =
      task.progress === 100 && task.tester && previousStatus !== "In Review";

    if (completionAttachments !== undefined) {
      task.completionAttachments = normalizeCompletionAttachments(
        completionAttachments,
        req.user._id,
      );
    }

    if (submittingForReview && req.user.role === "teamMember") {
      if (!task.completionAttachments?.length) {
        return res.status(400).json({
          message:
            "Add at least one delivery attachment (file or link) before submitting for testing.",
        });
      }
    }

    // Auto-mark task as completed if all items are checked
    if (task.progress === 100) {
      task.status = task.tester ? "In Review" : "Completed";
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
    const updatedTask = await populateTask(Task.findById(req.params.id));
    await syncProjectForTask(task);

    res.json({
      message: "Task checklist updated",
      task: serializeTaskAttachments(updatedTask),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Upload a task attachment file (reference or delivery)
// @route   POST /api/tasks/upload-attachment
// @access  Private
const uploadTaskAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const host = `${req.protocol}://${req.get("host")}`;
    res.status(201).json({
      url: `${host}/uploads/tasks/${req.file.filename}`,
      name: req.file.originalname,
      kind: "file",
    });
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

// @desc    Tester approves or rejects a task review
// @route   PUT /api/tasks/:id/review
// @access  Private (assigned tester only)
const reviewTask = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID format" });
    }

    const { result, comment = "" } = req.body;
    if (!["passed", "failed"].includes(result)) {
      return res.status(400).json({ message: "Review result must be passed or failed" });
    }

    if (result === "failed" && !String(comment).trim()) {
      return res.status(400).json({ message: "Bug details are required when a task fails testing" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const isAssignedTester =
      req.user.role === "tester" &&
      task.tester &&
      task.tester.toString() === req.user._id.toString();

    if (!isAssignedTester) {
      return res.status(403).json({ message: "Only the assigned tester can review this task" });
    }

    if (task.status !== "In Review") {
      return res.status(400).json({ message: "Only tasks in review can be tested" });
    }

    task.reviewHistory.push({
      tester: req.user._id,
      status: result,
      comment: String(comment || "").trim(),
    });

    if (result === "passed") {
      task.status = "Completed";
      task.progress = 100;
      task.todoChecklist.forEach((item) => (item.completed = true));
    } else {
      task.status = "Changes Requested";
      task.progress = Math.min(task.progress || 0, 95);
    }

    await task.save();

    if (result === "passed") {
      await logActivity(
        req.user._id,
        "Approved task",
        `Approved task "${task.title}" after testing`,
      );
    }

    const updatedTask = await populateTask(Task.findById(task._id)).populate(
      "reviewHistory.tester",
      "name email profileImageUrl",
    );

    await syncProjectForTask(task);

    res.json({
      message:
        result === "passed"
          ? "Task approved and completed"
          : "Bug sent back to developer",
      task: serializeTaskAttachments(updatedTask),
    });
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

    const tasks = await populateTask(Task.find({ projectId }));

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
    const taskStatuses = ["Pending", "In Progress", "In Review", "Changes Requested", "Completed"];
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

    const recentTasks = await populateTask(
      Task.find().sort({ createdAt: -1 }).limit(10),
    );

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
    const userTaskFilter =
      req.user.role === "tester" ? { tester: userId } : { assignedTo: userId };

    // Fetch statistics for user-specific tasks
    const totalTasks = await Task.countDocuments(userTaskFilter);
    const pendingTasks = await Task.countDocuments({
      ...userTaskFilter,
      status: "Pending",
    });
    const inProgressTasks = await Task.countDocuments({
      ...userTaskFilter,
      status: "In Progress",
    });
    const inReviewTasks = await Task.countDocuments({
      ...userTaskFilter,
      status: "In Review",
    });
    const changesRequestedTasks = await Task.countDocuments({
      ...userTaskFilter,
      status: "Changes Requested",
    });
    const completedTasks = await Task.countDocuments({
      ...userTaskFilter,
      status: "Completed",
    });
    const overdueTasks = await Task.countDocuments({
      ...userTaskFilter,
      status: { $ne: "Completed" },
      dueDate: { $lt: new Date() },
    });

    // Task distribution by status
    const taskStatuses = ["Pending", "In Progress", "In Review", "Changes Requested", "Completed"];
    const taskDistributionRaw = await Task.aggregate([
      {
        $match: userTaskFilter,
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
      { $match: userTaskFilter },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);

    const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
      acc[priority] =
        taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
      return acc;
    }, {});

    const recentTasks = await populateTask(
      Task.find(userTaskFilter).sort({ createdAt: -1 }).limit(10),
    );

    res.status(200).json({
      statistics: {
        totalTasks,
        pendingTasks,
        inProgressTasks,
        inReviewTasks,
        changesRequestedTasks,
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
  uploadTaskAttachment,
  reviewTask,
  getTasksByProject,
  getDashboardData,
  getUserDashboardData,
};
