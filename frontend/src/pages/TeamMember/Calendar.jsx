import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { toast } from "react-hot-toast";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import CalendarView from "../../components/calendar/CalendarView";
import TaskListModal from "../../components/calendar/TaskListModal";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { getErrorMessage } from "../../utils/helper";

const Calendar = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(moment());
  const [viewMode, setViewMode] = useState("month");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS);
      setTasks(response?.data?.tasks || []);
    } catch (apiError) {
      toast.error(getErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    return tasks.filter((task) => {
      if (!task?.dueDate) return false;
      const sameDate = moment(task.dueDate).isSame(selectedDate, "day");
      const matchStatus = statusFilter === "All" || task.status === statusFilter;
      return sameDate && matchStatus;
    });
  }, [selectedDate, statusFilter, tasks]);

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  return (
    <DashboardLayout activeMenu="Calendar">
      <div className="my-5">
        <div className="mb-5">
          <h2 className="text-xl md:text-2xl font-medium">Task Calendar</h2>
          <p className="text-sm text-gray-500 mt-1">
            Track your task deadlines by month, week, or day.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <CalendarView
              tasks={tasks}
              currentDate={currentDate}
              viewMode={viewMode}
              statusFilter={statusFilter}
              onDateChange={setCurrentDate}
              onViewModeChange={setViewMode}
              onStatusFilterChange={setStatusFilter}
              onDateClick={handleDateClick}
            />

            <TaskListModal
              isOpen={isModalOpen}
              selectedDate={selectedDate}
              tasks={selectedDateTasks}
              onClose={() => setIsModalOpen(false)}
              onTaskClick={(taskId) => navigate(`/member/tasks/${taskId}`)}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Calendar;
