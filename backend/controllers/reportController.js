const Task = require("../models/Task");
const User = require("../models/User");
const Project = require("../models/Project");
const Team = require("../models/Team");
const excelJS = require("exceljs");
const { notifySystemReportReady } = require("../utils/notificationService");

// @desc    Get task analytics report
// @route   GET /api/reports/tasks
// @access  Private (Admin)
const getTasksReport = async (req, res) => {
  try {
    const [totalTasks, completedTasks, pendingTasks, inProgressTasks] =
      await Promise.all([
        Task.countDocuments(),
        Task.countDocuments({ status: "Completed" }),
        Task.countDocuments({ status: "Pending" }),
        Task.countDocuments({ status: "In Progress" }),
      ]);

    const priorityBuckets = ["High", "Medium", "Low"];
    const priorityRaw = await Task.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    const priorityLevels = priorityBuckets.map((priority) => ({
      name: priority,
      value: priorityRaw.find((item) => item._id === priority)?.count || 0,
    }));

    const distribution = [
      { name: "Completed", value: completedTasks },
      { name: "Pending", value: pendingTasks },
      { name: "In Progress", value: inProgressTasks },
    ];

    res.status(200).json({
      summary: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        inProgress: inProgressTasks,
      },
      distribution,
      priorityLevels,
    });

  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching task report", error: error.message });
  }
};

