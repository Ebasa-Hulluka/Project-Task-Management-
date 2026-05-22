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

  const usersMissingRoles = await User.find({
    $or: [{ roles: { $exists: false } }, { roles: { $size: 0 } }],
    role: { $exists: true, $ne: null },
  }).select("_id role");

  if (usersMissingRoles.length > 0) {
    await Promise.all(
      usersMissingRoles.map((user) =>
        User.updateOne({ _id: user._id }, { $set: { roles: [user.role] } }),
      ),
    );
    console.log(`Migrated roles array for ${usersMissingRoles.length} user(s)`);
  }
};

module.exports = {
  ensureRoleHierarchy,
};
