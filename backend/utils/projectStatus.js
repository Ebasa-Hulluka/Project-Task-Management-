const Task = require("../models/Task");
const Project = require("../models/Project");

const isTaskFinished = (task) => task?.status === "Completed";

const buildTaskSummary = (tasks) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(isTaskFinished).length;
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress").length;
  const pendingTasks = tasks.filter((t) => t.status === "Pending").length;
  const inReviewTasks = tasks.filter((t) => t.status === "In Review").length;
  const changesRequestedTasks = tasks.filter(
    (t) => t.status === "Changes Requested",
  ).length;

  const progress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    pendingTasks,
    inReviewTasks,
    changesRequestedTasks,
    progress,
    taskSummary: {
      total: totalTasks,
      completed: completedTasks,
      inProgress: inProgressTasks,
      pending: pendingTasks,
      inReview: inReviewTasks,
      changesRequested: changesRequestedTasks,
    },
  };
};

/**
 * Derive project status from its tasks (and testing workflow).
 * - All tasks Completed → Completed
 * - Any work started → Active
 * - Otherwise → Planning (unless manually On Hold)
 */
const deriveProjectStatus = (storedStatus, tasks) => {
  if (storedStatus === "On Hold") {
    return "On Hold";
  }

  const total = tasks.length;
  if (total === 0) {
    return storedStatus || "Planning";
  }

  const finishedCount = tasks.filter(isTaskFinished).length;
  if (finishedCount === total) {
    return "Completed";
  }

  const hasStarted = tasks.some((t) =>
    ["In Progress", "In Review", "Changes Requested", "Completed"].includes(
      t.status,
    ),
  );
  if (hasStarted) {
    return "Active";
  }

  return "Planning";
};

const enrichProjectWithTaskMetrics = async (
  projectDoc,
  tasks,
  { persist = false } = {},
) => {
  const { progress, taskSummary } = buildTaskSummary(tasks);
  const status = deriveProjectStatus(projectDoc.status, tasks);

  if (persist && projectDoc._id) {
    const needsUpdate =
      projectDoc.status !== status || projectDoc.progress !== progress;
    if (needsUpdate) {
      await Project.findByIdAndUpdate(projectDoc._id, { status, progress });
    }
  }

  return {
    ...projectDoc,
    status,
    progress,
    taskSummary,
  };
};

const syncProjectFromTasks = async (projectId) => {
  if (!projectId) return null;

  const project = await Project.findById(projectId);
  if (!project) return null;

  const tasks = await Task.find({ projectId });
  const { progress, taskSummary } = buildTaskSummary(tasks);
  const status = deriveProjectStatus(project.status, tasks);

  project.status = status;
  project.progress = progress;
  await project.save();

  return { project, tasks, taskSummary, progress, status };
};

module.exports = {
  isTaskFinished,
  buildTaskSummary,
  deriveProjectStatus,
  enrichProjectWithTaskMetrics,
  syncProjectFromTasks,
};
