// Date formatting helpers
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

export const isOverdue = (dueDate) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
};

export const daysRemaining = (dueDate) => {
  if (!dueDate) return 0;
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// String formatting helpers
export const capitalizeFirstLetter = (string) => {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
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

// Number formatting helpers
export const addThousandSeparator = (num) => {
  if (num === null || num === undefined || isNaN(num)) return "0";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
};

// Color helpers
export const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case "high":
      return "text-red-600 bg-red-100";
    case "medium":
      return "text-yellow-600 bg-yellow-100";
    case "low":
      return "text-green-600 bg-green-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
};

export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return "text-green-600 bg-green-100";
    case "in progress":
      return "text-blue-600 bg-blue-100";
    case "in review":
      return "text-violet-600 bg-violet-100";
    case "changes requested":
      return "text-amber-700 bg-amber-100";
    case "pending":
      return "text-gray-600 bg-gray-100";
    case "planning":
      return "text-purple-600 bg-purple-100";
    case "active":
      return "text-blue-600 bg-blue-100";
    case "on hold":
      return "text-orange-600 bg-orange-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
};

// ✅ ADDED: Greeting helper
export const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "Good Morning";
  } else if (hour >= 12 && hour < 17) {
    return "Good Afternoon";
  } else if (hour >= 17 && hour < 21) {
    return "Good Evening";
  } else {
    return "Good Night";
  }
};

// Validation helpers
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

// Array/object helpers
export const groupBy = (array, key) => {
  return array.reduce((result, currentValue) => {
    const groupKey = currentValue[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(currentValue);
    return result;
  }, {});
};

export const sortByDate = (array, dateKey = "createdAt", ascending = false) => {
  return [...array].sort((a, b) => {
    const dateA = new Date(a[dateKey]);
    const dateB = new Date(b[dateKey]);
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

// Local storage helpers
export const setLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
};

export const getLocalStorage = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return null;
  }
};

export const removeLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error removing from localStorage:", error);
  }
};

// File helpers
export const getFileExtension = (filename) => {
  return filename?.split(".").pop() || "";
};

export const isImageFile = (filename) => {
  const ext = getFileExtension(filename).toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
};

// Download helpers
export const downloadFile = (url, filename) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/** Normalize API/form attachments to { url, name, kind }. */
export const normalizeTaskAttachments = (items = []) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (typeof item === "string") {
        const url = item.trim();
        if (!url) return null;
        return {
          url,
          name: getAttachmentLabel(url),
          kind: url.includes("/uploads/tasks/") ? "file" : "link",
        };
      }
      if (item && item.url) {
        const normalized = {
          url: String(item.url).trim(),
          name: item.name || getAttachmentLabel(item.url),
          kind: item.kind === "file" ? "file" : "link",
        };
        if (item.uploadedBy) {
          normalized.uploadedBy = item.uploadedBy;
        }
        return normalized;
      }
      return null;
    })
    .filter(Boolean);
};

/** Display name for a task attachment URL or path. */
export const getAttachmentLabel = (urlOrItem) => {
  const url =
    typeof urlOrItem === "string"
      ? urlOrItem
      : urlOrItem?.url || urlOrItem?.name || "";
  if (!url || typeof url !== "string") return "Attachment";
  const trimmed = url.trim();
  if (trimmed.startsWith("blob:")) return "Uploaded file";
  try {
    const urlObj = new URL(trimmed);
    const name = decodeURIComponent(urlObj.pathname.split("/").pop() || "");
    if (name) return name;
  } catch {
    // fall through
  }
  const segment = trimmed.split("/").pop();
  return segment || trimmed;
};

/** Normalize attachment value to an openable URL. */
export const resolveAttachmentUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) {
    const base =
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
      "https://project-task-management-5qip.onrender.com";
    return `${String(base).replace(/\/$/, "")}${trimmed}`;
  }
  try {
    return new URL(trimmed).href;
  } catch {
    return `https://${trimmed}`;
  }
};

/** Open attachment in a new browser tab. */
export const openAttachment = (urlOrItem) => {
  const url =
    typeof urlOrItem === "string" ? urlOrItem : urlOrItem?.url;
  const resolved = resolveAttachmentUrl(url);
  if (!resolved) return false;
  window.open(resolved, "_blank", "noopener,noreferrer");
  return true;
};

/** Resolve a Mongo/API task id from a task object or raw id string. */
export const getTaskId = (task) => {
  if (!task) return null;
  if (typeof task === "string") return task;
  const id = task._id ?? task.id;
  if (id == null) return null;
  return typeof id === "object" && typeof id.toString === "function"
    ? id.toString()
    : String(id);
};

// Error handling
export const getErrorMessage = (error) => {
  if (!error) return "An unexpected error occurred";
  if (typeof error === "string") return error;
  if (error.message && typeof error.message === "string") {
    return error.message;
  }
  if (error.data?.message) {
    return error.data.message;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  return "An unexpected error occurred";
};
