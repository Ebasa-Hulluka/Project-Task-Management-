export const ROLE_LABELS = {
  superAdmin: "Super Admin",
  admin: "Admin",
  projectManager: "Project Manager",
  teamMember: "Team Member",
  tester: "Tester",
};

export const getUserRoles = (user) => {
  if (!user) return [];
  if (Array.isArray(user.roles) && user.roles.length > 0) {
    return [...new Set(user.roles)];
  }
  if (user.role) return [user.role];
  return [];
};

export const getRoleLabel = (role) => ROLE_LABELS[role] || role;

export const getDashboardPath = (role) => {
  switch (role) {
    case "superAdmin":
    case "admin":
      return "/admin/dashboard";
    case "projectManager":
      return "/manager/dashboard";
    case "tester":
      return "/tester/dashboard";
    case "teamMember":
      return "/member/dashboard";
    default:
      return "/";
  }
};
