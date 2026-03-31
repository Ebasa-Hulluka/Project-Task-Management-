const Notification = require("../models/Notification");
const User = require("../models/User");
const Task = require("../models/Task");

const getAdminRecipientIds = async () => {
  const admins = await User.find({
    role: { $in: ["superAdmin", "admin"] },
    isActive: true,
  })
    .select("_id")
    .lean();
  return admins.map((admin) => admin._id.toString());
};

const createNotificationForUsers = async (
  userIds,
  { type, message, link = "" },
) => {
  if (!Array.isArray(userIds) || userIds.length === 0) return;

  const now = new Date();
  const docs = [];

  for (const userId of userIds) {
    // Avoid duplicate spam for the same event payload.
    const exists = await Notification.findOne({
      user: userId,
      type,
      message,
      link,
    }).lean();

    if (!exists) {
      docs.push({
        user: userId,
        type,
        message,
        link,
        read: false,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  if (docs.length) {
    await Notification.insertMany(docs);
  }
};

const notifyAdmins = async ({ type, message, link = "" }) => {
  const adminIds = await getAdminRecipientIds();
  await createNotificationForUsers(adminIds, { type, message, link });
};

const notifySystemReportReady = async ({ userId, reportType }) => {
  if (!userId) return;
  await createNotificationForUsers([userId], {
    type: "system_report_ready",
    message: `${reportType} is ready for download`,
    link: "/admin/reports",
  });
};

const generateOverdueTaskNotifications = async () => {
  const overdueTasks = await Task.find({
    status: { $ne: "Completed" },
    dueDate: { $lt: new Date() },
  })
    .select("_id title dueDate")
    .lean();

  if (!overdueTasks.length) return;

  const adminIds = await getAdminRecipientIds();
  if (!adminIds.length) return;

  for (const task of overdueTasks) {
    const dueLabel = task.dueDate
      ? new Date(task.dueDate).toISOString().split("T")[0]
      : "unknown date";
    await createNotificationForUsers(adminIds, {
      type: "task_overdue",
      message: `Task overdue: "${task.title}" (due ${dueLabel})`,
      link: "/admin/tasks",
    });
  }
};

module.exports = {
  notifyAdmins,
  notifySystemReportReady,
  generateOverdueTaskNotifications,
};
