import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  LuBell,
  LuCheck,
  LuClock,
  LuUser,
  LuBriefcase,
  LuCircleAlert,
  LuInfo,
  LuCheckCheck,
} from "react-icons/lu";
import moment from "moment";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        API_PATHS.NOTIFICATIONS.GET_NOTIFICATIONS,
        { params: { limit: 50 } },
      );
      setNotifications(response.data?.notifications || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error(error?.message || "Failed to load notifications");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getTitleByType = (type) => {
    switch (type) {
      case "user_role_changed":
        return "Role Updated";
      case "team_created":
        return "New Team";
      case "project_created":
        return "New Project";
      case "task_overdue":
        return "Task Overdue";
      case "system_report_ready":
        return "Report Ready";
      case "account_deletion_requested":
        return "Deletion Requested";
      case "account_deletion_cancelled":
        return "Deletion Cancelled";
      case "account_deleted_permanently":
        return "Account Deleted";
      default:
        return "Notification";
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "user_role_changed":
        return <LuUser className="text-blue-500" />;
      case "team_created":
      case "project_created":
        return <LuBriefcase className="text-purple-500" />;
      case "task_overdue":
        return <LuCircleAlert className="text-orange-500" />;
      case "system_report_ready":
        return <LuInfo className="text-green-500" />;
      case "account_deletion_requested":
      case "account_deletion_cancelled":
      case "account_deleted_permanently":
        return <LuCircleAlert className="text-red-500" />;
      default:
        return <LuBell className="text-gray-500" />;
    }
  };

  const markOneAsRead = async (notificationId) => {
    try {
      await axiosInstance.put(API_PATHS.NOTIFICATIONS.MARK_AS_READ(notificationId));
      setNotifications((prev) => prev.filter((item) => item._id !== notificationId));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((item) => !item.read);
    if (!unread.length) return;
    try {
      await Promise.all(
        unread.map((item) =>
          axiosInstance.put(API_PATHS.NOTIFICATIONS.MARK_AS_READ(item._id)),
        ),
      );
      setNotifications((prev) => prev.filter((item) => item.read));
      toast.success("Seen notifications cleared");
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error("Failed to mark all notifications as read");
    }
  };

  const clearAllNotifications = async () => {
    if (!notifications.length) return;
    try {
      await axiosInstance.delete(API_PATHS.NOTIFICATIONS.CLEAR_ALL);
      setNotifications([]);
      toast.success("All notifications cleared");
    } catch (error) {
      console.error("Failed to clear notifications:", error);
      toast.error("Failed to clear notifications");
    }
  };

  const filteredNotifications = useMemo(() => {
    switch (filter) {
      case "unread":
        return notifications.filter((item) => !item.read);
      case "read":
        return notifications.filter((item) => item.read);
      default:
        return notifications;
    }
  }, [filter, notifications]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markOneAsRead(notification._id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <DashboardLayout activeMenu="Notifications">
      <div className="my-5 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-medium">Notifications</h2>
            <p className="text-sm text-gray-500 mt-1">
              Stay updated with project and admin events
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="btn-outline flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <LuCheckCheck />
              Mark All Read
            </button>
            <button
              onClick={clearAllNotifications}
              disabled={notifications.length === 0}
              className="btn-outline flex items-center gap-2 text-sm text-red-600 disabled:opacity-50"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-1 inline-flex mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === "all"
                ? "bg-primary text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === "unread"
                ? "bg-primary text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter("read")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === "read"
                ? "bg-primary text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Read ({notifications.length - unreadCount})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {filteredNotifications.length > 0 ? (
              <div className="divide-y">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.read ? "bg-blue-50/50" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          !notification.read ? "bg-blue-100" : "bg-gray-100"
                        }`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {getTitleByType(notification.type)}
                              {!notification.read && (
                                <span className="ml-2 w-2 h-2 bg-primary rounded-full inline-block"></span>
                              )}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                          </div>

                          {!notification.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markOneAsRead(notification._id);
                              }}
                              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                              title="Mark as read"
                            >
                              <LuCheck className="text-gray-600" />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <LuClock className="text-xs" />
                            <span>{moment(notification.createdAt).fromNow()}</span>
                          </div>
                          {notification.link && (
                            <span className="text-xs text-primary">
                              View Details -&gt;
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <LuBell className="text-5xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No notifications found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
