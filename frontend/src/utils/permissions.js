// Role-based permissions configuration
export const ROLES = {
  SUPER_ADMIN: "admin",
  ADMIN: "admin",
  PROJECT_MANAGER: "projectManager",
  TEAM_MEMBER: "teamMember",
};

// Permission definitions
export const PERMISSIONS = {
  // User management
  MANAGE_USERS: "manage_users",
  VIEW_USERS: "view_users",
  CREATE_USER: "create_user",
  UPDATE_USER: "update_user",
  DELETE_USER: "delete_user",
  ASSIGN_ROLE: "assign_role",

  // Team management
  MANAGE_TEAMS: "manage_teams",
  VIEW_TEAMS: "view_teams",
  CREATE_TEAM: "create_team",
  UPDATE_TEAM: "update_team",
  DELETE_TEAM: "delete_team",
  ADD_TEAM_MEMBER: "add_team_member",
  REMOVE_TEAM_MEMBER: "remove_team_member",

  // Project management
  MANAGE_PROJECTS: "manage_projects",
  VIEW_ALL_PROJECTS: "view_all_projects",
  VIEW_OWN_PROJECTS: "view_own_projects",
  CREATE_PROJECT: "create_project",
  UPDATE_PROJECT: "update_project",
  DELETE_PROJECT: "delete_project",

  // Task management
  MANAGE_TASKS: "manage_tasks",
  VIEW_ALL_TASKS: "view_all_tasks",
  VIEW_ASSIGNED_TASKS: "view_assigned_tasks",
  CREATE_TASK: "create_task",
  UPDATE_TASK: "update_task",
  DELETE_TASK: "delete_task",
  ASSIGN_TASK: "assign_task",
  UPDATE_TASK_STATUS: "update_task_status",

  // Reports
  VIEW_REPORTS: "view_reports",
  EXPORT_REPORTS: "export_reports",
};

// Role-permission mapping
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),

  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.DELETE_USER,
    PERMISSIONS.ASSIGN_ROLE,
    PERMISSIONS.MANAGE_TEAMS,
    PERMISSIONS.VIEW_TEAMS,
    PERMISSIONS.CREATE_TEAM,
    PERMISSIONS.UPDATE_TEAM,
    PERMISSIONS.DELETE_TEAM,
    PERMISSIONS.ADD_TEAM_MEMBER,
    PERMISSIONS.REMOVE_TEAM_MEMBER,
    PERMISSIONS.MANAGE_PROJECTS,
    PERMISSIONS.VIEW_ALL_PROJECTS,
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.UPDATE_PROJECT,
    PERMISSIONS.DELETE_PROJECT,
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.VIEW_ALL_TASKS,
    PERMISSIONS.CREATE_TASK,
    PERMISSIONS.UPDATE_TASK,
    PERMISSIONS.DELETE_TASK,
    PERMISSIONS.ASSIGN_TASK,
    PERMISSIONS.UPDATE_TASK_STATUS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
  ],

  [ROLES.PROJECT_MANAGER]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_TEAMS,
    PERMISSIONS.VIEW_OWN_PROJECTS,
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.UPDATE_PROJECT,
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.VIEW_ALL_TASKS,
    PERMISSIONS.CREATE_TASK,
    PERMISSIONS.UPDATE_TASK,
    PERMISSIONS.DELETE_TASK,
    PERMISSIONS.ASSIGN_TASK,
    PERMISSIONS.UPDATE_TASK_STATUS,
    PERMISSIONS.VIEW_REPORTS,
  ],

  [ROLES.TEAM_MEMBER]: [
    PERMISSIONS.VIEW_ASSIGNED_TASKS,
    PERMISSIONS.UPDATE_TASK_STATUS,
    PERMISSIONS.VIEW_TEAMS,
    PERMISSIONS.VIEW_OWN_PROJECTS,
  ],
};

// Helper function to check if user has permission
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;

  if (userRole === ROLES.SUPER_ADMIN) return true;

  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
};

// Helper function to get all permissions for a role
export const getPermissionsByRole = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

