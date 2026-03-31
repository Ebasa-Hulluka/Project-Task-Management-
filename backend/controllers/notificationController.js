const NotificationSettings = require("../models/NotificationSettings");
const Notification = require("../models/Notification");
const { generateOverdueTaskNotifications } = require("../utils/notificationService");

const normalizeBoolean = (value, fallback) =>
  typeof value === "boolean" ? value : fallback;

const hasAnyNotificationsEnabled = (settings) =>
  Boolean(
    settings?.taskAssignments ||
      settings?.taskUpdates ||
      settings?.projectDeadlines ||
      settings?.teamUpdates ||
      settings?.systemAnnouncements,
  );

// @desc    Get notification settings for authenticated user
const getNotificationSettings = async (req, res) => {
  try {
    let settings = await NotificationSettings.findOne({ userId: req.user.id });

    if (!settings) {
      settings = await NotificationSettings.create({
        userId: req.user.id,
        visibleFrom: new Date(),
      });
    }

    const normalized = {
      userId: settings.userId,
      taskAssignments: settings.taskAssignments ?? true,
      taskUpdates: settings.taskUpdates ?? true,
      projectDeadlines: settings.projectDeadlines ?? settings.projectUpdates ?? true,
      teamUpdates: settings.teamUpdates ?? true,
      systemAnnouncements:
        settings.systemAnnouncements ?? settings.inAppNotifications ?? true,
      visibleFrom: settings.visibleFrom ?? settings.updatedAt ?? settings.createdAt,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };

    res.status(200).json(normalized);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update notification settings for authenticated user
const updateNotificationSettings = async (req, res) => {
  try {
    const existing = await NotificationSettings.findOne({ userId: req.user.id });
    const wasEnabled = hasAnyNotificationsEnabled(existing);

    const payload = {
      taskAssignments: normalizeBoolean(
        req.body.taskAssignments,
        existing?.taskAssignments ?? true,
      ),
      taskUpdates: normalizeBoolean(req.body.taskUpdates, existing?.taskUpdates ?? true),
      projectDeadlines: normalizeBoolean(
        req.body.projectDeadlines,
        existing?.projectDeadlines ?? existing?.projectUpdates ?? true,
      ),
      teamUpdates: normalizeBoolean(
        req.body.teamUpdates,
        existing?.teamUpdates ?? true,
      ),
      systemAnnouncements: normalizeBoolean(
        req.body.systemAnnouncements,
        existing?.systemAnnouncements ?? existing?.inAppNotifications ?? true,
      ),
    };

    const willBeEnabled = hasAnyNotificationsEnabled(payload);
    const nextVisibleFrom =
      !wasEnabled && willBeEnabled
        ? new Date()
        : existing?.visibleFrom ?? existing?.updatedAt ?? existing?.createdAt ?? new Date();

    const settings = await NotificationSettings.findOneAndUpdate(
      { userId: req.user.id },
      {
        $set: {
          ...payload,
          visibleFrom: nextVisibleFrom,
        },
        $setOnInsert: { userId: req.user.id },
      },
      { new: true, upsert: true },
    );

    const normalized = {
      userId: settings.userId,
      taskAssignments: settings.taskAssignments ?? true,
      taskUpdates: settings.taskUpdates ?? true,
      projectDeadlines: settings.projectDeadlines ?? true,
      teamUpdates: settings.teamUpdates ?? true,
      systemAnnouncements: settings.systemAnnouncements ?? true,
      visibleFrom: settings.visibleFrom ?? settings.updatedAt ?? settings.createdAt,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };

    res.status(200).json(normalized);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get notifications for authenticated user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    let settings = await NotificationSettings.findOne({ userId: req.user.id }).lean();
    if (!settings) {
      settings = await NotificationSettings.create({
        userId: req.user.id,
        visibleFrom: new Date(),
      });
      settings = settings.toObject();
    }

    const notificationsEnabled = hasAnyNotificationsEnabled(settings);
    if (!notificationsEnabled) {
      return res.status(200).json({
        notifications: [],
        unreadCount: 0,
      });
    }

    const visibleFrom = settings.visibleFrom
      ? new Date(settings.visibleFrom)
      : new Date(settings.updatedAt || settings.createdAt || Date.now());

    // Opportunistically generate overdue notifications for super admins.
    if (req.user.role === "admin") {
      await generateOverdueTaskNotifications();
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);

    const notifications = await Notification.find({
      user: req.user.id,
      createdAt: { $gte: visibleFrom },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = notifications.filter((item) => !item.read).length;

    res.status(200).json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Mark one notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    }).lean();

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification deleted after being seen" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Clear all notifications for authenticated user
// @route   DELETE /api/notifications/clear
// @access  Private
const clearAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({ user: req.user.id });
    return res.status(200).json({
      message: "All notifications cleared",
      deletedCount: result.deletedCount || 0,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getNotificationSettings,
  updateNotificationSettings,
  getNotifications,
  markAsRead,
  clearAllNotifications,
};

