const Project = require("../models/Project");
const Task = require("../models/Task");
const Team = require("../models/Team");
const mongoose = require("mongoose");
const { notifyAdmins } = require("../utils/notificationService");
const { isAdminRole, isTaskViewOnlyRole } = require("../utils/roles");
const {
  enrichProjectWithTaskMetrics,
  syncProjectFromTasks,
} = require("../utils/projectStatus");

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private (Project Manager)
const createProject = async (req, res) => {
  try {
    if (isTaskViewOnlyRole(req.user.role)) {
      return res.status(403).json({
        message:
          "Super Admins and Admins can only view projects. Creating projects is not allowed for your role.",
      });
    }

    const { name, description, startDate, endDate, status, team } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Project name is required" });
    }

    const teamIds = Array.isArray(team) ? [...new Set(team.map(String))] : [];
    if (
      teamIds.some((teamId) => !mongoose.Types.ObjectId.isValid(teamId))
    ) {
      return res.status(400).json({ message: "One or more team IDs are invalid" });
    }

    if (teamIds.length > 0) {
      const teamCount = await Team.countDocuments({ _id: { $in: teamIds } });
      if (teamCount !== teamIds.length) {
        return res.status(400).json({ message: "One or more selected teams are invalid" });
      }
    }

    const project = await Project.create({
      name,
      description,
      startDate,
      endDate,
      status,
      team: teamIds,
      createdBy: req.user._id,
    });

    if (teamIds.length > 0) {
      await Team.updateMany(
        { _id: { $in: teamIds } },
        { $addToSet: { projects: project._id } },
      );
    }

    const populatedProject = await Project.findById(project._id)
      .populate("team", "name")
      .populate("createdBy", "name email");

    await notifyAdmins({
      type: "project_created",
      message: `Project created: ${project.name}`,
      link: "/admin/projects",
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project: populatedProject,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
const getAllProjects = async (req, res) => {
  try {
    let projects;
    let query = {};

    if (isAdminRole(req.user.role)) {
      // Admin / Super Admin see all projects
      projects = await Project.find()
        .populate("team", "name")
        .populate("createdBy", "name email");
    } else if (req.user.role === "projectManager") {
      // Project Manager sees projects they created
      projects = await Project.find({ createdBy: req.user._id })
        .populate("team", "name")
        .populate("createdBy", "name email");
    } else {
      // Team Member sees projects from their teams
      const userTeams = await Team.find({ members: req.user._id }).select(
        "_id",
      );
      const teamIds = userTeams.map((t) => t._id);
      projects = await Project.find({ team: { $in: teamIds } })
        .populate("team", "name")
        .populate("createdBy", "name email");
    }

    projects = await Promise.all(
      projects.map(async (project) => {
        const tasks = await Task.find({ projectId: project._id });
        return await enrichProjectWithTaskMetrics(project._doc, tasks, {
          persist: true,
        });
      }),
    );

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid project ID format" });
    }

    const project = await Project.findById(id)
      .populate({
        path: "team",
        select: "name description members lead",
        populate: [
          { path: "members", select: "name email profileImageUrl" },
          { path: "lead", select: "name email profileImageUrl" },
        ],
      })
      .populate("createdBy", "name email");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Get all tasks for this project
    const tasks = await Task.find({ projectId: id }).populate(
      "assignedTo",
      "name email profileImageUrl",
    );

    const enriched = await enrichProjectWithTaskMetrics(project._doc, tasks, {
      persist: true,
    });

    res.json({
      ...enriched,
      tasks,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin, Project Manager - only their own)
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid project ID format" });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check authorization
    if (isTaskViewOnlyRole(req.user.role)) {
      return res.status(403).json({
        message:
          "Super Admins and Admins can only view projects. Editing projects is not allowed for your role.",
      });
    }

    if (
      req.user.role !== "projectManager" &&
      project.createdBy.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this project" });
    }

    const { name, description, startDate, endDate, status, team } = req.body;

    const previousTeamIds = (project.team || []).map((teamId) => teamId.toString());
    const nextTeamIds = Array.isArray(team) ? [...new Set(team.map(String))] : null;

    if (
      nextTeamIds &&
      nextTeamIds.some((teamId) => !mongoose.Types.ObjectId.isValid(teamId))
    ) {
      return res.status(400).json({ message: "One or more team IDs are invalid" });
    }

    if (nextTeamIds && nextTeamIds.length > 0) {
      const teamCount = await Team.countDocuments({ _id: { $in: nextTeamIds } });
      if (teamCount !== nextTeamIds.length) {
        return res.status(400).json({ message: "One or more selected teams are invalid" });
      }
    }

    project.name = name || project.name;
    project.description = description || project.description;
    project.startDate = startDate || project.startDate;
    project.endDate = endDate || project.endDate;
    project.status = status || project.status;
    project.team = nextTeamIds || project.team;

    const updatedProject = await project.save();

    if (nextTeamIds) {
      const removedTeamIds = previousTeamIds.filter(
        (teamId) => !nextTeamIds.includes(teamId),
      );
      const addedTeamIds = nextTeamIds.filter(
        (teamId) => !previousTeamIds.includes(teamId),
      );

      if (removedTeamIds.length > 0) {
        await Team.updateMany(
          { _id: { $in: removedTeamIds } },
          { $pull: { projects: updatedProject._id } },
        );
      }

      if (addedTeamIds.length > 0) {
        await Team.updateMany(
          { _id: { $in: addedTeamIds } },
          { $addToSet: { projects: updatedProject._id } },
        );
      }
    }

    const populatedProject = await Project.findById(updatedProject._id)
      .populate("team", "name")
      .populate("createdBy", "name email");

    res.json({
      message: "Project updated successfully",
      project: populatedProject,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin, Project Manager - only their own)
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid project ID format" });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (isTaskViewOnlyRole(req.user.role)) {
      return res.status(403).json({
        message:
          "Super Admins and Admins can only view projects. Deleting projects is not allowed for your role.",
      });
    }

    if (
      req.user.role !== "projectManager" &&
      project.createdBy.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this project" });
    }

    const taskCount = await Task.countDocuments({ projectId: id });
    if (taskCount > 0) {
      return res.status(400).json({
        message:
          "Cannot delete project with existing tasks. Delete tasks first.",
      });
    }

    await Team.updateMany(
      { projects: id },
      { $pull: { projects: id } },
    );

    await project.deleteOne();
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get project progress
// @route   GET /api/projects/:id/progress
// @access  Private
const getProjectProgress = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid project ID format" });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const tasks = await Task.find({ projectId: id });
    const synced = await syncProjectFromTasks(id);

    res.json({
      projectId: id,
      status: synced?.status ?? project.status,
      progress: synced?.progress ?? project.progress,
      taskSummary: synced?.taskSummary,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectProgress,
  syncProjectFromTasks,
};
