import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { LuCalendar, LuFileSpreadsheet, LuFilter, LuUsers } from "react-icons/lu";
import moment from "moment";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import Modal from "../../components/Modal";
import TaskListTable from "../../components/TaskListTable";
import AvatarGroup from "../../components/AvatarGroup";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import TaskStatusTabs from "../../components/TaskStatusTabs";
import { getPriorityColor, getStatusColor } from "../../utils/helper";

const ManageTasks = () => {
  const [allTasks, setAllTasks] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedProject, setSelectedProject] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);

  const getAllTasks = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS);

      if (response.data) {
        const tasks = response.data?.tasks || [];
        const statusSummary = response.data?.statusSummary || {};

        setAllTasks(tasks);
        setTabs([
          { label: "All", count: statusSummary.all || tasks.length || 0 },
          { label: "Pending", count: statusSummary.pendingTasks || 0 },
          { label: "In Progress", count: statusSummary.inProgressTasks || 0 },
          { label: "Completed", count: statusSummary.completedTasks || 0 },
        ]);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.REPORTS.EXPORT_TASKS, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `tasks_report_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Report downloaded successfully");
    } catch (error) {
      console.error("Error downloading task report:", error);
      toast.error("Failed to download report. Please try again.");
    }
  };

  const projectOptions = useMemo(() => {
    const projectMap = new Map();
    allTasks.forEach((task) => {
      if (task?.projectId?._id && task?.projectId?.name) {
        projectMap.set(task.projectId._id, task.projectId.name);
      }
    });

    return Array.from(projectMap.entries()).map(([id, name]) => ({ id, name }));
  }, [allTasks]);

  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      const statusMatch = filterStatus === "All" || task.status === filterStatus;
      const projectMatch =
        selectedProject === "all" || task?.projectId?._id === selectedProject;
      return statusMatch && projectMatch;
    });
  }, [allTasks, filterStatus, selectedProject]);

  useEffect(() => {
    getAllTasks();
  }, []);

  return (
    <DashboardLayout activeMenu="Manage Tasks">
      <div className="my-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-medium">Tasks</h2>
            <p className="text-sm text-gray-500 mt-1">View all tasks across projects</p>
          </div>

          <button className="btn-outline flex items-center gap-2" onClick={handleDownloadReport}>
            <LuFileSpreadsheet className="text-lg" />
            Export Report
          </button>
        </div>

        <div className="mt-4 flex flex-col lg:flex-row lg:items-center gap-3">
          {tabs?.length > 0 && (
            <TaskStatusTabs tabs={tabs} activeTab={filterStatus} setActiveTab={setFilterStatus} />
          )}

          <div className="flex items-center gap-2 lg:ml-auto">
            <div className="relative">
              <LuFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
              >
                <option value="all">All Projects</option>
                {projectOptions.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="mt-6">
            <TaskListTable
              tableData={filteredTasks}
              showProject
              showSearch
              showActions={false}
              onRowClick={(task) => setSelectedTask(task)}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        title="Task Details"
        size="md"
      >
        {selectedTask && (
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">{selectedTask.title}</h4>
              <p className="text-sm text-gray-500 mt-1">
                {selectedTask.description || "No description provided"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500 mb-1">Project</p>
                <p className="text-sm font-medium text-gray-700">
                  {selectedTask?.projectId?.name || "N/A"}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTask.status)}`}
                >
                  {selectedTask.status}
                </span>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500 mb-1">Priority</p>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTask.priority)}`}
                >
                  {selectedTask.priority}
                </span>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500 mb-1">Due Date</p>
                <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <LuCalendar className="text-gray-400" />
                  {selectedTask?.dueDate
                    ? moment(selectedTask.dueDate).format("MMM D, YYYY")
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                <LuUsers className="text-gray-400" />
                Assigned Members ({selectedTask?.assignedTo?.length || 0})
              </p>
              {selectedTask?.assignedTo?.length > 0 ? (
                <AvatarGroup users={selectedTask.assignedTo} maxVisible={8} size="md" />
              ) : (
                <p className="text-sm text-gray-500">No assignees</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default ManageTasks;
