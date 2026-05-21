import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import moment from "moment";
import {
  LuFolder,
  LuClipboardCheck,
  LuClock,
  LuCircleCheck,
  LuArrowRight,
  LuTrendingUp,
} from "react-icons/lu";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useUser } from "../../context/userContext";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import InfoCard from "../../components/Cards/InfoCard";
import ProjectCard from "../../components/Cards/ProjectCard";
import TaskListTable from "../../components/TaskListTable";
import CustomBarChart from "../../components/Charts/CustomBarChart";
import CustomPieChart from "../../components/Charts/CustomPieChart";
import { getGreeting, addThousandSeparator } from "../../utils/helper";
import { isTaskViewOnlyRole } from "../../utils/rolePaths";

const COLORS = ["#194f87", "#2e6aa3", "#0f5841"];

const ManagerDashboard = () => {
  const { user } = useUser();
  const isViewOnly = isTaskViewOnlyRole(user?.role);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
  });
  const [chartData, setChartData] = useState({
    taskDistribution: [],
    priorityLevels: [],
  });

  // Fetch manager dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch projects created by this manager
      const projectsResponse = await axiosInstance.get(
        API_PATHS.PROJECTS.GET_ALL_PROJECTS,
      );

      if (projectsResponse.data) {
        const projectsData = Array.isArray(projectsResponse.data)
          ? projectsResponse.data
          : [];
        setProjects(projectsData);

        // Calculate project stats
        const activeCount = projectsData.filter(
          (p) => p.status === "Active",
        ).length;

        // Fetch tasks for all projects
        let allTasks = [];
        let completedCount = 0;
        let pendingCount = 0;
        let inProgressCount = 0;
        let highPriority = 0;
        let mediumPriority = 0;
        let lowPriority = 0;

        // Get tasks from each project
        for (const project of projectsData) {
          try {
            const tasksResponse = await axiosInstance.get(
              API_PATHS.TASKS.GET_TASKS_BY_PROJECT(project._id),
            );

            if (tasksResponse.data) {
              const tasks = Array.isArray(tasksResponse.data)
                ? tasksResponse.data
                : [];
              allTasks = [...allTasks, ...tasks];

              // Calculate task stats
              tasks.forEach((task) => {
                if (task.status === "Completed") completedCount++;
                else if (task.status === "In Progress") inProgressCount++;
                else if (task.status === "Pending") pendingCount++;

                if (task.priority === "High") highPriority++;
                else if (task.priority === "Medium") mediumPriority++;
                else if (task.priority === "Low") lowPriority++;
              });
            }
          } catch (error) {
            console.error(
              `Error fetching tasks for project ${project._id}:`,
              error,
            );
          }
        }

        // Update stats
        setStats({
          totalProjects: projectsData.length,
          activeProjects: activeCount,
          totalTasks: allTasks.length,
          completedTasks: completedCount,
          pendingTasks: pendingCount,
          inProgressTasks: inProgressCount,
        });

        // Update chart data
        setChartData({
          taskDistribution: [
            { name: "Completed", value: completedCount },
            { name: "In Progress", value: inProgressCount },
            { name: "Pending", value: pendingCount },
          ],
          priorityLevels: [
            { name: "High", value: highPriority },
            { name: "Medium", value: mediumPriority },
            { name: "Low", value: lowPriority },
          ],
        });

        // Get recent tasks (last 5)
        const sortedTasks = allTasks.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );
        setRecentTasks(sortedTasks.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleViewAllProjects = () => {
    navigate("/manager/projects");
  };

  const handleViewAllTasks = () => {
    navigate("/manager/tasks");
  };

  const handleProjectClick = (projectId) => {
    navigate(`/manager/projects/${projectId}`);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="my-5">
        {/* Welcome Section */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-medium text-gray-800">
                {getGreeting()} {user?.name}!
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {moment().format("dddd, Do MMMM YYYY")}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={() => navigate("/manager/projects/create")}
                className="btn-primary"
              >
                + New Project
              </button>
            </div>
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
              label="Total Projects"
              value={addThousandSeparator(stats.totalProjects)}
              color="bg-primary"
              icon={<LuFolder />}
            />
            <InfoCard
              label="Active Projects"
              value={addThousandSeparator(stats.activeProjects)}
              color="bg-blue-500"
              icon={<LuTrendingUp />}
            />
            <InfoCard
              label="Total Tasks"
              value={addThousandSeparator(stats.totalTasks)}
              color="bg-blue-500"
              icon={<LuClipboardCheck />}
            />
            <InfoCard
              label="Completed Tasks"
              value={addThousandSeparator(stats.completedTasks)}
              color="bg-green-600"
              icon={<LuCircleCheck />}
            />
          </div>
        )}

        {/* Charts Section */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
            <div className="card">
              <h5 className="font-medium mb-4">Task Distribution</h5>
              {chartData.taskDistribution.some((d) => d.value > 0) ? (
                <CustomPieChart
                  data={chartData.taskDistribution}
                  colors={COLORS}
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  No task data available
                </div>
              )}
            </div>

            <div className="card">
              <h5 className="font-medium mb-4">Task Priority Levels</h5>
              {chartData.priorityLevels.some((d) => d.value > 0) ? (
                <CustomBarChart data={chartData.priorityLevels} />
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  No priority data available
                </div>
              )}
            </div>
          </div>
        )}

        {/* Projects Section */}
        <div className="card mt-6">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-lg font-semibold">Your Projects</h5>
            <button className="card-btn" onClick={handleViewAllProjects}>
              See All <LuArrowRight className="inline ml-1" />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card animate-pulse h-48"></div>
              ))}
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.slice(0, 3).map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  onClick={() => handleProjectClick(project._id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No projects yet</p>
              {!isViewOnly && (
                <button
                  onClick={() => navigate("/manager/projects/create")}
                  className="btn-primary"
                >
                  Create Your First Project
                </button>
              )}
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="card mt-6">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-lg font-semibold">Recent Tasks</h5>
            <button className="card-btn" onClick={handleViewAllTasks}>
              See All <LuArrowRight className="inline ml-1" />
            </button>
          </div>

          {loading ? (
            <div className="animate-pulse h-32"></div>
          ) : recentTasks.length > 0 ? (
            <TaskListTable tableData={recentTasks} showProject={true} />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No tasks yet</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManagerDashboard;

