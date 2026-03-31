import React from "react";
import moment from "moment";
import { LuX } from "react-icons/lu";
import { getPriorityColor, getStatusColor, formatDate } from "../../utils/helper";

const TaskListModal = ({ isOpen, selectedDate, tasks = [], onClose, onTaskClick }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Tasks for {moment(selectedDate).format("MMM D, YYYY")}</h3>
            <p className="text-xs text-gray-500 mt-1">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <LuX />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4">
          {tasks.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No tasks scheduled for this date.</p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <button
                  key={task._id}
                  type="button"
                  onClick={() => onTaskClick(task._id)}
                  className="w-full text-left border border-gray-200 rounded-lg p-4 hover:border-[#1368ec]/30 hover:bg-blue-50/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-gray-800">{task.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`text-[11px] px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Due: {formatDate(task.dueDate)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskListModal;
