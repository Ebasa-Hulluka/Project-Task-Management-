export const isAdminRole = (role) => role === "admin" || role === "superAdmin";

export const getProjectPaths = (role) => {
  const admin = isAdminRole(role);
  return {
    list: admin ? "/admin/projects" : "/manager/projects",
    detail: (id) =>
      admin ? `/admin/projects/${id}` : `/manager/projects/${id}`,
    edit: (id) =>
      admin ? `/admin/projects/edit/${id}` : `/manager/projects/edit/${id}`,
  };
};

/** Project managers create/edit tasks; status & checklists are updated by assigned team members. */
export const canManageTasks = (role) => role === "projectManager";

/** Super Admin & Admin: view-only for projects & tasks (no create/edit task actions). */
export const isTaskViewOnlyRole = (role) => isAdminRole(role);

export const canCreateProjects = (role) => role === "projectManager";
export const canCreateTasks = (role) => role === "projectManager";
