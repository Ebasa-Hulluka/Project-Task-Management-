import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { LuArrowRight } from "react-icons/lu";

import { useUser } from "../../context/userContext";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import InfoCard from "../../components/Cards/InfoCard";
import TaskListTable from "../../components/TaskListTable";
import CustomPieChart from "../../components/Charts/CustomPieChart";
import CustomBarChart from "../../components/Charts/CustomBarChart";
import { addThousandSeparator, getGreeting } from "../../utils/helper";

const COLORS = ["#194f87", "#2e6aa3", "#0f5841"];

const Dashboard = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pieChartData, setPieChartData] = useState([]);
  const [barChartData, setBarChartData] = useState({});

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

    const PriorityLevelData = [
      { name: "High", value: taskPriorityLevels?.High || 0 },
      { name: "Medium", value: taskPriorityLevels?.Medium || 0 },
      { name: "Low", value: taskPriorityLevels?.Low || 0 },
    ];

    setBarChartData(PriorityLevelData);
  };

  const getDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        API_PATHS.TASKS.GET_DASHBOARD_DATA,
      );

      if (response.data) {
        setDashboardData(response.data);
        prepareChartData(response.data?.charts || {});

        if (response.data.recentTasks) {
          setRecentTasks(response.data.recentTasks);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent tasks if not included in dashboard data
  const getRecentTasks = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS);
      if (response.data && Array.isArray(response.data.tasks)) {
        // Get the 5 most recent tasks
        const sorted = [...response.data.tasks].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );
        setRecentTasks(sorted.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching recent tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSeeMore = () => {
    navigate("/admin/tasks");
  };

  useEffect(() => {
    getDashboardData();
    getRecentTasks();
  }, []);

  // Calculate statistics
  const statistics = {
    totalTasks: dashboardData?.charts?.taskDistribution?.All || 0,
    pendingTasks: dashboardData?.charts?.taskDistribution?.Pending || 0,
    inProgressTasks: dashboardData?.charts?.taskDistribution?.InProgress || 0,
    completedTasks: dashboardData?.charts?.taskDistribution?.Completed || 0,
  };

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="card my-5">
        <div>
          <div className="col-span-3">
            <h2 className="text-lg md:text-xl font-medium text-gray-800">
              {getGreeting()} {user?.name}
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              {moment().format("dddd, Do MMMM YYYY")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mt-6">
          <InfoCard
            label="Total Tasks"
            value={addThousandSeparator(statistics.totalTasks)}
            color="bg-primary"
            icon="📊"
          />
          <InfoCard
            label="Pending"
            value={addThousandSeparator(statistics.pendingTasks)}
            color="bg-blue-500"
            icon="⏳"
          />
          <InfoCard
            label="In Progress"
            value={addThousandSeparator(statistics.inProgressTasks)}
            color="bg-blue-600"
            icon="🔄"
          />
          <InfoCard
            label="Completed"
            value={addThousandSeparator(statistics.completedTasks)}
            color="bg-green-600"
            icon="✅"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 md:my-6">
        <div>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h5 className="font-medium">Task Distribution by Status</h5>
            </div>
            {pieChartData.length > 0 ? (
              <CustomPieChart data={pieChartData} colors={COLORS} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h5 className="font-medium">Task Priority Levels</h5>
            </div>
            {barChartData.length > 0 ? (
              <CustomBarChart data={barChartData} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-lg font-semibold">Recent Tasks</h5>
              <button className="card-btn" onClick={onSeeMore}>
                See All <LuArrowRight className="text-base inline ml-1" />
              </button>
            </div>

            {!loading && (
              <TaskListTable tableData={recentTasks} showProject={true} />
            )}

            {!loading && recentTasks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No recent tasks found
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

