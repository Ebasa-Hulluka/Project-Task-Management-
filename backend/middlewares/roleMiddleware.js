const normalizeRole = (role = "") => {
  const value = String(role || "").trim().toLowerCase();
  if (value === "projectmanager" || value === "project_manager" || value === "manager") {
    return "projectManager";
  }
  if (value === "teammember" || value === "team_member" || value === "member") {
    return "teamMember";
  }
  if (value === "tester" || value === "qa" || value === "quality_assurance") {
    return "tester";
  }
  if (value === "superadmin" || value === "super_admin") {
    return "superAdmin";
  }
  if (value === "admin") {
    return "admin";
  }
  return String(role || "");
};

// Generic role-based authorization middleware
const authorize = (...roles) => {
  const allowedRoles = roles.map(normalizeRole);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const currentRole = normalizeRole(req.user.role);

    const isSuperAdminBypass = currentRole === "superAdmin";
    const isAdminBypass =
      currentRole === "admin" && !allowedRoles.includes("superAdmin");

    if (!isSuperAdminBypass && !isAdminBypass && !allowedRoles.includes(currentRole)) {
      return res.status(403).json({
        message: `Forbidden: Required roles: ${roles.join(", ")}`,
      });
    }

    next();
  };
};

const isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (normalizeRole(req.user.role) !== "superAdmin") {
    return res.status(403).json({
      message: "Forbidden: Super admin access required",
    });
  }

  next();
};

// Check if user is the creator of a resource
const isCreator = (model) => {
  return async (req, res, next) => {
    try {
      const resource = await model.findById(req.params.id);

      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }

      // Admin can do anything
      if (normalizeRole(req.user.role) === "admin") {
        return next();
      }

      // Check if user is the creator
      if (
        resource.createdBy &&
        resource.createdBy.toString() === req.user._id.toString()
      ) {
        return next();
      }

      return res
        .status(403)
        .json({ message: "Forbidden: You are not the creator" });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Server error", error: error.message });
    }
  };
};

module.exports = { authorize, isCreator, isSuperAdmin };
