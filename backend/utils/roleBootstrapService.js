const User = require("../models/User");

const ensureRoleHierarchy = async () => {
  const existingSuperAdmin = await User.findOne({ role: "superAdmin" })
    .sort({ createdAt: 1 })
    .lean();

  if (!existingSuperAdmin) {
    const earliestAdmin = await User.findOne({ role: "admin" }).sort({ createdAt: 1 });
    if (earliestAdmin) {
      earliestAdmin.role = "superAdmin";
      await earliestAdmin.save();
    }
  }

  await User.updateMany(
    { role: { $in: ["superadmin", "SuperAdmin"] } },
    { $set: { role: "superAdmin" } },
  );

  await User.updateMany(
    { isActive: false },
    { $set: { status: "deactivated" } },
  );

  await User.updateMany(
    {
      isActive: { $ne: false },
      $or: [
        { status: { $exists: false } },
        { status: null },
        { status: { $in: ["pending", "rejected"] } },
      ],
    },
    { $set: { status: "active" } },
  );
};

module.exports = {
  ensureRoleHierarchy,
};
