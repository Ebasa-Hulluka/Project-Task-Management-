const VALID_USER_ROLES = [
  "superAdmin",
  "admin",
  "projectManager",
  "teamMember",
  "tester",
];

const ROLE_PRIORITY = {
  superAdmin: 0,
  admin: 1,
  projectManager: 2,
  tester: 3,
  teamMember: 4,
};

const getUserRoles = (user) => {
  if (!user) return [];
  const fromArray = Array.isArray(user.roles)
    ? user.roles.filter((r) => VALID_USER_ROLES.includes(r))
    : [];
  if (fromArray.length > 0) {
    return [...new Set(fromArray)];
  }
  if (user.role && VALID_USER_ROLES.includes(user.role)) {
    return [user.role];
  }
  return ["teamMember"];
};

const pickPrimaryRole = (roles = []) => {
  const unique = [...new Set(roles)].filter((r) => VALID_USER_ROLES.includes(r));
  if (!unique.length) return "teamMember";
  return unique.sort(
    (a, b) => (ROLE_PRIORITY[a] ?? 99) - (ROLE_PRIORITY[b] ?? 99),
  )[0];
};

const normalizeRolesInput = (body = {}) => {
  let raw = body.roles;
  if (!Array.isArray(raw) && body.role !== undefined) {
    raw = [body.role];
  }
  if (!Array.isArray(raw)) raw = [];

  const normalized = [
    ...new Set(
      raw
        .map((value) => String(value || "").trim())
        .filter((value) => VALID_USER_ROLES.includes(value)),
    ),
  ];

  return normalized;
};

const validateAssignableRoles = (roles, actor) => {
  if (!roles.length) {
    return { ok: false, message: "Select at least one role" };
  }

  if (roles.includes("superAdmin")) {
    return {
      ok: false,
      message: "Super admin role cannot be assigned from user management",
    };
  }

  if (roles.length > 1 && roles.includes("superAdmin")) {
    return { ok: false, message: "Super admin cannot be combined with other roles" };
  }

  const actorRoles = getUserRoles(actor);
  const actorIsSuperAdmin = actorRoles.includes("superAdmin");

  if (roles.includes("admin") && !actorIsSuperAdmin) {
    return {
      ok: false,
      message: "Only the super admin can assign the admin role",
    };
  }

  return { ok: true, roles };
};

const userHasRole = (user, role) => getUserRoles(user).includes(role);

const sortRolesForSelection = (roles = []) =>
  [...roles].sort(
    (a, b) => (ROLE_PRIORITY[a] ?? 99) - (ROLE_PRIORITY[b] ?? 99),
  );

const serializeAuthUser = (user, activeRole) => {
  const roles = getUserRoles(user);
  const role = activeRole && roles.includes(activeRole) ? activeRole : pickPrimaryRole(roles);

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role,
    roles,
    status: user.status,
    isActive: user.isActive,
    team: user.team,
    profileImageUrl: user.profileImageUrl,
    themePreference: user.themePreference || "system",
  };
};

module.exports = {
  VALID_USER_ROLES,
  ROLE_PRIORITY,
  getUserRoles,
  pickPrimaryRole,
  normalizeRolesInput,
  validateAssignableRoles,
  userHasRole,
  sortRolesForSelection,
  serializeAuthUser,
};
