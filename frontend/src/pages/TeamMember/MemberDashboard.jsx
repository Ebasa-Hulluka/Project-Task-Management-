import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import {
  LuArrowRight,
  LuClock,
  LuCircleCheck,
  LuCircleAlert,
} from "react-icons/lu";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useUser } from "../../context/userContext";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import InfoCard from "../../components/Cards/InfoCard";
import TaskListTable from "../../components/TaskListTable";
import CustomPieChart from "../../components/Charts/CustomPieChart";
import CustomBarChart from "../../components/Charts/CustomBarChart";
import { addThousandSeparator, getGreeting } from "../../utils/helper";

const COLORS = ["#194f87", "#2e6aa3", "#0f5841"];

const MemberDashboard = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pieChartData, setPieChartData] = useState([]);
  const [barChartData, setBarChartData] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);

  // Prepare Chart Data
  const prepareChartData = (data) => {
    const taskDistribution = data?.taskDistribution || {};
    const taskPriorityLevels = data?.taskPriorityLevels || {};

    const taskDistributionData = [
      { name: "Pending", value: taskDistribution?.Pending || 0 },
      { name: "In Progress", value: taskDistribution?.InProgress || 0 },
      { name: "Completed", value: taskDistribution?.Completed || 0 },
    ];

    setPieChartData(taskDistributionData);

    const priorityLevelData = [
      { name: "High", value: taskPriorityLevels?.High || 0 },
      { name: "Medium", value: taskPriorityLevels?.Medium || 0 },
      { name: "Low", value: taskPriorityLevels?.Low || 0 },
    ];

    setBarChartData(priorityLevelData);
  };

  // Fetch dashboard data
  const getDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        API_PATHS.TASKS.GET_USER_DASHBOARD_DATA,
      );

      if (response.data) {
        setDashboardData(response.data);
        prepareChartData(response.data?.charts || {});

        if (response.data.recentTasks) {
          setRecentTasks(response.data.recentTasks);
        }

        // Calculate upcoming deadlines
        if (response.data.recentTasks) {
          const now = new Date();
          const upcoming = response.data.recentTasks
            .filter((task) => task.status !== "Completed" && task.dueDate)
            .map((task) => ({
              ...task,
              daysLeft: Math.ceil(
                (new Date(task.dueDate) - now) / (1000 * 60 * 60 * 24),
              ),
            }))
            .filter((task) => task.daysLeft <= 3 && task.daysLeft >= 0)
            .sort((a, b) => a.daysLeft - b.daysLeft)
            .slice(0, 3);

          setUpcomingDeadlines(upcoming);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeeAllTasks = () => {
    navigate("/member/tasks");
  };

  const handleTaskClick = (taskId) => {
    navigate(`/member/tasks/${taskId}`);
  };

  useEffect(() => {
    getDashboardData();
  }, []);

  // Calculate statistics
  const stats = {
    total: dashboardData?.statistics?.totalTasks || 0,
    pending: dashboardData?.statistics?.pendingTasks || 0,
    inProgress: dashboardData?.statistics?.inProgressTasks || 0,
    completed: dashboardData?.statistics?.completedTasks || 0,
  };

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="my-5">
        {/* Welcome Section */}
        <div className="card mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-medium text-gray-800">
              {getGreeting()} {user?.name}!
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              {moment().format("dddd, Do MMMM YYYY")}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card animate-pulse h-24"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoCard
              label="Total Tasks"
              value={addThousandSeparator(stats.total)}
              color="bg-primary"
              icon="📊"
            />
            <InfoCard
              label="Pending"
              value={addThousandSeparator(stats.pending)}
              color="bg-blue-500"
              icon="⏳"
            />
            <InfoCard
              label="In Progress"
              value={addThousandSeparator(stats.inProgress)}
              color="bg-blue-600"
              icon="🔄"
            />
            <InfoCard
              label="Completed"
              value={addThousandSeparator(stats.completed)}
              color="bg-green-600"
              icon="✅"
            />
          </div>
        )}

        {/* Upcoming Deadlines Alert */}
        {!loading && upcomingDeadlines.length > 0 && (
          <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-orange-700 mb-2">
              <LuCircleAlert className="text-lg" />
              <h4 className="font-medium">Upcoming Deadlines</h4>
            </div>
            <div className="space-y-2">
              {upcomingDeadlines.map((task) => (
                <div
                  key={task._id}
                  onClick={() => handleTaskClick(task._id)}
                  className="flex items-center justify-between bg-white p-3 rounded-lg cursor-pointer hover:shadow-sm transition-shadow"
                >
                  <div>
                    <p className="font-medium text-sm">{task.title}</p>
                    <p className="text-xs text-gray-500">
                      Due {moment(task.dueDate).format("MMM D, YYYY")}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      task.daysLeft === 0
                        ? "bg-red-100 text-red-700"
                        : task.daysLeft === 1
                          ? "bg-orange-100 text-orange-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {task.daysLeft === 0
                      ? "Today"
                      : task.daysLeft === 1
                        ? "Tomorrow"
                        : `${task.daysLeft} days left`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts Section */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
            <div className="card">
              <h5 className="font-medium mb-4">Task Distribution</h5>
              {pieChartData.some((d) => d.value > 0) ? (
                <CustomPieChart data={pieChartData} colors={COLORS} />
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  No tasks assigned yet
                </div>
              )}
            </div>

            <div className="card">
              <h5 className="font-medium mb-4">Task Priority Levels</h5>
              {barChartData.some((d) => d.value > 0) ? (
                <CustomBarChart data={barChartData} />
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  No priority data available
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Tasks */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-lg font-semibold">My Recent Tasks</h5>
            <button className="card-btn" onClick={handleSeeAllTasks}>
              See All <LuArrowRight className="text-base inline ml-1" />
            </button>
          </div>

          {loading ? (
            <div className="animate-pulse h-32"></div>
          ) : recentTasks.length > 0 ? (
            <TaskListTable
              tableData={recentTasks}
              onRowClick={handleTaskClick}
              showProject={true}
            />
          ) : (
            <div className="text-center py-8">
              <LuClock className="text-4xl text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No tasks assigned yet</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MemberDashboard;

