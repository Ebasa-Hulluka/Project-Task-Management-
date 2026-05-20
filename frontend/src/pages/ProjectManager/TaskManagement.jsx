import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { LuPlus, LuSearch, LuFilter, LuClipboardCheck } from "react-icons/lu";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import TaskCard from "../../components/Cards/TaskCard";
import TaskStatusTabs from "../../components/TaskStatusTabs";
import IncrementalListControls from "../../components/IncrementalListControls";
import useIncrementalList from "../../hooks/useIncrementalList";
import { getErrorMessage } from "../../utils/helper";
import DeleteAlert from "../../components/DeleteAlert";

const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterProject, setFilterProject] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [tabs, setTabs] = useState([]);
  const [deleteTaskId, setDeleteTaskId] = useState("");
  const [deletingTaskId, setDeletingTaskId] = useState("");
  const {
    visibleItems: visibleTasks,
    visibleCount: visibleTaskCount,
    totalCount: totalTaskCount,
    remainingCount: remainingTasksCount,
    showMore: showMoreTasks,
  } = useIncrementalList(filteredTasks, 4, [
    filteredTasks.length,
    searchTerm,
    filterStatus,
    filterProject,
  ]);

  const navigate = useNavigate();

  // Fetch all tasks and projects
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch tasks
      const tasksResponse = await axiosInstance.get(
        API_PATHS.TASKS.GET_ALL_TASKS,
      );

      if (tasksResponse.data) {
        const allTasks = tasksResponse.data.tasks || [];
        setTasks(allTasks);

        // Update tabs with counts
        const statusSummary = tasksResponse.data.statusSummary || {};
        const statusArray = [
          { label: "All", count: statusSummary.all || 0 },
          { label: "Pending", count: statusSummary.pendingTasks || 0 },
          { label: "In Progress", count: statusSummary.inProgressTasks || 0 },
          { label: "In Review", count: statusSummary.inReviewTasks || 0 },
          { label: "Changes Requested", count: statusSummary.changesRequestedTasks || 0 },
          { label: "Completed", count: statusSummary.completedTasks || 0 },
        ];
        setTabs(statusArray);
      }

      // Fetch projects for filter
      const projectsResponse = await axiosInstance.get(
        API_PATHS.PROJECTS.GET_ALL_PROJECTS,
      );

      if (projectsResponse.data) {
        setProjects(projectsResponse.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Handle task click
  const handleTaskClick = (taskId) => {
    navigate(`/manager/tasks/${taskId}`);
  };

  // Handle create task
  const handleCreateTask = () => {
    navigate("/manager/tasks/create");
  };

  // Handle edit task
  const handleEditTask = (taskId) => {
    navigate(`/manager/tasks/edit/${taskId}`);
  };

  // Handle delete task
  const handleDeleteTask = async (taskId) => {
    setDeleteTaskId(taskId);
  };

  const confirmDeleteTask = async () => {
    if (!deleteTaskId) return;

    try {
      setDeletingTaskId(deleteTaskId);
      await axiosInstance.delete(API_PATHS.TASKS.DELETE_TASK(deleteTaskId));
      toast.success("Task deleted successfully");
      setDeleteTaskId("");
      fetchData(); // Refresh list
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingTaskId("");
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...tasks];

    // Apply status filter
    if (filterStatus !== "All") {
      filtered = filtered.filter((task) => task.status === filterStatus);
    }

    // Apply project filter
    if (filterProject !== "all") {
      filtered = filtered.filter(
        (task) => task.projectId?._id === filterProject,
      );
    }

    // Apply search
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredTasks(filtered);
  }, [searchTerm, filterStatus, filterProject, tasks]);

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DashboardLayout activeMenu="Tasks">
      <div className="my-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-medium">Task Management</h2>
            <p className="text-sm text-gray-500 mt-1">
              Create and manage tasks across your projects
            </p>
          </div>

          <button
            className="btn-primary flex items-center gap-2"
            onClick={handleCreateTask}
          >
            <LuPlus className="text-lg" />
            New Task
          </button>
        </div>

        {/* Tabs */}
        {tabs.length > 0 && (
          <div className="mt-6">
            <TaskStatusTabs
              tabs={tabs}
              activeTab={filterStatus}
              setActiveTab={setFilterStatus}
            />
          </div>
        )}

        {/* Search and Filters */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>

            <button
              className="btn-outline flex items-center gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <LuFilter />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project
                  </label>
                  <select
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="input w-full"
                  >
                    <option value="all">All Projects</option>
                    {projects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tasks Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {filteredTasks.length > 0 ? (
              visibleTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onClick={() => handleTaskClick(task._id)}
                  onEdit={() => handleEditTask(task._id)}
                  onDelete={() => handleDeleteTask(task._id)}
                  showActions={true}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <LuClipboardCheck className="text-5xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No tasks found</p>
                <button className="btn-primary" onClick={handleCreateTask}>
                  Create Your First Task
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && filteredTasks.length > 0 && (
          <IncrementalListControls
            visibleCount={visibleTaskCount}
            totalCount={totalTaskCount}
            remainingCount={remainingTasksCount}
            onShowMore={showMoreTasks}
            batchSize={4}
            itemLabel="tasks"
          />
        )}
      </div>

      <DeleteAlert
        isOpen={Boolean(deleteTaskId)}
        onClose={() => setDeleteTaskId("")}
        onConfirm={confirmDeleteTask}
        title="Delete Task"
        message="Are you sure you want to delete this task?"
        itemName={tasks.find((task) => task._id === deleteTaskId)?.title || ""}
        loading={deletingTaskId === deleteTaskId}
      />
    </DashboardLayout>
  );
};

export default TaskManagement;