// Helper function to check if user has any of the given permissions
export const hasAnyPermission = (userRole, permissions) => {
  if (!userRole || !permissions || !permissions.length) return false;

  if (userRole === ROLES.SUPER_ADMIN) return true;

  const userPermissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.some((permission) => userPermissions.includes(permission));
};

// Helper function to check if user has all of the given permissions
export const hasAllPermissions = (userRole, permissions) => {
  if (!userRole || !permissions || !permissions.length) return false;

  if (userRole === ROLES.SUPER_ADMIN) return true;

  const userPermissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.every((permission) =>
    userPermissions.includes(permission),
  );
};

// Menu items based on role (for dynamic side menu)
export const getMenuItemsByRole = (role) => {
  const menuMap = {
    [ROLES.SUPER_ADMIN]: [
      {
        label: "Dashboard",
        path: "/admin/dashboard",
        icon: "LuLayoutDashboard",
      },
      { label: "Projects", path: "/admin/projects", icon: "LuFolder" },
      { label: "Teams", path: "/admin/teams", icon: "LuUsersRound" },
      { label: "Tasks", path: "/admin/tasks", icon: "LuClipboardCheck" },
      { label: "Users", path: "/admin/users", icon: "LuUsers" },
      { label: "Reports", path: "/admin/reports", icon: "LuChartBar" },
    ],
    [ROLES.ADMIN]: [
      {
        label: "Dashboard",
        path: "/admin/dashboard",
        icon: "LuLayoutDashboard",
      },
      { label: "Projects", path: "/admin/projects", icon: "LuFolder" },
      { label: "Teams", path: "/admin/teams", icon: "LuUsersRound" },
      { label: "Tasks", path: "/admin/tasks", icon: "LuClipboardCheck" },
      { label: "Users", path: "/admin/users", icon: "LuUsers" },
      { label: "Reports", path: "/admin/reports", icon: "LuChartBar" },
    ],
    [ROLES.PROJECT_MANAGER]: [
      {
        label: "Dashboard",
        path: "/manager/dashboard",
        icon: "LuLayoutDashboard",
      },
      { label: "My Projects", path: "/manager/projects", icon: "LuFolder" },
      {
        label: "Create Project",
        path: "/manager/projects/create",
        icon: "LuSquarePlus",
      },
      { label: "Tasks", path: "/manager/tasks", icon: "LuClipboardCheck" },
      {
        label: "Create Task",
        path: "/manager/tasks/create",
        icon: "LuSquarePlus",
      },
    ],
    [ROLES.TEAM_MEMBER]: [
      {
        label: "Dashboard",
        path: "/member/dashboard",
        icon: "LuLayoutDashboard",
      },
      { label: "My Tasks", path: "/member/tasks", icon: "LuClipboardCheck" },
    ],
  };

  return menuMap[role] || [];
};

// Route protection based on role
export const getRoutePermissions = (path) => {
  const routePermissions = {
    // Admin routes
    "/admin": [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    "/admin/dashboard": [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    "/admin/projects": [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    "/admin/teams": [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    "/admin/tasks": [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    "/admin/users": [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    "/admin/reports": [ROLES.SUPER_ADMIN, ROLES.ADMIN],

    // Project Manager routes
    "/manager": [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PROJECT_MANAGER],
    "/manager/dashboard": [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.PROJECT_MANAGER,
    ],
    "/manager/projects": [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PROJECT_MANAGER],
    "/manager/projects/create": [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.PROJECT_MANAGER,
    ],
    "/manager/tasks": [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PROJECT_MANAGER],
    "/manager/tasks/create": [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.PROJECT_MANAGER,
    ],

    // Team Member routes
    "/member": [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.PROJECT_MANAGER,
      ROLES.TEAM_MEMBER,
    ],
    "/member/dashboard": [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.PROJECT_MANAGER,
      ROLES.TEAM_MEMBER,
    ],
    "/member/tasks": [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.PROJECT_MANAGER,
      ROLES.TEAM_MEMBER,
    ],
  };

  return routePermissions[path] || [];
};
