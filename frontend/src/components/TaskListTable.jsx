import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import {
  LuEye,
  LuPencil, // ✅ Changed from LuEdit
  LuTrash2,
  LuChevronLeft,
  LuChevronRight,
  LuSearch,
  LuFilter,
} from "react-icons/lu";

import AvatarGroup from "./AvatarGroup";
import { getPriorityColor, getStatusColor } from "../utils/helper";

const SortIcon = ({ sortConfig, column }) => {
  if (sortConfig.key !== column) return null;
  return (
    <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
  );
};

const TaskListTable = ({
  tableData = [],
  onRowClick,
  onEdit,
  onDelete,
  showActions = false,
  showProject = false,
  showSearch = false,
  itemsPerPage = 10,
}) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Filter and search
  const filteredData = tableData.filter((task) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      task.title?.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower) ||
      task.priority?.toLowerCase().includes(searchLower) ||
      task.status?.toLowerCase().includes(searchLower)
    );
  });

  // Sorting
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "asc"
          ? "desc"
          : "asc",
    });
  };

  const handleRowClick = (task) => {
    if (onRowClick) {
      onRowClick(task);
    } else {
      navigate(`/member/tasks/${task._id}`);
    }
  };

  const handleEdit = (e, task) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(task);
    }
  };

  const handleDelete = (e, task) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(task);
    }
  };

  if (!tableData.length) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <LuSearch className="text-4xl text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No tasks found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Search Bar */}
      {showSearch && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Table - Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th
                onClick={() => handleSort("title")}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
              >
                Task Name <SortIcon sortConfig={sortConfig} column="title" />
              </th>
              {showProject && (
                <th
                  onClick={() => handleSort("project")}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                >
                  Project <SortIcon sortConfig={sortConfig} column="project" />
                </th>
              )}
              <th
                onClick={() => handleSort("status")}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
              >
                Status <SortIcon sortConfig={sortConfig} column="status" />
              </th>
              <th
                onClick={() => handleSort("priority")}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
              >
                Priority <SortIcon sortConfig={sortConfig} column="priority" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned To
              </th>
              <th
                onClick={() => handleSort("dueDate")}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
              >
                Due Date <SortIcon sortConfig={sortConfig} column="dueDate" />
              </th>
              {showActions && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedData.map((task) => (
              <tr
                key={task._id}
                onClick={() => handleRowClick(task)}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-gray-500 truncate max-w-xs">
                        {task.description}
                      </p>
                    )}
                  </div>
                </td>

                {showProject && (
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {task.projectId?.name || "—"}
                  </td>
                )}

                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}
                  >
                    {task.status}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}
                  >
                    {task.priority}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <AvatarGroup
                    users={task.assignedTo || []}
                    maxVisible={3}
                    size="sm"
                  />
                </td>

                <td className="px-4 py-3 text-sm text-gray-600">
                  {moment(task.dueDate).format("MMM D, YYYY")}
                </td>

                {showActions && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleEdit(e, task)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <LuPencil className="text-lg" /> {/* ✅ Changed here */}
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, task)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <LuTrash2 className="text-lg" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden divide-y divide-gray-200">
        {paginatedData.map((task) => (
          <div
            key={task._id}
            onClick={() => handleRowClick(task)}
            className="p-4 hover:bg-gray-50 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900 flex-1">
                {task.title}
              </h4>
              <span
                className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}
              >
                {task.priority}
              </span>
            </div>

            {task.description && (
              <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full ${getStatusColor(task.status)}`}
                >
                  {task.status}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-500">
                  Due {moment(task.dueDate).format("MMM D")}
                </span>
              </div>

              {task.assignedTo?.length > 0 && (
                <AvatarGroup users={task.assignedTo} maxVisible={2} size="sm" />
              )}
            </div>

            {showActions && (
              <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-gray-100">
                <button
                  onClick={(e) => handleEdit(e, task)}
                  className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                >
                  <LuPencil className="text-sm" /> Edit {/* ✅ Changed here */}
                </button>
                <button
                  onClick={(e) => handleDelete(e, task)}
                  className="text-red-600 text-sm hover:underline flex items-center gap-1"
                >
                  <LuTrash2 className="text-sm" /> Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + itemsPerPage, sortedData.length)} of{" "}
            {sortedData.length} tasks
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LuChevronLeft className="text-lg" />
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LuChevronRight className="text-lg" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskListTable;
