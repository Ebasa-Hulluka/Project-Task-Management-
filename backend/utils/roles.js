const isAdminRole = (role) => role === "admin" || role === "superAdmin";

const isSuperAdminRole = (role) => role === "superAdmin";

const canManageProjects = (role) =>
  isAdminRole(role) || role === "projectManager";

/** Super Admin & Admin are view-only on tasks; only PM edits task status/checklists. */
const canManageTasks = (role) => role === "projectManager";

const isTaskViewOnlyRole = (role) => isAdminRole(role);

const canCreateProjects = (role) => role === "projectManager";
const canCreateTasks = (role) => role === "projectManager";

module.exports = {
  isAdminRole,
  isSuperAdminRole,
  isTaskViewOnlyRole,
  canCreateProjects,
  canCreateTasks,
  canManageProjects,
  canManageTasks,
};
