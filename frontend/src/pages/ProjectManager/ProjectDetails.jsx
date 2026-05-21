import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import moment from "moment";
import {
  LuArrowLeft,
  LuPencil,
  LuPlus,
  LuUsers,
  LuCalendar,
  LuClipboardCheck,
  LuTrendingUp,
} from "react-icons/lu";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import DeleteAlert from "../../components/DeleteAlert";
import TaskListTable from "../../components/TaskListTable";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import AvatarGroup from "../../components/AvatarGroup";
import ProjectProgressBar from "../../components/ProjectProgressBar";
import { getStatusColor, getErrorMessage } from "../../utils/helper";
import { getProjectTeamDisplay } from "../../utils/projectTeam";
import { getProjectPaths, isTaskViewOnlyRole } from "../../utils/rolePaths";
import { getProjectDisplayName } from "../../utils/projectDisplay";
import { useUser } from "../../context/userContext";

const StatCard = ({ label, value, tone = "default" }) => {
  const tones = {
    default: "bg-white text-gray-700",
    green: "bg-green-50 text-green-700",
    blue: "bg-blue-50 text-blue-700",
    yellow: "bg-yellow-50 text-yellow-700",
  };

  return (
    <div className={`rounded-xl p-4 shadow-sm border border-gray-100 ${tones[tone]}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
};

const InfoTile = ({ icon: Icon, label, children }) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 h-full">
    <div className="flex items-center gap-2 mb-3">
      <span className="inline-flex p-2 rounded-lg bg-white border border-gray-100">
        <Icon className="text-gray-600 text-lg" />
      </span>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
    </div>
    {children}
  </div>
);

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const projectPaths = getProjectPaths(user?.role);
  const isViewOnly = isTaskViewOnlyRole(user?.role);
  const canManageTasks = !isViewOnly;

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskFilter, setTaskFilter] = useState("all");
  const [deleteTaskId, setDeleteTaskId] = useState("");
  const [deletingTaskId, setDeletingTaskId] = useState("");

  const fetchProjectData = async () => {
    try {
      setLoading(true);

      const [projectResponse, tasksResponse] = await Promise.all([
        axiosInstance.get(API_PATHS.PROJECTS.GET_PROJECT_BY_ID(id)),
        axiosInstance.get(API_PATHS.TASKS.GET_TASKS_BY_PROJECT(id)),
      ]);

      if (projectResponse.data) {
        setProject(projectResponse.data);
      }

      if (tasksResponse.data) {
        setTasks(tasksResponse.data);
      }
    } catch (error) {
      console.error("Error fetching project data:", error);
      toast.error("Failed to load project details");
      navigate(projectPaths.list);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProject = () => {
    navigate(projectPaths.edit(id));
  };

  const handleCreateTask = () => {
    navigate("/manager/tasks/create", {
      state: { projectId: id, projectName: project?.name },
    });
  };

  const handleTaskClick = (task) => {
    navigate(`/manager/tasks/${task._id}`);
  };

  const handleEditTask = (task) => {
    navigate(`/manager/tasks/edit/${task._id}`);
  };

  const handleDeleteTask = (task) => {
    setDeleteTaskId(task._id);
  };

  const confirmDeleteTask = async () => {
    if (!deleteTaskId) return;

    try {
      setDeletingTaskId(deleteTaskId);
      await axiosInstance.delete(API_PATHS.TASKS.DELETE_TASK(deleteTaskId));
      toast.success("Task deleted successfully");
      setDeleteTaskId("");
      setTasks((prev) => prev.filter((task) => task._id !== deleteTaskId));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingTaskId("");
    }
  };

  const getFilteredTasks = () => {
    if (taskFilter === "all") return tasks;
    return tasks.filter((task) => task.status === taskFilter);
  };

  useEffect(() => {
    if (id) {
      fetchProjectData();
    }
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout activeMenu="Project Details">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout activeMenu="Project Details">
        <div className="text-center py-12">
          <p className="text-gray-500">Project not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const filteredTasks = getFilteredTasks();
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "Completed").length,
    inProgress: tasks.filter((t) => t.status === "In Progress").length,
    pending: tasks.filter((t) => t.status === "Pending").length,
  };

  const { teamNames, users: teamMemberUsers } = getProjectTeamDisplay(project.team);
  const projectProgress = Math.min(100, Math.max(0, project.progress || 0));
  const timelineLabel =
    project.startDate || project.endDate
      ? `${project.startDate ? moment(project.startDate).format("MMM D") : "—"} – ${
          project.endDate ? moment(project.endDate).format("MMM D, YYYY") : "—"
        }`
      : "Not set";

  return (
    <DashboardLayout activeMenu="Project Details">
      <div className="my-5 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <LuArrowLeft className="text-xl" />
            </button>
            <div>
              <h2 className="text-xl md:text-2xl font-medium">Project Details</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Overview and tasks for this project
              </p>
            </div>
          </div>

          {canManageTasks && (
            <button
              onClick={handleEditProject}
              className="btn-outline flex items-center justify-center gap-2 shrink-0"
            >
              <LuPencil />
              Edit Project
            </button>
          )}
        </div>

        {/* Project overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {getProjectDisplayName(project.name)}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Created {moment(project.createdAt).fromNow()}
                </p>
              </div>
              <span
                className={`self-start px-3 py-1 rounded-full text-sm font-medium shrink-0 ${getStatusColor(project.status)}`}
              >
                {project.status}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">
                {project.description?.trim() || "No description provided."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoTile icon={LuCalendar} label="Timeline">
                <p className="text-sm font-medium text-gray-900">{timelineLabel}</p>
              </InfoTile>

              <InfoTile icon={LuUsers} label="Teams">
                {teamNames.length > 0 ? (
                  <>
                    <ul className="space-y-1">
                      {teamNames.map((name) => (
                        <li
                          key={name}
                          className="text-sm font-medium text-gray-900"
                        >
                          {name}
                        </li>
                      ))}
                    </ul>
                    {teamMemberUsers.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200/80">
                        <p className="text-xs text-gray-500 mb-2">
                          {teamMemberUsers.length} member
                          {teamMemberUsers.length !== 1 ? "s" : ""} across teams
                        </p>
                        <AvatarGroup
                          users={teamMemberUsers}
                          maxVisible={5}
                          showTooltip
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500">No teams assigned</p>
                )}
              </InfoTile>

              <InfoTile icon={LuTrendingUp} label="Overall progress">
                <div className="flex items-baseline justify-between gap-2 mb-3">
                  <span className="text-2xl font-semibold text-gray-900">
                    {projectProgress}%
                  </span>
                  {projectProgress === 100 && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                      Complete
                    </span>
                  )}
                </div>
                <ProjectProgressBar progress={projectProgress} showLabel={false} />
              </InfoTile>
            </div>
          </div>
        </div>

        {/* Task stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Tasks" value={taskStats.total} />
          <StatCard label="Completed" value={taskStats.completed} tone="green" />
          <StatCard label="In Progress" value={taskStats.inProgress} tone="blue" />
          <StatCard label="Pending" value={taskStats.pending} tone="yellow" />
        </div>

        {/* Tasks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Project Tasks</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
                {taskFilter !== "all" ? ` · ${taskFilter}` : ""}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <select
                value={taskFilter}
                onChange={(e) => setTaskFilter(e.target.value)}
                className="input text-sm py-2 min-w-[140px]"
              >
                <option value="all">All Tasks</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="In Review">In Review</option>
                <option value="Completed">Completed</option>
              </select>

              {canManageTasks && (
                <button
                  onClick={handleCreateTask}
                  className="btn-primary flex items-center justify-center gap-2 text-sm whitespace-nowrap"
                >
                  <LuPlus />
                  New Task
                </button>
              )}
            </div>
          </div>

          {filteredTasks.length > 0 ? (
            <TaskListTable
              tableData={filteredTasks}
              onRowClick={handleTaskClick}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              showActions={canManageTasks}
              itemsPerPage={8}
            />
          ) : (
            <div className="text-center py-12 rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
              <LuClipboardCheck className="text-4xl text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No tasks in this project</p>
              <p className="text-sm text-gray-400 mt-1">
                {taskFilter !== "all"
                  ? "Try a different filter or create a new task."
                  : "Create a task to get started."}
              </p>
              {canManageTasks && (
                <button onClick={handleCreateTask} className="btn-primary mt-4">
                  Create First Task
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <DeleteAlert
        isOpen={Boolean(deleteTaskId)}
        onClose={() => setDeleteTaskId("")}
        onConfirm={confirmDeleteTask}
        title="Delete Task"
        message="Are you sure you want to delete this task? This cannot be undone."
        itemName={tasks.find((task) => task._id === deleteTaskId)?.title || ""}
        loading={deletingTaskId === deleteTaskId}
      />
    </DashboardLayout>
  );
};

export default ProjectDetails;
