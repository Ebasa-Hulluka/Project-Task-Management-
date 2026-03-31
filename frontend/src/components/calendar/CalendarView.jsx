import React, { useMemo } from "react";
import moment from "moment";
import TaskDayCell from "./TaskDayCell";

const VIEW_OPTIONS = ["month", "week", "day"];
const STATUS_OPTIONS = ["All", "Pending", "In Progress", "Completed"];

const CalendarView = ({
  tasks = [],
  currentDate,
  viewMode,
  statusFilter,
  onDateChange,
  onViewModeChange,
  onStatusFilterChange,
  onDateClick,
}) => {
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!task?.dueDate) return false;
      if (statusFilter === "All") return true;
      return task.status === statusFilter;
    });
  }, [tasks, statusFilter]);

  const tasksByDate = useMemo(() => {
    return filteredTasks.reduce((acc, task) => {
      const key = moment(task.dueDate).format("YYYY-MM-DD");
      if (!acc[key]) acc[key] = [];
      acc[key].push(task);
      return acc;
    }, {});
  }, [filteredTasks]);

  const getPeriodTitle = () => {
    if (viewMode === "month") return currentDate.format("MMMM YYYY");
    if (viewMode === "week") {
      const start = currentDate.clone().startOf("week");
      const end = currentDate.clone().endOf("week");
      return `${start.format("MMM D")} - ${end.format("MMM D, YYYY")}`;
    }
    return currentDate.format("MMMM D, YYYY");
  };

  const getDaysForView = () => {
    if (viewMode === "month") {
      const start = currentDate.clone().startOf("month").startOf("week");
      const end = currentDate.clone().endOf("month").endOf("week");
      const days = [];
      const day = start.clone();
      while (day.isBefore(end) || day.isSame(end, "day")) {
        days.push(day.clone());
        day.add(1, "day");
      }
      return days;
    }

    if (viewMode === "week") {
      const start = currentDate.clone().startOf("week");
      return Array.from({ length: 7 }, (_, index) => start.clone().add(index, "day"));
    }

    return [currentDate.clone()];
  };

  const goToToday = () => onDateChange(moment());
  const goPrevious = () => {
    if (viewMode === "month") onDateChange(currentDate.clone().subtract(1, "month"));
    else if (viewMode === "week") onDateChange(currentDate.clone().subtract(1, "week"));
    else onDateChange(currentDate.clone().subtract(1, "day"));
  };
  const goNext = () => {
    if (viewMode === "month") onDateChange(currentDate.clone().add(1, "month"));
    else if (viewMode === "week") onDateChange(currentDate.clone().add(1, "week"));
    else onDateChange(currentDate.clone().add(1, "day"));
  };

  const days = getDaysForView();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <button type="button" onClick={goPrevious} className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm">
              Prev
            </button>
            <button type="button" onClick={goToToday} className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm">
              Today
            </button>
            <button type="button" onClick={goNext} className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm">
              Next
            </button>
            <h3 className="ml-2 text-base md:text-lg font-semibold text-gray-800">{getPeriodTitle()}</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-gray-100 p-1 rounded-lg">
              {VIEW_OPTIONS.map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => onViewModeChange(view)}
                  className={`px-3 py-1.5 text-sm rounded-md capitalize ${
                    viewMode === view ? "bg-[#1368ec] text-white" : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="border border-gray-200 rounded-lg text-sm px-3 py-2 bg-white"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={`grid ${viewMode === "day" ? "grid-cols-1" : "grid-cols-7"} border-b border-gray-100`}>
        {(viewMode === "day"
          ? [currentDate.format("dddd")]
          : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        ).map((weekday) => (
          <div key={weekday} className="px-2 py-2 text-xs font-semibold text-gray-500 text-center border-r last:border-r-0">
            {weekday}
          </div>
        ))}
      </div>

      <div className={`grid ${viewMode === "day" ? "grid-cols-1" : viewMode === "week" ? "grid-cols-7" : "grid-cols-7"}`}>
        {days.map((day) => {
          const key = day.format("YYYY-MM-DD");
          return (
            <TaskDayCell
              key={key}
              day={day}
              currentDate={currentDate}
              viewMode={viewMode}
              tasks={tasksByDate[key] || []}
              onClick={onDateClick}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
