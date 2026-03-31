import {
  LuLayoutDashboard,
  LuUsers,
  LuClipboardCheck,
  LuSquarePlus,
  LuLogOut,
  LuFolder,
  LuUsersRound,
  LuFileText,
  LuSettings,
  LuChartBar,
} from "react-icons/lu";

// Admin Side Menu Data
export const SIDE_MENU_ADMIN_DATA = [
  {
    id: "01",
    label: "Dashboard",
    icon: LuLayoutDashboard,
    path: "/admin/dashboard",
  },
  {
    id: "02",
    label: "Projects",
    icon: LuFolder,
    path: "/admin/projects",
  },
  {
    id: "03",
    label: "Teams",
    icon: LuUsersRound,
    path: "/admin/teams",
  },
  {
    id: "04",
    label: "Tasks",
    icon: LuClipboardCheck,
    path: "/admin/tasks",
  },
  {
    id: "05",
    label: "Users",
    icon: LuUsers,
    path: "/admin/users",
  },
  {
    id: "06",
    label: "Reports",
    icon: LuChartBar,
    path: "/admin/reports",
  },
  {
    id: "07",
    label: "Settings",
    icon: LuSettings,
    path: "/admin/settings",
  },
  {
    id: "08",
    label: "Logout",
    icon: LuLogOut,
    path: "logout",
  },
];

// Project Manager Side Menu Data
export const SIDE_MENU_MANAGER_DATA = [
  {
    id: "01",
    label: "Dashboard",
    icon: LuLayoutDashboard,
    path: "/manager/dashboard",
  },
  {
    id: "02",
    label: "My Projects",
    icon: LuFolder,
    path: "/manager/projects",
  },
  {
    id: "03",
    label: "Create Project",
    icon: LuSquarePlus,
    path: "/manager/projects/create",
  },
  {
    id: "04",
    label: "Tasks",
    icon: LuClipboardCheck,
    path: "/manager/tasks",
  },
  {
    id: "05",
    label: "Create Task",
    icon: LuSquarePlus,
    path: "/manager/tasks/create",
  },
  {
    id: "06",
    label: "Logout",
    icon: LuLogOut,
    path: "logout",
  },
];

// Team Member Side Menu Data
export const SIDE_MENU_MEMBER_DATA = [
  {
    id: "01",
    label: "Dashboard",
    icon: LuLayoutDashboard,
    path: "/member/dashboard",
  },
  {
    id: "02",
    label: "My Tasks",
    icon: LuClipboardCheck,
    path: "/member/tasks",
  },
  {
    id: "03",
    label: "Task Details",
    icon: LuFileText,
    path: "/member/task-details",
  },
  {
    id: "04",
    label: "Logout",
    icon: LuLogOut,
    path: "logout",
  },
];

// Priority Options
export const PRIORITY_DATA = [
  { label: "Low", value: "Low", color: "bg-green-100 text-green-600" },
  { label: "Medium", value: "Medium", color: "bg-yellow-100 text-yellow-600" },
  { label: "High", value: "High", color: "bg-red-100 text-red-600" },
];

// Status Options
export const STATUS_DATA = [
  { label: "Pending", value: "Pending", color: "bg-gray-100 text-gray-600" },
  {
    label: "In Progress",
    value: "In Progress",
    color: "bg-blue-100 text-blue-600",
  },
  {
    label: "Completed",
    value: "Completed",
    color: "bg-green-100 text-green-600",
  },
];

// Project Status Options
export const PROJECT_STATUS_DATA = [
  {
    label: "Planning",
    value: "Planning",
    color: "bg-purple-100 text-purple-600",
  },
  { label: "Active", value: "Active", color: "bg-blue-100 text-blue-600" },
  {
    label: "Completed",
    value: "Completed",
    color: "bg-green-100 text-green-600",
  },
  {
    label: "On Hold",
    value: "On Hold",
    color: "bg-orange-100 text-orange-600",
  },
];

// User Roles
export const USER_ROLES = [
  { label: "Project Manager", value: "projectManager" },
  { label: "Team Member", value: "teamMember" },
];

// Validation Functions
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

// Utility Functions
export const addThousandSeparator = (num) => {
  if (num === null || num === undefined || isNaN(num)) return "0";

  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateTime = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getPriorityColor = (priority) => {
  switch (priority) {
    case "High":
      return "text-red-600 bg-red-100";
    case "Medium":
      return "text-yellow-600 bg-yellow-100";
    case "Low":
      return "text-green-600 bg-green-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case "Completed":
      return "text-green-600 bg-green-100";
    case "In Progress":
      return "text-blue-600 bg-blue-100";
    case "Pending":
      return "text-gray-600 bg-gray-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
};

export const getInitials = (name) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};
