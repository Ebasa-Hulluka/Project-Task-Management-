import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  LuFileSpreadsheet,
  LuCalendar,
  LuChartBar,
  LuChartPie,
} from "react-icons/lu";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import CustomBarChart from "../../components/Charts/CustomBarChart";
import CustomPieChart from "../../components/Charts/CustomPieChart";

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [reportType, setReportType] = useState("tasks");
  const [reportData, setReportData] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch report data
  const fetchReportData = async (type = reportType) => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;

      let endpoint = API_PATHS.REPORTS.TASKS;
      if (type === "users") endpoint = API_PATHS.REPORTS.USERS;
      if (type === "projects") endpoint = API_PATHS.REPORTS.PROJECTS;

      const response = await axiosInstance.get(endpoint, { params });
      const payload = response?.data || {};
      setReportData(payload);
    } catch (error) {
      console.error("Error fetching report data:", error);
      const message =
        error?.message ||
        error?.response?.data?.message ||
        "Failed to fetch report data";
      setError(message);
      toast.error(message);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle export
  const handleExport = async (type) => {
    try {
      setExportLoading(true);

      let apiPath;
      let fileName;

      switch (type) {
        case "tasks":
          apiPath = API_PATHS.REPORTS.EXPORT_TASKS;
          fileName = "tasks_report";
          break;
        case "users":
          apiPath = API_PATHS.REPORTS.EXPORT_USERS;
          fileName = "users_report";
          break;
        case "projects":
          apiPath = API_PATHS.REPORTS.EXPORT_PROJECTS;
          fileName = "projects_report";
          break;
        default:
          return;
      }

      const response = await axiosInstance.get(apiPath, {
        responseType: "blob",
      });

      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${fileName}_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${type} report downloaded successfully`);
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("Failed to export report");
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData(reportType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType]);

  const COLORS = ["#0f5841", "#2f7d65", "#194f87", "#2e6aa3"];

  return (
    <DashboardLayout activeMenu="Reports">
      <div className="my-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-medium">
              Reports & Analytics
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              View and export detailed reports
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="btn-outline flex items-center gap-2"
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              <LuCalendar />
              Date Range
            </button>
          </div>
        </div>

        {/* Date Range Picker */}
        {showDatePicker && (
          <div className="mt-4 p-4 bg-white rounded-lg shadow-sm border">
            <div className="flex flex-col md:flex-row items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, startDate: e.target.value })
                  }
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, endDate: e.target.value })
                  }
                  className="input"
                />
              </div>
              <button
                className="btn-primary"
                onClick={() => fetchReportData(reportType)}
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Report Type Tabs */}
        <div className="mt-6 border-b">
          <div className="flex gap-6">
            <button
              className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                reportType === "tasks"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setReportType("tasks")}
            >
              Tasks Report
            </button>
            <button
              className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                reportType === "users"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setReportType("users")}
            >
              Users Report
            </button>
            <button
              className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                reportType === "projects"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setReportType("projects")}
            >
              Projects Report
            </button>
          </div>
        </div>

        {/* Report Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
            {error}
          </div>
        ) : (
          <div className="mt-6">
            {/* Tasks Report */}
            {reportType === "tasks" && reportData && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500">Total Tasks</p>
                    <p className="text-2xl font-semibold mt-1">
                      {reportData.summary.total}
                    </p>
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg">
                    <p className="text-sm text-green-600">Completed</p>
                    <p className="text-2xl font-semibold text-green-700 mt-1">
                      {reportData.summary.completed}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-6 rounded-lg">
                    <p className="text-sm text-yellow-600">Pending</p>
                    <p className="text-2xl font-semibold text-yellow-700 mt-1">
                      {reportData.summary.pending}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <p className="text-sm text-blue-600">In Progress</p>
                    <p className="text-2xl font-semibold text-blue-700 mt-1">
                      {reportData.summary.inProgress}
                    </p>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <LuChartPie className="text-primary" />
                      Task Distribution
                    </h3>
                    <CustomPieChart
                      data={reportData.distribution}
                      colors={COLORS}
                    />
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <LuChartBar className="text-primary" />
                      Priority Levels
                    </h3>
                    <CustomBarChart data={reportData.priorityLevels} />
                  </div>
                </div>

                {/* Export Buttons */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="font-medium mb-4">Export Reports</h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      disabled={exportLoading}
                      className="btn-outline flex items-center gap-2"
                      onClick={() => handleExport("tasks")}
                    >
                      <LuFileSpreadsheet />
                      Export as Excel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Users Report */}
            {reportType === "users" && reportData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500">Total Users</p>
                    <p className="text-2xl font-semibold mt-1">
                      {reportData.total || 0}
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500">Active Today</p>
                    <p className="text-2xl font-semibold mt-1">
                      {reportData.activeToday || 0}
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500">Teams</p>
                    <p className="text-2xl font-semibold mt-1">
                      {reportData.teams || 0}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="font-medium mb-4">Users by Role</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Super Admins</span>
                      <span className="font-semibold">
                        {reportData.byRole?.superAdmin || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Admins</span>
                      <span className="font-semibold">
                        {reportData.byRole?.admin || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Project Managers</span>
                      <span className="font-semibold">
                        {reportData.byRole?.projectManager || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Team Members</span>
                      <span className="font-semibold">
                        {reportData.byRole?.teamMember || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="font-medium mb-4">Export Users Report</h3>
                  <button
                    disabled={exportLoading}
                    className="btn-outline flex items-center gap-2"
                    onClick={() => handleExport("users")}
                  >
                    <LuFileSpreadsheet />
                    Export Users Report
                  </button>
                </div>
              </div>
            )}

            {/* Projects Report */}
            {reportType === "projects" && reportData && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500">Total Projects</p>
                    <p className="text-2xl font-semibold mt-1">
                      {reportData.total || 0}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <p className="text-sm text-blue-600">Active</p>
                    <p className="text-2xl font-semibold text-blue-700 mt-1">
                      {reportData.byStatus?.active || 0}
                    </p>
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg">
                    <p className="text-sm text-green-600">Completed</p>
                    <p className="text-2xl font-semibold text-green-700 mt-1">
                      {reportData.byStatus?.completed || 0}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-6 rounded-lg">
                    <p className="text-sm text-purple-600">Completion Rate</p>
                    <p className="text-2xl font-semibold text-purple-700 mt-1">
                      {reportData.completionRate || 0}%
                    </p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="font-medium mb-4">Projects by Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Active</span>
                      <span className="font-semibold">
                        {reportData.byStatus?.active || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Planning</span>
                      <span className="font-semibold">
                        {reportData.byStatus?.planning || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Completed</span>
                      <span className="font-semibold">
                        {reportData.byStatus?.completed || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>On Hold</span>
                      <span className="font-semibold">
                        {reportData.byStatus?.onHold || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="font-medium mb-4">Export Projects Report</h3>
                  <button
                    disabled={exportLoading}
                    className="btn-outline flex items-center gap-2"
                    onClick={() => handleExport("projects")}
                  >
                    <LuFileSpreadsheet />
                    Export Projects Report
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Reports;
