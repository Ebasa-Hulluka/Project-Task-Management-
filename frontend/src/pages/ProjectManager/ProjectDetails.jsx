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
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import AvatarGroup from "../../components/AvatarGroup";
import TaskCard from "../../components/Cards/TaskCard";
import ProjectProgressBar from "../../components/ProjectProgressBar";
import IncrementalListControls from "../../components/IncrementalListControls";
import useIncrementalList from "../../hooks/useIncrementalList";
import { getStatusColor } from "../../utils/helper";

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskFilter, setTaskFilter] = useState("all");

  // Fetch project details and tasks
  const fetchProjectData = async () => {
    try {
      setLoading(true);

      // Fetch project details
      const projectResponse = await axiosInstance.get(
        API_PATHS.PROJECTS.GET_PROJECT_BY_ID(id),
      );

      if (projectResponse.data) {
        setProject(projectResponse.data);
      }

      // Fetch tasks for this project
      const tasksResponse = await axiosInstance.get(
        API_PATHS.TASKS.GET_TASKS_BY_PROJECT(id),
      );

      if (tasksResponse.data) {
        setTasks(tasksResponse.data);
      }
    } catch (error) {
      console.error("Error fetching project data:", error);
      toast.error("Failed to load project details");
      navigate("/manager/projects");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit project
  const handleEditProject = () => {
    navigate(`/manager/projects/edit/${id}`);
  };

  // Handle create task
  const handleCreateTask = () => {
    navigate("/manager/tasks/create", {
      state: { projectId: id, projectName: project?.name },
    });
  };

  // Handle task click
  const handleTaskClick = (taskId) => {
    navigate(`/manager/tasks/${taskId}`);
  };

  // Filter tasks
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
  const {
    visibleItems: visibleTasks,
    visibleCount: visibleTaskCount,
    totalCount: totalTaskCount,
    remainingCount: remainingTasksCount,
    showMore: showMoreTasks,
  } = useIncrementalList(filteredTasks, 4, [filteredTasks.length, taskFilter, id]);
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "Completed").length,
    inProgress: tasks.filter((t) => t.status === "In Progress").length,
    pending: tasks.filter((t) => t.status === "Pending").length,
  };

  return (
    <DashboardLayout activeMenu="Project Details">
      <div className="my-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LuArrowLeft className="text-xl" />
            </button>
            <h2 className="text-xl md:text-2xl font-medium">Project Details</h2>
          </div>

          <button
            onClick={handleEditProject}
            className="btn-outline flex items-center gap-2"
          >
            <LuPencil />
            Edit Project
          </button>
        </div>

        {/* Project Info Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold">{project.name}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Created {moment(project.createdAt).fromNow()}
              </p>
            </div>
            <span
              className={`mt-2 md:mt-0 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}
            >
              {project.status}
            </span>
          </div>

          <p className="text-gray-700 mb-6">
            {project.description || "No description provided."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <LuCalendar className="text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Timeline</p>
                <p className="text-sm font-medium">
                  {project.startDate
                    ? moment(project.startDate).format("MMM D")
                    : "N/A"}{" "}
                  -{" "}
                  {project.endDate
                    ? moment(project.endDate).format("MMM D, YYYY")
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <LuUsers className="text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Team Members</p>
                <AvatarGroup
                  avatars={project.team?.map((m) => m.profileImageUrl) || []}
                  maxVisible={5}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <LuTrendingUp className="text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Progress</p>
                <ProjectProgressBar progress={project.progress || 0} />
              </div>
            </div>
          </div>
        </div>

        {/* Task Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Total Tasks</p>
            <p className="text-2xl font-semibold">{taskStats.total}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600">Completed</p>
            <p className="text-2xl font-semibold text-green-700">
              {taskStats.completed}
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600">In Progress</p>
            <p className="text-2xl font-semibold text-blue-700">
              {taskStats.inProgress}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-600">Pending</p>
            <p className="text-2xl font-semibold text-yellow-700">
              {taskStats.pending}
            </p>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Project Tasks</h3>

            <div className="flex items-center gap-4 mt-2 md:mt-0">
              <select
                value={taskFilter}
                onChange={(e) => setTaskFilter(e.target.value)}
                className="input text-sm py-1.5"
              >
                <option value="all">All Tasks</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>

              <button
                onClick={handleCreateTask}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <LuPlus />
                New Task
              </button>
            </div>
          </div>

          {filteredTasks.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onClick={() => handleTaskClick(task._id)}
                  />
                ))}
              </div>

              <IncrementalListControls
                visibleCount={visibleTaskCount}
                totalCount={totalTaskCount}
                remainingCount={remainingTasksCount}
                onShowMore={showMoreTasks}
                batchSize={4}
                itemLabel="tasks"
              />
            </>
          ) : (
            <div className="text-center py-12">
              <LuClipboardCheck className="text-4xl text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No tasks found for this project</p>
              <button onClick={handleCreateTask} className="btn-primary mt-4">
                Create First Task
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProjectDetails;