// @desc    Get user analytics report
// @route   GET /api/reports/users
// @access  Private (Admin)
const getUsersReport = async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [totalUsers, teamsCount, roleCountsRaw] = await Promise.all([
      User.countDocuments(),
      Team.countDocuments(),
      User.aggregate([
        {
          $project: {
            roleList: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$roles", []] } }, 0] },
                "$roles",
                ["$role"],
              ],
            },
          },
        },
        { $unwind: "$roleList" },
        {
          $group: {
            _id: "$roleList",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const roleCountMap = roleCountsRaw.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const superAdminCount =
      (roleCountMap.superAdmin || 0) +
      (roleCountMap.superadmin || 0);
    const adminCount = roleCountMap.admin || 0;
    const projectManagerCount =
      (roleCountMap.projectManager || 0) +
      (roleCountMap.projectmanager || 0);
    const teamMemberCount =
      (roleCountMap.teamMember || 0) +
      (roleCountMap.teammember || 0) +
      (roleCountMap.member || 0);
    const testerCount =
      (roleCountMap.tester || 0) +
      (roleCountMap.Tester || 0);

    // Uses updatedAt as activity proxy unless explicit login-tracking exists.
    // Exclude deactivated/pending/rejected accounts from "Active Today".
    const activeToday = await User.countDocuments({
      updatedAt: { $gte: twentyFourHoursAgo },
      isActive: true,
      $or: [
        { status: "active" },
        { status: { $exists: false } },
        { status: null },
      ],
    });

    res.status(200).json({
      total: totalUsers,
      byRole: {
        superAdmin: superAdminCount,
        admin: adminCount,
        projectManager: projectManagerCount,
        teamMember: teamMemberCount,
        tester: testerCount,
      },
      activeToday,
      teams: teamsCount,
    });

  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching users report", error: error.message });
  }
};

// @desc    Get project analytics report
// @route   GET /api/reports/projects
// @access  Private (Admin)
const getProjectsReport = async (req, res) => {
  try {
    const [totalProjects, statusCounts] = await Promise.all([
      Project.countDocuments(),
      Project.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statusCountMap = statusCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const activeProjects =
      (statusCountMap.Active || 0) + (statusCountMap.active || 0);
    const planningProjects =
      (statusCountMap.Planning || 0) + (statusCountMap.planning || 0);
    const completedProjects =
      (statusCountMap.Completed || 0) + (statusCountMap.completed || 0);
    const onHoldProjects =
      (statusCountMap["On Hold"] || 0) +
      (statusCountMap.OnHold || 0) +
      (statusCountMap.onHold || 0) +
      (statusCountMap.onhold || 0);

    const completionRate =
      totalProjects > 0
        ? Math.round((completedProjects / totalProjects) * 100)
        : 0;

    res.status(200).json({
      total: totalProjects,
      byStatus: {
        active: activeProjects,
        planning: planningProjects,
        completed: completedProjects,
        onHold: onHoldProjects,
      },
      completionRate,
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching projects report",
      error: error.message,
    });
  }
};

// @desc    Export all tasks as an Excel file
// @route   GET /api/reports/export/tasks
// @access  Private (Admin)
const exportTasksReport = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("assignedTo", "name email")
      .populate("projectId", "name");

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tasks Report");

    worksheet.columns = [
      { header: "Task ID", key: "_id", width: 25 },
      { header: "Title", key: "title", width: 30 },
      { header: "Description", key: "description", width: 50 },
      { header: "Project", key: "project", width: 20 },
      { header: "Priority", key: "priority", width: 15 },
      { header: "Status", key: "status", width: 20 },
      { header: "Progress", key: "progress", width: 15 },
      { header: "Due Date", key: "dueDate", width: 20 },
      { header: "Assigned To", key: "assignedTo", width: 30 },
    ];

    tasks.forEach((task) => {
      const assignedTo = task.assignedTo
        .map((user) => `${user.name} (${user.email})`)
        .join(", ");
      worksheet.addRow({
        _id: task._id,
        title: task.title,
        description: task.description,
        project: task.projectId?.name || "No Project",
        priority: task.priority,
        status: task.status,
        progress: `${task.progress}%`,
        dueDate: task.dueDate.toISOString().split("T")[0],
        assignedTo: assignedTo || "Unassigned",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="tasks_report.xlsx"',
    );

    await notifySystemReportReady({
      userId: req.user?._id || req.user?.id,
      reportType: "Tasks report export",
    });

    return workbook.xlsx.write(res).then(() => {
      res.end();
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error exporting tasks", error: error.message });
  }
};

// @desc    Export user-task report as an Excel file
// @route   GET /api/reports/export/users
// @access  Private (Admin)
const exportUsersReport = async (req, res) => {
  try {
    const users = await User.find()
      .select("name email role status")
      .lean();

    const userTasks = await Task.find().populate(
      "assignedTo",
      "name email _id",
    );

    const userTaskMap = {};
    users.forEach((user) => {
      userTaskMap[user._id] = {
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status || "active",
        taskCount: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
      };
    });

    userTasks.forEach((task) => {
      if (task.assignedTo) {
        task.assignedTo.forEach((assignedUser) => {
          if (userTaskMap[assignedUser._id]) {
            userTaskMap[assignedUser._id].taskCount += 1;
            if (task.status === "Pending") {
              userTaskMap[assignedUser._id].pendingTasks += 1;
            } else if (task.status === "In Progress") {
              userTaskMap[assignedUser._id].inProgressTasks += 1;
            } else if (task.status === "Completed") {
              userTaskMap[assignedUser._id].completedTasks += 1;
            }
          }
        });
      }
    });

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users Report");

    worksheet.columns = [
      { header: "Name", key: "name", width: 30 },
      { header: "Email", key: "email", width: 40 },
      { header: "Role", key: "role", width: 20 },
      { header: "Status", key: "status", width: 18 },
      { header: "Total Tasks", key: "taskCount", width: 16 },
      { header: "Pending", key: "pendingTasks", width: 14 },
      { header: "In Progress", key: "inProgressTasks", width: 14 },
      { header: "Completed", key: "completedTasks", width: 14 },
    ];

    Object.values(userTaskMap).forEach((user) => {
      worksheet.addRow(user);
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="users_report_${new Date().toISOString().split("T")[0]}.xlsx"`,
    );

    await notifySystemReportReady({
      userId: req.user?._id || req.user?.id,
      reportType: "Users report export",
    });

    return workbook.xlsx.write(res).then(() => {
      res.end();
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error exporting users report", error: error.message });
  }
};

// @desc    Export project report as an Excel file
// @route   GET /api/reports/export/projects
// @access  Private (Admin)
const exportProjectsReport = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("team", "name")
      .populate("createdBy", "name email");

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Projects Report");

    worksheet.columns = [
      { header: "Project Name", key: "name", width: 30 },
      { header: "Description", key: "description", width: 50 },
      { header: "Status", key: "status", width: 20 },
      { header: "Progress", key: "progress", width: 15 },
      { header: "Start Date", key: "startDate", width: 20 },
      { header: "End Date", key: "endDate", width: 20 },
      { header: "Team", key: "team", width: 20 },
      { header: "Created By", key: "createdBy", width: 30 },
    ];

    for (const project of projects) {
      const taskCount = await Task.countDocuments({ projectId: project._id });
      const completedTasks = await Task.countDocuments({
        projectId: project._id,
        status: "Completed",
      });

      worksheet.addRow({
        name: project.name,
        description: project.description || "N/A",
        status: project.status,
        progress: `${project.progress}%`,
        startDate: project.startDate
          ? project.startDate.toISOString().split("T")[0]
          : "N/A",
        endDate: project.endDate
          ? project.endDate.toISOString().split("T")[0]
          : "N/A",
        team: project.team?.map((t) => t.name).join(", ") || "No Team",
        createdBy: project.createdBy
          ? `${project.createdBy.name} (${project.createdBy.email})`
          : "N/A",
      });
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="projects_report.xlsx"',
    );

    await notifySystemReportReady({
      userId: req.user?._id || req.user?.id,
      reportType: "Projects report export",
    });

    return workbook.xlsx.write(res).then(() => {
      res.end();
    });
  } catch (error) {
    res.status(500).json({
      message: "Error exporting projects report",
      error: error.message,
    });
  }
};

module.exports = {
  getTasksReport,
  getUsersReport,
  getProjectsReport,
  exportTasksReport,
  exportUsersReport,
  exportProjectsReport,
};
