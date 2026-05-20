import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { LuSearch, LuFilter, LuClock } from "react-icons/lu";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useUser } from "../../context/userContext";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import TaskStatusTabs from "../../components/TaskStatusTabs";
import TaskCard from "../../components/Cards/TaskCard";
import IncrementalListControls from "../../components/IncrementalListControls";
import useIncrementalList from "../../hooks/useIncrementalList";
import { getErrorMessage } from "../../utils/helper";

const MyTasks = () => {
  const { user } = useUser();
  const [allTasks, setAllTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const {
    visibleItems: visibleTasks,
    visibleCount: visibleTaskCount,
    totalCount: totalTaskCount,
    remainingCount: remainingTasksCount,
    showMore: showMoreTasks,
  } = useIncrementalList(filteredTasks, 4, [filteredTasks.length, searchTerm, filterStatus]);

  const navigate = useNavigate();
  const taskBasePath = user?.role === "tester" ? "/tester/tasks" : "/member/tasks";

  const getAllTasks = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS, {
        params: {
          status: filterStatus === "All" ? "" : filterStatus,
        },
      });

      const tasks = response.data?.tasks || [];
      setAllTasks(tasks);

      const statusSummary = response.data?.statusSummary || {};
      const statusArray = [
        { label: "All", count: statusSummary.all || 0 },
        { label: "Pending", count: statusSummary.pendingTasks || 0 },
        { label: "In Progress", count: statusSummary.inProgressTasks || 0 },
        { label: "In Review", count: statusSummary.inReviewTasks || 0 },
        { label: "Changes Requested", count: statusSummary.changesRequestedTasks || 0 },
        { label: "Completed", count: statusSummary.completedTasks || 0 },
      ];
      setTabs(statusArray);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (taskId) => {
    console.log("Navigating to task:", taskId);
    navigate(`${taskBasePath}/${taskId}`);
  };

  const handleUpdateStatus = (taskId) => {
    navigate(`/member/tasks/${taskId}`, { state: { openStatusEditor: true } });
  };

  // Apply search filter
  useEffect(() => {
    let filtered = [...allTasks];

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredTasks(filtered);
  }, [searchTerm, allTasks]);

  // Update filtered tasks when status filter changes
  useEffect(() => {
    if (filterStatus === "All") {
      setFilteredTasks(allTasks);
    } else {
      setFilteredTasks(allTasks.filter((task) => task.status === filterStatus));
    }
  }, [filterStatus, allTasks]);

  useEffect(() => {
    getAllTasks();
  }, []);

  return (
    <DashboardLayout activeMenu={user?.role === "tester" ? "Testing Tasks" : "My Tasks"}>
      <div className="my-5">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h2 className="text-xl md:text-2xl font-medium">My Tasks</h2>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 py-2 text-sm w-64"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-outline p-2"
              title="Filters"
            >
              <LuFilter />
            </button>
          </div>
        </div>

        {/* Tabs */}
        {tabs?.length > 0 && (
          <div className="mt-6">
            <TaskStatusTabs
              tabs={tabs}
              activeTab={filterStatus}
              setActiveTab={setFilterStatus}
            />
          </div>
        )}

        {/* Tasks Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {filteredTasks?.length > 0 ? (
              visibleTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onClick={() => handleTaskClick(task._id)}
                  onStatusUpdate={() => handleUpdateStatus(task._id)}
                  showActions={user?.role !== "tester"}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <LuClock className="text-5xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No tasks found</p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="text-primary hover:underline"
                  >
                    Clear search
                  </button>
                )}
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
    </DashboardLayout>
  );
};

export default MyTasks;
