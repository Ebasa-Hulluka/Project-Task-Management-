const RENDER_API_URL = "https://project-task-management-5qip.onrender.com";

export const BASE_URL = RENDER_API_URL;

export const API_PATHS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    SELECT_LOGIN_ROLE: "/api/auth/select-role",
    FORGOT_PASSWORD: "/api/auth/forgot-password",
    GET_PROFILE: "/api/auth/profile",
    UPDATE_PROFILE: "/api/auth/profile",
    UPLOAD_IMAGE: "/api/auth/upload-image",
    CHANGE_PASSWORD: "/api/auth/change-password",
  },
  USERS: {
    GET_ALL_USERS: "/api/users",
    CREATE_USER: "/api/users",
    GET_FILTERED_USERS: ({ role, status } = {}) => {
      const query = new URLSearchParams();
      if (role && role !== "all") query.set("role", role);
      if (status && status !== "all") query.set("status", status);
      const queryString = query.toString();
      return queryString ? `/api/users?${queryString}` : "/api/users";
    },
    GET_USER_BY_ID: (userId) => `/api/users/${userId}`,
    DELETE_USER: (userId) => `/api/users/${userId}`,
    UPDATE_USER_ROLE: (userId) => `/api/users/${userId}/role`,
    ASSIGN_TEAM: "/api/users/assign-team",
    GET_USERS_BY_ROLE: (role) => `/api/users/role/${role}`,
    GET_TEAM_MEMBERS: "/api/users/team-members",
    DEACTIVATE_ACCOUNT: (userId) => `/api/users/deactivate/${userId}`,
    REACTIVATE_ACCOUNT: (userId) => `/api/users/reactivate/${userId}`,
    GET_DEACTIVATED_USERS: "/api/users/deactivated",
    GET_PASSWORD_RESET_REQUESTS: "/api/users/password-reset-requests",
    COMPLETE_PASSWORD_RESET_REQUEST: (requestId) =>
      `/api/users/password-reset-requests/${requestId}/complete`,
  },
  NOTIFICATIONS: {
    GET_NOTIFICATIONS: "/api/notifications",
    CLEAR_ALL: "/api/notifications/clear",
    MARK_AS_READ: (notificationId) => `/api/notifications/${notificationId}/read`,
    GET_SETTINGS: "/api/notifications/settings",
    UPDATE_SETTINGS: "/api/notifications/settings",
  },
  TASKS: {
    GET_DASHBOARD_DATA: "/api/tasks/dashboard-data",
    GET_USER_DASHBOARD_DATA: "/api/tasks/user-dashboard-data",
    GET_ALL_TASKS: "/api/tasks",
    GET_TASK_BY_ID: (taskId) => `/api/tasks/${taskId}`,
    CREATE_TASK: "/api/tasks",
    UPDATE_TASK: (taskId) => `/api/tasks/${taskId}`,
    DELETE_TASK: (taskId) => `/api/tasks/${taskId}`,
    UPDATE_TASK_STATUS: (taskId) => `/api/tasks/${taskId}/status`,
    REVIEW_TASK: (taskId) => `/api/tasks/${taskId}/review`,
    UPDATE_TODO_CHECKLIST: (taskId) => `/api/tasks/${taskId}/todo`,
    UPDATE_TODO: (taskId) => `/api/tasks/${taskId}/todo`,
    UPLOAD_ATTACHMENT: "/api/tasks/upload-attachment",
    GET_TASKS_BY_PROJECT: (projectId) => `/api/tasks/project/${projectId}`,
  },
  PROJECTS: {
    GET_ALL_PROJECTS: "/api/projects",
    GET_PROJECT_BY_ID: (projectId) => `/api/projects/${projectId}`,
    CREATE_PROJECT: "/api/projects",
    UPDATE_PROJECT: (projectId) => `/api/projects/${projectId}`,
    DELETE_PROJECT: (projectId) => `/api/projects/${projectId}`,
    GET_PROJECT_PROGRESS: (projectId) => `/api/projects/${projectId}/progress`,
  },
  TEAMS: {
    GET_ALL_TEAMS: "/api/teams",
    GET_TEAM_BY_ID: (teamId) => `/api/teams/${teamId}`,
    CREATE_TEAM: "/api/teams",
    UPDATE_TEAM: (teamId) => `/api/teams/${teamId}`,
    UPDATE_TEAM_LEAD: (teamId) => `/api/teams/${teamId}/lead`,
    DELETE_TEAM: (teamId) => `/api/teams/${teamId}`,
    ADD_MEMBER: (teamId) => `/api/teams/${teamId}/members`,
    REMOVE_MEMBER: (teamId, userId) => `/api/teams/${teamId}/members/${userId}`,
  },
  REPORTS: {
    TASKS: "/api/reports/tasks",
    USERS: "/api/reports/users",
    PROJECTS: "/api/reports/projects",
    EXPORT_TASKS: "/api/reports/export/tasks",
    EXPORT_USERS: "/api/reports/export/users",
    EXPORT_PROJECTS: "/api/reports/export/projects",
  },
  PUBLIC: {
    GET_LANDING_STATS: "/api/public/landing-stats",
    GET_ADMIN_CONTACT: "/api/public/admin-contact",
  },
  IMAGE: {
    UPLOAD_IMAGE: "/api/auth/upload-image",
  },
  ACTIVITY: {
    GET_ACTIVITY: "/api/activity",
  },
  CHAT: {
    GET_CONVERSATIONS: "/api/chat/conversations",
    START_CONVERSATION: "/api/chat/conversations/start",
    GET_MESSAGES: (conversationId) =>
      `/api/chat/conversations/${conversationId}/messages`,
    MARK_SEEN: (conversationId) => `/api/chat/conversations/${conversationId}/seen`,
    SEARCH_MESSAGES: (conversationId) =>
      `/api/chat/conversations/${conversationId}/search`,
    SEARCH_USERS: "/api/chat/users/search",
    GET_USER_PROFILE: (userId) => `/api/chat/users/${userId}/profile`,
    SEND_MESSAGE: "/api/chat/messages",
    EDIT_MESSAGE: (messageId) => `/api/chat/messages/${messageId}`,
    DELETE_MESSAGE: (messageId) => `/api/chat/messages/${messageId}`,
  },
};

export default API_PATHS;
